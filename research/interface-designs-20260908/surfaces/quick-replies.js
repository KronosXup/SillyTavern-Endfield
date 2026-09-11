(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const initialSets = () => [
    { id:'global', items:[
      { id:'look', label:'观察四周', longLabel:'仔细观察门外的光线、声音与周围环境', message:'我停下来，仔细观察四周。', icon:'fa-eye' },
      { id:'listen', label:'听一会', longLabel:'留意持续出现的细微动静，再决定下一步', message:'我先不说话，安静听了一会。', icon:'fa-ear-listen' },
      { id:'ask', label:'问一句', longLabel:'询问刚才听到的声音究竟来自什么地方', message:'“刚才的声音，是从哪边传来的？”', icon:'fa-comment', related:[
        {id:'ask-place',label:'询问位置',message:'“那道门通向哪里？”'},
        {id:'ask-detail',label:'请对方说得更具体一点',message:'“能再说得具体一点吗？”'},
        {id:'ask-confirm',label:'确认自己是否理解正确',message:'“你的意思是，我们应该先等一等？”'}
      ] }
    ] },
    { id:'chat', items:[
      { id:'wait', label:'稍等', longLabel:'先停留片刻，确认身后的动静已经消失', message:'我在原地等了一会，没有急着向前。', icon:'fa-hourglass-half' },
      { id:'next', label:'继续向前', longLabel:'沿着走廊继续向前，检查下一个尚未打开的房间', message:'我沿着走廊继续向前。', icon:'fa-arrow-right' },
      { id:'detail', label:'仔细查看', longLabel:'仔细查看眼前的细节', message:'我靠近一些，仔细查看眼前的细节。', icon:'fa-magnifying-glass', iconOnly:true }
    ] }
  ];
  let sets=initialSets(), floating=false, menuTrigger=null, editorTarget=null, editorReturn=null, drag=null;
  let position={x:null,y:70};
  const bar=$('#qr--bar'), float=$('#qr--popout'), floatBody=float.querySelector('.qr--body'), context=$('#qr-context'), menu=context.querySelector('.ctx-menu');
  const editor=$('#qr-editor'), draft=$('#send_textarea'), feedback=$('#qr-feedback');
  const allItems=()=>sets.flatMap(set=>set.items);
  const itemById=id=>allItems().find(item=>item.id===id);
  const displayLabel=item=>$('#qr-long').checked&&item.longLabel?item.longLabel:item.label;
  const activeButton=(id,part='action')=>document.querySelector(`[data-qr-${part}="${id}"]`);
  const say=message=>{feedback.textContent=message;};
  const icon=className=>{const i=document.createElement('i');i.className=`qr--button-icon fa-solid ${className}`;i.setAttribute('aria-hidden','true');return i;};
  const button=(label,className)=>{const b=document.createElement('button');b.type='button';b.className=className;b.textContent=label;return b;};
  const revealFocus=event=>{
    if(document.body.dataset.variant!=='b')return;
    const group=event.target.closest('.qr--buttons');
    const scrolling=group?.parentElement.classList.contains('qr--buttons')?group.parentElement:group;
    if(scrolling&&scrolling.scrollWidth>scrolling.clientWidth)event.target.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  const closeMenu=(restore=true)=>{
    if(context.hidden)return;
    context.hidden=true;
    const target=menuTrigger;menuTrigger=null;
    if(target)activeButton(target.id,'expander')?.setAttribute('aria-expanded','false');
    if(restore&&target){const b=activeButton(target.id,target.part)||activeButton(target.id);b?.focus();}
  };
  const positionMenu=()=>{
    if(context.hidden||!menuTrigger)return;
    const target=activeButton(menuTrigger.id,menuTrigger.part)||activeButton(menuTrigger.id);
    if(!target){closeMenu(false);return;}
    const r=target.getBoundingClientRect();
    const m=menu.getBoundingClientRect();
    const x=Math.max(12,Math.min(r.left,document.documentElement.clientWidth-m.width-12));
    const below=innerHeight-r.bottom-8;
    const y=below>=m.height?r.bottom+6:Math.max(12,Math.min(r.top-m.height-6,innerHeight-m.height-12));
    menu.style.left=`${x}px`;menu.style.top=`${y}px`;
  };
  const draftStatus=()=>{$('#draft-status').textContent=draft.value?`${draft.value.length} 字符 · 本页草稿`:'纯文本样例';};
  const sendLocal=message=>{
    if(!message.trim()){say('先写一点内容，再模拟发送。');draft.focus();return false;}
    const p=document.createElement('p');p.className='sample-message user-sample';p.textContent=message;
    $('#qr-transcript').append(p);p.scrollIntoView({block:'nearest'});
    draft.value='';draftStatus();draft.focus();say('已加入本页的模拟消息；没有向酒馆发送。');return true;
  };
  const execute=item=>{
    closeMenu(false);
    const text=item.message;
    let combined=text+' ';
    if($('#qr-inject').checked&&draft.value.length)combined=$('#qr-before').checked?`${text} ${draft.value}`:`${draft.value} ${text}`;
    if($('#qr-send-mode').value==='send')sendLocal(combined);
    else{draft.value=combined;draftStatus();draft.focus();say(`已插入「${item.label}」的纯文本样本。`);}
    const root=activeButton(item.id)?.closest('.qr--button');
    root?.classList.add('did-execute');window.setTimeout(()=>root?.classList.remove('did-execute'),350);
  };
  const openMenu=(item,part='expander')=>{
    if(!item.related?.length)return;
    closeMenu(false);menuTrigger={id:item.id,part};
    const holder=$('#qr-context-items');holder.replaceChildren();
    for(const [index,related] of item.related.entries()){
      const b=button(related.label,'ctx-item');b.setAttribute('role','menuitem');b.tabIndex=index?-1:0;
      b.addEventListener('click',()=>execute(related));holder.append(b);
    }
    context.hidden=false;activeButton(item.id,'expander')?.setAttribute('aria-expanded','true');positionMenu();holder.querySelector('button')?.focus({preventScroll:true});
  };
  const openEditor=(item,returnTarget)=>{
    closeMenu(false);editorTarget=item;editorReturn=returnTarget;
    $('#qr--modal-label').value=item.label;$('#qr--modal-message').value=item.message;$('#qr-editor-note').textContent='只修改本页样本。';
    editor.showModal();$('#qr--modal-label').focus();
  };
  const makeItem=item=>{
    const root=document.createElement('div');root.className='qr--button menu_button';root.dataset.qrId=item.id;
    const action=button('','qr--button-action');action.dataset.qrAction=item.id;action.title=item.message;action.setAttribute('aria-label',displayLabel(item)||item.message||'未命名快捷回复');
    if(item.icon)action.append(icon(item.icon));
    const label=document.createElement('span');label.className='qr--button-label';label.textContent=displayLabel(item);
    if(item.iconOnly&&!$('#qr-icons').checked)label.classList.add('qr--hidden');action.append(label);
    action.addEventListener('click',event=>{if(event.ctrlKey){openEditor(item,{id:item.id});return;}execute(item);});
    action.addEventListener('contextmenu',event=>{if(item.related?.length){event.preventDefault();openMenu(item,'action');}});
    action.addEventListener('focus',revealFocus);root.append(action);
    if(item.related?.length){
      root.classList.add('qr--hasCtx');const more=button('⋮','qr--button-expander');more.dataset.qrExpander=item.id;more.setAttribute('aria-label',`展开「${displayLabel(item)}」的关联动作`);more.setAttribute('aria-haspopup','menu');more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','qr-context');
      more.addEventListener('click',()=>openMenu(item));more.addEventListener('focus',revealFocus);root.append(more);
    }
    return root;
  };
  const render=()=>{
    bar.replaceChildren();floatBody.replaceChildren();
    const host=floating?floatBody:bar;
    const filter=$('#qr-sets').value;
    const visible=filter==='empty'?[]:sets.filter(set=>filter!=='global'||set.id==='global');
    let holder=host;
    if($('#qr-combined').checked&&visible.length){holder=document.createElement('div');holder.className='qr--buttons';host.append(holder);}
    for(const set of visible){const group=document.createElement('div');group.className='qr--buttons';group.dataset.qrSet=set.id;group.setAttribute('aria-label',set.id==='global'?'全局集合样本':'聊天集合样本');for(const item of set.items)group.append(makeItem(item));holder.append(group);}
    if(!floating&&visible.length){const pop=button('','qr-popout-action');pop.id='qr--popoutTrigger';pop.setAttribute('aria-label','弹出快捷回复窗');pop.title='弹出快捷回复窗';pop.append(icon('fa-window-restore'));pop.addEventListener('click',()=>setFloating(true));bar.append(pop);}
    float.hidden=!floating;$('#qr-float-demo').checked=floating;
    if(floating&&!visible.length){const empty=document.createElement('p');empty.className='qr-study-copy';empty.textContent='本页当前没有可见动作。';floatBody.append(empty);}
  };
  const placeFloat=()=>{
    if(!floating)return;
    const r=float.getBoundingClientRect();
    position.x=Math.max(12,Math.min(position.x??(document.documentElement.clientWidth-r.width)/2,document.documentElement.clientWidth-r.width-12));
    position.y=Math.max(12,Math.min(position.y,innerHeight-r.height-12));
    float.style.left=`${position.x}px`;float.style.top=`${position.y}px`;
  };
  const setFloating=value=>{
    closeMenu(false);const wasInside=float.contains(document.activeElement);
    floating=value;render();placeFloat();
    if(floating){float.querySelector('.qr--close').focus();say('动作已移到本页工具窗；收回后仍保留。');}
    else{
      const target=$('#qr--popoutTrigger');
      if(target&&target.getBoundingClientRect().height)target.focus();
      else if(wasInside)(bar.querySelector('.qr--button-action')||$('#qr-float-demo')).focus();
      say('快捷回复已回到输入栏上方。');
    }
  };
  const closeEditor=()=>editor.close();
  $('#send_form').addEventListener('submit',event=>{event.preventDefault();sendLocal(draft.value);});draft.addEventListener('input',draftStatus);
  $('#qr-float-demo').addEventListener('change',event=>setFloating(event.target.checked));float.querySelector('.qr--close').addEventListener('click',()=>setFloating(false));
  for(const id of ['qr-combined','qr-long','qr-icons','qr-sets'])$('#'+id).addEventListener('change',()=>{closeMenu(false);render();placeFloat();say($('#qr-sets').value==='empty'?'当前是空集合样本；输入框仍可使用。':'已调整本页按钮条样本。');});
  $('#qr-send-mode').addEventListener('change',()=>say($('#qr-send-mode').value==='insert'?'点击将填入本页草稿。':'点击将增加本页模拟消息，不连接酒馆。'));
  $('#qr-edit-sample').addEventListener('click',()=>openEditor(itemById('look'),{control:'qr-edit-sample'}));
  $('#qr-editor-close').addEventListener('click',closeEditor);
  editor.addEventListener('close',()=>{const target=editorReturn;editorReturn=null;editorTarget=null;if(target?.id)(activeButton(target.id)||$('#qr-edit-sample')).focus();else if(target?.control)$('#'+target.control).focus();});
  for(const [id,key] of [['qr--modal-label','label'],['qr--modal-message','message']])$('#'+id).addEventListener('input',event=>{
    if(!editorTarget)return;editorTarget[key]=event.target.value;
    if(key==='label')delete editorTarget.longLabel;
    render();placeFloat();$('#qr-editor-note').textContent='本页样本已更新；关闭不会撤销。';
  });
  context.addEventListener('click',event=>{if(event.target===context)closeMenu();});
  context.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeMenu();return;}
    if(event.key==='Tab'){event.preventDefault();closeMenu();return;}
    const items=[...context.querySelectorAll('[role=menuitem]')];let index=items.indexOf(document.activeElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();index=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((b,i)=>b.tabIndex=i===index?0:-1);items[index]?.focus();}
  });
  const handle=$('#qr--popoutheader');
  handle.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,baseX:position.x,baseY:position.y};handle.setPointerCapture(event.pointerId);});
  handle.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;position.x=drag.baseX+event.clientX-drag.x;position.y=drag.baseY+event.clientY-drag.y;placeFloat();});
  const endDrag=()=>{drag=null;};handle.addEventListener('pointerup',endDrag);handle.addEventListener('pointercancel',endDrag);handle.addEventListener('lostpointercapture',endDrag);
  handle.addEventListener('keydown',event=>{const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[event.key];if(!delta)return;event.preventDefault();position.x+=delta[0];position.y+=delta[1];placeFloat();});
  window.addEventListener('resize',()=>{placeFloat();positionMenu();});window.addEventListener('scroll',()=>{if(!context.hidden)positionMenu();},{passive:true});
  document.addEventListener('ef:variant',()=>{placeFloat();positionMenu();});
  $('#qr-reset').addEventListener('click',()=>{
    closeMenu(false);sets=initialSets();draft.value='';draftStatus();$('#qr-transcript').replaceChildren();const p=document.createElement('p');p.className='sample-message';p.textContent='门外传来轻微的响动。灯光沿着空旷的走廊向前延伸。';$('#qr-transcript').append(p);render();placeFloat();say('虚构动作和本页消息已恢复。');
  });
  const params=new URLSearchParams(location.search);$('#qr-long').checked=params.get('long')==='1';$('#qr-combined').checked=params.get('combined')==='1';render();draftStatus();
})();
