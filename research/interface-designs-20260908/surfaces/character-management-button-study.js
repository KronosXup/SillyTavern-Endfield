'use strict';
// Load the existing local proposal in each frame. No host or persistent writes.
(async () => {
  const widthControl = document.querySelector('#study-width');
  const reset = document.querySelector('#study-reset');
  const status = document.querySelector('#study-status');
  const frames = ['single', 'double'].map(kind => ({ kind, frame: document.querySelector('#study-' + kind) }));
  const ready = new Set();
  const observers = [];
  function applyWidth(frame) {
    const control = frame.contentDocument?.querySelector('#preview-width');
    if (!control) return;
    control.value = widthControl.value;
    control.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function sizeFrame(frame) {
    const panel = frame.contentDocument?.querySelector('.drawer-slice');
    if (panel) frame.style.height = Math.ceil(panel.getBoundingClientRect().height + 12) + 'px';
  }
  widthControl.addEventListener('change', () => {
    document.body.style.setProperty('--study-width', widthControl.value + 'px');
    frames.forEach(({ frame }) => applyWidth(frame));
    status.textContent = '两侧宽度上限为 ' + widthControl.value + 'px；窄屏自动适应，可继续比较悬停与筛选状态。';
  });
  reset.addEventListener('click', () => {
    frames.forEach(({ frame }) => {
      frame.contentDocument?.querySelector('#reset-demo')?.click();
      applyWidth(frame);
    });
    status.textContent = '两侧已重置为相同内容；当前宽度上限 ' + widthControl.value + 'px。';
  });
  try {
    const sourceURL = new URL('character-management-review.html', location.href);
    const response = await fetch(sourceURL);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const source = await response.text();
    for (const { kind, frame } of frames) {
      const doc = new DOMParser().parseFromString(source, 'text/html');
      doc.documentElement.dataset.buttonStudy = kind;
      const base = doc.createElement('base');
      base.href = sourceURL.href;
      doc.head.prepend(base);
      const style = doc.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'character-management-button-study.css';
      doc.head.append(style);
      doc.title = kind === 'single' ? '单层圆面 · 角色管理' : '双层圆边 · 角色管理';
      frame.addEventListener('load', () => {
        if (!frame.contentDocument?.querySelector('.drawer-slice')) return;
        applyWidth(frame);
        sizeFrame(frame);
        const observer = new ResizeObserver(() => sizeFrame(frame));
        observer.observe(frame.contentDocument.querySelector('.drawer-slice'));
        observers.push(observer);
        ready.add(kind);
        if (ready.size === 2) status.textContent = '两侧已载入。先看整排，再看图标周围的留白。';
      }, { once: true });
      frame.srcdoc = '<!doctype html>\n' + doc.documentElement.outerHTML;
    }
  } catch (error) {
    status.textContent = '对照预览暂时未能载入，请返回当前主稿。' + error.message;
  }
  window.addEventListener('pagehide', () => observers.forEach(observer => observer.disconnect()), { once: true });
})();
