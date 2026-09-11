(() => {
  'use strict';
  const $ = window.jQuery;
  const toastr = window.toastr;
  const byId = id => document.getElementById(id);
  const stage = byId('feedback-stage');
  const dialog = byId('feedback-dialog');
  const status = byId('feedback-action-status');
  const positions = ['toast-top-left','toast-top-center','toast-top-right','toast-bottom-left','toast-bottom-center','toast-bottom-right'];
  const tasks = new Map();
  let nextTaskId = 1;
  let frameRequest = 0;
  let replacingSamples = false;
  let dialogOpener = null;

  if (!$ || !toastr || toastr.version !== '2.1.3') {
    status.textContent = '通知库未载入，请检查本页资源。';
    for (const button of document.querySelectorAll('[data-show-toast],#show-feedback-stack,#open-feedback-dialog')) button.disabled = true;
    return;
  }

  for (const input of document.querySelectorAll('.feedback-lab input[type="checkbox"]')) input.checked = false;
  for (const select of document.querySelectorAll('.feedback-lab select')) select.selectedIndex = 0;

  // Same basic Toastr values as the target host; the target remains body.
  toastr.options = {
    positionClass: 'toast-top-center', closeButton: false, progressBar: false,
    showDuration: 250, hideDuration: 250, timeOut: 4000, extendedTimeOut: 10000,
    showEasing: 'linear', hideEasing: 'linear', showMethod: 'fadeIn', hideMethod: 'fadeOut',
    escapeHtml: true, target: 'body', onHidden: fixToastContainer,
  };

  function updateFrame() {
    frameRequest = 0;
    const frame = dialog.open ? dialog.querySelector('.dialog-reading') : stage;
    const rect = frame.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const top = Math.max(0, rect.top);
    const bottom = Math.min(viewportHeight, rect.bottom);
    const left = Math.max(0, rect.left);
    const viewportWidth = document.documentElement.clientWidth;
    const right = Math.min(viewportWidth, rect.right);
    const style = document.body.style;
    style.setProperty('--feedback-frame-left', `${left}px`);
    style.setProperty('--feedback-frame-top', `${top}px`);
    style.setProperty('--feedback-frame-width', `${Math.max(48,right-left)}px`);
    style.setProperty('--feedback-frame-height', `${Math.max(84,bottom-top)}px`);
    style.setProperty('--feedback-frame-right-inset', `${Math.max(0,viewportWidth-right)}px`);
    style.setProperty('--feedback-frame-bottom-inset', `${Math.max(0,viewportHeight-bottom)}px`);
    document.getElementById('toast-container')?.classList.toggle('feedback-frame-hidden', bottom <= top || right <= left);
  }

  function scheduleFrame() {
    if (!frameRequest) frameRequest = requestAnimationFrame(updateFrame);
  }

  // Single-dialog lab equivalent; this does not import the host Popup lifecycle.
  function fixToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container && dialog.open) container = toastr.getContainer(toastr.options, true)[0];
    if (container) {
      const target = dialog.open ? dialog : document.body;
      if (container.parentElement !== target) target.appendChild(container);
      container.classList.remove(...positions);
      container.classList.add(toastr.options.positionClass);
    }
    updateFrame();
  }

  toastr.subscribe(args => {
    if (args.state !== 'visible') return;
    const container = toastr.getContainer(args.options, false)[0];
    if (!container) return;
    const toast = args.options.newestOnTop ? container.firstElementChild : container.lastElementChild;
    if (!toast) return;
    const interactive = args.options.tapToDismiss !== false;
    toast.classList.toggle('interactable', interactive);
    toast.classList.toggle('toast-non-interactable', !interactive);
    if (interactive) {
      toast.tabIndex = 0;
      toast.title = '点击关闭';
    } else {
      toast.removeAttribute('tabindex');
      toast.removeAttribute('title');
    }
    const close = toast.querySelector('.toast-close-button');
    toast.classList.toggle('feedback-has-close', Boolean(close));
    if (close) close.setAttribute('aria-label', '关闭通知');
    fixToastContainer();
  });

  // Like the host general keyboard path, only Enter activates div/i interactables.
  // Native buttons retain their browser keyboard behavior, without a second click.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) return;
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.matches('button,input,select,textarea,a')) return;
    const target = event.target.closest('#toast-container .interactable');
    if (!target) return;
    event.preventDefault();
    target.click();
  });

  function normalOptions() {
    return {
      closeButton: byId('feedback-close').checked,
      progressBar: byId('feedback-progress').checked,
      timeOut: Number(byId('feedback-duration').value),
    };
  }

  function sampleFor(type) {
    const long = byId('feedback-long').checked;
    const name = long
      ? '边境档案_北侧中继站与巡检记录_包含罕见字𠮷及LongFileNameWithoutSpaces_SeptemberRevision_2026_Final_校对留存.json'
      : '边界记录员';
    const samples = {
      success: { title: '', message: `角色已创建：${name}` },
      info: { title: '尚未设置世界信息', message: '请先创建或导入一个世界信息文件。' },
      error: { title: long ? `无法导入角色：${name}` : '无法导入角色', message: '文件可能无效或已损坏。请检查文件内容后再试。' },
      warning: { title: '暂时无法继续', message: '请先完成当前消息的编辑。' },
    };
    const sample = samples[type];
    if (long && type !== 'success') sample.message += ` 示例文件 ${name} 尚未处理；已有记录仍保留在当前页面。请核对文件名称与格式，确认后再继续查看。`;
    if (byId('feedback-no-title').checked) sample.title = '';
    return sample;
  }

  function showNormal(type) {
    const sample = sampleFor(type);
    const toast = toastr[type](sample.message, sample.title, normalOptions());
    if (toast?.[0]) toast[0].dataset.demoKind = type;
    return toast;
  }

  function updateTaskControls() {
    byId('complete-feedback-task').disabled = tasks.size === 0;
  }

  async function clearToast(toast) {
    const node = toast?.[0];
    if (!node?.isConnected) return;
    // clear() removes the node inside its animation callback. Observe removal,
    // rather than awaiting a jQuery queue promise attached to deleted node data.
    await new Promise(resolve => {
      let completed = false;
      const finish = () => {
        if (completed || node.isConnected) return;
        completed = true;
        observer.disconnect();
        fixToastContainer();
        resolve();
      };
      const observer = new MutationObserver(finish);
      observer.observe(node.parentElement, { childList: true });
      toastr.clear(toast, { force: true });
      finish();
    });
  }

  async function finishTask(id, stopped) {
    const task = tasks.get(id);
    if (!task) return;
    tasks.delete(id);
    updateTaskControls();
    const hadFocus = task.toast[0].contains(document.activeElement);
    await clearToast(task.toast);
    status.textContent = stopped ? '本页模拟任务已停止。' : '本页模拟任务已结束。';
    if (hadFocus && document.activeElement === document.body) {
      const target = dialog.open ? byId('show-dialog-feedback') : document.querySelector('[data-show-toast="persistent"]');
      target.focus();
    }
  }

  function showPersistent() {
    const mode = byId('persistent-mode').value;
    const id = `feedback-simulation-${nextTaskId++}`;
    const content = document.createElement('div');
    content.className = 'action-loader-toast';
    content.dataset.loaderId = id;
    content.dataset.blocking = 'false';
    content.dataset.toastMode = mode;
    const message = document.createElement('span');
    message.className = 'action-loader-message';
    message.textContent = byId('feedback-long').checked
      ? '正在处理虚构档案：边境档案_中继站巡检与异常记录_LongFileNameWithoutSpaces_2026_留存副本.json。请稍候，任务结束前已有记录会保持打开。'
      : '正在处理内容，请稍候…';
    content.appendChild(message);
    if (mode === 'stoppable') {
      const stop = document.createElement('i');
      stop.className = 'fa-solid fa-stop-circle action-loader-stop interactable';
      stop.title = '停止模拟任务';
      stop.setAttribute('aria-label', '停止模拟任务');
      stop.setAttribute('role', 'button');
      stop.tabIndex = 0;
      stop.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        void finishTask(id, true);
      });
      content.appendChild(stop);
    }
    const title = byId('feedback-no-title').checked ? '' : '处理中';
    const toast = toastr.info($(content), title, {
      timeOut: 0, extendedTimeOut: 0, tapToDismiss: false, escapeHtml: false,
      closeButton: false, progressBar: false,
    });
    toast[0].dataset.demoKind = 'persistent';
    tasks.set(id, { toast, mode });
    updateTaskControls();
    return toast;
  }

  function revealStage() {
    if (!dialog.open) stage.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    updateFrame();
  }

  async function clearSamples({ quiet = false } = {}) {
    tasks.clear();
    updateTaskControls();
    const toasts = [...document.querySelectorAll('#toast-container > .toast')].map(node => $(node));
    await Promise.all(toasts.map(clearToast));
    if (!quiet) status.textContent = '本页通知与模拟任务已清空。';
  }

  function setResetBusy(busy) {
    replacingSamples = busy;
    for (const button of document.querySelectorAll('[data-show-toast],#clear-feedback,#show-feedback-stack,#show-dialog-feedback')) button.disabled = busy;
  }

  for (const button of document.querySelectorAll('[data-show-toast]')) {
    button.addEventListener('click', () => {
      if (replacingSamples) return;
      status.textContent = '';
      revealStage();
      if (button.dataset.showToast === 'persistent') showPersistent();
      else showNormal(button.dataset.showToast);
    });
  }

  byId('toast-position').addEventListener('change', event => {
    if (!positions.includes(event.target.value)) return;
    toastr.options.positionClass = event.target.value;
    fixToastContainer();
  });
  byId('feedback-width').addEventListener('change', event => {
    document.body.style.setProperty('--feedback-review-width', event.target.value === 'wide' ? '1080px' : `${event.target.value}px`);
    updateFrame();
  });
  byId('feedback-height').addEventListener('change', event => {
    document.body.style.setProperty('--feedback-review-height', `${event.target.value}px`);
    updateFrame();
  });
  byId('clear-feedback').addEventListener('click', async event => {
    if (replacingSamples) return;
    const control = event.currentTarget;
    const restoreFocus = document.activeElement === control;
    setResetBusy(true);
    try { await clearSamples(); }
    finally {
      setResetBusy(false);
      if (restoreFocus && document.activeElement === document.body) control.focus();
    }
  });
  byId('complete-feedback-task').addEventListener('click', async () => {
    const ids = [...tasks.keys()];
    for (const id of ids) await finishTask(id, false);
  });
  byId('show-feedback-stack').addEventListener('click', async event => {
    if (replacingSamples) return;
    const control = event.currentTarget;
    const restoreFocus = document.activeElement === control;
    setResetBusy(true);
    const count = Number(byId('feedback-stack-count').value);
    try {
      await clearSamples({ quiet: true });
      status.textContent = '';
      revealStage();
      for (const type of ['success','info','warning','error'].slice(0,count)) showNormal(type);
    } finally {
      setResetBusy(false);
      if (restoreFocus && document.activeElement === document.body) {
        const toast = document.querySelector('#toast-container > .toast');
        (toast || control).focus();
      }
    }
  });

  function closeDialog(result) {
    if (!dialog.open) return;
    dialog.close(result);
    fixToastContainer();
  }
  byId('open-feedback-dialog').addEventListener('click', event => {
    dialogOpener = event.currentTarget;
    dialog.showModal();
    fixToastContainer();
  });
  byId('show-dialog-feedback').addEventListener('click', () => { if (!replacingSamples) showNormal('info'); });
  byId('close-feedback-dialog').addEventListener('click', () => closeDialog('close'));
  byId('cancel-feedback-dialog').addEventListener('click', () => closeDialog('cancel'));
  byId('confirm-feedback-dialog').addEventListener('click', () => {
    closeDialog('confirmed');
    status.textContent = '本页查看步骤已完成。';
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeDialog('cancel');
  });
  dialog.addEventListener('close', () => {
    fixToastContainer();
    if (dialogOpener?.isConnected) dialogOpener.focus();
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function applyMotionPreference() {
    toastr.options.showDuration = reducedMotion.matches ? 0 : 250;
    toastr.options.hideDuration = reducedMotion.matches ? 0 : 250;
  }
  reducedMotion.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
  new ResizeObserver(scheduleFrame).observe(stage);
  new ResizeObserver(scheduleFrame).observe(dialog);
  new ResizeObserver(scheduleFrame).observe(document.querySelector('.feedback-lab'));
  document.querySelector('.feedback-options').addEventListener('toggle', scheduleFrame);
  document.fonts.ready.then(scheduleFrame);
  window.addEventListener('resize', scheduleFrame);
  window.addEventListener('scroll', scheduleFrame, { passive: true });
  document.addEventListener('ef:variant', scheduleFrame);
  updateTaskControls();
  updateFrame();
  showNormal('success');
})();
