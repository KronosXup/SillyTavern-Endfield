import {knowledgeInitialState,renderKnowledgePanel,handleKnowledgeAction} from './panels-knowledge.js';
import {personalInitialState,renderPersonalPanel,handlePersonalAction} from './panels-personal.js';

const panels = [
  {id:'connection',label:'API 连接',title:'API 连接配置',icon:'plug',native:'rm_api_block',help:'连接配置、来源、端点、密钥和模型在同一条操作流程内。配置切换、输入校验和状态切换只作用于本页样例；不向端点发送请求。'},
  {id:'formatting',label:'AI 回复格式化',title:'高级格式化设置',icon:'text',native:'AdvancedFormatting',help:'上下文、格式指引、系统提示词与推理各保留自己的分组。聊天补全下不可用的项目保留禁用状态；切换 API 类型可查看差异。'},
  {id:'world',label:'世界书',title:'世界书',icon:'book',native:'WorldInfo',help:'全局启用的多选与当前编辑对象的单选分开保留。可搜索、创建与编辑示例条目，展开全局激活设置和各条目的详细字段。'},
  {id:'settings',label:'用户设置',title:'用户设置',icon:'settings',native:'user-settings-block',help:'主题、角色、聊天与脚本设置保留各自分组。搜索只高亮命中的文字，不隐藏其余条目。所有更改仅更新本页示例值。'},
  {id:'backgrounds',label:'背景',title:'背景',icon:'image',native:'Backgrounds',help:'全局与聊天图库分开；当前使用、聊天锁定、批量选择是三种独立状态。图片来自本机已有图库，仅作为设计样例。'},
  {id:'extensions',label:'扩展程序',title:'扩展程序',icon:'cubes',native:'rm_extensions_block',help:'沿用动态折叠节和独立的扩展管理入口。示例展示不同密度的扩展表单；安装与管理动作不会操作实际宿主。'},
  {id:'personas',label:'用户设定管理',title:'用户设定管理',icon:'user',native:'PersonaManagement',help:'保留头像列表与当前人设详情的关系。名称、描述、链接和插入位置均可试用；深度与角色只在相应插入位置出现。'},
];
const initialState = {...knowledgeInitialState,...personalInitialState};
let state = structuredClone(initialState);
const requested = new URL(location.href).searchParams.get('panel');
let activePanel = panels.some(p=>p.id===requested) ? requested : 'connection';
const ui = {details:new Map(),scroll:new Map()};
const body = document.querySelector('#panel-body');
const scroll = document.querySelector('#panel-scroll');
const toolbar = document.querySelector('#toolbar');
const stage = document.querySelector('#content-stage');
let toastTimer;
let rendering = false;

