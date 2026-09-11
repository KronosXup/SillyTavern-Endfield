(() => {
  'use strict';
  const q = selector => document.querySelector(selector);
  const body = document.body;
  const input = q('#send_textarea');
  const holder = q('#form_sheld');
  const form = q('#send_form');
  const frame = q('#viewport-wrap');
  const status = q('#composer-status-text');
  let generationTimer;
  let scriptTimer;
  let attachmentCount = 0;
  let scriptProgress = 0;
  let paused = false;
  let menuAnchor = null;
  const sampleDraft = '先把这段话留在这里。\n\n不急着替我总结，也不用把每一件事都安排得井井有条。\n我想从刚才没说完的那句话继续。\n\n长一点的草稿应该有足够的阅读宽度。\n即使光标来到下一行，发送按钮也应该留在熟悉的位置。\n\n这份原型只保留在当前页面。\n点击发送，会得到一段本地模拟回复。\n你也可以在生成途中停下。\n\nhttps://example.invalid/averylongpathwithoutspaces/for-layout-testing-only';
  const reply = '记录纸向前翻了一页。你留下的那几句话仍在原处，没有被急着删改。\n\n“好，”对方说，“我们就从这里继续。”\n\n这段回复来自当前页面的本地演示，没有调用任何模型或 API。';
  const captions = { a: 'A / 常规桌面保留紧凑单行，窄屏先保证书写宽度。', b: 'B / 全宽书写纸面与下层工具带分开，适合长输入。', c: 'C / 桌面侧边操作尺，窄屏归回底部工具行。' };
  function resizeInput() {
    input.style.height = 'auto';
    // scrollHeight is integral; leave room for the fractional text line box.
    input.style.height = `${input.scrollHeight + 1}px`;
  }
  function setStatus(text) { status.textContent = text; }
  function connected() { return q('#connection-toggle').checked; }
  function updateAvailability() {
    const previousFocus = document.activeElement;
    const online = connected();
    form.classList.toggle('no-connection', !online);
    input.placeholder = online ? '写下消息…' : '未连接 · 仍可编辑草稿';
    q('#send_but').classList.toggle('displayNone', !online);
    for (const id of ['mes_continue','mes_impersonate']) q(`#${id}`).classList.toggle('displayNone', !online || !q('#quick-actions').checked);
    if (['send_but','mes_continue','mes_impersonate'].includes(previousFocus?.id) && previousFocus.classList.contains('displayNone')) input.focus({ preventScroll: true });
    resizeInput();
  }
  function finishGeneration(stopped = false) {
    const restoreInputFocus = document.activeElement === q('#mes_stop');
    clearInterval(generationTimer);
    generationTimer = undefined;
    delete body.dataset.generating;
    q('#response-state').textContent = stopped ? '已停止 · 本地示例' : '已完成 · 本地示例';
    if (!q('#reply-stream').textContent) q('#reply-stream').textContent = '生成已停止。';
    setStatus(stopped ? '已停止。草稿仍可继续编辑。' : '示例回复已完成。');
    if (restoreInputFocus) input.focus({ preventScroll: true });
  }
  function startGeneration(continuing = false) {
    if (!connected()) { window.EF.toast('当前模拟为未连接；勾选“连接就绪”后再试。'); return; }
    if (body.dataset.generating || holder.classList.contains('isExecutingCommandsFromChatInput')) { window.EF.toast('请先停止当前示例。'); return; }
    if (!continuing && !input.value.trim() && !attachmentCount) { input.focus(); setStatus('写下一句话，或添加一份附件示例。'); return; }
    closeMenus();
    if (!continuing) {
      q('#last-user-message').textContent = `${input.value.trim() || '（仅发送附件示例）'}${attachmentCount ? `\n[${attachmentCount} 份附件示例]` : ''}`;
      q('#user-preview').hidden = false;
      input.value = '';
      attachmentCount = 0;
      renderAttachments();
      resizeInput();
    }
    q('#response-preview').hidden = false;
    q('#response-state').textContent = '正在生成 · 本地示例';
    const target = continuing ? '上一页的记录又多了一行。\n\n续写仍然沿着原来的意思向前。这里没有真实网络请求，你可以随时停止。' : reply;
    q('#reply-stream').textContent = '';
    body.dataset.generating = 'true';
    setStatus('正在生成本地示例 · 右侧可停止');
    let cursor = 0;
    generationTimer = setInterval(() => {
      cursor += 2;
      q('#reply-stream').textContent = target.slice(0,cursor);
      if (cursor >= target.length) finishGeneration();
    },75);
    input.focus({ preventScroll: true });
  }
  function renderAttachments(longName = false) {
    q('#file_form').classList.toggle('displayNone', attachmentCount === 0);
    const name = attachmentCount === 1 ? (longName ? '关于这段尚未写完的对话与后续情节的补充说明_第二次整理_最终校对版.txt' : '塔卫二_对话记录_补充说明.txt') : `已选择 ${attachmentCount} 个文件`;
    q('.file_name').textContent = name;
    q('.file_name').title = attachmentCount === 1 ? name : '对话记录.txt\n补充说明.txt\n其他本地示例';
    q('.file_size').textContent = `${(attachmentCount * 12.4).toFixed(1)} KB`;
  }
  function addAttachment(longName = false) {
    closeMenus();
    attachmentCount = longName ? 1 : Math.min(attachmentCount + 1,9);
    renderAttachments(longName);
    setStatus('已添加附件示例；没有读取或上传任何文件。');
  }
  function loadDraft() { closeMenus(); input.value = sampleDraft; resizeInput(); input.focus(); setStatus('多行草稿已填入。输入框按内容增高，到上限后内部滚动。'); }
  function endScript(message = '脚本示例已完成。') {
    const restoreInputFocus = ['stscript_continue','stscript_pause','stscript_stop'].includes(document.activeElement?.id);
    clearInterval(scriptTimer);
    scriptTimer = undefined;
    paused = false;
    holder.classList.remove('isExecutingCommandsFromChatInput','script_paused');
    input.readOnly = false;
    setStatus(message);
    if (restoreInputFocus) input.focus({ preventScroll: true });
  }
  function startScript() {
    closeMenus();
    if (body.dataset.generating || scriptTimer) { window.EF.toast('请先停止当前示例。'); return; }
    holder.classList.add('isExecutingCommandsFromChatInput');
    paused = false;
    scriptProgress = 0;
    setStatus('脚本示例 0% · 可暂停或终止');
    scriptTimer = setInterval(() => {
      if (paused) return;
      scriptProgress += 4;
      setStatus(`脚本示例 ${scriptProgress}% · 可暂停或终止`);
      if (scriptProgress >= 100) endScript();
    },250);
  }
  function togglePause() {
    const previousControl = q(paused ? '#stscript_continue' : '#stscript_pause');
    const moveControlFocus = document.activeElement === previousControl;
    paused = !paused;
    holder.classList.toggle('script_paused', paused);
    setStatus(paused ? `脚本示例已暂停于 ${scriptProgress}% · 点击继续` : `脚本示例继续执行 · ${scriptProgress}%`);
    if (moveControlFocus) q(paused ? '#stscript_continue' : '#stscript_pause').focus({ preventScroll: true });
  }
  function closeMenus(restoreFocus = false) {
    for (const menu of document.querySelectorAll('.local-menu')) menu.hidden = true;
    for (const button of document.querySelectorAll('[aria-controls="options"],[aria-controls="extensionsMenu"]')) button.setAttribute('aria-expanded','false');
    if (restoreFocus && menuAnchor) menuAnchor.focus();
    menuAnchor = null;
  }
  function toggleMenu(id, anchor) {
    const menu = q(`#${id}`);
    const wasOpen = !menu.hidden;
    closeMenus();
    if (wasOpen) return;
    menu.hidden = false;
    menuAnchor = anchor;
    anchor.setAttribute('aria-expanded','true');
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(10, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 10))}px`;
    menu.style.top = `${Math.max(10, Math.min(rect.top - menu.offsetHeight - 8, window.innerHeight - menu.offsetHeight - 10))}px`;
    menu.querySelector('button')?.focus();
  }
  function reset() {
    closeMenus();
    if (generationTimer) finishGeneration(true);
    endScript();
    input.value = '';
    attachmentCount = 0;
    renderAttachments();
    q('#user-preview').hidden = true;
    q('#response-preview').hidden = true;
    q('#connection-toggle').checked = true;
    q('#quick-actions').checked = false;
    updateAvailability();
    resizeInput();
    setStatus('就绪 · 点击输入框查看聚焦动效');
  }
  const actions = { draft: loadDraft, attach: () => addAttachment(), longfile: () => addAttachment(true), continue: () => startGeneration(true), script: startScript, reset };
  q('#options_button').addEventListener('click', event => toggleMenu('options', event.currentTarget));
  q('#extensionsMenuButton').addEventListener('click', event => toggleMenu('extensionsMenu', event.currentTarget));
  for (const button of document.querySelectorAll('.host-button[role="button"]')) button.addEventListener('keydown',event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); button.click(); } });
  for (const button of document.querySelectorAll('[data-action]')) button.addEventListener('click',()=> {
    const moveMenuFocus = document.activeElement === button;
    const action = actions[button.dataset.action];
    closeMenus();
    action?.();
    if (moveMenuFocus && (document.activeElement === button || document.activeElement === body)) {
      const next = body.dataset.generating ? q('#mes_stop') : holder.classList.contains('isExecutingCommandsFromChatInput') ? q(paused ? '#stscript_continue' : '#stscript_pause') : input;
      next.focus({ preventScroll: true });
    }
  });
  for (const menu of document.querySelectorAll('.local-menu')) menu.addEventListener('keydown',event=> {
    const items = [...menu.querySelectorAll('button')];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  });
  q('#send_but').addEventListener('click',()=>startGeneration());
  q('#mes_stop').addEventListener('click',()=>finishGeneration(true));
  q('#mes_continue').addEventListener('click',()=>startGeneration(true));
  q('#mes_impersonate').addEventListener('click',()=> { input.value = '那就从刚才没说完的地方继续吧。我想听听你的想法。'; resizeInput(); input.focus(); setStatus('代写示例已放入草稿，没有发送。'); });
  q('#stscript_pause').addEventListener('click',togglePause);
  q('#stscript_continue').addEventListener('click',togglePause);
  q('#stscript_stop').addEventListener('click',()=>endScript('脚本示例已终止。'));
  q('#load-draft').addEventListener('click',loadDraft);
  q('#add-attachment').addEventListener('click',()=>addAttachment());
  q('#start-script').addEventListener('click',startScript);
  q('#reset-preview').addEventListener('click',reset);
  q('#file_form').addEventListener('submit',event=>event.preventDefault());
  q('#file_form').addEventListener('reset',()=> { const restoreInputFocus = q('#file_form').contains(document.activeElement); attachmentCount = 0; renderAttachments(); setStatus('已移除这批附件示例。'); if (restoreInputFocus) input.focus({ preventScroll: true }); });
  q('#quick-actions').addEventListener('change',updateAvailability);
  q('#connection-toggle').addEventListener('change',()=> { if (!connected() && generationTimer) finishGeneration(true); updateAvailability(); setStatus(connected() ? '模拟连接已就绪。' : '模拟未连接；草稿保留。'); });
  q('#touch-preview').addEventListener('change',event=>frame.classList.toggle('touch-targets',event.target.checked));
  q('#preview-width').addEventListener('change',event=> { const width = event.target.value; frame.style.setProperty('--preview-width',width === 'wide' ? '900px' : `${width}px`); if (width !== 'wide') { q('#touch-preview').checked = true; frame.classList.add('touch-targets'); } closeMenus(); requestAnimationFrame(resizeInput); });
  input.addEventListener('input',resizeInput);
  input.addEventListener('keydown',event=> { if (!event.isComposing && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); startGeneration(); } });
  input.addEventListener('paste',event=> { if (event.clipboardData?.files.length) { event.preventDefault(); window.EF.toast('此原型不读取真实文件；请使用“添加附件示例”。'); } });
  holder.addEventListener('dragover',event=>event.preventDefault());
  holder.addEventListener('drop',event=> { event.preventDefault(); window.EF.toast('已接到拖放动作；原型未读取文件，请使用示例附件。'); });
  document.addEventListener('click',event=> { if (!event.target.closest('.local-menu,#options_button,#extensionsMenuButton')) closeMenus(); });
  document.addEventListener('keydown',event=> { if (event.key === 'Escape') closeMenus(true); });
  document.addEventListener('ef:variant',event=> { q('#variant-caption').textContent = captions[event.detail.variant] || captions.a; requestAnimationFrame(resizeInput); closeMenus(); });
  window.addEventListener('resize',()=> { closeMenus(); resizeInput(); });
  window.addEventListener('pagehide',()=> { clearInterval(generationTimer); clearInterval(scriptTimer); });
  let previousWidth = 0;
  new ResizeObserver(entries=> {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - previousWidth) < 1) return;
    previousWidth = width;
    resizeInput();
  }).observe(input);
  document.fonts.ready.then(resizeInput);
  q('#variant-caption').textContent = captions[body.dataset.variant] || captions.a;
  updateAvailability();
  requestAnimationFrame(resizeInput);
})();
