'use strict';
(() => {
  const page = document.body.dataset.page;
  const normalQuestion = '删除聊天文件？';
  const longQuestion = '是否删除“第十二次外勤记录：跨区域物资调度、未完成事项与待核对的长篇聊天备忘”这份聊天文件？';
  if (page === 'stage') {
    const dialog = document.querySelector('dialog');
    const question = document.getElementById('confirmation-question');
    const ok = dialog.querySelector('.popup-button-ok');
    const cancel = dialog.querySelector('.popup-button-cancel');
    let openerResult = '';
    let entranceTimer;
    let exitTimer;
    function announce(result) {
      parent.postMessage({type:'confirmation-preview-result', result}, location.origin);
    }
    function open() {
      clearTimeout(entranceTimer);
      clearTimeout(exitTimer);
      dialog.classList.remove('is-entering', 'is-closing');
      if (!dialog.open) dialog.showModal();
      if (dialog.classList.contains('is-calibrated') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        void dialog.offsetWidth;
        dialog.classList.add('is-entering');
        entranceTimer = setTimeout(() => dialog.classList.remove('is-entering'), 370);
      }
      ok.focus({preventScroll:true});
      announce('open');
    }
    function close(result) {
      if (!dialog.open || dialog.classList.contains('is-closing')) return;
      openerResult = result;
      clearTimeout(entranceTimer);
      dialog.classList.remove('is-entering');
      if (dialog.classList.contains('is-calibrated') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        dialog.classList.add('is-closing');
        exitTimer = setTimeout(() => {
          dialog.close(openerResult);
          dialog.classList.remove('is-closing');
        }, 155);
      } else dialog.close(openerResult);
    }
    for (const button of [ok, cancel]) {
      button.addEventListener('click', () => close(button.dataset.result));
      button.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          button.click();
        }
      });
    }
    dialog.addEventListener('cancel', event => { event.preventDefault(); close('escape'); });
    dialog.addEventListener('close', () => { announce(openerResult); });
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== parent) return;
      if (event.data?.type === 'confirmation-preview-version') {
        dialog.classList.toggle('is-calibrated', event.data.version === 'calibrated');
        open();
      }
      if (event.data?.type === 'confirmation-preview-open') open();
      if (event.data?.type === 'confirmation-preview-question') {
        question.textContent = event.data.long ? longQuestion : normalQuestion;
        question.scrollTop = 0;
        open();
      }
    });
    open();
  }
  if (page === 'calibration-review') {
    const frame = document.getElementById('confirmation-frame');
    const reference = document.getElementById('reference-view');
    const modes = [...document.querySelectorAll('[data-view]')];
    const longQuestionControl = document.getElementById('long-question');
    const status = document.getElementById('review-status');
    const reopen = document.getElementById('reopen');
    let currentView = 'calibrated';
    function send(type, payload = {}) {
      frame.contentWindow.postMessage({type, ...payload}, location.origin);
    }
    function show(view) {
      currentView = view;
      const isReference = view === 'reference';
      frame.hidden = isReference;
      reference.hidden = !isReference;
      modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
      document.querySelector('.long-question-control').hidden = isReference;
      reopen.hidden = isReference;
      status.textContent = isReference ? '高清原图，可切回校准稿对照' : '仅演示，不会删除聊天';
      if (!isReference) send('confirmation-preview-version', {version:view});
    }
    modes.forEach(button => button.addEventListener('click', () => show(button.dataset.view)));
    longQuestionControl.addEventListener('change', () => send('confirmation-preview-question', {long:longQuestionControl.checked}));
    reopen.addEventListener('click', () => send('confirmation-preview-open'));
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'confirmation-preview-result' || currentView === 'reference') return;
      const result = event.data.result;
      status.textContent = result === '1' ? '已确认演示；聊天文件没有改动'
        : result === '0' || result === 'escape' ? '已取消演示；聊天文件没有改动'
          : '仅演示，不会删除聊天';
      if (result !== 'open') reopen.focus({preventScroll:true});
    });
  }
})();