const glyphs = {plug:0xf1e6,text:0xf031,book:0xf558,settings:0xf4fe,image:0xe209,cubes:0xf1b3,user:0xf118,sliders:0xf1de,address:0xf2bb,search:0xf002,plus:0xf067,save:0xf0c7,edit:0xf303,trash:0xf2ed,import:0xf56f,export:0xf56e,reset:0xf2ea,check:0xf00c,close:0xf00d,chevron:0xf078,lock:0xf023,unlock:0xf09c,grid:0xf00a,list:0xf03a,folder:0xf07b,upload:0xf093,copy:0xf0c5,link:0xf0c1,help:0xf059,eye:0xf06e,refresh:0xf021,play:0xf04b,pin:0xf08d,back:0xf060,expand:0xf065,file:0xf15b,code:0xf121,star:0xf005,download:0xf019,warning:0xf071,checkCircle:0xf058,volume:0xf028};
function icon(name) { return `<i class="fa" aria-hidden="true">&#${glyphs[name]??glyphs.file};</i>`; }
function esc(value='') {return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function getValue(path) {return String(path).split('.').reduce((o,k)=>o?.[k],state);}
function setValue(path,value) {
  const keys=String(path).split('.');
  if(keys.some(k=>['__proto__','prototype','constructor'].includes(k)))return;
  let target=state;
  for(let i=0;i<keys.length-1;i++){if(target[keys[i]]==null)target[keys[i]]={};target=target[keys[i]];}
  target[keys.at(-1)]=value;
}
function idFor(path) {return `field-${String(path).replace(/[^a-zA-Z0-9_-]/g,'-')}`;}
function highlight(text,query) {
  const value=String(text??'');const q=String(query??'').trim();
  if(!q)return esc(value);
  const lower=value.toLocaleLowerCase();const needle=q.toLocaleLowerCase();let from=0;let html='';let index;
  while((index=lower.indexOf(needle,from))>=0){html+=esc(value.slice(from,index))+`<mark>${esc(value.slice(index,index+q.length))}</mark>`;from=index+q.length;}
  return html+esc(value.slice(from));
}
function visibleLabel(text) {return esc(text);}
function field(o) {
  const {path,label='',type='text',help='',options=[],placeholder='',min,max,step,rows=6,disabled=false,wide=false,readonly=false}=o;
  const id=idFor(path);const value=o.value!==undefined?o.value:getValue(path);const attr=`id="${id}" data-field="${esc(path)}"${disabled?' disabled':''}${readonly?' readonly':''}${help?` aria-describedby="${id}-help"`:''}`;
  const numAttrs=`${min!==undefined?` min="${esc(min)}"`:''}${max!==undefined?` max="${esc(max)}"`:''}${step!==undefined?` step="${esc(step)}"`:''}`;
  let control;
  if(type==='select') {
    control=`<select ${attr}>${options.map(item=>{const option=typeof item==='object'?item:{value:item,label:item};return `<option value="${esc(option.value)}"${String(option.value)===String(value)?' selected':''}${option.disabled?' disabled':''}>${esc(option.label??option.value)}</option>`;}).join('')}</select>`;
  } else if(type==='textarea') {
    control=`<textarea ${attr} rows="${rows}" placeholder="${esc(placeholder)}" spellcheck="false">${esc(value)}</textarea><div class="field-count" data-count-for="${esc(path)}">${String(value??'').length} 字符</div>`;
  } else if(type==='range') {
    const safeValue=Number.isFinite(Number(value))?value:(min??0);
    control=`<div class="range-control"><input ${attr} type="range" value="${esc(safeValue)}"${numAttrs}><input id="${id}-amount" type="number" data-field="${esc(path)}" aria-label="${esc(label)}数值" value="${esc(safeValue)}"${numAttrs}${disabled?' disabled':''}></div>`;
  } else {
    control=`<input ${attr} type="${esc(type)}" value="${esc(value??'')}" placeholder="${esc(placeholder)}"${numAttrs}${type==='password'?' autocomplete="new-password"':type==='url'?' autocomplete="url"':' autocomplete="off"'}${['url','password','search'].includes(type)?' spellcheck="false"':''}>`;
  }
  return `<div class="setting-row${wide?' is-wide':''}${type==='textarea'?' is-textarea':''}${disabled?' is-disabled':''}"><div class="field-label"><label for="${id}">${visibleLabel(label)}</label>${help?`<p class="help-text" id="${id}-help">${visibleLabel(help)}</p>`:''}</div><div class="control">${control}</div></div>`;
}
function toggle({path,label='',help='',disabled=false}) {
  const id=idFor(path);return `<label class="check-row${disabled?' is-disabled':''}" for="${id}"><input id="${id}" type="checkbox" data-field="${esc(path)}"${getValue(path)?' checked':''}${disabled?' disabled':''}><span class="check-copy"><span>${visibleLabel(label)}</span>${help?`<small class="help-text">${visibleLabel(help)}</small>`:''}</span></label>`;
}
function button(label,action,{icon:iconName,kind='secondary',disabled=false,title='',attrs=''}={}) {
  return `<button type="button" class="button ${esc(kind)}${!label?' icon-only':''}" data-action="${esc(action)}"${disabled?' disabled':''}${title?` title="${esc(title)}"`:''}${!label?` aria-label="${esc(title||action)}"`:''}${attrs?' '+attrs:''}>${iconName?icon(iconName):''}${label?`<span>${esc(label)}</span>`:''}</button>`;
}
function section(title,content,{id,open=true,meta=''}={}) {
  const key=`${activePanel}:${id||title}`;const expanded=ui.details.has(key)?ui.details.get(key):open;
  return `<details class="section" data-section-id="${esc(key)}"${expanded?' open':''}><summary class="section-head"><span>${visibleLabel(title)}</span>${meta?`<span class="section-meta">${esc(meta)}</span>`:''}</summary><div class="section-body">${content}</div></details>`;
}
function announce(message) {
  const toast=document.querySelector('#toast');clearTimeout(toastTimer);toast.textContent=String(message);toast.hidden=false;toastTimer=setTimeout(()=>{toast.hidden=true;},4200);
}
function download(name,data,mime='application/json') {
  const content=typeof data==='string'?data:JSON.stringify(data,null,2);
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function modal({title,body:content,confirmLabel='确定',onConfirm,wide=false}) {
  const host=document.querySelector('#dialog-host');const opener=document.activeElement;
  const previous=host.querySelector('dialog');if(previous)previous.close();
  host.innerHTML=`<dialog class="study-dialog${wide?' is-wide':''}" aria-labelledby="dialog-title"><header class="dialog-heading"><h2 id="dialog-title">${esc(title)}</h2><button type="button" class="dialog-close" data-dialog-close aria-label="关闭">${icon('close')}</button></header><div class="dialog-body">${content}</div><footer class="dialog-actions">${onConfirm?'<button type="button" class="button secondary" data-dialog-close>取消</button>':''}<button type="button" class="button ${onConfirm?'primary':'secondary'}" data-dialog-confirm>${esc(confirmLabel)}</button></footer></dialog>`;
  const dialog=host.querySelector('dialog');
  dialog.querySelectorAll('[data-dialog-close]').forEach(el=>el.addEventListener('click',()=>dialog.close()));
  dialog.querySelector('[data-dialog-confirm]').addEventListener('click',async()=>{
    try {const result=onConfirm?await onConfirm(dialog):true;if(result!==false)dialog.close();}
    catch(error){console.error(error);announce('该操作未完成，请检查填写内容。');}
  });
  dialog.addEventListener('close',()=>{dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});else toolbar.querySelector('[aria-current="page"]')?.focus({preventScroll:true});},{once:true});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.showModal();return dialog;
}
function context() {return {state,esc,icon,field,toggle,button,section,render,announce,modal,download,highlight};}
function captureFocus() {
  const el=document.activeElement;
  if(!body.contains(el))return null;
  return {path:el.dataset.field,id:el.id,action:el.dataset.action,type:el.type,start:el.selectionStart,end:el.selectionEnd};
}
function restoreFocus(saved) {
  if(!saved)return;
  let el=saved.id?document.getElementById(saved.id):null;
  if(!el&&saved.path)el=Array.from(body.querySelectorAll('[data-field]')).find(n=>n.dataset.field===saved.path&&n.type===saved.type);
  if(!el&&saved.action)el=Array.from(body.querySelectorAll('[data-action]')).find(n=>n.dataset.action===saved.action);
  if(el&&!el.disabled){el.focus({preventScroll:true});if(saved.start!=null&&typeof el.setSelectionRange==='function'){try{el.setSelectionRange(saved.start,saved.end);}catch{}}}
}
function arrangePanelTools() {
  const content=body.querySelector('.panel-body');
  if(!content)return;
  content.querySelectorAll('.panel-intro').forEach(el=>el.remove());
  const selected=[];
  for(const el of [...content.children]) {
    if(el.matches('.preset-line,.list-toolbar,.search-row'))selected.push(el);
    else if(activePanel==='connection'&&el.matches('.setting-row'))selected.push(el);
    else if(activePanel==='world'&&el.querySelector('select[multiple]'))selected.push(el);
    else if(activePanel==='world'&&el.matches('.actions'))selected.push(el);
  }
  if(selected.length){
    const tools=document.createElement('div');tools.className='panel-tools';
    selected.forEach(el=>tools.append(el));content.prepend(tools);
  }
  if(activePanel==='personas') {
    const list=content.querySelector('.resource-list');
    const tools=content.querySelector(':scope>.panel-tools');
    if(list&&tools){
      const listActions=list.querySelector(':scope>.list-toolbar');
      const search=list.querySelector(':scope>.search-row');
      const mainRow=tools.querySelector('.list-toolbar');
      const actions=mainRow?.querySelector('.actions');
      if(listActions&&actions){actions.prepend(...listActions.children);listActions.remove();mainRow.prepend(actions);}
      if(search)tools.append(search);
    }
  }
}
function render({resetScroll=false}={}) {
  const focus=captureFocus();const oldScroll=scroll.scrollTop;const p=panels.find(p=>p.id===activePanel);rendering=true;
  toolbar.innerHTML=`<span class="toolbar-context" role="img" aria-label="AI 响应配置，本页不展示" title="AI 响应配置">${icon('sliders')}</span>`+panels.map(p=>`<button class="tool-button" type="button" data-panel="${p.id}" aria-label="${p.label}"${p.id===activePanel?' aria-current="page"':''}>${icon(p.icon)}<span class="tool-tip" aria-hidden="true">${p.label}</span></button>`).join('')+`<span class="toolbar-context" role="img" aria-label="角色管理，本页不展示" title="角色管理">${icon('address')}</span>`;
  document.querySelector('#panel-title').textContent=p.title;
  document.querySelector('#panel-position').textContent=`${panels.indexOf(p)+1} / 7`;
  document.querySelector('#panel-native-name').textContent=p.label;
  body.dataset.panel=activePanel;
  stage.style.setProperty('--demo-font-scale',String(state.settings?.fontScale??1));
  const ctx=context();body.innerHTML=renderKnowledgePanel(activePanel,ctx)??renderPersonalPanel(activePanel,ctx)??'<p class="empty-state">面板尚未载入。</p>';
  arrangePanelTools();
  scroll.scrollTop=resetScroll?(ui.scroll.get(activePanel)||0):oldScroll;
  restoreFocus(focus);rendering=false;
  document.title=`Endfield · ${p.label} · 七面板 V3`;
}
function switchPanel(id,{focus=false}={}) {
  if(!panels.some(p=>p.id===id))return;
  ui.scroll.set(activePanel,scroll.scrollTop);activePanel=id;
  const url=new URL(location.href);url.searchParams.set('panel',id);history.replaceState(null,'',url);
  render({resetScroll:true});if(focus)toolbar.querySelector(`[data-panel="${id}"]`).focus({preventScroll:true});
}
toolbar.addEventListener('click',e=>{const target=e.target.closest('[data-panel]');if(target)switchPanel(target.dataset.panel);});
toolbar.addEventListener('keydown',e=>{
  const target=e.target.closest('[data-panel]');if(!target||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const index=panels.findIndex(p=>p.id===target.dataset.panel);const next=e.key==='Home'?0:e.key==='End'?panels.length-1:(index+(e.key==='ArrowRight'?1:-1)+panels.length)%panels.length;switchPanel(panels[next].id,{focus:true});
});
body.addEventListener('toggle',e=>{if(e.target.matches('details[data-section-id]')&&!rendering)ui.details.set(e.target.dataset.sectionId,e.target.open);},true);
function readInput(el) {
  if(el instanceof HTMLSelectElement&&el.multiple)return Array.from(el.selectedOptions,o=>o.value);
  if(el.type==='checkbox')return el.checked;
  if(['number','range'].includes(el.type)) {
    if(el.value==='')return '';
    let value=Number(el.value);if(!Number.isFinite(value))return '';
    if(el.min!=='')value=Math.max(Number(el.min),value);if(el.max!=='')value=Math.min(Number(el.max),value);return value;
  }
  const value=el.value;
  return el.tagName==='SELECT'&&typeof getValue(el.dataset.field)==='number'&&value!==''&&Number.isFinite(Number(value))?Number(value):value;
}
body.addEventListener('input',e=>{
  const el=e.target;if(!el.dataset?.field)return;
  setValue(el.dataset.field,readInput(el));
  body.querySelectorAll('[data-count-for]').forEach(n=>{if(n.dataset.countFor===el.dataset.field)n.textContent=`${String(el.value).length} 字符`;});
  if(el.type==='range')el.closest('.range-control')?.querySelector('input[type=number]')?.setAttribute('value',el.value);
  if((el.type==='search'||el.dataset.field==='settings.search')&&!e.isComposing)render();
});
body.addEventListener('compositionend',e=>{if(e.target.dataset?.field&&(e.target.type==='search'||e.target.dataset.field==='settings.search'))render();});
body.addEventListener('change',e=>{const el=e.target;if(!el.dataset?.field)return;setValue(el.dataset.field,readInput(el));render();});
async function routeAction(e) {
  const el=e.target.closest('[data-action]');if(!el||el.disabled)return;
  e.preventDefault();const action=el.dataset.action;const ctx=context();
  try {if(await handleKnowledgeAction(action,el,ctx))return;if(await handlePersonalAction(action,el,ctx))return;announce('这个动作暂未包含在当前样例中。');}
  catch(error){console.error(error);announce('该操作未完成，示例数据已保留。');}
}
document.addEventListener('click',routeAction);
document.addEventListener('submit',e=>e.preventDefault());
document.querySelector('#preview-width').addEventListener('change',e=>{stage.style.setProperty('--preview-width',e.target.value==='auto'?'1080px':`${e.target.value}px`);});
document.querySelector('#preview-height').addEventListener('change',e=>{stage.style.setProperty('--content-height',e.target.value==='compact'?'300px':'680px');});
document.querySelector('#reset-demo').addEventListener('click',()=>modal({title:'重置本页样例？',body:'<p>将恢复七个面板的示例值。正式酒馆中的数据与设置不受影响。</p>',confirmLabel:'重置样例',onConfirm:()=>{state=structuredClone(initialState);ui.details.clear();ui.scroll.clear();render({resetScroll:true});announce('本页样例已恢复。');}}));
document.querySelector('#panel-help').addEventListener('click',()=>{const p=panels.find(p=>p.id===activePanel);modal({title:p.label,body:`<p>${esc(p.help)}</p>`,confirmLabel:'知道了'});});
document.querySelector('#reference-open').addEventListener('click',()=>modal({title:'继承已确认的角色管理面板',wide:true,confirmLabel:'返回面板',body:`<p>七个面板沿用现行角色管理的视觉体系：紧凑深灰工具头、连续浅灰工作面、白色资源条目。等高线、按钮材质与滚动条直接复用已确认素材。</p><ul><li>工具区：沿用 R02 等高线，保持右侧显现和原有比例。</li><li>主体：浅色连续表面，依靠分隔与字重区分字段和分组。</li><li>操作：圆形与胶囊按钮、灰色内缘、统一的悬停变化。</li><li>内容：世界书、背景、人设各自保留列表与编辑关系。</li></ul><table class="native-map"><thead><tr><th>面板</th><th>当前宿主入口</th></tr></thead><tbody>${panels.map(p=>`<tr><td>${p.label}</td><td><code>#${p.native}</code></td></tr>`).join('')}</tbody></table><details><summary>辅助参考：游戏设置页</summary><img class="reference-image" src="assets/settings-reference.jpg" alt="游戏设置实录，仅供字段关系参考"></details><p class="reference-copy">已核对普通 SillyTavern 1.18.0 的七个入口。网页里的配置、世界书和人设均为示例；本轮仍为独立设计方案。</p>`}));
new ResizeObserver(entries=>{document.querySelector('#preview-size').textContent=`${Math.round(entries[0].contentRect.width)} px`;}).observe(stage);
render();
