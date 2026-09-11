(() => {
  'use strict';
  const q = selector => document.querySelector(selector);
  const body = document.body;
  const frame = q('#workspace-frame');
  const stage = q('#workspace-stage');
  const chat = q('#chat');
  const input = q('#send_textarea');
  const drawer = q('#settings-drawer');
  const dialog = q('#workspace-dialog');
  const navButtons = [...document.querySelectorAll('[data-nav]')];
  const navLabels = ['AI 响应配置','API 连接','高级格式','世界书','用户设置','背景','扩展设置','用户角色','角色管理'];
  const defaultTitle = '未完的记录';
  const draft = '先把这段话留在这里。\n\n不急着收尾，也不用把每件事都安排得井井有条。\n我想从刚才没说完的那句话继续。\n\n光标来到下一行时，工具应该留在熟悉的位置。\n长一些的草稿需要足够的阅读宽度。\n\n这是当前页面的虚构样本。\n没有读取真实聊天，也不会发送到任何服务。';
  const staticSample = '窗边的纸页被风翻起一角，又慢慢落回桌上。铅笔横在尚未写完的句子旁，窗外只有很轻的雨声。\n\n记录没有替任何人作出决定。它只是停在这里，等下一句话自然地接上。';
  let openNav = -1;
  let menuAnchor = null;
  let activeMenu = null;
  let dialogOrigin = null;
  let dialogAction = null;
  let attachments = 0;
  let generationTimer;
  let activeResponse = null;
  let bookmarked = false;
  function state(text) { q('#scene-state').textContent = text; }
  function resizeInput() { input.style.height='auto'; input.style.height=`${input.scrollHeight + 1}px`; }
  function measureScene() {
    const width=stage.getBoundingClientRect().width;
    body.classList.toggle('narrow-scene',width<=520);
    document.documentElement.style.setProperty('--workspace-popup-limit',`${Math.max(236,width-24)}px`);
    stage.style.setProperty('--compose-height',`${q('#form_sheld').offsetHeight}px`);
    if (activeMenu && menuAnchor) placeMenu(activeMenu,menuAnchor);
  }
  function closeMenus(restore=false) {
    for (const menu of document.querySelectorAll('.menu-shell')) menu.hidden=true;
    for (const trigger of document.querySelectorAll('[aria-controls="options"],[aria-controls="extensionsMenu"],[aria-controls="message-menu"]')) trigger.setAttribute('aria-expanded','false');
    if (restore) menuAnchor?.focus({preventScroll:true});
    activeMenu=null; menuAnchor=null;
  }
  function placeMenu(menu,anchor) {
    const bounds=stage.getBoundingClientRect();
    const anchorRect=anchor.getBoundingClientRect();
    const topHeight=q('.workspace-top').offsetHeight;
    menu.style.maxHeight=`${Math.max(110,stage.clientHeight-topHeight-q('#form_sheld').offsetHeight-13)}px`;
    const desired=anchorRect.top-bounds.top-menu.offsetHeight-7;
    const top=Math.max(topHeight+5,Math.min(desired,stage.clientHeight-menu.offsetHeight-8));
    menu.style.top=`${top}px`;
    menu.style.left=`${Math.max(9,Math.min(anchorRect.left-bounds.left,stage.clientWidth-menu.offsetWidth-9))}px`;
  }
  function toggleMenu(id,anchor) {
    const menu=q(`#${id}`); const wasOpen=!menu.hidden;
    closeMenus(); closeSettings();
    if(wasOpen)return;
    menu.hidden=false; activeMenu=menu; menuAnchor=anchor;
    anchor.setAttribute('aria-expanded','true'); placeMenu(menu,anchor);
    menu.querySelector('button')?.focus();
  }
  function closeSettings(restore=false) {
    const previous=openNav;
    drawer.hidden=true; drawer.classList.remove('openDrawer'); drawer.classList.add('closedDrawer'); openNav=-1;
    for(const button of navButtons){button.setAttribute('aria-expanded','false');button.querySelector('.drawer-icon').classList.replace('openIcon','closedIcon');}
    if(restore && previous>=0)navButtons[previous].focus({preventScroll:true});
  }
  function openSettings(index=4) {
    const wasOpen=openNav===index && !drawer.hidden;
    closeMenus(); closeSettings();
    if(wasOpen)return;
    openNav=index; const button=navButtons[index];
    button.setAttribute('aria-expanded','true');button.querySelector('.drawer-icon').classList.replace('closedIcon','openIcon');
    q('#settings-heading').textContent=navLabels[index];q('.settings-index').textContent=String(index+1).padStart(2,'0');
    drawer.hidden=false;drawer.classList.replace('closedDrawer','openDrawer');q('.settings-body').scrollTop=0;
    q('#close-settings').focus({preventScroll:true});
  }
  function syncControls() {
    const previousFocus=document.activeElement;
    const connected=q('#scene-connected').checked;
    const generating=body.dataset.generating==='true';
    q('#send_form').classList.toggle('no-connection',!connected);
    q('#send_but').hidden=!connected||generating;
    q('#mes_stop').hidden=!generating;
    q('#mes_continue').hidden=!connected||generating||!q('#enable-quick-actions').checked;
    q('#mes_impersonate').hidden=!connected||generating||!q('#enable-quick-actions').checked;
    input.placeholder=connected?'写下下一句话…':'未连接 · 草稿仍可编辑';
    if(['send_but','mes_stop','mes_continue','mes_impersonate'].includes(previousFocus?.id)&&previousFocus.hidden)input.focus({preventScroll:true});
    resizeInput();
    requestAnimationFrame(measureScene);
  }
  function updateAttachments(long=false) {
    const restoreInputFocus=attachments===0&&q('#file_form').contains(document.activeElement);
    q('#file_form').hidden=attachments===0;
    const name=attachments===1?(long?'关于这段尚未写完的对话与后续记录的补充说明_第二次整理_校对版.txt':'虚构对话_补充记录.txt'):`已选择 ${attachments} 个文件`;
    q('.file_name').textContent=name;q('.file_name').title=name;q('.file_size').textContent=`${(attachments*12.4).toFixed(1)} KB`;
    if(restoreInputFocus)input.focus({preventScroll:true});
    requestAnimationFrame(measureScene);
  }
  function addAttachment(long=false) {attachments=long?1:Math.min(attachments+1,9);updateAttachments(long);state('已添加附件示例；没有读取或上传文件。');}
  function loadDraft() {closeMenus();closeSettings();input.value=draft;resizeInput();input.focus();state('多行草稿已填入；到上限后在输入框内滚动。');}
  function appendUser(value) {
    const article=document.createElement('article');article.className='user-line';
    const strong=document.createElement('strong');strong.textContent='你';
    const p=document.createElement('p');p.textContent=value;
    const small=document.createElement('small');small.textContent='刚刚 · 本地示例';article.append(strong,p,small);q('#live-messages').append(article);
  }
  function stopGeneration(stopped=false) {
    clearInterval(generationTimer);generationTimer=undefined;delete body.dataset.generating;
    if(activeResponse){activeResponse.querySelector('small').textContent=stopped?'已停止 · 本地示例':'已完成 · 本地示例';if(!activeResponse.querySelector('p').textContent)activeResponse.querySelector('p').textContent='生成已停止。';}
    syncControls();state(stopped?'已停止。当前草稿仍然保留。':'本地回复已完成。');activeResponse=null;
  }
  function send(continuing=false) {
    if(!q('#scene-connected').checked){state('当前是未连接示例；请在设置中切换连接状态。');return;}
    if(generationTimer){window.EF.toast('请先停止当前本地生成。');return;}
    if(!continuing&&!input.value.trim()&&!attachments){input.focus();state('写下一句话，或添加一份附件示例。');return;}
    closeMenus();closeSettings();q('#chat-empty').hidden=true;
    if(!continuing){appendUser(`${input.value.trim()||'（附件示例）'}${attachments?`\n[${attachments}份附件示例]`:''}`);input.value='';attachments=0;updateAttachments();resizeInput();}
    const article=document.createElement('article');article.className='live-response';
    const header=document.createElement('header');const strong=document.createElement('strong');strong.textContent='示例回复';const small=document.createElement('small');small.textContent='正在生成 · 本地示例';header.append(strong,small);
    const p=document.createElement('p');article.append(header,p);q('#live-messages').append(article);activeResponse=article;
    const reply=continuing?'纸页翻过一个很轻的弧度。下一行没有急着落笔，只留下恰好可以继续的位置。\n\n这是一段固定的本地续写样本。':'新的句子落在下一行。原来没说完的话并没有消失，它只是有了继续展开的余地。\n\n“好，”纸页上的声音说，“那就从这里开始。”\n\n以上回复完全来自当前页面的虚构示例。';
    let cursor=0;body.dataset.generating='true';syncControls();state('正在生成本地示例 · 可点击停止');chat.scrollTop=chat.scrollHeight;
    generationTimer=setInterval(()=>{const nearBottom=chat.scrollHeight-chat.scrollTop-chat.clientHeight<60;cursor+=2;p.textContent=reply.slice(0,cursor);if(nearBottom)chat.scrollTop=chat.scrollHeight;if(cursor>=reply.length)stopGeneration();},75);
    input.focus({preventScroll:true});
  }
  function openDialog(action,origin) {
    if(dialog.open)return;
    dialogOrigin=origin||document.activeElement;dialogAction=action;closeMenus();closeSettings();
    const isDelete=action==='delete';dialog.classList.toggle('is-danger',isDelete);
    q('#dialog-title').textContent=isDelete?'删除这段示例？':'重命名示例';q('#dialog-description').textContent=isDelete?'确认要清空当前预览中的这段记录吗？':'为这份虚构记录换一个名称，观察标题与确认窗口的关系。';
    q('#dialog-subject').textContent=q('#chat-title').textContent;q('#rename-fields').hidden=isDelete;q('#delete-note').hidden=!isDelete;
    q('#dialog-symbol').className=isDelete?'fa-solid fa-trash-can':'fa-solid fa-pencil';q('#dialog-confirm').textContent=isDelete?'删除本地示例':'确认名称';
    q('#rename-error').hidden=true;q('#rename-input').removeAttribute('aria-invalid');q('#rename-input').value=q('#chat-title').textContent;
    measureScene();dialog.showModal();
    if(isDelete)q('#dialog-cancel').focus();else{q('#rename-input').focus();q('#rename-input').select();}
  }
  function closeDialog() {dialog.close('cancel');}
  function clearChat() {
    if(generationTimer)stopGeneration(true);
    q('#initial-messages').hidden=true;q('#live-messages').replaceChildren();q('#chat-empty').hidden=false;input.value='';attachments=0;updateAttachments();resizeInput();state('当前本地示例已清空；可以恢复或重新写一句话。');
  }
  function resetSettings() {
    q('#sample-theme').selectedIndex=0;q('#theme-sample-status').textContent='只展示控件状态，不切换实际主题。';
    q('#sample-font-size').value='1';q('output[for="sample-font-size"]').textContent='100%';stage.style.removeProperty('--reading-scale');
    q('#show-fiction-note').checked=true;q('.fiction-note').hidden=false;q('#long-setting-example').checked=false;q('#enable-quick-actions').checked=false;q('#scene-connected').checked=true;
    q('.setting-details').open=false;syncControls();q('#settings-state').textContent='示例设置已恢复。';
  }
  function reset() {
    const restoreChatFocus=q('#chat-empty').contains(document.activeElement);
    if(generationTimer)stopGeneration(true);
    closeMenus();closeSettings();if(dialog.open)dialog.close('reset');
    q('#chat-title').textContent=defaultTitle;q('#chat-title').title=defaultTitle;q('#initial-messages').hidden=false;q('#chat-empty').hidden=true;q('#live-messages').replaceChildren();
    input.value='';attachments=0;updateAttachments();bookmarked=false;q('#message-menu-trigger').removeAttribute('data-bookmarked');resetSettings();resizeInput();chat.scrollTop=0;state('仅本地示例 · 点击输入框查看聚焦伸展');if(restoreChatFocus)chat.focus({preventScroll:true});
  }
  async function copySample(){try{await navigator.clipboard.writeText(staticSample);state('已复制虚构示例文字。');}catch{state('浏览器未允许复制；可以手动选取示例文字。');}}
  const actions={rename:origin=>openDialog('rename',origin),delete:origin=>openDialog('delete',origin),draft:loadDraft,continue:()=>send(true),settings:()=>openSettings(4),attach:()=>addAttachment(),longfile:()=>addAttachment(true),copy:copySample,bookmark:()=>{bookmarked=!bookmarked;q('#message-menu-trigger').toggleAttribute('data-bookmarked',bookmarked);state(bookmarked?'已给这条虚构示例标记检查点。':'检查点示例标记已移除。');}};
  navButtons.forEach((button,index)=>button.addEventListener('click',()=>openSettings(index)));
  q('#close-settings').addEventListener('click',()=>closeSettings(true));q('#open-scene-settings').addEventListener('click',()=>openSettings(4));
  q('#options_button').addEventListener('click',event=>toggleMenu('options',event.currentTarget));q('#extensionsMenuButton').addEventListener('click',event=>toggleMenu('extensionsMenu',event.currentTarget));q('#message-menu-trigger').addEventListener('click',event=>toggleMenu('message-menu',event.currentTarget));
  for(const button of document.querySelectorAll('[data-action]'))button.addEventListener('click',()=>{const origin=menuAnchor;const moveMenuFocus=document.activeElement===button;const action=button.dataset.action;closeMenus();actions[action]?.(origin);if(moveMenuFocus&&(document.activeElement===button||document.activeElement===body)){const next=['attach','longfile'].includes(action)?input:origin;next?.focus({preventScroll:true});}});
  for(const menu of document.querySelectorAll('.menu-shell'))menu.addEventListener('keydown',event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const items=[...menu.querySelectorAll('button')];const index=items.indexOf(document.activeElement);const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();});
  q('#rename-chat').addEventListener('click',event=>openDialog('rename',event.currentTarget));q('#delete-chat').addEventListener('click',event=>openDialog('delete',event.currentTarget));q('#dialog-close').addEventListener('click',closeDialog);q('#dialog-cancel').addEventListener('click',closeDialog);
  q('#dialog-form').addEventListener('submit',event=>{event.preventDefault();if(dialogAction==='rename'){const name=q('#rename-input').value.trim();if(!name){q('#rename-error').hidden=false;q('#rename-input').setAttribute('aria-invalid','true');q('#rename-input').focus();return;}q('#chat-title').textContent=name;q('#chat-title').title=name;state('本页示例名称已更新。');}else if(dialogAction==='delete')clearChat();dialog.close('confirm');});
  q('#rename-input').addEventListener('input',()=>{q('#rename-error').hidden=true;q('#rename-input').removeAttribute('aria-invalid');});
  dialog.addEventListener('close',()=>{if(dialog.returnValue==='cancel')state('已取消，示例没有改变。');dialogOrigin?.focus({preventScroll:true});dialogOrigin=null;dialogAction=null;});
  dialog.addEventListener('cancel',()=>{dialog.returnValue='cancel';});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog();});
  q('#load-scene-draft').addEventListener('click',loadDraft);q('#settings-load-draft').addEventListener('click',loadDraft);q('#reset-scene').addEventListener('click',reset);q('#restore-chat').addEventListener('click',reset);q('#copy-sample').addEventListener('click',copySample);
  q('#send_but').addEventListener('click',()=>send());q('#mes_stop').addEventListener('click',()=>stopGeneration(true));q('#mes_continue').addEventListener('click',()=>send(true));q('#mes_impersonate').addEventListener('click',()=>{input.value='就从这页继续吧。我想听听还没有说完的那句话。';resizeInput();input.focus();state('代写样本已放入草稿，没有发送。');});
  input.addEventListener('input',resizeInput);input.addEventListener('keydown',event=>{if(!event.isComposing&&event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();send();}});
  input.addEventListener('paste',event=>{if(event.clipboardData?.files.length){event.preventDefault();state('原型不读取文件；请使用魔杖中的附件示例。');}});
  q('#form_sheld').addEventListener('dragover',event=>event.preventDefault());q('#form_sheld').addEventListener('drop',event=>{event.preventDefault();state('已接到拖放动作；没有读取或上传文件。');});
  q('#file_form').addEventListener('submit',event=>event.preventDefault());q('#file_form').addEventListener('reset',()=>{attachments=0;updateAttachments();state('已移除这批附件示例。');});
  q('#sample-theme').addEventListener('change',event=>{q('#theme-sample-status').textContent=event.target.value;q('#settings-state').textContent='已变更主题选择样本。';});
  q('#sample-font-size').addEventListener('input',event=>{stage.style.setProperty('--reading-scale',event.target.value);q('output[for="sample-font-size"]').textContent=`${Math.round(Number(event.target.value)*100)}%`;q('#settings-state').textContent='示例正文字号已更新。';});
  q('#show-fiction-note').addEventListener('change',event=>{q('.fiction-note').hidden=!event.target.checked;q('#settings-state').textContent=event.target.checked?'已显示排版说明。':'已隐藏排版说明；正文仍是虚构样本。';});
  q('#long-setting-example').addEventListener('change',event=>q('#settings-state').textContent=event.target.checked?'长标签示例已开启。':'长标签示例已关闭。');
  q('#enable-quick-actions').addEventListener('change',()=>{syncControls();q('#settings-state').textContent='输入栏快捷动作已更新。';});
  q('#scene-connected').addEventListener('change',()=>{if(!q('#scene-connected').checked&&generationTimer)stopGeneration(true);syncControls();q('#settings-state').textContent=q('#scene-connected').checked?'模拟连接已就绪。':'已切换为未连接示例。';});
  q('#settings-reset').addEventListener('click',resetSettings);
  q('#scene-width').addEventListener('change',event=>{frame.style.setProperty('--scene-width',event.target.value==='wide'?'920px':`${event.target.value}px`);if(event.target.value!=='wide'){q('#scene-touch').checked=true;frame.classList.add('touch-targets');body.classList.add('touch-dialogs');}closeMenus();requestAnimationFrame(()=>{resizeInput();measureScene();});});
  q('#scene-touch').addEventListener('change',event=>{frame.classList.toggle('touch-targets',event.target.checked);body.classList.toggle('touch-dialogs',event.target.checked);requestAnimationFrame(measureScene);});
  q('#scene-short').addEventListener('change',event=>{frame.classList.toggle('short-scene',event.target.checked);closeMenus();requestAnimationFrame(measureScene);});
  document.addEventListener('click',event=>{if(!event.target.closest('.menu-shell,#options_button,#extensionsMenuButton,#message-menu-trigger'))closeMenus();if(!event.target.closest('#settings-drawer,[data-nav],#open-scene-settings,.lab-toolbar,.variant-picker'))closeSettings();});
  document.addEventListener('keydown',event=>{if(event.key!=='Escape'||dialog.open)return;if(activeMenu)closeMenus(true);else if(!drawer.hidden)closeSettings(true);});
  function variantChanged(){q('#combination-caption').textContent=body.dataset.variant==='b'?'B / 输入 B · 顶栏 B · 菜单 B · 弹窗 A · 设置 B':'A / 输入 A · 顶栏 A · 菜单 A · 弹窗 B · 设置 A';closeMenus();requestAnimationFrame(()=>{resizeInput();measureScene();});}
  document.addEventListener('ef:variant',variantChanged);
  let previousWidth=0;
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(Math.abs(width-previousWidth)>=1){previousWidth=width;resizeInput();}measureScene();}).observe(frame);
  let previousInputWidth=0;
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(Math.abs(width-previousInputWidth)<1)return;previousInputWidth=width;resizeInput();measureScene();}).observe(input);
  new ResizeObserver(measureScene).observe(q('#form_sheld'));
  window.addEventListener('resize',()=>{closeMenus();resizeInput();measureScene();});window.addEventListener('pagehide',()=>clearInterval(generationTimer));
  document.fonts.ready.then(()=>{resizeInput();measureScene();});syncControls();variantChanged();
})();
