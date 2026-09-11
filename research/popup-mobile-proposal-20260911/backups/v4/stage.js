const query = new URLSearchParams(location.search);
const variant = query.get('variant') === 'current' ? 'current' : 'candidate';
document.body.dataset.variant = variant;
const dialog = document.querySelector('dialog');
const content = dialog.querySelector('.popup-content');
const input = dialog.querySelector('.popup-input');
const inputs = dialog.querySelector('.popup-inputs');
const ok = dialog.querySelector('.popup-button-ok');
const cancel = dialog.querySelector('.popup-button-cancel');
let caseId = query.get('case') || 'confirm';
const cases = {
  confirm: { text: '删除该预设？此操作不可逆，且您当前的设置将被覆盖。' },
  short: { text: '清空当前草稿？' },
  'button-reference': { text: '确认当前操作？', ok: '确认', cancel: '取消' },
  input: { html: '<h3>重命名</h3><p>为当前预设输入一个新名称。</p>', input: '双人成行v12.0——长夏未央', cancel: '取消' },
  'list-input': { html: '<h3>新增自定义表情</h3><ol><li>输入用于识别表情的名称。</li><li>名称可以包含中文，较长时请检查输入内容。</li><li>保存后可在角色表情列表中选择。</li></ol>', input: '微笑', cancel: '取消' },
  checkbox: { text: '删除选中的 3 个角色？此操作不可逆。', checkbox: '同时删除这些角色的聊天记录（包含较长的说明文字）', cancel: '取消' },
  'inline-checkbox': { html: '<p>连接这个资源列表？</p><p><var>https://example.com/shared/resources/very-long-resource-list.json</var></p><label class="checkbox_label"><input type="checkbox"><span>连接后刷新当前资源列表</span></label>', cancel: '取消' },
  long: { html: '<h3>操作说明</h3><p>这是用于检查长内容的预览文字。请向下滚动，查看正文末尾和操作按钮。</p>' + Array.from({length:7},(_,i)=>`<p>${i+1}. 操作前请确认当前选择。较长的说明应自然换行，并保留原有段落；阅读时，文字不能横向溢出，也不应覆盖按钮和图标。</p>`).join('') + '<p><strong>正文结束。</strong>现在可以返回或确认。</p>', cancel: '返回' },
  'long-buttons': { text: '检测到已有配置，如何处理当前导入内容？', ok: '确认覆盖并继续导入', cancel: '保留当前配置并返回' },
  'medium-buttons': { text: '继续处理当前导入内容？', ok: '继续导入', cancel: '返回编辑' },
  notice: { text: '设置已保存。', ok: '知道了', cancel: null },
};
let specimen;
function renderCase(nextCase) {
caseId = Object.hasOwn(cases,nextCase) ? nextCase : 'confirm';
specimen = cases[caseId];
if (dialog.open) dialog.close();
input.style.display = 'none';
input.autofocus = false;
inputs.style.display = 'none';
inputs.replaceChildren();
cancel.style.display = '';
dialog.setAttribute('aria-label', `弹窗比例预览：${caseId}`);
if (specimen.html) content.innerHTML = specimen.html;
else content.textContent = specimen.text;
ok.textContent = specimen.ok || '确定';
cancel.textContent = specimen.cancel === undefined ? '否' : specimen.cancel || '';
if (specimen.cancel === null) cancel.style.display = 'none';
if (specimen.input !== undefined) { input.style.display = 'block'; input.value = specimen.input; input.autofocus = true; }
if (specimen.checkbox) {
  inputs.style.display = 'block';
  const label = document.createElement('label'); label.className = 'checkbox_label';
  const box = document.createElement('input'); box.type = 'checkbox';
  const text = document.createElement('span'); text.textContent = specimen.checkbox;
  label.append(box, text); inputs.append(label);
}
openPreview();
}
function closePreview(label) {
  dialog.close();
  document.querySelector('#outcome').textContent = `已选择：${label}`;
  document.querySelector('#closed-panel').hidden = false;
  document.querySelector('#reopen').focus();
}
function openPreview() {
  document.querySelector('#closed-panel').hidden = true;
  dialog.querySelector('.popup-body').scrollTop = 0;
  content.scrollTop = 0;
  dialog.showModal();
  if (query.get('embedded') !== '1') {
    if (specimen.input !== undefined) { input.focus(); input.select(); }
    else ok.focus();
  }
}
for (const action of [ok,cancel]) {
  action.addEventListener('click',()=>closePreview(action.textContent));
  action.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();closePreview(action.textContent);}});
}
dialog.addEventListener('cancel',event=>{event.preventDefault();closePreview(specimen.cancel === null ? '关闭' : cancel.textContent);});
document.querySelector('#reopen').addEventListener('click',openPreview);
const reportSize=()=>parent.postMessage({type:'popup-preview-size',width:innerWidth,height:innerHeight},location.origin);
window.addEventListener('resize',reportSize);
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='popup-preview-case')return;
  renderCase(event.data.case);
});
renderCase(caseId); reportSize();
