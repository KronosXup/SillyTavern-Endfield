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
    function announce(result) {
      parent.postMessage({type:'confirmation-preview-result', result}, location.origin);
    }
    function open() {
      if (!dialog.open) dialog.showModal();
      ok.focus({preventScroll:true});
      announce('open');
    }
    for (const button of [ok, cancel]) {
      button.addEventListener('click', () => {
        openerResult = button.dataset.result;
        dialog.close(openerResult);
      });
      button.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          button.click();
        }
      });
    }
    dialog.addEventListener('cancel', () => { openerResult = 'escape'; });
    dialog.addEventListener('close', () => { announce(openerResult); });
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== parent) return;
      if (event.data?.type === 'confirmation-preview-open') open();
      if (event.data?.type === 'confirmation-preview-question') {
        question.textContent = event.data.long ? longQuestion : normalQuestion;
        question.scrollTop = 0;
        open();
      }
    });
    open();
  }
  if (page === 'review') {
    const frame = document.getElementById('confirmation-frame');
    const reference = document.getElementById('reference-view');
    const referenceImage = document.getElementById('reference-image');
    const caption = document.getElementById('reference-caption');
    const modes = [...document.querySelectorAll('[data-view]')];
    const longQuestionControl = document.getElementById('long-question');
    const status = document.getElementById('review-status');
    let currentView = 'proposal';
    function show(view) {
      currentView = view;
      frame.hidden = view !== 'proposal';
      reference.hidden = view === 'proposal';
      modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
      document.querySelector('.long-question-control').hidden = view !== 'proposal';
      document.getElementById('reopen').hidden = view !== 'proposal';
      if (view === 'game') {
        referenceImage.src = '../assets/confirmation-20260910/removed-reference.svg';
        referenceImage.alt = '游戏内短确认原框：贯穿画面的白带，问题居中，灰色取消与黄色确认胶囊跨下沿';
        caption.textContent = '游戏原框 · 原始视频帧；白带和按钮的位置关系以此为准';
      } else if (view === 'current') {
        referenceImage.src = '../assets/confirmation-20260910/removed-reference.svg';
        referenceImage.alt = '改动前实际酒馆中的删除聊天文件确认弹窗';
        caption.textContent = '当前酒馆 · 本次实拍，未执行删除';
      }
      status.textContent = view === 'proposal' ? '仅演示，不会删除聊天' : '原始画面，可切回适配稿对照';
    }
    modes.forEach(button => button.addEventListener('click', () => show(button.dataset.view)));
    longQuestionControl.addEventListener('change', () => {
      frame.contentWindow.postMessage({type:'confirmation-preview-question', long:longQuestionControl.checked}, location.origin);
    });
    document.getElementById('reopen').addEventListener('click', () => {
      frame.contentWindow.postMessage({type:'confirmation-preview-open'}, location.origin);
    });
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'confirmation-preview-result') return;
      const result = event.data.result;
      if (currentView !== 'proposal') return;
      status.textContent = result === '1' ? '已确认演示；聊天文件没有改动'
        : result === '0' || result === 'escape' ? '已取消演示；聊天文件没有改动'
          : '仅演示，不会删除聊天';
      if (result !== 'open') document.getElementById('reopen').focus({preventScroll:true});
    });
  }
})();
