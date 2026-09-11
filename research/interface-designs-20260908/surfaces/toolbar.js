(() => {
  'use strict';
  const q = selector => document.querySelector(selector);
  const body = document.body;
  const frame = q('#toolbar-viewport');
  const buttons = [...document.querySelectorAll('.drawer-toggle')];
  const text = q('#sample-message');
  let openId = null;
  let originalMessage = '“先把这页读完。”\n他把笔放在页边，留下一个小小的记号。';
  let translated = false;
  let excluded = false;
  let bookmarked = false;
  let branchCount = 0;
  let simulatedConnection = false;
  let composing = false;
  const labels = ['AI 响应配置','API 连接','高级格式','世界书','用户设置','背景','扩展设置','用户角色','角色管理'];
  const longLabels = ['AI 响应生成与采样参数配置','API 连接与聊天补全服务设置','高级格式与上下文模板管理','世界书与长期背景资料管理','用户界面与阅读偏好设置','聊天背景与纸面显示管理','扩展启用状态与快捷入口设置','用户角色与发言身份管理','角色卡片与群组聊天管理'];
  const panelBodies = [
    '<div class="panel-row"><label for="sample-preset">响应预设</label><select id="sample-preset"><option>平衡</option><option>细致叙述</option><option>简洁回应</option></select></div><div class="panel-row"><label for="sample-temperature">温度</label><input id="sample-temperature" type="range" min="0" max="2" step="0.1" value="0.8"><output for="sample-temperature">0.8</output></div><p class="panel-help">这些只是控件样本，不会更改模型参数。</p><div class="panel-actions"><button type="button" class="ef-button" data-panel-action="reset-sampling">恢复示例值</button></div>',
    '<div class="panel-row"><label>连接来源</label><span>本地演示连接</span></div><div class="panel-status" id="demo-api-status" role="status">未连接 · 本页不会请求任何服务器</div><p class="panel-help">点击后仅切换示例状态；不需要地址或密钥。</p><div class="panel-actions"><button type="button" class="ef-button primary" data-panel-action="connect">模拟连接</button></div>',
    '<label for="formatting-sample">上下文格式样本</label><textarea id="formatting-sample">继续当前对话，保留已有角色称呼与段落结构。\n让下一句自然承接上一页。</textarea><div class="panel-actions"><button type="button" class="ef-button primary" data-panel-action="save-formatting">确认本页文本</button></div>',
    '<input class="ef-field" id="sample-world-search" aria-label="搜索世界书样本" placeholder="搜索资料标题"><ul class="panel-list" id="world-list"><li><label><input type="checkbox" checked><span>地点记录 · 北侧走廊</span></label></li><li><label><input type="checkbox"><span>关于一份名字很长、用于测试窄屏折行的背景资料样本</span></label></li><li><label><input type="checkbox" checked><span>人物关系 · 当前章节</span></label></li></ul><p class="panel-help" id="world-search-result">3 份虚构资料，用于检验长标题和勾选布局。</p>',
    '<div class="panel-row"><label for="reader-scale">本页阅读字号</label><input id="reader-scale" type="range" min="0.9" max="1.2" step="0.05" value="1"><output for="reader-scale">100%</output></div><label class="panel-check"><input type="checkbox" id="always-actions"><span>在这份原型里始终展开消息操作</span></label><p class="panel-help">设置只影响当前样本。关闭抽屉即可看文字和工具变化。</p>',
    '<p class="panel-help">只切换下面阅读样本的纸面，不触碰实际主题。</p><div class="background-options"><button type="button" data-paper="white" aria-pressed="true">白纸</button><button type="button" data-paper="gray" aria-pressed="false">浅灰</button><button type="button" data-paper="contours" aria-pressed="false">等高线</button></div>',
    '<label class="panel-check"><input type="checkbox" checked><span>附件资料 · 示例开关</span></label><label class="panel-check"><input type="checkbox"><span>扩展入口名称很长时仍然完整换行，不挤出勾选框</span></label><p class="panel-help">这里没有安装、启用或停用实际扩展；只用于展示开关密度与长标签。</p>',
    '<ul class="panel-list persona-list"><li><button type="button" data-persona="记录者" aria-pressed="true"><span>记录者</span><small>当前示例身份</small></button></li><li><button type="button" data-persona="旅人" aria-pressed="false"><span>旅人</span><small>第二份样本</small></button></li></ul><p class="panel-help">选择只改变本页状态提示，不切换真实用户角色。</p>',
    '<ul class="panel-list character-list"><li><button type="button" data-character="示例角色" aria-pressed="true"><span>示例角色</span><small>当前阅读样本</small></button></li><li><button type="button" data-character="一位名字很长的夜班档案记录员" aria-pressed="false"><span>一位名字很长的夜班档案记录员</span><small>长名字样本</small></button></li></ul><p class="panel-help">选择后，阅读样本的角色名会同步变化。</p>'
  ];
  const caption = () => q('#toolbar-caption').textContent = body.dataset.variant === 'b' ? 'B / 更矮的近黑控制条，黄色只标记打开的入口。' : 'A / 图标与短标题同列，白纸索引签。';
  function currentLabel(index) { return q('#long-labels').checked ? longLabels[index] : labels[index]; }
  function closeDrawer(restoreFocus = false) {
    const prior = buttons.find(button=>button.dataset.panel===openId);
    for (const button of buttons) {
      button.setAttribute('aria-expanded','false');
      const icon = button.querySelector('.drawer-icon');
      icon.classList.replace('openIcon','closedIcon');
      const panel = q(`#${button.dataset.panel}`);
      panel.hidden = true;
      panel.classList.remove('openDrawer');
      panel.classList.add('closedDrawer');
    }
    openId = null;
    q('.selection-caption').classList.remove('is-open');
    q('#selection-caption').textContent = '选择一个入口，查看当前项和抽屉示例。';
    if (restoreFocus) prior?.focus({ preventScroll: true });
  }
  function openDrawer(button) {
    const wasOpen = openId === button.dataset.panel;
    closeDrawer();
    if (wasOpen) return;
    openId = button.dataset.panel;
    button.setAttribute('aria-expanded','true');
    button.querySelector('.drawer-icon').classList.replace('closedIcon','openIcon');
    const panel = q(`#${openId}`);
    panel.hidden = false;
    panel.classList.replace('closedDrawer','openDrawer');
    q('#selection-caption').textContent = `当前 · ${currentLabel(buttons.indexOf(button))}`;
    q('.selection-caption').classList.add('is-open');
  }
  function showResult(message) { q('#message-result').hidden = false; q('#message-result').textContent = message; }
  function toggleMessageActions(force) {
    const group = q('.extraMesButtons');
    const hint = q('.extraMesButtonsHint');
    const active = document.activeElement;
    const expanded = typeof force === 'boolean' ? force : group.hidden;
    group.hidden = !expanded;
    group.classList.toggle('visible',expanded);
    hint.hidden = expanded;
    hint.setAttribute('aria-expanded',String(expanded));
    q('#show-message-actions').textContent = expanded ? '收起消息工具示例' : '展开消息工具示例';
    q('#show-message-actions').setAttribute('aria-pressed',String(expanded));
    if (expanded && hint.contains(active)) group.querySelector('button:not([hidden]):not(:disabled)')?.focus({ preventScroll: true });
    else if (!expanded && group.contains(active)) hint.focus({ preventScroll: true });
  }
  function editMessage() {
    if (q('#curEditTextarea')) return;
    const textarea = document.createElement('textarea');
    textarea.id = 'curEditTextarea';
    textarea.setAttribute('aria-label','编辑示例消息');
    textarea.value = originalMessage;
    text.hidden = true;
    text.insertAdjacentElement('afterend',textarea);
    q('.mes_buttons').hidden = true;
    q('.mes_edit_buttons').hidden = false;
    textarea.focus();
  }
  function endEdit(save) {
    const textarea = q('#curEditTextarea');
    if (!textarea) return;
    if (save) { originalMessage = textarea.value; translated = false; text.textContent = originalMessage; showResult('已更新本页示例文字。'); }
    textarea.remove();
    text.hidden = false;
    q('.mes_buttons').hidden = false;
    q('.mes_edit_buttons').hidden = true;
    q('.mes_edit').focus({ preventScroll: true });
  }
  buttons.forEach((button,index)=> {
    const panel = q(`#${button.dataset.panel}`);
    panel.innerHTML = `<header class="panel-head"><span class="panel-number">${String(index + 1).padStart(2,'0')}</span><div class="panel-title"><h2>${labels[index]}</h2><p>LOCAL DEMO / 原生抽屉交互示例</p></div><button type="button" class="close-drawer" aria-label="关闭${labels[index]}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header><div class="panel-content">${panelBodies[index]}</div>`;
    button.addEventListener('click',()=>openDrawer(button));
    panel.querySelector('.close-drawer').addEventListener('click',()=>closeDrawer(true));
  });
  q('#sample-temperature').addEventListener('input',event=>q('output[for="sample-temperature"]').textContent=Number(event.target.value).toFixed(1));
  q('#sample-preset').addEventListener('change',event=>window.EF.toast(`本页预设样本：${event.target.value}`));
  q('[data-panel-action="reset-sampling"]').addEventListener('click',()=> { q('#sample-preset').selectedIndex = 0; q('#sample-temperature').value = '0.8'; q('output[for="sample-temperature"]').textContent = '0.8'; window.EF.toast('采样样本已恢复默认值。'); });
  q('[data-panel-action="connect"]').addEventListener('click',event=> {
    simulatedConnection = !simulatedConnection;
    q('#demo-api-status').textContent = simulatedConnection ? '模拟已连接 · 没有网络请求' : '未连接 · 本页不会请求任何服务器';
    event.currentTarget.textContent = simulatedConnection ? '断开示例连接' : '模拟连接';
    q('#API-status-top').classList.toggle('fa-plug',simulatedConnection);
    q('#API-status-top').classList.toggle('fa-plug-circle-exclamation',!simulatedConnection);
  });
  q('[data-panel-action="save-formatting"]').addEventListener('click',()=>window.EF.toast('已保留当前页面文本；没有修改宿主格式设置。'));
  q('#sample-world-search').addEventListener('input',event=> {
    const term = event.target.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const row of q('#world-list').children) { row.hidden = !row.textContent.toLocaleLowerCase().includes(term); if (!row.hidden) count++; }
    q('#world-search-result').textContent = count ? `${count} 份匹配的虚构资料。` : '没有匹配的资料样本。';
  });
  q('#reader-scale').addEventListener('input',event=> { q('#reader-preview').style.setProperty('--reader-scale',event.target.value); q('output[for="reader-scale"]').textContent=`${Math.round(Number(event.target.value)*100)}%`; });
  q('#always-actions').addEventListener('change',event=> { body.classList.toggle('expandMessageActions',event.target.checked); toggleMessageActions(event.target.checked); });
  for (const paper of document.querySelectorAll('[data-paper]')) paper.addEventListener('click',()=> { q('#reader-preview').dataset.paper = paper.dataset.paper; for (const sibling of paper.parentElement.children) sibling.setAttribute('aria-pressed',String(sibling === paper)); });
  for (const persona of document.querySelectorAll('[data-persona]')) persona.addEventListener('click',()=> { for (const item of document.querySelectorAll('[data-persona]')) item.setAttribute('aria-pressed',String(item === persona)); window.EF.toast(`本页示例身份：${persona.dataset.persona}`); });
  for (const character of document.querySelectorAll('[data-character]')) character.addEventListener('click',()=> { for (const item of document.querySelectorAll('[data-character]')) item.setAttribute('aria-pressed',String(item === character)); q('#demo-character-name').textContent = character.dataset.character; window.EF.toast('阅读样本的角色名已更新。'); });
  for (const checkbox of document.querySelectorAll('#rm_extensions_block input,#world-list input')) checkbox.addEventListener('change',()=>window.EF.toast(checkbox.checked ? '已勾选此处示例。' : '已取消勾选此处示例。'));
  q('#show-message-actions').addEventListener('click',()=> { closeDrawer(); if (body.classList.contains('expandMessageActions')) { q('#always-actions').checked = false; body.classList.remove('expandMessageActions'); } toggleMessageActions(); });
  q('.extraMesButtonsHint').addEventListener('click',()=>toggleMessageActions(true));
  q('.mes_edit').addEventListener('click',editMessage);
  q('.mes_edit_done').addEventListener('click',()=>endEdit(true));
  q('.mes_edit_cancel').addEventListener('click',()=>endEdit(false));
  for (const control of document.querySelectorAll('[data-message-action]')) control.addEventListener('click',async()=> {
    switch(control.dataset.messageAction) {
      case 'translate': translated = !translated; text.textContent = translated ? '“Finish this page first.”\nHe rested the pen in the margin, leaving a small mark.\n[本地翻译样本]' : originalMessage; showResult(translated ? '已切到固定英文样本；未调用翻译服务。' : '已还原原文。'); break;
      case 'prompt': showResult('提示词样本\n角色：示例角色\n任务：自然承接当前对话\n此处没有读取真实提示词或聊天。'); break;
      case 'hide': excluded = !excluded; text.classList.toggle('is-excluded',excluded); control.setAttribute('aria-pressed',String(excluded)); control.querySelector('i').className = excluded ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'; showResult(excluded ? '此条示例已标记为排除；再点可恢复。' : '此条示例已恢复。'); break;
      case 'embed': showResult('附件示例：一份很长的补充记录文件名_用于检验窄屏排版.txt · 12.4 KB\n没有读取或上传文件。'); break;
      case 'bookmark': bookmarked = !bookmarked; control.setAttribute('aria-pressed',String(bookmarked)); showResult(bookmarked ? '已给这条示例加上检查点标记。' : '检查点示例标记已移除。'); break;
      case 'branch': branchCount++; showResult(`已创建第 ${branchCount} 个虚构分支标记；没有创建真实聊天。`); break;
      case 'copy': try { await navigator.clipboard.writeText(text.textContent); showResult('已复制这里的示例文字。'); } catch { showResult('浏览器未允许复制。可直接选择上方示例文字。'); } break;
    }
  });
  q('#toolbar-width').addEventListener('change',event=> { const value = event.target.value; frame.style.setProperty('--toolbar-width',value === 'wide' ? '900px' : `${value}px`); if (value !== 'wide') { q('#toolbar-touch').checked = true; frame.classList.add('touch-targets'); } });
  q('#toolbar-touch').addEventListener('change',event=>frame.classList.toggle('touch-targets',event.target.checked));
  q('#long-labels').addEventListener('change',event=> {
    body.classList.toggle('long-labels',event.target.checked);
    buttons.forEach((button,index)=> { const label = currentLabel(index); button.title = label; button.setAttribute('aria-label',label); button.querySelector('.nav-label').textContent = label; q(`#${button.dataset.panel} .panel-title h2`).textContent = label; });
    if (openId) q('#selection-caption').textContent = `当前 · ${currentLabel(buttons.findIndex(button=>button.dataset.panel === openId))}`;
  });
  q('#reset-toolbar').addEventListener('click',()=> {
    closeDrawer(); endEdit(false); translated = false; excluded = false; bookmarked = false; branchCount = 0;
    originalMessage = '“先把这页读完。”\n他把笔放在页边，留下一个小小的记号。'; text.textContent = originalMessage; text.classList.remove('is-excluded');
    q('#message-result').hidden = true; q('#always-actions').checked = false; body.classList.remove('expandMessageActions'); toggleMessageActions(false);
    q('#reader-preview').style.removeProperty('--reader-scale'); q('#reader-scale').value = '1'; q('output[for="reader-scale"]').textContent='100%';
    delete q('#reader-preview').dataset.paper; for (const item of document.querySelectorAll('.background-options button')) item.setAttribute('aria-pressed',String(item.dataset.paper === 'white'));
    q('#demo-character-name').textContent='示例角色'; for (const item of document.querySelectorAll('[data-character]')) item.setAttribute('aria-pressed',String(item.dataset.character === '示例角色'));
    for (const item of document.querySelectorAll('.mes_button[aria-pressed]')) item.setAttribute('aria-pressed','false'); q('.mes_hide i').className='fa-solid fa-eye';
    simulatedConnection = false; q('#demo-api-status').textContent='未连接 · 本页不会请求任何服务器'; q('[data-panel-action="connect"]').textContent='模拟连接'; q('#API-status-top').classList.remove('fa-plug'); q('#API-status-top').classList.add('fa-plug-circle-exclamation');
    q('#sample-preset').selectedIndex=0; q('#sample-temperature').value='0.8'; q('output[for="sample-temperature"]').textContent='0.8';
    q('#formatting-sample').value=q('#formatting-sample').defaultValue; q('#sample-world-search').value=''; for (const row of q('#world-list').children) row.hidden=false; q('#world-search-result').textContent='3 份虚构资料，用于检验长标题和勾选布局。';
    for (const item of document.querySelectorAll('#rm_extensions_block input,#world-list input')) item.checked=item.defaultChecked;
    for (const item of document.querySelectorAll('[data-persona]')) item.setAttribute('aria-pressed',String(item.dataset.persona === '记录者'));
    window.EF.toast('阅读与消息操作样本已重置。');
  });
  document.addEventListener('click',event=> {
    if (!event.target.closest('#top-settings-holder,#toolbar-width,#toolbar-touch,#long-labels,.lab-toolbar,.variant-picker')) closeDrawer();
    if (!body.classList.contains('expandMessageActions') && !event.target.closest('.extraMesButtons,.extraMesButtonsHint,#show-message-actions,#always-actions')) toggleMessageActions(false);
  });
  document.addEventListener('compositionstart',()=> { composing = true; });
  document.addEventListener('compositionend',()=> { composing = false; });
  document.addEventListener('keydown',event=> {
    if (event.key !== 'Escape') return;
    if (event.isComposing || composing || event.keyCode === 229) return;
    if (q('#curEditTextarea')) endEdit(false);
    else { closeDrawer(true); if (!body.classList.contains('expandMessageActions')) toggleMessageActions(false); }
  });
  document.addEventListener('ef:variant',caption);
  caption();
  text.textContent = originalMessage;
  q('#API-status-top').classList.replace('fa-plug','fa-plug-circle-exclamation');
})();
