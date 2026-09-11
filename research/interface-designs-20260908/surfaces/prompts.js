(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const base = [
    {id:'main',name:'主提示词',system:true,marker:false,editable:true,role:'system',enabled:true,tokens:384,content:'以角色的视角继续对话。保持叙述清楚，不替对方决定行动。',override:'本次角色样本要求：语言简短，保留观察与停顿。',forbid:false,position:0,depth:4,order:100,triggers:[]},
    {id:'charDescription',name:'角色描述',system:true,marker:true,editable:true,role:'system',enabled:true,tokens:768,source:'角色描述',content:'样本角色擅长修理旧设备，习惯先检查细节再做判断。',position:0,depth:4,order:100,triggers:[]},
    {id:'worldInfoBefore',name:'世界书 · 角色之前',system:true,marker:true,editable:true,role:'system',enabled:true,tokens:1240,source:'世界书（角色之前）',content:'一座沿山谷修建的工业城。夜里，维修区的灯总比办公区熄得晚。',position:0,depth:4,order:100,triggers:[]},
    {id:'narrative',name:'叙述距离',system:false,marker:false,editable:true,role:'system',enabled:true,tokens:126,content:'使用有限视角，先呈现动作，再补充必要的心理。避免重复总结。',position:0,depth:4,order:100,triggers:[]},
    {id:'chatHistory',name:'聊天历史',system:true,marker:true,editable:false,role:'system',enabled:true,tokens:4380,content:'这里只检查已组装的聊天消息。',position:0,depth:4,order:100,triggers:[]},
    {id:'styleNote',name:'补充风格说明',system:false,marker:false,editable:true,role:'user',enabled:false,tokens:86,content:'不要把每一段都写成完整的小结。允许留下短句。',position:0,depth:4,order:100,triggers:[]},
    {id:'scene',name:'场景锚点',system:false,marker:false,editable:true,role:'assistant',enabled:true,tokens:62,content:'此刻是傍晚。屋外的雨刚刚停下。',position:1,depth:2,order:100,triggers:['normal','continue']},
  ];
  let prompts = structuredClone(base), order = base.map(p => p.id), nextId = 1;
  let editing = null, mode = null, returnTarget = null, longNames = false, resetTouched = false;
  const list = $('#completion_prompt_manager_list');
  const frame = $('#prompt-frame');
  const popup = $('#completion_prompt_manager_popup');
  const screen = $('#completion_prompt_manager');
  let inertPeers = [];
  const field = suffix => document.getElementById(`completion_prompt_manager_popup_entry_form_${suffix}`);
  const find = id => prompts.find(p => p.id === id);
  const nameOf = prompt => longNames && prompt.id === 'narrative' ? '有关叙述视角、人物距离与细节呈现方式的完整补充说明｜LongUnbrokenPromptIdentifierForNarrowLayout' : prompt.name;
  const announce = message => { $('#pm-feedback').textContent = message; window.EF?.toast(message); };
  const icon = name => { const i = document.createElement('i'); i.className = `fa-solid ${name}`; i.setAttribute('aria-hidden','true'); return i; };
  const button = (className,label,iconName) => { const b=document.createElement('button'); b.type='button'; b.className=className; b.setAttribute('aria-label',label); b.title=label; if(iconName)b.append(icon(iconName)); return b; };
  const focusRow = (id,action='inspect') => list.querySelector(`[data-pm-identifier="${id}"] [data-action="${action}"]`)?.focus({preventScroll:true});

  function render({focusId,focusAction,keepScroll=true}={}) {
    const scroll = $('.prompt-list-scroll').scrollTop;
    const head = document.createElement('li'); head.className='completion_prompt_manager_list_head'; head.setAttribute('aria-hidden','true');
    for(const label of ['名称','操作','Token']) { const span=document.createElement('span');span.textContent=label;head.append(span); }
    list.replaceChildren(head);
    for(const id of order) {
      const p=find(id);if(!p)continue;
      const row=document.createElement('li'); row.className=`completion_prompt_manager_prompt completion_prompt_manager_prompt_draggable${p.enabled?'':' completion_prompt_manager_prompt_disabled'}${p.marker?' completion_prompt_manager_marker':''}${p.forbid?' completion_prompt_manager_important':''}`; row.dataset.pmIdentifier=id;
      const handle=button('drag-handle',`移动 ${nameOf(p)}；也可按 Alt 加上或下方向键`,'fa-grip-vertical');handle.dataset.action='move';handle.draggable=true;
      const name=document.createElement('span'); name.className='completion_prompt_manager_prompt_name';name.dataset.pmName=nameOf(p);
      const line=document.createElement('span');line.className='prompt-name-line';
      const type=icon(p.position===1?'fa-syringe':p.marker?'fa-thumbtack':p.system?'fa-square-poll-horizontal':'fa-asterisk');type.classList.add('prompt-type-icon');
      const inspect=button('prompt-manager-inspect-action',`检查 ${nameOf(p)}`);inspect.dataset.action='inspect';
      const title=document.createElement('span');title.className='prompt-name-text';title.textContent=nameOf(p);inspect.append(title);
      const meta=document.createElement('span');meta.className='prompt-name-meta';
      if(p.override&&!p.forbid) { const tag=document.createElement('small');tag.className='prompt-manager-overridden';tag.append(icon('fa-address-card'),document.createTextNode('角色覆盖'));meta.append(tag); }
      else if(p.forbid) {const tag=document.createElement('small');tag.textContent='禁止覆盖';meta.append(tag);}
      if(p.position===1) {const tag=document.createElement('small');tag.className='prompt-manager-injection-depth';tag.textContent=`@ ${p.depth}`;meta.append(tag);}
      if(p.role!=='system') {const tag=document.createElement('small');tag.dataset.role=p.role;tag.textContent=p.role==='user'?'User':'Assistant';meta.append(tag);}
      if(p.marker) {const tag=document.createElement('small');tag.textContent='来源内容';meta.append(tag);}
      inspect.append(meta);line.append(type,inspect);name.append(line);
      const controlWrap=document.createElement('span');controlWrap.className='pm-controls-wrapper';
      const controls=document.createElement('span');controls.className='prompt_manager_prompt_controls';
      if(!p.system) {const detach=button('pm-row-button prompt-manager-detach-action',`从顺序移出 ${nameOf(p)}`,'fa-link-slash');detach.dataset.action='detach';controls.append(detach);} else {const spacer=document.createElement('span');spacer.className='pm-control-placeholder';spacer.setAttribute('aria-hidden','true');controls.append(spacer);}
      if(p.editable) {const edit=button('pm-row-button prompt-manager-edit-action',`编辑 ${nameOf(p)}`,'fa-pencil');edit.dataset.action='edit';controls.append(edit);} else {const spacer=document.createElement('span');spacer.className='pm-control-placeholder';spacer.setAttribute('aria-hidden','true');controls.append(spacer);}
      const toggle=button('pm-row-button prompt-manager-toggle-action',`${p.enabled?'停用':'启用'} ${nameOf(p)}`);toggle.dataset.action='toggle';toggle.setAttribute('aria-pressed',String(p.enabled));const track=document.createElement('span');track.className='pm-toggle-track';track.setAttribute('aria-hidden','true');toggle.append(track);controls.append(toggle);controlWrap.append(controls);
      const tokens=document.createElement('span');tokens.className='prompt_manager_prompt_tokens';tokens.dataset.pmTokens=!p.enabled?'-':p.tokens===null?'pending':String(p.tokens);tokens.textContent=!p.enabled?'—':p.tokens===null?'待重算':p.tokens.toLocaleString('en-US');
      row.append(handle,name,controlWrap,tokens);list.append(row);
    }
    const active=order.map(find).filter(p=>p?.enabled), known=active.reduce((sum,p)=>sum+(p.tokens??0),0);
    $('#pm-total').textContent=known.toLocaleString('en-US')+(active.some(p=>p.tokens===null)?' + …':'');
    const select=$('#completion_prompt_manager_footer_append_prompt');const previous=select.value;
    select.replaceChildren(new Option('选择条目库中的样本',''));
    for(const p of prompts.filter(p=>!p.system).sort((a,b)=>a.name.localeCompare(b.name))) select.add(new Option(`${p.name}${order.includes(p.id)?' · 已在顺序中':''}`,p.id));
    if([...select.options].some(o=>o.value===previous))select.value=previous;
    $('#pm-insert').disabled=!select.value;
    if(keepScroll)$('.prompt-list-scroll').scrollTop=scroll;
    if(focusId)focusRow(focusId,focusAction);
  }

  function openPanel(kind,title,trigger) {
    mode=kind;returnTarget=trigger||document.activeElement;popup.hidden=false;screen.inert=true;
    inertPeers=[...document.body.children].filter(node=>node!==frame&&node.tagName!=='SCRIPT'&&!node.inert);
    for(const node of inertPeers)node.inert=true;
    $('#pm-dialog-title').textContent=title;
    $('#pm-dialog-kind').textContent=kind==='edit'?'编辑定义':kind==='inspect'?'检查内容':'恢复顺序';
    $('#completion_prompt_manager_popup_edit').hidden=kind!=='edit';
    $('#completion_prompt_manager_popup_inspect').hidden=kind!=='inspect';
    $('#pm-reset-order-confirm').hidden=kind!=='reset';
    field('save').hidden=kind!=='edit';field('reset').hidden=true;$('#pm-reset-order-apply').hidden=kind!=='reset';
    field('close').textContent=kind==='reset'?'取消':'关闭';
    $('.pm-dialog-scroll').scrollTop=0;
  }

  function closePanel(message) {
    const target=returnTarget;popup.hidden=true;screen.inert=false;mode=null;editing=null;resetTouched=false;
    for(const node of inertPeers)node.inert=false;
    inertPeers=[];
    $('#pm-edit-form').reset();
    if(target?.isConnected)target.focus({preventScroll:true});else $('#pm-new').focus({preventScroll:true});
    if(message)announce(message);
  }

  function loadEdit(p) {
    field('name').value=p.name;field('role').value=p.role;field('injection_position').value=String(p.position);
    field('injection_depth').value=p.depth;field('injection_order').value=p.order;field('prompt').value=p.content;
    field('prompt').disabled=p.marker;field('prompt').hidden=p.marker;
    field('forbid_overrides').checked=!!p.forbid;
    for(const opt of field('injection_trigger').options)opt.selected=p.triggers.includes(opt.value);
    $('#completion_prompt_manager_forbid_overrides_block').hidden=p.id!=='main';
    $('#completion_prompt_manager_popup_entry_source_block').hidden=!p.marker;
    $('#completion_prompt_manager_popup_entry_source').textContent=p.source||'';
    field('reset').hidden=!p.system;
    $('#pm-reset-note').hidden=!resetTouched;
    updatePosition();
  }

  function updatePosition() {
    const enabled=field('injection_position').value==='1';
    $('#completion_prompt_manager_depth_block').hidden=!enabled;
    $('#completion_prompt_manager_order_block').hidden=!enabled;
  }

  function editPrompt(id,trigger) {
    const p=find(id);if(!p?.editable)return;
    editing=id;resetTouched=false;openPanel('edit',nameOf(p),trigger);loadEdit(p);field('name').focus();
  }

  function inspectPrompt(id,trigger) {
    const p=find(id);if(!p)return;
    if(!p.enabled) {announce('此样本已停用，没有已组装的内容可检查。');return;}
    openPanel('inspect',nameOf(p),trigger);
    const entries=id==='chatHistory' ? [
      {name:'样本消息 1',role:'User',tokens:24,content:'桌上的台灯又不亮了，你能看看吗？'},
      {name:'样本消息 2',role:'Assistant',tokens:92,content:'她先拔下插头，把灯移到窗边。\n“灯泡没有烧。等一下，我看看接线。”'},
    ] : [{name:nameOf(p),role:p.role,tokens:p.tokens,content:p.override&&!p.forbid?p.override:p.content}];
    const container=$('#completion_prompt_manager_popup_entry_form_inspect_list');container.replaceChildren();
    for(const entry of entries) {const d=document.createElement('details');d.className='inline-drawer pm-inspect-entry';const s=document.createElement('summary');s.className='inline-drawer-toggle inline-drawer-header';const caption=document.createElement('span');caption.className='pm-inspect-caption';const title=document.createElement('strong');title.textContent=entry.name;const sub=document.createElement('small');sub.textContent=`${entry.role} · ${entry.tokens??'待重算'} Token 样本`;caption.append(title,sub);s.append(caption);const pre=document.createElement('pre');pre.className='inline-drawer-content';pre.textContent=entry.content||'此条目没有内容。';d.append(s,pre);container.append(d);}
    $('#completion_prompt_manager_popup_close_button').focus();
  }

  function saveEdit(event) {
    event.preventDefault();if(mode!=='edit')return;
    const form=$('#pm-edit-form');if(!form.reportValidity())return;
    const p=find(editing);if(!p)return;
    p.name=field('name').value.trim()||'未命名条目';p.role=field('role').value;p.position=Number(field('injection_position').value);
    p.depth=Number(field('injection_depth').value);p.order=Number(field('injection_order').value);p.triggers=[...field('injection_trigger').selectedOptions].map(o=>o.value);
    if(!p.marker)p.content=field('prompt').value;
    p.forbid=field('forbid_overrides').checked;p.tokens=null;delete p.draft;
    const id=p.id;const isNew=!order.includes(id);render();
    returnTarget=list.querySelector(`[data-pm-identifier="${id}"] [data-action="edit"]`)||$('#pm-new');
    closePanel(isNew?'条目已存入样本库。选择并插入后才会加入发送顺序。':'已保存这一条样本；Token 等待实际宿主重算。');
  }

  function move(id,direction) {
    const index=order.indexOf(id),next=index+direction;if(index<0||next<0||next>=order.length){announce(direction<0?'已经是第一项。':'已经是最后一项。');return;}
    const activeAction=document.activeElement?.dataset.action||'move';
    [order[index],order[next]]=[order[next],order[index]];render({focusId:id,focusAction:activeAction});
    list.querySelector(`[data-pm-identifier="${id}"]`)?.scrollIntoView({block:'nearest'});
    announce(`已将 ${nameOf(find(id))} ${direction<0?'上移':'下移'}一位，顺序已在样本中生效。`);
  }

  list.addEventListener('click',event=>{
    const action=event.target.closest('[data-action]');const id=action?.closest('[data-pm-identifier]')?.dataset.pmIdentifier;if(!id)return;
    if(action.dataset.action==='edit')editPrompt(id,action);
    if(action.dataset.action==='inspect')inspectPrompt(id,action);
    if(action.dataset.action==='toggle') {const p=find(id);p.enabled=!p.enabled;render({focusId:id,focusAction:'toggle'});announce(`${nameOf(p)}已${p.enabled?'启用':'停用'}。样本设置立即生效。`);}
    if(action.dataset.action==='detach') {const index=order.indexOf(id);order.splice(index,1);render({focusId:order[Math.min(index,order.length-1)]});announce('已移出发送顺序，条目仍保留在样本库。');}
    if(action.dataset.action==='move')announce('拖动把手排序，或按 Alt 加上、下方向键。');
  });
  list.addEventListener('keydown',event=>{if(!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key))return;const id=event.target.closest('[data-pm-identifier]')?.dataset.pmIdentifier;if(!id)return;event.preventDefault();move(id,event.key==='ArrowUp'?-1:1);});

  let dragging=null,dropId=null,dropAfter=false;
  const clearDrop=()=>{for(const row of list.querySelectorAll('[data-drop]'))delete row.dataset.drop;};
  list.addEventListener('dragstart',event=>{const handle=event.target.closest('.drag-handle');if(!handle){event.preventDefault();return;}dragging=handle.closest('[data-pm-identifier]').dataset.pmIdentifier;event.dataTransfer.setData('text/plain',dragging);event.dataTransfer.effectAllowed='move';handle.closest('li').dataset.dragging='true';});
  list.addEventListener('dragover',event=>{if(!dragging)return;const row=event.target.closest('[data-pm-identifier]');if(!row||row.dataset.pmIdentifier===dragging)return;event.preventDefault();event.dataTransfer.dropEffect='move';const rect=row.getBoundingClientRect();dropId=row.dataset.pmIdentifier;dropAfter=event.clientY>rect.top+rect.height/2;clearDrop();row.dataset.drop=dropAfter?'after':'before';});
  list.addEventListener('drop',event=>{if(!dragging||!dropId)return;event.preventDefault();const id=dragging;order=order.filter(value=>value!==id);order.splice(order.indexOf(dropId)+(dropAfter?1:0),0,id);dragging=null;dropId=null;render({focusId:id,focusAction:'move'});announce('拖动后的顺序已在样本中生效。');});
  list.addEventListener('dragend',()=>{dragging=null;dropId=null;clearDrop();for(const row of list.querySelectorAll('[data-dragging]'))delete row.dataset.dragging;});

  let touchDrag=null;
  const cancelTouch=()=>{if(!touchDrag)return;clearTimeout(touchDrag.timer);touchDrag=null;dragging=null;dropId=null;clearDrop();for(const row of list.querySelectorAll('[data-dragging]'))delete row.dataset.dragging;};
  list.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse')return;
    const handle=event.target.closest('.drag-handle');if(!handle)return;
    const id=handle.closest('[data-pm-identifier]').dataset.pmIdentifier;
    handle.setPointerCapture(event.pointerId);
    touchDrag={id,x:event.clientX,y:event.clientY,pointer:event.pointerId,active:false,timer:setTimeout(()=>{if(!touchDrag)return;touchDrag.active=true;dragging=id;handle.closest('li').dataset.dragging='true';$('#pm-feedback').textContent='可以拖动到另一行。';},750)};
  });
  list.addEventListener('pointermove',event=>{
    if(!touchDrag||touchDrag.pointer!==event.pointerId)return;
    if(!touchDrag.active){if(Math.hypot(event.clientX-touchDrag.x,event.clientY-touchDrag.y)>12)cancelTouch();return;}
    const row=document.elementFromPoint(event.clientX,event.clientY)?.closest('#completion_prompt_manager_list [data-pm-identifier]');
    clearDrop();dropId=null;
    if(row&&row.dataset.pmIdentifier!==dragging){const rect=row.getBoundingClientRect();dropId=row.dataset.pmIdentifier;dropAfter=event.clientY>rect.top+rect.height/2;row.dataset.drop=dropAfter?'after':'before';}
    const scroller=$('.prompt-list-scroll'),bounds=scroller.getBoundingClientRect();
    if(event.clientY>bounds.bottom-30)scroller.scrollTop+=12;else if(event.clientY<bounds.top+30)scroller.scrollTop-=12;
  });
  list.addEventListener('pointerup',event=>{
    if(!touchDrag||touchDrag.pointer!==event.pointerId)return;
    const id=dragging,changed=touchDrag.active&&dropId&&id;
    if(changed){order=order.filter(value=>value!==id);order.splice(order.indexOf(dropId)+(dropAfter?1:0),0,id);}
    cancelTouch();
    if(changed){render({focusId:id,focusAction:'move'});announce('拖动后的顺序已在样本中生效。');}
  });
  list.addEventListener('pointercancel',cancelTouch);

  $('#completion_prompt_manager_footer_append_prompt').addEventListener('change',event=>{$('#pm-insert').disabled=!event.target.value;});
  $('#pm-insert').addEventListener('click',()=>{const id=$('#completion_prompt_manager_footer_append_prompt').value;if(!find(id))return;if(order.includes(id)){announce('这个条目已经在发送顺序中。');return;}find(id).enabled=false;order.unshift(id);render({focusId:id,focusAction:'toggle'});$('.prompt-list-scroll').scrollTop=0;announce('已插入顶部，默认停用；启用后才会发送。');});
  $('#pm-new').addEventListener('click',event=>{const p={id:`sample-new-${nextId++}`,name:'',system:false,marker:false,editable:true,role:'system',enabled:false,tokens:null,content:'',position:0,depth:4,order:100,triggers:[],draft:true};prompts.push(p);editPrompt(p.id,event.currentTarget);$('#pm-dialog-title').textContent='新建条目';});
  const ordinaryClose=()=>{const wasReset=resetTouched;const p=find(editing);if(p?.draft&&!p.name)prompts=prompts.filter(item=>item!==p);if(wasReset){const id=editing;render();returnTarget=list.querySelector(`[data-pm-identifier="${id}"] [data-action="edit"]`);}closePanel(wasReset?'已关闭。刚才恢复的默认内容仍在样本内存中。':undefined);};
  field('close').addEventListener('click',ordinaryClose);
  $('#completion_prompt_manager_popup_close_button').addEventListener('click',ordinaryClose);
  $('#pm-edit-form').addEventListener('submit',saveEdit);
  field('injection_position').addEventListener('change',updatePosition);
  field('reset').addEventListener('click',()=>{const p=find(editing),original=base.find(item=>item.id===editing);if(!p||!original)return;if(p.id==='main'){p.name=original.name;p.content=original.content;p.forbid=false;p.tokens=null;resetTouched=true;}loadEdit({...p,role:'system',triggers:[]});announce(resetTouched?'已恢复条目默认内容；这一步立即改变样本内存。':'此来源条目没有独立默认正文，已重填编辑字段。');});
  $('#prompt-manager-reset-character').addEventListener('click',event=>{openPanel('reset','恢复默认顺序',event.currentTarget);field('close').focus();});
  $('#pm-reset-order-apply').addEventListener('click',()=>{order=base.map(p=>p.id);for(const initial of base){const p=find(initial.id);if(p)p.enabled=initial.enabled;}render();returnTarget=$('#prompt-manager-reset-character');closePanel('已恢复默认顺序与启停状态，保留条目正文。');});
  popup.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();ordinaryClose();return;}if(event.key!=='Tab')return;const items=[...popup.querySelectorAll('button,input,select,textarea,summary,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}});
  $('#pm-width').addEventListener('change',event=>{frame.dataset.width=event.target.value;});
  $('#pm-height').addEventListener('change',event=>{frame.style.setProperty('--pm-height',`${event.target.value}px`);});
  $('#pm-long-name').addEventListener('change',event=>{longNames=event.target.checked;render();});
  $('#restore-prompts').addEventListener('click',()=>{if(!popup.hidden)closePanel();prompts=structuredClone(base);order=base.map(p=>p.id);nextId=1;render({keepScroll:false});$('.prompt-list-scroll').scrollTop=0;announce('本页样本已恢复。');});
  render();
})();
