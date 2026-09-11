(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const frame = $('bg-frame');
  const workspace = $('Backgrounds');
  const layer = $('bg-dialog-layer');
  const content = $('bg-dialog-content');
  const initialImages = [
    { id:'g1', file:'晨雾堤岸.webp', source:'global', scene:0, added:6, ratio:'16 / 9', folders:['f1'] },
    { id:'g2', file:'工业区_外沿.webp', source:'global', scene:1, added:3, ratio:'16 / 9', folders:['f1'] },
    { id:'g3', file:'裂谷公路_日落.webp', source:'global', scene:2, added:5, ratio:'16 / 9', folders:['f1'] },
    { id:'g4', file:'远山_晴.webp', source:'global', scene:3, added:1, ratio:'4 / 3', folders:[] },
    { id:'g5', file:'夜间引导灯.webp', source:'global', scene:4, added:2, ratio:'16 / 9', folders:[] },
    { id:'g6', file:'门廊_雨后与混凝土结构之间的一点天光_长文件名样本.webp', source:'global', scene:5, added:4, ratio:'16 / 9', folders:[] },
    { id:'c1', file:'营地_晨光.webp', source:'chat', scene:6, added:7, ratio:'16 / 9', folders:[] },
    { id:'c2', file:'仓库_低照度.webp', source:'chat', scene:7, added:8, ratio:'4 / 3', folders:[] },
  ];
  const initialFolders = [
    { id:'f1', name:'外出路线', cover:'g2' },
    { id:'f2', name:'未分类的远行参考与待整理场景素材', cover:null },
  ];
  let state;
  let serial = 10;
  let dialog = null;
  let inertSnapshot = [];
  const collator = new Intl.Collator('zh-CN', { sensitivity:'base', numeric:false });
  const icon = name => { const node = document.createElement('i'); node.className = `fa-solid fa-${name}`; node.setAttribute('aria-hidden','true'); return node; };
  const node = (tag, className, text) => { const el = document.createElement(tag); if(className) el.className=className; if(text !== undefined) el.textContent=text; return el; };
  const nameOf = image => image ? image.file.replace(/\.[^.]+$/, '') : '—';
  const imageById = id => state.images.find(image => image.id === id);
  const liveImages = source => state.images.filter(image => image.listed !== false && (!source || image.source === source));
  const folderById = id => state.folders.find(folder => folder.id === id);
  const say = message => { $('bg-feedback').textContent=message; };
  const sceneCache = new Map();

  // 自绘几何占位场景；不是用户背景，也不代表官方游戏场景。
  function sceneUrl(index) {
    if(sceneCache.has(index)) return sceneCache.get(index);
    const palettes = [
      ['#cddad5','#849f94','#526c66','#bbcbb7'], ['#d2d0bb','#858c75','#494e49','#b4aa7b'],
      ['#d9c0a7','#9a8977','#5e6661','#d8a88b'], ['#d4ddd7','#a0afa2','#667d75','#e4e8d0'],
      ['#68756f','#454f4c','#2a3434','#c8c27e'], ['#c5ccbd','#8d9a8b','#5e6b62','#d7d2a5'],
      ['#e1dcbd','#a7ad83','#64725b','#e8e4c6'], ['#b0b7ab','#7e8b78','#485a4c','#d2c897'],
    ];
    const [sky, middle, dark, light] = palettes[index % palettes.length];
    const landscape = `<path d="M0 228 94 171 174 206 267 106 379 218 477 150 640 213V360H0Z" fill="${middle}"/><path d="M0 277 149 235 275 259 427 230 640 285V360H0Z" fill="${dark}"/>`;
    const industrial = `<rect x="56" y="121" width="114" height="161" fill="${middle}"/><rect x="140" y="166" width="181" height="116" fill="${dark}"/><rect x="408" y="106" width="17" height="190" fill="${dark}"/><rect x="417" y="112" width="147" height="10" fill="${dark}"/><path d="M0 285H640V360H0Z" fill="${middle}"/>`;
    const foreground = index % 2 ? `<path d="M0 327H640M0 340H640" stroke="${dark}" stroke-width="3"/><path d="M323 360 390 264H431L419 360Z" fill="${light}" opacity=".55"/>` : `<path d="M0 304H640M37 315H522M144 328H640" stroke="${light}" stroke-width="2" opacity=".35"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${sky}"/><circle cx="${index%2 ? 494 : 438}" cy="${index%3===0 ? 78 : 98}" r="23" fill="${light}" opacity=".8"/>${index%2 ? industrial : landscape}${foreground}</svg>`;
    const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    sceneCache.set(index,url);
    return url;
  }

  function resetSample() {
    state = { images:structuredClone(initialImages), folders:structuredClone(initialFolders), globalId:'g1', lockedId:'g1', tab:'global', folderId:null, selectionMode:false, selected:new Set(), columns:matchMedia('(max-width:480px)').matches ? 3 : 5, sort:'az', filter:'', hasChat:true, fitting:'classic' };
    serial=10;
    $('bg-filter').value=''; $('bg-sort').value='az'; $('background_fitting').value='classic'; $('bg-lab-chat').checked=true;
    render();
  }

  function filteredImages(source) {
    let images=liveImages(source);
    if(source==='global' && state.folderId) images=images.filter(image=>image.folders.includes(state.folderId));
    const search=state.filter.toLowerCase();
    images=images.filter(image=>image.file.toLowerCase().includes(search));
    images.sort((a,b)=> state.sort==='az' ? collator.compare(a.file,b.file) : state.sort==='za' ? collator.compare(b.file,a.file) : state.sort==='newest' ? b.added-a.added : a.added-b.added);
    return images;
  }

  function mark(className, glyph, label) {
    const el=node('span',`bg-mark ${className}`); el.append(icon(glyph)); el.title=label; el.setAttribute('aria-hidden','true'); return el;
  }

  function imageTile(image) {
    const isGlobal=state.globalId===image.id;
    const isLocked=state.hasChat && state.lockedId===image.id;
    const isSelected=state.selected.has(image.id);
    const tile=node('article',`bg_example${isGlobal ? ' selected-background' : ''}${isLocked ? ' locked-background' : ''}${isSelected ? ' folder-group-selected' : ''}`);
    tile.setAttribute('bgfile',image.file); tile.setAttribute('custom',String(image.source==='chat')); tile.setAttribute('animated','false'); tile.dataset.id=image.id; tile.style.aspectRatio=image.ratio; tile.title=image.file;
    const clipper=node('div','thumbnail-clipper'); clipper.style.backgroundImage=sceneUrl(image.scene);
    clipper.append(node('div','BGSampleTitle',nameOf(image))); tile.append(clipper);
    const select=node('button','bg-select'); select.type='button'; select.dataset.focusKey=`select-${image.id}`;
    const mode=state.selectionMode && image.source==='global';
    select.setAttribute('aria-label',`${mode ? '归类勾选' : '选择背景'}：${nameOf(image)}${isGlobal ? '；全局选中' : ''}${isLocked ? '；当前聊天已锁定' : ''}`);
    select.setAttribute('aria-pressed',String(mode ? isSelected : isLocked || ((!state.hasChat || !state.lockedId) && isGlobal)));
    select.addEventListener('click',event=>selectImage(image.id,event.shiftKey));
    select.addEventListener('keydown',event=>{ if(event.key==='F10' && event.shiftKey){ event.preventDefault(); if(!mode) showImageMenu(image.id,select); } });
    tile.append(select);
    if(isGlobal) tile.append(mark('bg-global-mark','check','全局选择'));
    if(isLocked) tile.append(mark('bg-lock-mark','lock','当前聊天锁定'));
    if(mode) tile.append(mark('bg-select-mark','check','归类勾选'));
    else {
      const menu=node('button','mobile-only-menu-toggle'); menu.type='button'; menu.dataset.focusKey=`menu-${image.id}`; menu.setAttribute('aria-label',`${nameOf(image)}：操作`); menu.setAttribute('aria-haspopup','dialog'); menu.append(icon('ellipsis-vertical'));
      menu.addEventListener('click',event=>{ event.stopPropagation(); showImageMenu(image.id,menu); }); tile.append(menu);
    }
    return tile;
  }

  function folderTile(folder) {
    const tile=node('article','bg_folder_tile'); tile.dataset.folderId=folder.id;
    const select=node('button','bg-folder-select'); select.type='button'; select.title=folder.name; select.dataset.focusKey=`folder-${folder.id}`; select.setAttribute('aria-label',`打开文件夹：${folder.name}`);
    const cover=node('span','bg_folder_tile_cover'); cover.append(icon('folder')); select.append(cover,node('span','bg_folder_tile_name',folder.name));
    const coverImage=imageById(folder.cover) || liveImages('global').find(image=>image.folders.includes(folder.id));
    if(coverImage){ cover.style.backgroundImage=sceneUrl(coverImage.scene); cover.style.backgroundSize='cover'; cover.style.color='#fff'; }
    select.addEventListener('click',()=>{ state.folderId=folder.id; state.selected.clear(); render(); $('bg_back_to_folders').focus(); });
    const menu=node('button','mobile-only-menu-toggle'); menu.type='button'; menu.dataset.focusKey=`folder-menu-${folder.id}`; menu.setAttribute('aria-label',`${folder.name}：操作`); menu.setAttribute('aria-haspopup','dialog'); menu.append(icon('ellipsis-vertical')); menu.addEventListener('click',()=>showFolderMenu(folder.id,menu));
    tile.append(select,menu); return tile;
  }

  function render() {
    workspace.style.setProperty('--bg-thumb-columns',state.columns);
    workspace.style.setProperty('--bg-folder-columns',Math.min(4,state.columns));
    workspace.dataset.cols=String(state.columns);
    workspace.classList.toggle('bg-selection-mode',state.selectionMode);
    workspace.classList.toggle('in-folder-view',Boolean(state.folderId));
    $('bg_thumb_zoom_in').disabled=state.columns<=2; $('bg_thumb_zoom_out').disabled=state.columns>=8;
    $('bg-density').textContent=`${state.columns} 列${state.columns>3 ? ' · 高密度缩略图不保证 44px' : ''}`;
    const global=state.tab==='global';
    for(const source of ['global','chat']) {
      const active=source===state.tab;
      $(`bg-tab-${source}`).setAttribute('aria-selected',String(active)); $(`bg-tab-${source}`).tabIndex=active ? 0 : -1;
      $(`bg-tab-${source}`).parentElement.classList.toggle('ui-tabs-active',active);
      $(`bg_${source}_tab`).hidden=!active;
    }
    $('bg_selection_mode_button').hidden=!global;
    $('bg_selection_mode_button').setAttribute('aria-pressed',String(state.selectionMode));
    $('bg_selection_mode_button').title=state.selectionMode ? '退出多选归类' : '多选归类';
    $('bg_selection_mode_button').setAttribute('aria-label',state.selectionMode ? `退出多选归类，已选 ${state.selected.size} 张` : '多选归类');
    $('bg_group_select_count').hidden=state.selected.size===0; $('bg_group_select_count').textContent=String(state.selected.size);
    $('bg_group_add_to_folder_button').hidden=!global || !state.selectionMode || !state.selected.size;
    $('bg_folder_remove_selected_button').hidden=!global || !state.folderId || !state.selectionMode || !state.selected.size;
    $('bg_folder_breadcrumb').hidden=!state.folderId;
    $('bg_current_folder_name').textContent=folderById(state.folderId)?.name || '';
    $('bg_current_folder_name').title=folderById(state.folderId)?.name || '';
    $('bg_folder_grid').hidden=Boolean(state.folderId);
    const folders=state.folders.filter(folder=>folder.name.toLowerCase().includes(state.filter.toLowerCase()));
    $('bg_folder_grid').replaceChildren(...folders.map(folderTile));
    const globalImages=filteredImages('global');
    $('bg_menu_content').replaceChildren(...globalImages.map(imageTile));
    $('bg-global-empty').hidden=globalImages.length>0 || (!state.folderId && folders.length>0);
    $('bg-global-empty').textContent=state.filter ? '没有匹配的背景。' : state.folderId ? '这个文件夹还没有背景。返回后可用多选归类加入图片。' : '还没有全局背景。';
    const chatImages=state.hasChat ? filteredImages('chat') : [];
    $('bg_custom_content').replaceChildren(...chatImages.map(imageTile));
    $('bg_chat_hint').hidden=chatImages.length>0;
    $('bg_chat_hint').textContent=!state.hasChat ? '先选择一个聊天，再查看或添加它的背景。' : state.filter ? '没有匹配的聊天背景。' : '当前聊天还没有背景。生成或上传的聊天背景会显示在这里。';
    renderPreview();
  }

  function renderPreview() {
    const global=imageById(state.globalId);
    const locked=state.hasChat ? imageById(state.lockedId) : null;
    const visible=locked || global;
    $('bg-visible-name').textContent=nameOf(visible); $('bg-global-name').textContent=nameOf(global); $('bg-locked-name').textContent=locked ? nameOf(locked) : state.hasChat ? '未锁定' : '未选择聊天';
    $('bg-visible-preview').style.backgroundImage=visible ? sceneUrl(visible.scene) : 'none';
    const sizes={classic:'cover',cover:'cover',contain:'contain',stretch:'100% 100%',center:'auto 30px'};
    $('bg-visible-preview').style.backgroundSize=sizes[state.fitting];
  }

  function selectImage(id, shift=false) {
    const image=imageById(id); if(!image) return;
    if(state.selectionMode && image.source==='global') {
      if(state.selected.has(id)) state.selected.delete(id); else state.selected.add(id);
      render(); restoreFocus(`select-${id}`); say(`归类已选 ${state.selected.size} 张；背景没有切换。`); return;
    }
    if(image.source==='chat' && !state.hasChat){ say('先选择聊天。'); return; }
    if(state.hasChat && (state.lockedId || image.source==='chat') && !(shift && image.source==='global')) {
      state.lockedId=id; say(`已切换当前聊天锁定背景：${nameOf(image)}。全局选择保留。`);
    } else {
      state.globalId=id; say(state.hasChat && state.lockedId ? `已更改全局选择：${nameOf(image)}。当前聊天仍显示锁定背景。` : `已选择全局背景：${nameOf(image)}。`);
    }
    render(); restoreFocus(`select-${id}`);
  }

  function restoreFocus(key) {
    const target=key && document.querySelector(`[data-focus-key="${key}"]`);
    if(target && !target.closest('[hidden]')) target.focus(); else $('bg-filter').focus();
  }

  function openDialog({title,kind='编辑',submitText='保存',trigger,build,onSubmit,menu=false,danger=false}) {
    const priorReturn=dialog?.returnKey;
    const priorId=dialog?.returnId;
    if(layer.hidden) {
      inertSnapshot=[...document.body.children].filter(el=>el!==frame && !el.matches('script,.demo-toast')).map(el=>[el,el.inert]);
      inertSnapshot.forEach(([el])=>{ el.inert=true; }); workspace.inert=true;
    }
    dialog={ returnKey:priorReturn || trigger?.dataset.focusKey || null, returnId:priorId || trigger?.id || null, onSubmit };
    $('bg-dialog-title').textContent=title; $('bg-dialog-kind').textContent=kind;
    $('bg-dialog-footer').hidden=menu; $('bg-dialog-confirm').textContent=submitText;
    $('bg-dialog-confirm').classList.toggle('danger',danger); $('bg-dialog-confirm').classList.toggle('primary',!danger);
    $('bg-dialog-error').hidden=true; $('bg-dialog-error').textContent='';
    layer.dataset.kind=menu ? 'menu' : 'form'; content.replaceChildren(); build?.(content);
    layer.hidden=false;
    requestAnimationFrame(()=>{ if(!layer.hidden) (content.querySelector('input,select,button') || $('bg-dialog-close')).focus(); });
  }

  function closeDialog() {
    const previous=dialog; dialog=null; layer.hidden=true; workspace.inert=false;
    inertSnapshot.forEach(([el,old])=>{ el.inert=old; }); inertSnapshot=[];
    if(previous?.returnKey) restoreFocus(previous.returnKey);
    else if(previous?.returnId && $(previous.returnId) && !$(previous.returnId).hidden) $(previous.returnId).focus();
    else $('bg-filter').focus();
  }

  function error(message) { $('bg-dialog-error').textContent=message; $('bg-dialog-error').hidden=false; return false; }
  function inputField(parent,label,value) {
    const wrap=node('label','',label); const input=node('input','bg-field'); input.id='bg-name-input'; input.type='text'; input.maxLength=160; input.value=value; input.required=true; input.autocomplete='off'; wrap.append(input); parent.append(wrap); return input;
  }
  function validName() { const value=$('bg-name-input').value.trim(); if(!value){ error('名称不能为空。'); $('bg-name-input').focus(); return null; } if(/[\\/]/.test(value)){ error('名称不能包含路径分隔符。'); return null; } return value; }
  function menuAction(parent,label,glyph,action,danger=false) { const button=node('button',`bg-menu-action${danger ? ' danger' : ''}`); button.type='button'; button.append(icon(glyph),node('span','',label)); button.addEventListener('click',action); parent.append(button); }

  function showImageMenu(id,trigger) {
    const image=imageById(id); if(!image) return;
    const locked=state.hasChat && state.lockedId===id;
    openDialog({ title:nameOf(image), kind:image.source==='global' ? '全局背景操作' : '聊天背景操作', trigger, menu:true, build:parent=>{
      menuAction(parent,locked ? '解除聊天锁定' : '锁定到当前聊天',locked ? 'lock-open' : 'lock',()=>{
        if(!state.hasChat){ error('先选择一个聊天，再锁定背景。'); return; }
        state.lockedId=locked ? null : id; render(); closeDialog(); say(locked ? '已解除聊天锁定，恢复全局背景。' : `已锁定到当前聊天：${nameOf(image)}。`);
      });
      if(image.source==='global') menuAction(parent,'重命名','pen-to-square',()=>renameImage(id));
      else menuAction(parent,'转入全局背景','file-arrow-up',()=>copyToGlobal(id));
      menuAction(parent,'删除背景','trash-can',()=>deleteImage(id),true);
      if(image.source==='global') {
        menuAction(parent,'所属文件夹','folder',()=>assignFolders([id],false));
        if(state.folderId) menuAction(parent,'设为当前文件夹封面','image',()=>{ const folder=folderById(state.folderId); if(folder){ folder.cover=id; render(); } closeDialog(); say('已更新这个文件夹的封面。'); });
      }
    }});
  }

  function renameImage(id) {
    const image=imageById(id); if(!image) return;
    openDialog({ title:'重命名背景', kind:'仅修改此项名称', build:parent=>inputField(parent,'名称（保留扩展名）',nameOf(image)), onSubmit:()=>{
      const name=validName(); if(!name) return false;
      const ext=image.file.match(/\.[^.]+$/)?.[0] || '.webp'; const file=name+ext;
      if(liveImages('global').some(other=>other.id!==id && other.file===file)) return error('样本中已存在这个名称。');
      image.file=file; render(); say(`已重命名：${name}。`); return true;
    }});
  }

  function copyToGlobal(id) {
    const image=imageById(id); if(!image) return;
    openDialog({ title:'转入全局背景', kind:'按原生操作边界模拟', submitText:'转入全局', build:parent=>{ parent.append(node('p','','以新名称加入全局，并从聊天背景列表移出。已有聊天锁定仍指向原来的背景。')); inputField(parent,'全局背景名称',nameOf(image)); }, onSubmit:()=>{
      const name=validName(); if(!name) return false;
      if(name===nameOf(image)) return error('请输入一个新名称。原生流程在名称未改变时退出。');
      const ext=image.file.match(/\.[^.]+$/)?.[0] || '.webp'; const file=name+ext;
      if(liveImages('global').some(other=>other.file===file)) return error('全局样本已存在这个名称。');
      const next={...image,id:`g${++serial}`,file,source:'global',folders:[],added:serial,listed:true};
      state.images.push(next); state.globalId=next.id; image.listed=false;
      render(); say('已模拟转入全局，聊天列表原条目已移出；没有读写文件。'); return true;
    }});
  }

  function deleteImage(id) {
    const image=imageById(id); if(!image) return;
    openDialog({ title:'删除这个背景？', kind:nameOf(image), submitText:'删除', danger:true, build:parent=>{
      parent.append(node('p','',image.source==='global' ? '在本页移除这张全局样本。原生对应操作会删除服务器上的背景文件。' : '从当前聊天背景列表移除。这里仅演示操作范围。'));
      if(image.source==='chat'){ const label=node('label','bg-checkbox'); const input=node('input'); input.type='checkbox'; input.id='delete_bg_from_server'; input.checked=true; label.append(input,node('span','','同时删除服务器文件（模拟）')); parent.append(label); }
    }, onSubmit:()=>{
      const deleteFile=image.source==='global' || $('delete_bg_from_server').checked;
      image.listed=false; state.selected.delete(id);
      for(const folder of state.folders) if(folder.cover===id) folder.cover=null;
      if(state.globalId===id) state.globalId=liveImages('global')[0]?.id || null;
      if(state.lockedId===id) state.lockedId=liveImages(image.source)[0]?.id || null;
      render(); say(deleteFile ? '已移除样本；服务器文件删除仅被模拟。' : '仅从样本聊天列表移除，未模拟删除原文件。'); return true;
    }});
  }

  function folderChecks(parent, ids=[]) {
    for(const folder of state.folders) {
      const label=node('label','bg-checkbox'); const input=node('input'); input.type='checkbox'; input.dataset.folderId=folder.id; input.checked=ids.includes(folder.id); label.append(input,node('span','',folder.name)); parent.append(label);
    }
  }
  function assignFolders(imageIds,multi,trigger) {
    if(!state.folders.length){ say('先新建一个文件夹。'); if(!layer.hidden) error('先关闭此菜单并新建一个文件夹。'); return; }
    const image=imageById(imageIds[0]);
    openDialog({ title:multi ? `把 ${imageIds.length} 张背景加入文件夹` : '所属文件夹', kind:multi ? '多选归类' : nameOf(image), submitText:multi ? '应用' : '保存', trigger, build:parent=>folderChecks(parent,multi ? [] : image.folders), onSubmit:()=>{
      const folders=[...content.querySelectorAll('input[data-folder-id]:checked')].map(input=>input.dataset.folderId);
      if(multi && !folders.length) return error('选择至少一个文件夹。');
      for(const imageId of imageIds) { const entry=imageById(imageId); if(entry) entry.folders=multi ? [...new Set([...entry.folders,...folders])] : [...folders]; }
      if(multi){ state.selectionMode=false; state.selected.clear(); }
      render(); say(multi ? '已加入所选文件夹，退出多选归类。' : '已保存这张背景的文件夹归属。'); return true;
    }});
  }

  function showFolderMenu(id,trigger) {
    const folder=folderById(id); if(!folder) return;
    openDialog({ title:folder.name, kind:'文件夹操作', trigger, menu:true, build:parent=>{
      menuAction(parent,'重命名文件夹','pen-to-square',()=>editFolder(id));
      menuAction(parent,'删除文件夹','trash-can',()=>{
        openDialog({ title:'删除这个文件夹？', kind:folder.name, submitText:'删除文件夹', danger:true, build:body=>body.append(node('p','','只删除分组，图片会保留在全局背景里。')), onSubmit:()=>{
          state.folders=state.folders.filter(entry=>entry.id!==id); state.images.forEach(image=>{ image.folders=image.folders.filter(key=>key!==id); });
          if(state.folderId===id) state.folderId=null; state.selected.clear(); render(); say('文件夹已删除，全部图片保留。'); return true;
        }});
      },true);
    }});
  }

  function editFolder(id=null,trigger) {
    if(state.tab!=='global'){ say('文件夹只用于全局背景。'); return; }
    const folder=folderById(id);
    openDialog({ title:folder ? '重命名文件夹' : '新建文件夹', kind:'全局背景分组', trigger, submitText:folder ? '保存' : '创建', build:parent=>inputField(parent,'文件夹名称',folder?.name || ''), onSubmit:()=>{
      const name=validName(); if(!name) return false;
      if(folder) folder.name=name; else state.folders.push({id:`f${++serial}`,name,cover:null});
      render(); say(folder ? '文件夹已重命名。' : '已创建空文件夹，可通过归类加入图片。'); return true;
    }});
  }

  function simulateUpload(trigger) {
    if(state.tab==='chat' && !state.hasChat){ say('先选择聊天，再添加聊天背景。'); return; }
    const source=state.tab;
    openDialog({ title:'添加模拟背景', kind:source==='global' ? '全局背景 · 本地样本' : '聊天背景 · 本地样本', trigger, submitText:'添加样本', build:parent=>{
      parent.append(node('p','','使用本页自绘场景代替上传文件。不会打开文件选择器，也不会读取或上传图片。')); inputField(parent,'样本名称',`模拟背景_${serial+1}`);
    }, onSubmit:()=>{
      const name=validName(); if(!name) return false;
      const file=name+'.webp'; if(liveImages(source).some(image=>image.file===file)) return error('这个来源里已存在同名样本。');
      const image={id:`${source==='global' ? 'g' : 'c'}${++serial}`,file,source,scene:serial%8,added:serial,ratio:'16 / 9',folders:[]};
      state.images.push(image); if(source==='global') state.globalId=image.id;
      render(); say(`已添加一张${source==='global' ? '全局' : '聊天'}占位样本；未执行上传。${source==='global' && state.lockedId ? '聊天锁定保持。' : ''}`); return true;
    }});
  }

  function switchTab(source) {
    state.tab=source; if(source==='chat'){ state.selectionMode=false; state.selected.clear(); }
    render(); document.querySelector('.bg-panel-scroll').scrollTop=0;
  }
  for(const source of ['global','chat']) {
    $(`bg-tab-${source}`).addEventListener('click',()=>switchTab(source));
    $(`bg-tab-${source}`).addEventListener('keydown',event=>{ if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){ event.preventDefault(); const next=event.key==='Home' ? 'global' : event.key==='End' ? 'chat' : source==='global' ? 'chat' : 'global'; switchTab(next); $(`bg-tab-${next}`).focus(); } });
  }
  $('bg-filter').addEventListener('input',event=>{ state.filter=event.target.value; render(); });
  $('bg-sort').addEventListener('change',event=>{ state.sort=event.target.value; render(); say('排序已更新；日期是固定的样本顺序。'); });
  $('background_fitting').addEventListener('change',event=>{ state.fitting=event.target.value; renderPreview(); say('已在下方小预览演示适配方式，源图没有改变。'); });
  $('bg_thumb_zoom_in').addEventListener('click',()=>{ state.columns=Math.max(2,state.columns-1); render(); });
  $('bg_thumb_zoom_out').addEventListener('click',()=>{ state.columns=Math.min(8,state.columns+1); render(); });
  $('bg_selection_mode_button').addEventListener('click',()=>{ state.selectionMode=!state.selectionMode; if(!state.selectionMode) state.selected.clear(); render(); say(state.selectionMode ? '多选归类已开启，单击图片勾选；背景保持。' : '已退出多选归类。'); });
  $('bg_group_add_to_folder_button').addEventListener('click',event=>assignFolders([...state.selected],true,event.currentTarget));
  $('bg_folder_remove_selected_button').addEventListener('click',()=>{ for(const id of state.selected){ const image=imageById(id); if(image) image.folders=image.folders.filter(folder=>folder!==state.folderId); } state.selected.clear(); state.selectionMode=false; render(); $('bg_back_to_folders').focus(); say('已从此文件夹移除所选图片，全局背景保留。'); });
  $('bg_back_to_folders').addEventListener('click',()=>{ const old=state.folderId; state.folderId=null; state.selected.clear(); render(); restoreFocus(`folder-${old}`); });
  $('bg_add_folder_button').addEventListener('click',event=>editFolder(null,event.currentTarget));
  $('add_background_button_top').addEventListener('click',event=>simulateUpload(event.currentTarget));
  $('auto_background').addEventListener('click',event=>openDialog({ title:'自动选择 · 模拟说明', kind:'没有发起模型请求', trigger:event.currentTarget, submitText:'知道了', build:parent=>parent.append(node('p','','原生操作会依据当前聊天场景请求模型，并从全局背景名称中选择。本页不连接聊天或模型，因此保留当前背景。')), onSubmit:()=>true }));
  $('bg-lab-width').addEventListener('change',event=>{ frame.dataset.width=event.target.value; });
  $('bg-lab-height').addEventListener('change',event=>{ frame.dataset.height=event.target.value; frame.style.setProperty('--bg-lab-height',event.target.value+'px'); });
  $('bg-lab-chat').addEventListener('change',event=>{ state.hasChat=event.target.checked; render(); say(state.hasChat ? '已回到样本聊天，恢复它保存的锁定背景。' : '未选中聊天，当前显示全局背景。'); });
  $('bg-restore-sample').addEventListener('click',()=>{ resetSample(); say('已恢复 6 张全局图、2 张聊天图和 2 个文件夹；宽高与设计方向保留。'); });
  $('bg-dialog-close').addEventListener('click',closeDialog); $('bg-dialog-cancel').addEventListener('click',closeDialog);
  layer.addEventListener('click',event=>{ if(event.target===layer) closeDialog(); });
  $('bg-dialog-form').addEventListener('submit',event=>{ event.preventDefault(); if(dialog?.onSubmit && dialog.onSubmit() !== false) closeDialog(); });
  document.addEventListener('keydown',event=>{
    if(layer.hidden) return;
    if(event.key==='Escape'){ event.preventDefault(); closeDialog(); return; }
    if(event.key==='Tab') {
      const controls=[...layer.querySelectorAll('button,input,select,textarea,[tabindex]')].filter(el=>!el.disabled && !el.closest('[hidden]') && el.getClientRects().length);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey && (document.activeElement===first || !layer.contains(document.activeElement))){ event.preventDefault(); last?.focus(); }
      else if(!event.shiftKey && (document.activeElement===last || !layer.contains(document.activeElement))){ event.preventDefault(); first?.focus(); }
    }
  });
  resetSample();
})();
