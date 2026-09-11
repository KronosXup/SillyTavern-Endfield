(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const stage=$('.settings-stage');
  const form=$('#settings-form');
  let activePanel='appearance';
  let connectionTimer;
  const panelNames={appearance:'用户设置',connection:'连接设置',generation:'生成设置'};
  const setStatus=message=>{const status=$('#settings-change-state');status.classList.add('changed');status.replaceChildren(Object.assign(document.createElement('span'),{}),document.createTextNode(message));};
  const updateRanges=()=>$$('input[type=range]').forEach(input=>{const output=$(`#${input.id}-value`);if(output)output.value=`${input.dataset.decimals?Number(input.value).toFixed(Number(input.dataset.decimals)):input.value}${input.dataset.unit||''}`;});
  const markMatches=()=>{
    const query=$('#settings-search').value.trim().toLocaleLowerCase();
    const rows=$$('[data-search]');
    rows.forEach(row=>row.classList.remove('highlighted'));
    if(!query){$('#search-summary').textContent='搜索会标记匹配项';return;}
    const active=$(`[data-settings-panel="${activePanel}"]`);
    const matches=[...active.querySelectorAll('[data-search]')].filter(row=>`${row.dataset.search} ${row.textContent}`.toLocaleLowerCase().includes(query));
    matches.forEach(row=>{row.classList.add('highlighted');const detail=row.closest('details');if(detail)detail.open=true;});
    $('#search-summary').textContent=matches.length?`当前类别 ${matches.length} 项已标记`:'当前类别无匹配项';
  };
  const selectPanel=id=>{
    activePanel=id;
    $$('[data-settings-panel]').forEach(panel=>panel.hidden=panel.dataset.settingsPanel!==id);
    $$('[data-panel]').forEach(button=>{if(button.dataset.panel===id)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    $('#drawer-title').replaceChildren(Object.assign(document.createElement('span'),{textContent:'//'}),document.createTextNode(` ${panelNames[id]}`));
    $('#drawer-title span').setAttribute('aria-hidden','true');$('#drawer-body').scrollTop=0;markMatches();
  };
  $$('[data-panel]').forEach(button=>button.addEventListener('click',()=>selectPanel(button.dataset.panel)));
  $('#settings-search').addEventListener('input',markMatches);
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',event=>{if(event.target.matches('input[type=range]'))updateRanges();setStatus('已更新本次示例');});
  form.addEventListener('change',()=>setStatus('已更新本次示例'));
  $('#model-name').addEventListener('change',()=>$('#full-model-name').textContent=$('#model-name').value);
  $('#setting-reduced-motion').addEventListener('change',()=>{document.body.classList.toggle('reduced-motion',$('#setting-reduced-motion').checked);$('[data-toggle-motion]').checked=$('#setting-reduced-motion').checked;});
  $('[data-toggle-motion]').addEventListener('change',()=>$('#setting-reduced-motion').checked=$('[data-toggle-motion]').checked);
  $('#toggle-height').addEventListener('click',event=>{const short=stage.classList.toggle('short-window');event.currentTarget.setAttribute('aria-pressed',String(short));});
  $$('[data-long-label]').forEach(label=>label.dataset.shortLabel=label.textContent);
  $('#toggle-long-label').addEventListener('click',event=>{const long=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(long));$$('[data-long-label]').forEach(label=>label.textContent=long?label.dataset.longLabel:label.dataset.shortLabel);markMatches();});
  $('#close-drawer').addEventListener('click',()=>{$('#settings-drawer').hidden=true;$('#drawer-closed').hidden=false;$('#reopen-drawer').focus();});
  $('#reopen-drawer').addEventListener('click',()=>{$('#settings-drawer').hidden=false;$('#drawer-closed').hidden=true;$('#close-drawer').focus();});
  $('#back-to-top').addEventListener('click',()=>$('#drawer-body').scrollTo({top:0,behavior:document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  $('#save-theme').addEventListener('click',()=>{setStatus('示例主题已暂存');EF.toast('只演示保存反馈，未写入酒馆');});
  $('#new-preset').addEventListener('click',()=>EF.toast('此处保留预设入口；新建窗口见「弹出窗口」方案'));
  $('#test-connection').addEventListener('click',()=>{
    const button=$('#test-connection');const failed=$('#simulate-failure').checked;button.disabled=true;button.textContent='测试中…';$('#connection-state').className='connection-state waiting';$('#connection-state').replaceChildren(document.createElement('span'),document.createTextNode('等待响应'));$('#connection-preview-title').textContent='等待响应';$('#connection-message').hidden=true;
    connectionTimer=setTimeout(()=>{button.disabled=false;button.textContent='再次测试';$('#connection-state').className=`connection-state ${failed?'failure':'success'}`;$('#connection-state').replaceChildren(document.createElement('span'),document.createTextNode(failed?'连接失败':'示例已连接'));$('#connection-preview-title').textContent=failed?'暂时无法连接':'连接可用';$('#connection-message').className=`connection-message${failed?' error':''}`;$('#connection-message p').textContent=failed?'示例错误：服务暂时不可用。可取消失败选项后再次测试。':'示例成功：模型列表已就绪。本次操作没有发送任何网络请求。';$('#connection-message').hidden=false;setStatus(failed?'示例测试失败':'示例测试完成');},800);
  });
  $('#reset-demo').addEventListener('click',()=>{
    clearTimeout(connectionTimer);form.reset();updateRanges();$('#settings-search').value='';markMatches();$('#full-model-name').textContent=$('#model-name').value;$('#test-connection').disabled=false;$('#test-connection').textContent='测试示例连接';$('#connection-state').className='connection-state';$('#connection-state').replaceChildren(document.createElement('span'),document.createTextNode('未测试'));$('#connection-preview-title').textContent='尚未连接';$('#connection-message').hidden=true;$('#simulate-failure').checked=false;$('#settings-change-state').classList.remove('changed');$('#settings-change-state').replaceChildren(document.createElement('span'),document.createTextNode('示例已就绪'));document.body.classList.remove('reduced-motion');$('[data-toggle-motion]').checked=false;EF.toast('表单示例已恢复');
  });
  updateRanges();
})();
