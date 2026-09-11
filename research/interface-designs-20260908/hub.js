(() => {
  'use strict';
  const catalog = [
    {id:'composer',name:'输入栏',group:'输入与回复',description:'保留聚焦动效，比较不同的输入与操作关系。',recommendation:'默认推荐：保留紧凑结构，增强聚焦层次。',ready:true},
    {id:'quick-replies',name:'快捷回复',group:'常用动作与输入',description:'比较自然换行与横向工具轨，分开执行、关联菜单和弹出工具窗。',recommendation:'默认自然短签；动作多时比较横向工具轨。',ready:true},
    {id:'toolbar',name:'工具栏',group:'导航与操作',description:'九个原生入口，清楚区分选中、悬停和工具分组。',recommendation:'比较：白色索引签与深色工具条。',ready:true},
    {id:'menus',name:'菜单',group:'目录与选择',description:'聊天操作、扩展菜单与长列表，检验密度和层级。',recommendation:'默认优先：沿用原生菜单结构。',ready:true},
    {id:'dialogs',name:'弹出窗口',group:'确认与输入',description:'从一句确认到长正文，按内容选择合适的窗口。',recommendation:'长表单比较 A/B；C 仅用于一句话的短确认。',ready:true},
    {id:'settings',name:'设置与抽屉',group:'表单与信息',description:'在常用设置密度中比较白纸工作面与深色控制面。',recommendation:'延续已确认的主界面，区分操作与阅读表面。',ready:true},
    {id:'catalogs',name:'目录与卡片',group:'角色与资料',description:'角色、用户角色和世界书目录，比较条目与封面密度。',recommendation:'按已有节点选择布局，保留原生入口。',ready:true},
    {id:'connection',name:'连接与模型',group:'配置与状态',description:'保留来源选择、模型手填与原生列表，区分连接和测试消息。',recommendation:'比较：连续登记页与宽屏横向核对台。',ready:true},
    {id:'generation',name:'生成参数',group:'预设与采样',description:'按接口分别看长度、采样和预设，保留原有联动与恢复边界。',recommendation:'默认紧凑参数清单；宽面板再比较横向对齐。',ready:true},
    {id:'prompts',name:'提示词管理',group:'条目与顺序',description:'名称查看、铅笔编辑，分别检查启停、排序和单条保存。',recommendation:'保留连续条目；用工具头区分操作层次。',ready:true},
    {id:'editors',name:'编辑与管理',group:'角色与世界书',description:'长文放大编辑、已有角色与新建草稿、世界书条目各自保留原有流程。',recommendation:'默认连续校稿；面板足够宽时比较双列。',ready:true},
    {id:'workspace',name:'组合场景',group:'整体验收',description:'把区域放回同一聊天界面，检查日常使用路径。',recommendation:'整套关系以实际预览为准，逐区域可替换。',ready:true},
  ];
  const $ = selector=>document.querySelector(selector);
  const qa=new URLSearchParams(location.search).get('qa')==='1';
  const reviewKey=qa?'ef-design:qa-review':'ef-design:review';
  const noteKey=qa?'ef-design:qa-review-note':'ef-design:review-note';
  const surfaceUrl=id=>`surfaces/${id}.html${qa?'?qa=1':''}`;
  if(qa){$('.preview-scope').textContent='本地测试页 · 选择记录独立保存';$('.hub-brand').href='index.html?qa=1';}
  const frame=$('#surface-frame');
  let current=catalog[0];
  let currentVariant=null;
  let choices={};
  try {
    const storedChoices=JSON.parse(EF.stored(reviewKey,'{}'));
    if(storedChoices && typeof storedChoices==='object' && !Array.isArray(storedChoices)) {
      for(const surface of catalog) {
        const entry=storedChoices[surface.id];
        if(entry && typeof entry==='object' && typeof entry.variant==='string' && /^[a-z0-9-]{1,20}$/i.test(entry.variant)) choices[surface.id]={name:surface.name,variant:EF.normalizeVariant(surface.id,entry.variant),recordedAt:typeof entry.recordedAt==='string'?entry.recordedAt:''};
      }
    }
  } catch {}
  let exportUrl=null;
  const hideExport=()=>{if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=null;}$('#review-export').hidden=true;$('#export-review').setAttribute('aria-expanded','false');$('#download-review').removeAttribute('href');};
  const saveReview=()=>{ const count=Object.keys(choices).length;EF.save(reviewKey,JSON.stringify(choices)); $('#review-count').textContent=String(count);$('#open-review').setAttribute('aria-label',`我的方案选择，已记录 ${count} 组`);hideExport(); };
  const nav=$('#surface-nav');
  const revealCurrentNav=()=>nav.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});
  window.addEventListener('resize',revealCurrentNav);
  $('#surface-count').textContent=String(catalog.length).padStart(2,'0');
  catalog.forEach((surface,index)=>{
    const button=document.createElement('button'); button.type='button'; button.className='nav-item'; button.dataset.surface=surface.id;
    button.innerHTML=`<span class="nav-number">${String(index+1).padStart(2,'0')}</span><span class="nav-label"></span><span class="nav-ready ${surface.ready?'':'pending'}" aria-hidden="true"></span>`;
    button.querySelector('.nav-label').textContent=surface.name;
    button.addEventListener('click',()=>selectSurface(surface.id)); nav.append(button);
  });
  const selectSurface=id=>{
    const surface=catalog.find(item=>item.id===id)||catalog[0]; current=surface; currentVariant=null;
    $('#surface-title').textContent=surface.name;
    $('#surface-eyebrow').textContent=`${String(catalog.indexOf(surface)+1).padStart(2,'0')} / ${surface.group}`;
    $('#surface-description').textContent=surface.description;
    $('#surface-recommendation').textContent=surface.recommendation;
    $('#standalone-link').href=surfaceUrl(surface.id); $('#standalone-link').hidden=!surface.ready;
    $('#record-choice').disabled=true;
    frame.hidden=!surface.ready; $('#preparing-state').hidden=surface.ready;
    $('#preparing-state .preparing-number').textContent=String(catalog.indexOf(surface)+1).padStart(2,'0');
    if(surface.ready){frame.src=surfaceUrl(surface.id);frame.title=`${surface.name}交互方案`;}
    for(const item of nav.children) { if(item.dataset.surface===surface.id)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current'); }
    revealCurrentNav();
    history.replaceState(null,'',`#${surface.id}`);
  };
  for(const button of document.querySelectorAll('button[data-width]'))button.addEventListener('click',()=>{
    $('#preview-canvas').dataset.width=button.dataset.width;
    for(const item of document.querySelectorAll('button[data-width]'))item.setAttribute('aria-pressed',String(item===button));
  });
  const updatePreviewWidth=()=>{$('#actual-width').textContent=frame.hidden?'':`实际 ${Math.round(frame.clientWidth)}px`;};
  new ResizeObserver(updatePreviewWidth).observe(frame);
  frame.addEventListener('load',updatePreviewWidth);
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='ef-design:variant')return;
    if(event.data.surface===current.id && typeof event.data.variant==='string' && /^[a-z0-9-]{1,20}$/i.test(event.data.variant)) {currentVariant=event.data.variant;$('#record-choice').disabled=false;}
  });
  $('#record-choice').addEventListener('click',()=>{ if(!currentVariant)return;choices[current.id]={name:current.name,variant:currentVariant,recordedAt:new Date().toISOString()};saveReview();EF.toast(`已记录：${current.name} · ${currentVariant.toUpperCase()}`); });
  const renderReview=()=>{
    const list=$('#review-list');list.replaceChildren();
    for(const surface of catalog){
      const row=document.createElement('div');row.className='review-line';
      const title=document.createElement('strong');title.textContent=surface.name;
      const value=document.createElement('span');value.textContent=choices[surface.id]?`方案 ${choices[surface.id].variant.toUpperCase()}`:'还未选择';
      const jump=document.createElement('button');jump.type='button';jump.textContent=choices[surface.id]?'重新比较':'去比较';jump.addEventListener('click',()=>{$('#review-dialog').close();selectSurface(surface.id);nav.querySelector('[aria-current="page"]')?.focus({preventScroll:true});});
      row.append(title,value,jump);list.append(row);
    }
  };
  $('#open-review').addEventListener('click',()=>{renderReview();$('#review-dialog').showModal();});
  $('#review-note').value=EF.stored(noteKey,'');$('#review-note').addEventListener('input',()=>{EF.save(noteKey,$('#review-note').value);hideExport();});
  $('#clear-review').addEventListener('click',()=>{choices={};$('#review-note').value='';EF.save(noteKey,'');saveReview();renderReview();EF.toast('已清空本页的验收选择');});
  $('#export-review').addEventListener('click',()=>{
    const lines=['# 终末地主题方案验收','',...catalog.map(surface=>`- ${surface.name}：${choices[surface.id]?`方案 ${choices[surface.id].variant.toUpperCase()}`:'未选择'}`),'','## 补充意见','',$('#review-note').value||'暂无',''];
    if(exportUrl)URL.revokeObjectURL(exportUrl);
    $('#review-export-text').value=lines.join('\n');
    exportUrl=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}));
    $('#download-review').href=exportUrl;$('#review-export').hidden=false;$('#export-review').setAttribute('aria-expanded','true');
    $('#review-export-text').focus();$('#review-export-text').select();EF.toast('验收文本已生成');
  });
  window.addEventListener('pagehide',()=>{if(exportUrl)URL.revokeObjectURL(exportUrl);});
  $('#open-guide').addEventListener('click',()=>$('#guide-dialog').showModal());
  $('#next-surface').addEventListener('click',()=>selectSurface(catalog[(catalog.indexOf(current)+1)%catalog.length].id));
  saveReview();selectSurface(location.hash.slice(1));
})();
