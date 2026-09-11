const message = document.querySelector('.user-message');
const body = document.querySelector('#message-body');
const editor = document.querySelector('.editor');
const editText = document.querySelector('#message-edit');
const status = document.querySelector('#preview-status');
const samples = {
  short: '<p>测试生成：请只回复<q>“连接正常”</q>，不要展开。</p>',
  long: '<p>我把刚才的话想了一遍，还是想再说明白一点。</p><p>这次先确认消息能正常发出，下一步再看长回复的排版。<strong>文字应该是最先被读到的部分。</strong></p><blockquote>“连接正常。”</blockquote><p><em>我看了一眼屏幕，把光标移回输入框。</em></p>'
};
function resetEditor() { editor.hidden=true; body.hidden=false; document.querySelector('#edit-button').disabled=false; document.querySelector('#collapse-button').setAttribute('aria-expanded','true'); }
function setSample() { resetEditor(); body.innerHTML=samples[document.querySelector('#sample-mode').value]; status.textContent='未应用到酒馆 · 用户消息专用设计'; }
document.querySelector('#cover-mode').addEventListener('change',e=>{message.dataset.cover=e.target.value;});
document.querySelector('#sample-mode').addEventListener('change',setSample);
document.querySelector('#width-mode').addEventListener('change',e=>document.documentElement.style.setProperty('--preview-width',e.target.value+'px'));
document.querySelector('#edit-button').addEventListener('click',()=>{editText.value=body.innerText;body.hidden=true;editor.hidden=false;document.querySelector('#edit-button').disabled=true;editText.focus();});
document.querySelector('#cancel-edit').addEventListener('click',()=>{resetEditor();document.querySelector('#edit-button').focus();});
document.querySelector('#save-edit').addEventListener('click',()=>{const paragraphs=editText.value.split(/\n\s*\n/).map(text=>{const p=document.createElement('p');p.textContent=text;return p;});body.replaceChildren(...paragraphs);resetEditor();status.textContent='示例已更新 · 仅保存在本页，未修改酒馆';document.querySelector('#edit-button').focus();});
document.querySelector('#collapse-button').addEventListener('click',e=>{if(!editor.hidden)resetEditor();body.hidden=!body.hidden;e.currentTarget.setAttribute('aria-expanded',String(!body.hidden));e.currentTarget.setAttribute('aria-label',body.hidden?'展开回复':'折叠回复');e.currentTarget.style.transform=body.hidden?'rotate(180deg)':'';});
document.querySelector('#more-button').addEventListener('click',e=>{const menu=document.querySelector('.more-menu');menu.hidden=!menu.hidden;e.currentTarget.setAttribute('aria-expanded',String(!menu.hidden));});
document.querySelector('#restore-sample').addEventListener('click',()=>{setSample();document.querySelector('.more-menu').hidden=true;document.querySelector('#more-button').setAttribute('aria-expanded','false');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!editor.hidden){resetEditor();document.querySelector('#edit-button').focus();}document.querySelector('.more-menu').hidden=true;document.querySelector('#more-button').setAttribute('aria-expanded','false');}});
