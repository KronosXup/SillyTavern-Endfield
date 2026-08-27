// CDP 截图与数字探针。用法：
//   node scripts/shot.mjs <输出名> [宽] [高] [--clip x,y,w,h] [--scale n]
//   node scripts/shot.mjs --probe "<js表达式>"
// 需先启动带 --remote-debugging-port=9333 的 Edge。

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PORT = process.env.CDP_PORT ?? '9333';
const OUT_DIR = resolve(import.meta.dirname, '../research/runtime');

async function target() {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  const page = list.find(t => t.type === 'page' && t.url.includes('127.0.0.1:8000'));
  if (!page) throw new Error('找不到 SillyTavern 页面，先在 Edge 里打开 http://127.0.0.1:8000/');
  return page.webSocketDebuggerUrl;
}

function session(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data);
    const slot = pending.get(msg.id);
    if (!slot) return;
    pending.delete(msg.id);
    msg.error ? slot.reject(new Error(msg.error.message)) : slot.resolve(msg.result);
  });
  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', () => rej(new Error('CDP 连接失败')), { once: true });
  });
  return {
    ready,
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        pending.set(++id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      }),
    close: () => ws.close(),
  };
}

const args = process.argv.slice(2);
const wsUrl = await target();
const cdp = session(wsUrl);
await cdp.ready;

if (args[0] === '--probe') {
  const wFlag = args.indexOf('--width');
  const hFlag = args.indexOf('--height');
  const vw = wFlag > -1 ? Number(args[wFlag + 1]) : null;
  const vh = hFlag > -1 ? Number(args[hFlag + 1]) : 844;
  if (vw) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vw,
      height: vh,
      deviceScaleFactor: 1,
      mobile: vw < 700,
    });
    await new Promise(r => setTimeout(r, 700));
  }
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression: args[1],
    returnByValue: true,
    awaitPromise: true,
  });
  if (vw) await cdp.send('Emulation.clearDeviceMetricsOverride');
  if (exceptionDetails) throw new Error(exceptionDetails.text);
  console.log(JSON.stringify(result.value, null, 2));
} else {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--clip' || args[i] === '--scale' || args[i] === '--pre') flags[args[i].slice(2)] = args[++i];
    else positional.push(args[i]);
  }
  const [name = 'shot', w = '1280', h = '800'] = positional;
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: Number(w),
    height: Number(h),
    deviceScaleFactor: 1,
    mobile: Number(w) < 700,
  });
  await new Promise(r => setTimeout(r, 700));
  // 视口切换会复位滚动，所以定位脚本必须在设完 metrics 之后跑。
  if (flags.pre) {
    await cdp.send('Runtime.evaluate', { expression: flags.pre, returnByValue: true, awaitPromise: true });
    await new Promise(r => setTimeout(r, 400));
  }
  const shotArgs = { format: 'png' };
  if (flags.clip) {
    const [x, y, cw, ch] = flags.clip.split(',').map(Number);
    shotArgs.clip = { x, y, width: cw, height: ch, scale: Number(flags.scale ?? 1) };
  }
  const { data } = await cdp.send('Page.captureScreenshot', shotArgs);
  await cdp.send('Emulation.clearDeviceMetricsOverride');
  const out = resolve(OUT_DIR, `${name}.png`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log(out);
}

cdp.close();
