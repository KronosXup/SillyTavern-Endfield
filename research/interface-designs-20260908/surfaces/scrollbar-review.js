'use strict';

// Demo controls only. Wheel, drag, keyboard scrolling and text editing remain native.
const widthSelect = document.getElementById('preview-width');
const frame = document.getElementById('samples-frame');
const widthReadout = document.getElementById('width-readout');
const overflowButton = document.getElementById('toggle-overflow');
const extraContent = document.getElementById('extra-content');
const shortSample = document.getElementById('no-overflow');
const textarea = document.getElementById('textarea-scroll');

function updateWidthReadout() {
  widthReadout.textContent = `当前样例容器：${Math.round(frame.getBoundingClientRect().width)}px。选定宽度超过可用空间时自动收紧。`;
}

function applyPreviewWidth() {
  frame.style.width = widthSelect.value === 'auto' ? '100%' : `${widthSelect.value}px`;
  updateWidthReadout();
}

function setExtraContent(visible) {
  extraContent.hidden = !visible;
  overflowButton.setAttribute('aria-pressed', String(visible));
  overflowButton.textContent = visible ? '恢复短内容' : '增加示例内容';
  shortSample.scrollTop = 0;
}

widthSelect.addEventListener('change', applyPreviewWidth);
overflowButton.addEventListener('click', () => setExtraContent(extraContent.hidden));
document.getElementById('reset-samples').addEventListener('click', () => {
  textarea.value = textarea.defaultValue;
  setExtraContent(false);
  document.querySelectorAll('.native-scroll').forEach((element) => {
    element.scrollTop = 0;
    element.scrollLeft = 0;
  });
});

if (typeof ResizeObserver === 'function') {
  new ResizeObserver(updateWidthReadout).observe(frame);
} else {
  window.addEventListener('resize', updateWidthReadout);
}
applyPreviewWidth();
