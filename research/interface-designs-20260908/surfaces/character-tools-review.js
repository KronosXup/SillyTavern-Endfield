'use strict';
// Isolated demonstration. No host APIs, storage, files, uploads or network calls.
const $=s=>document.querySelector(s);
const data=Array.from({length:27},(_,i)=>({
  id:i+1,name:'示例角色 '+String(i+1).padStart(2,'0'),favorite:i%4===0,
  type:i%9===8?'group':i%11===10?'folder':'character',tags:[i%2===0?'日常':'冒险',i%3===0?'长篇':'短篇'],
  created:i,recent:(i*7)%27,chats:(i*11)%49,tokens:1000+i*121,
}));
const defaults=()=>({query:'',searchOpen:false,sort:'az',lastSort:'az',filters:{favorites:0,groups:0,folders:0},tagState:{},showTags:false,long:false,extensions:false,page:1,size:50,grid:false,bulk:false,selected:new Set(),lastSelected:null,lastSelectionMode:undefined});
let state=defaults();
const icons={create:'user-plus',file:'file-import',url:'cloud-arrow-down',group:'users-gear',search:'magnifying-glass',favorites:'star',groups:'users',folders:'folder-plus',manage:'gear',tags:'tags',clear:'filter-circle-xmark',grid:'table-cells-large',bulk:'pen-to-square',all:'check-double',delete:'trash-can'};
const labels={create:'新建角色',file:'从文件导入角色',url:'从外部 URL 导入内容',group:'创建新群聊',search:'切换搜索栏',favorites:'仅显示收藏',groups:'仅显示群聊',folders:'仅显示文件夹',manage:'管理标签',tags:'显示标签列表',clear:'清除所有过滤器',grid:'切换角色网格视图',bulk:'批量编辑角色',all:'选择当前页全部角色',delete:'删除已选角色',extra:'扩展追加按钮'};
const sortOptions=[['search','搜索'],['az','A-Z'],['za','Z-A'],['new','最新'],['old','最旧'],['fav','收藏夹'],['recent','最近'],['mostChats','最多聊天'],['leastChats','最少聊天'],['mostTokens','最多 Token'],['leastTokens','最少 Token'],['random','随机']];
function iconButton(action,extra=''){return `<button type="button" class="tool ${extra}" data-action="${action}" title="${labels[action]||action}" aria-label="${labels[action]||action}"><i class="fa-solid fa-${icons[action]||'puzzle-piece'}" aria-hidden="true"></i></button>`;}
function template(kind){const prefix=kind==='before'?'before':'proposal';return `<section class="example ${kind}" ${kind==='before'?'inert':''}>
  <header><h2>${kind==='before'?'现状结构':'配色校正稿'}</h2><span>${kind==='before'?'跟随右侧状态':'可直接操作'}</span></header>
  <div class="drawer-slice" data-panel="${prefix}">
    <div class="tools" data-native="charListFixedTop">
      <div class="action-bar" data-native="rm_button_bar">
        ${iconButton('create')}${iconButton('file')}${iconButton('url')}${iconButton('group')}
        <div class="extra-buttons" data-native="rm_buttons_container"></div>
        <select class="sort-order" aria-label="角色排序顺序" title="角色排序顺序">${sortOptions.map(([v,l])=>`<option value="${v}" ${v==='search'?'hidden':''}>${l}</option>`).join('')}</select>
        ${iconButton('search','search-toggle')}
      </div>
      <div class="search-form" data-native="form_character_search_form" hidden><input type="search" id="${prefix}-search" aria-label="搜索角色" placeholder="搜索…" autocomplete="off"></div>
      <div class="tag-controls" data-native="rm_tag_controls"><div class="tags">
        ${['favorites','groups','folders'].map(a=>iconButton(a,'filter-tool')).join('')}
        ${iconButton('manage','filter-tool manage-tags')}${iconButton('tags','filter-tool')}${iconButton('clear','filter-tool')}
        <div class="ordinary-tags" hidden></div>
      </div></div>
    </div>
    <div class="pagination" data-native="rm_print_characters_pagination">
      <div class="paginationjs">
        <div class="pagination-count" aria-live="polite"></div>
        <div class="page-buttons" aria-label="角色分页">${[['first','«','首页'],['prev','‹','上一页'],['next','›','下一页'],['last','»','末页']].map(([a,t,l])=>`<button type="button" data-page="${a}" aria-label="${l}" title="${l}">${t}</button>`).join('')}</div>
        <select class="page-size" aria-label="每页角色数量">${[10,25,50,100,250,500,1000].map(n=>`<option value="${n}">${n} / 页</option>`).join('')}</select>
      </div>
      ${iconButton('grid')}${iconButton('bulk')}
      <span class="bulk-count" hidden></span>${iconButton('all','bulk-option')}${iconButton('delete','bulk-option delete-button')}
    </div>
    <div class="stub-list" aria-label="匿名示例角色列表"></div>
  </div>
  <p class="example-footer">${kind==='before'?'当前顶部结构复现，非截图。':'只评审工具区；下方条目为示例占位。'}</p>
</section>`;}
$('#comparisons').innerHTML=template('before')+template('proposal');
const panels=[...document.querySelectorAll('[data-panel]')],proposal=$('[data-panel="proposal"]');
const say=text=>{$('#demo-status').textContent=text;};
function explain(title,text){$('#dialog-title').textContent=title;$('#dialog-body').textContent=text;$('#demo-dialog').showModal();}
function matches(value,mode){return mode===0||mode===1&&value||mode===2&&!value;}
function results(){
  const q=state.query.trim().toLocaleLowerCase();
  const rows=data.filter(d=>(!q||d.name.toLocaleLowerCase().includes(q)||d.tags.some(t=>t.includes(q)))&&matches(d.favorite,state.filters.favorites)&&matches(d.type==='group',state.filters.groups)&&matches(d.type==='folder',state.filters.folders)&&Object.entries(state.tagState).every(([tag,mode])=>matches(d.tags.includes(tag),mode)));
  const sorters={az:(a,b)=>a.id-b.id,za:(a,b)=>b.id-a.id,new:(a,b)=>b.created-a.created,old:(a,b)=>a.created-b.created,fav:(a,b)=>Number(b.favorite)-Number(a.favorite),recent:(a,b)=>b.recent-a.recent,mostChats:(a,b)=>b.chats-a.chats,leastChats:(a,b)=>a.chats-b.chats,mostTokens:(a,b)=>b.tokens-a.tokens,leastTokens:(a,b)=>a.tokens-b.tokens,random:(a,b)=>(a.id*13%29)-(b.id*13%29),search:(a,b)=>a.id-b.id};
  return rows.sort(sorters[state.sort]);
}
function currentRows(){const rows=results();return rows.slice((state.page-1)*state.size,state.page*state.size);}
function reloadList(){state.page=1;state.bulk=false;state.selected.clear();state.lastSelected=null;state.lastSelectionMode=undefined;render();}
function setSearch(query){const hadQuery=!!state.query.trim();state.query=query;if(query.trim()&&!hadQuery){state.lastSort=state.sort;state.sort='search';}else if(!query.trim()&&state.sort==='search')state.sort=state.lastSort;reloadList();}
function tagNames(){return ['日常','冒险','长篇','短篇',...(state.long?['跨世界观与多角色长期互动的详细分类标签（含分支剧情与人物关系）']:[])];}
function renderTags(){for(const panel of panels){const el=panel.querySelector('.ordinary-tags');el.replaceChildren();for(const tag of tagNames()){const b=document.createElement('button');b.type='button';b.className='tag-name';b.textContent=tag;b.dataset.tag=tag;el.append(b);}}}
function render(rebuildList=true){
 const rows=results(),pages=Math.max(1,Math.ceil(rows.length/state.size));state.page=Math.min(state.page,pages);const visible=rows.slice((state.page-1)*state.size,state.page*state.size);
 for(const panel of panels){const before=panel.dataset.panel==='before';
  const search=panel.querySelector('.search-form');search.hidden=!state.searchOpen;if(search.querySelector('input').value!==state.query)search.querySelector('input').value=state.query;
  panel.querySelector('[data-action="search"]').classList.toggle('active',state.searchOpen);panel.querySelector('[data-action="search"]').setAttribute('aria-expanded',String(state.searchOpen));
  const sort=panel.querySelector('.sort-order');sort.querySelector('[value=search]').hidden=!state.query.trim();sort.value=state.sort;
  panel.querySelector('.ordinary-tags').hidden=!state.showTags;const tagToggle=panel.querySelector('[data-action="tags"]'),activeTags=Object.values(state.tagState).filter(Boolean).length;tagToggle.setAttribute('aria-expanded',String(state.showTags));tagToggle.classList.toggle('active',state.showTags);tagToggle.classList.toggle('has-filters',activeTags>0);tagToggle.setAttribute('aria-label','显示标签列表'+(activeTags?'，'+activeTags+' 项筛选生效':''));
  for(const name of ['favorites','groups','folders']){const el=panel.querySelector(`[data-action="${name}"]`),mode=state.filters[name];el.dataset.filter=name;el.dataset.state=['undefined','include','exclude'][mode];el.setAttribute('aria-pressed',mode===0?'false':mode===1?'true':'mixed');el.setAttribute('aria-label',labels[name]+'：'+['不限','包含','排除'][mode]);}
  panel.querySelectorAll('[data-tag]').forEach(el=>{const mode=state.tagState[el.dataset.tag]||0;el.dataset.state=['undefined','include','exclude'][mode];el.setAttribute('aria-pressed',mode===0?'false':mode===1?'true':'mixed');el.setAttribute('aria-label',el.dataset.tag+'：'+['不限','包含','排除'][mode]);});
  panel.querySelector('.pagination-count').textContent=rows.length?`${(state.page-1)*state.size+1}–${Math.min(state.page*state.size,rows.length)} / ${rows.length}`:'0 / 0';
  panel.querySelector('.page-size').value=String(state.size);
  for(const a of ['first','prev'])panel.querySelector(`[data-page=${a}]`).disabled=state.page===1;
  for(const a of ['next','last'])panel.querySelector(`[data-page=${a}]`).disabled=state.page===pages;
  panel.querySelector('[data-action=grid]').setAttribute('aria-pressed',String(state.grid));panel.querySelector('[data-action=bulk]').setAttribute('aria-pressed',String(state.bulk));
  panel.querySelector('.pagination').classList.toggle('bulk-active',state.bulk);
  panel.querySelector('.bulk-count').hidden=!state.bulk;panel.querySelector('.bulk-count').textContent=state.bulk?`已选 ${state.selected.size}`:'';
  panel.querySelectorAll('.bulk-option').forEach(el=>{el.hidden=!state.bulk&&!before;el.classList.toggle('bulk-ghost',before&&!state.bulk)});
  panel.querySelector('[data-action=delete]').disabled=state.bulk&&state.selected.size===0;panel.querySelector('[data-action=all]').disabled=state.bulk&&!visible.some(d=>d.type==='character');
  const list=panel.querySelector('.stub-list');list.classList.toggle('grid',state.grid);
  if(rebuildList){const oldScroll=list.scrollTop;list.replaceChildren();if(!visible.length){const e=document.createElement('p');e.className='empty-list';e.textContent='没有符合条件的示例角色';list.append(e);}for(const d of visible){const row=document.createElement('button');row.type='button';row.className='stub-row';row.dataset.item=String(d.id);row.innerHTML=`<span class="stub-avatar" aria-hidden="true">${d.type==='group'?'群':d.type==='folder'?'夹':String(d.id).padStart(2,'0')}</span><span class="stub-text"><strong>${d.name}</strong><small>${d.tags.join(' · ')}${d.favorite?' · 收藏':''}</small></span><span class="stub-check" aria-hidden="true" hidden></span>`;list.append(row);}list.scrollTop=oldScroll;}
  list.querySelectorAll('[data-item]').forEach(el=>{const d=data.find(d=>d.id===Number(el.dataset.item));el.classList.toggle('selected',state.selected.has(d.id));el.querySelector('.stub-check').hidden=!state.bulk;el.disabled=state.bulk&&d.type!=='character';if(state.bulk)el.setAttribute('aria-pressed',String(state.selected.has(d.id)));else el.removeAttribute('aria-pressed');});
 }
}
function toggleItem(id,range){const visible=currentRows().filter(d=>d.type==='character');const item=data.find(d=>d.id===id);if(!item||item.type!=='character')return;const enabled=!state.selected.has(id),oldIndex=visible.findIndex(d=>d.id===state.lastSelected),newIndex=visible.findIndex(d=>d.id===id);if(range&&(oldIndex<0||enabled!==state.lastSelectionMode)){say('这次 Shift 点击与上次选择方向不同，保持原选择。');return;}const items=range?visible.slice(Math.min(oldIndex,newIndex),Math.max(oldIndex,newIndex)+1):[item];for(const d of items){if(enabled)state.selected.add(d.id);else state.selected.delete(d.id)}if(!range){state.lastSelected=id;state.lastSelectionMode=enabled;}render(false);say(`批量模式：已选 ${state.selected.size} 个示例角色。`);}
proposal.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target||target.disabled)return;
 if(target.dataset.page){const total=Math.max(1,Math.ceil(results().length/state.size));state.page=({first:1,prev:Math.max(1,state.page-1),next:Math.min(total,state.page+1),last:total})[target.dataset.page];state.bulk=false;state.selected.clear();render();proposal.querySelector('.stub-list').scrollTop=0;say(`第 ${state.page} 页，共 ${total} 页。`);return;}
 if(target.dataset.tag){const tag=target.dataset.tag;state.tagState[tag]=((state.tagState[tag]||0)+1)%3;reloadList();say(tag+'：'+['不限','包含','排除'][state.tagState[tag]]);return;}
 if(target.dataset.item){if(state.bulk)toggleItem(Number(target.dataset.item),e.shiftKey);else say('这里展示匿名条目占位；角色列表正文不在本轮设计范围。');return;}
 const a=target.dataset.action;if(!a)return;
 if(['create','file','url','group','manage','extra'].includes(a)){explain(labels[a]||'扩展追加按钮','这是工具区的独立方案，只演示入口位置与点击反馈；本页不打开真实编辑器，也不导入或创建数据。');return;}
 if(a==='search'){state.searchOpen=!state.searchOpen;render(false);if(state.searchOpen)proposal.querySelector('input[type=search]').focus();say(state.searchOpen?'搜索栏已展开。':'搜索栏已收起；已有搜索词仍参与筛选。');return;}
 if(a in state.filters){state.filters[a]=(state.filters[a]+1)%3;reloadList();say(labels[a]+'：'+['不限','包含','排除'][state.filters[a]]);return;}
 if(a==='tags'){state.showTags=!state.showTags;render(false);say(state.showTags?'标签列表已展开。':'标签列表已收起；已选标签仍参与筛选。');return;}
 if(a==='clear'){state.filters={favorites:0,groups:0,folders:0};state.tagState={};setSearch('');say('已清除搜索词和筛选条件。');return;}
 if(a==='grid'){state.grid=!state.grid;render(false);say(state.grid?'已切换为网格占位。':'已切换为列表占位。');return;}
 if(a==='bulk'){state.bulk=!state.bulk;state.selected.clear();state.lastSelected=null;state.lastSelectionMode=undefined;render(false);say(state.bulk?'批量编辑已展开。可点选角色；Shift 点击选择当前页的一段。':'已退出批量编辑。');return;}
 if(a==='all'){const eligible=currentRows().filter(d=>d.type==='character'),allSelected=eligible.every(d=>state.selected.has(d.id));for(const d of eligible){if(allSelected)state.selected.delete(d.id);else state.selected.add(d.id);}render(false);say(allSelected?'已取消当前页的全部选择。':`已选择当前页 ${state.selected.size} 个可编辑角色；群聊和文件夹不参与。`);return;}
 if(a==='delete'){explain('批量删除 · 入口预览',`已选择 ${state.selected.size} 个示例角色。正式酒馆在这里打开删除确认；本稿只核对入口显隐，没有执行删除。`);}
});
proposal.addEventListener('contextmenu',e=>{const row=e.target.closest('[data-item]');if(state.bulk&&row&&!row.disabled){e.preventDefault();explain('批量角色操作','正式酒馆提供右键操作菜单。本稿仅覆盖顶部工具区，右键菜单另行设计。');}});
proposal.querySelector('input[type=search]').addEventListener('input',e=>{setSearch(e.target.value);say(`当前有 ${results().length} 个匹配示例。`);});
proposal.querySelector('.sort-order').addEventListener('change',e=>{state.sort=e.target.value;if(state.sort!=='search')state.lastSort=state.sort;reloadList();say('排序：'+sortOptions.find(o=>o[0]===state.sort)[1]);});
proposal.querySelector('.page-size').addEventListener('change',e=>{state.size=Number(e.target.value);reloadList();say(`每页 ${state.size} 项。`);});
$('#preview-width').addEventListener('change',e=>document.documentElement.style.setProperty('--preview-width',e.target.value+'px'));
$('#show-before').addEventListener('change',e=>$('.example.before').hidden=!e.target.checked);
$('#long-tags').addEventListener('change',e=>{state.long=e.target.checked;state.showTags=state.long||state.showTags;renderTags();render(false);say('长标签按实际宽度换行，功能图标不被挤小。');});
$('#extension-buttons').addEventListener('change',e=>{state.extensions=e.target.checked;for(const panel of panels)panel.querySelector('.extra-buttons').innerHTML=state.extensions?iconButton('extra')+iconButton('extra'):'';say(state.extensions?'模拟两个扩展追加按钮；顺序保持，空间不足时自然换行。':'已收起扩展追加按钮。');});
$('#short-height').addEventListener('change',e=>$('#workbench').classList.toggle('short-height',e.target.checked));
$('#search-empty').addEventListener('click',()=>{state.searchOpen=true;setSearch('未收录的角色');proposal.querySelector('input[type=search]').focus();say('无结果示例。可清空搜索词恢复。');});
$('#reset-demo').addEventListener('click',()=>{state=defaults();for(const id of ['long-tags','extension-buttons','short-height'])$('#'+id).checked=false;$('#workbench').classList.remove('short-height');panels.forEach(p=>p.querySelector('.extra-buttons').replaceChildren());renderTags();render();say('已回到初始状态。');});
renderTags();render();
