'use strict';
// Isolated layout/state study. All metadata below is fictional; no host APIs or storage.
const $=s=>document.querySelector(s),base='../research/operator-site-2026-09-09/';
const examples=[
 {id:'1',name:'提弗洛斯',image:'removed-reference.svg',version:'v1.2',note:'示例备注：一段尚未写完的旅程。',tags:['冒险','长篇'],favorite:true},
 {id:'2',name:'管理员',image:'removed-reference.svg',version:'v0.8',note:'示例备注：这里保留角色作者的原始说明。',tags:['日常','多角色']},
 {id:'3',name:'陈千语',image:'removed-reference.svg',version:'v2.0',note:'示例备注：短篇互动，适合从一个场景开始。',tags:['短篇'],favorite:true},
 {id:'4',name:'佩丽卡',image:'removed-reference.svg',note:'示例备注：普通方形头像也需要自然显示。',tags:['日常']},
 {id:'5',name:'没有头像的角色',note:'示例备注：缺少图片时仍能辨识条目。',tags:['未分类']},
 {id:'6',name:'仅有姓名的角色',image:'removed-reference.svg',tags:[]},
 {id:'g',kind:'group',name:'东岸同行者',note:'示例成员：管理员、陈千语',tags:['群聊'],count:2},
 {id:'f',kind:'folder',name:'长篇故事',note:'示例文件夹',tags:[],count:3},
];
let bulk=false,selected=new Set(),lastSelected=null,long=false;
const panels=[$('#role-list'),$('#role-grid')];
function itemName(d){return long&&d.id==='1'?'提弗洛斯 · 跨越世界尽头的长篇旅途与多角色分支互动记录':d.name;}
function filtered(){const q=$('#query').value.trim().toLowerCase();return examples.filter(d=>(!$('#favorites-only').checked||d.favorite)&&(!q||(itemName(d)+' '+(d.note||'')+' '+d.tags.join(' ')).toLowerCase().includes(q)));}
function make(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
function picture(file,alt=''){const image=make('img');image.src=base+file;image.alt=alt;image.addEventListener('error',()=>{const parent=image.parentElement;if(parent){image.remove();parent.classList.add('no-picture');parent.append(make('i','fa-solid fa-user'));}},{once:true});return image;}
function card(d){
 const row=make('button','role-entry '+(d.kind==='group'?'group_select':d.kind==='folder'?'bogus_folder_select':'character_select'));
 row.type='button';row.dataset.id=d.id;row.classList.toggle('is_fav',!!d.favorite);row.classList.toggle('character_selected',selected.has(d.id));row.title=itemName(d);row.setAttribute('aria-label',itemName(d)+(d.favorite?'，已收藏':'')+(d.kind==='group'?'，群聊':d.kind==='folder'?'，文件夹':''));
 if(bulk){row.disabled=!!d.kind;if(!d.kind)row.setAttribute('aria-pressed',String(selected.has(d.id)));}
 const avatar=make('span','avatar');
 if(d.image)avatar.append(picture(d.image));
 else if(d.kind==='group'){const group=make('span','group-avatars');group.append(picture('removed-reference.svg'),picture('removed-reference.svg'));avatar.append(group);}
 else if(d.kind==='folder'){avatar.append(make('i','fa-solid fa-folder'));}
 else{avatar.classList.add('no-picture');avatar.append(make('i','fa-solid fa-user'),make('small','','无头像'));}
 const content=make('span','entry-content'),nameLine=make('span','character_name_block');
 nameLine.append(make('span','ch_name',itemName(d)));
 if(d.kind)nameLine.append(make('span','type-mark',d.kind==='group'?'群聊 '+d.count:'文件夹 '+d.count));
 else if(d.version){const version=make('small','character_version',long&&d.id==='1'?'v1.2.0-beta / extended edition':d.version);version.title=version.textContent;nameLine.append(version);}
 content.append(nameLine);
 if(d.note){const note=make('span','ch_description',d.note);note.title=d.note;content.append(note);}
 const tags=make('span','tags_inline');for(const tag of [...d.tags,...(long&&d.id==='1'?['包含多人物关系和跨世界观分支的长期互动标签']:[])])tags.append(make('span','tag',tag));content.append(tags);
 if(d.kind==='folder'){const dots=make('span','member-dots');dots.append(picture('removed-reference.svg'),picture('removed-reference.svg'),picture('removed-reference.svg'));content.append(dots);}
 row.append(avatar,content);
 if(d.favorite){const star=make('span','favorite-mark');star.setAttribute('aria-hidden','true');star.append(make('i','fa-solid fa-star'));row.append(star);}
 if(bulk&&!d.kind){const check=make('span','bulk-check');check.setAttribute('aria-hidden','true');if(selected.has(d.id))check.append(make('i','fa-solid fa-check'));row.append(check);}
 return row;
}
function render(){const rows=filtered();document.body.classList.toggle('bulk-mode',bulk);for(const panel of panels){const old=panel.scrollTop;panel.replaceChildren(...rows.map(card));if(!rows.length)panel.append(make('p','empty-result','没有符合条件的示例角色'));panel.scrollTop=old;}document.querySelectorAll('.result-count').forEach(e=>e.textContent=rows.length+' 项');$('#selection-count').hidden=!bulk;$('#selection-count').textContent='已选 '+selected.size;$('#select-all').hidden=!bulk;$('#select-all').disabled=!rows.some(d=>!d.kind);}
function say(text){$('#demo-status').textContent=text;}
function resetSelection(){selected.clear();lastSelected=null;}
for(const panel of panels)panel.addEventListener('click',e=>{const row=e.target.closest('.role-entry');if(!row||row.disabled)return;const d=examples.find(d=>d.id===row.dataset.id);if(bulk){if(e.shiftKey&&!lastSelected){say('请先单击一个角色，再使用 Shift 范围选择。');return;}const target=!selected.has(d.id),list=filtered().filter(d=>!d.kind),start=list.findIndex(item=>item.id===lastSelected?.id);let ids=[d.id];if(e.shiftKey&&lastSelected){if(target!==lastSelected.mode){say('这次 Shift 点击与上次选择方向不同，保持原选择。');return;}const finish=list.findIndex(item=>item.id===d.id);if(start>=0)ids=list.slice(Math.min(start,finish),Math.max(start,finish)+1).map(item=>item.id);}for(const id of ids)target?selected.add(id):selected.delete(id);if(!e.shiftKey)lastSelected={id:d.id,mode:target};render();panel.querySelector('[data-id="'+d.id+'"]').focus({preventScroll:true});say('已选 '+selected.size+' 个示例角色；两种视图同步。');return;}
 $('#dialog-title').textContent=itemName(d);$('#dialog-text').textContent=d.kind==='folder'?'这里仅示意文件夹入口。正式酒馆仍进入它原有的标签文件夹，不把文件夹当作角色。':d.kind==='group'?'这里仅示意群聊入口。正式酒馆保留群聊的成员与原生打开行为。':'这里只演示条目的打开反馈。正式酒馆仍调用原来的角色选择流程；本页不读取或改变真实角色。';$('#demo-dialog').showModal();});
$('#query').addEventListener('input',()=>{bulk=false;$('#bulk-mode').checked=false;resetSelection();render();say('找到 '+filtered().length+' 项。');});
$('#favorites-only').addEventListener('change',()=>{bulk=false;$('#bulk-mode').checked=false;resetSelection();render();say($('#favorites-only').checked?'只显示已收藏的两个示例角色。':'已显示全部示例。');});
$('#bulk-mode').addEventListener('change',e=>{bulk=e.target.checked;resetSelection();render();say(bulk?'批量模式：只选择角色，群聊与文件夹暂不可选。':'已退出批量模式。');});
$('#select-all').addEventListener('click',()=>{const ids=filtered().filter(d=>!d.kind).map(d=>d.id),all=ids.every(id=>selected.has(id));for(const id of ids)all?selected.delete(id):selected.add(id);lastSelected=null;render();say(all?'已取消选择。':'已选中当前结果中的 '+ids.length+' 个角色。');});
$('#long-content').addEventListener('change',e=>{long=e.target.checked;render();});
$('#panel-width').addEventListener('change',e=>document.documentElement.style.setProperty('--preview-width',e.target.value+'px'));
$('#short-height').addEventListener('change',e=>document.body.classList.toggle('short-height',e.target.checked));
$('#reduce-motion').addEventListener('change',e=>document.body.classList.toggle('reduced-motion',e.target.checked));
$('#reset').addEventListener('click',()=>{bulk=false;long=false;resetSelection();$('#query').value='';for(const id of ['favorites-only','bulk-mode','long-content','short-height','reduce-motion'])$('#'+id).checked=false;document.body.classList.remove('short-height','reduced-motion');render();panels.forEach(p=>p.scrollTop=0);say('已恢复初始示例。');});
render();
