(() => {
  'use strict';
  const q = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const stage = q('.connection-stage');
  const fakeKey = 'DEMO_ONLY_NOT_A_SECRET';
  const longModel = 'example-provider/character-chat-long-context-preview-2026-09-08-131072';
  const modelSamples = ['example-provider/dialogue-small', 'example-local/story-model:27b', 'example-provider/reasoning-medium'];
  const longSamples = [longModel, 'example-local/多语言推理模型-包含稀有字𰻞-与括号（候选）:27b', 'example-provider/character-dialogue-context-131072-preview-extended-vocabulary'];
  const keyInputs = { custom:q('#api_key_custom'), openai:q('#api_key_openai'), generic:q('#api_key_ooba') };
  const keySaved = { custom:true, openai:true, generic:false };
  const profiles = [{ id:'sample-1', name:'本地示例 · 日常对话', snapshot:null }];
  let nextProfile = 2;
  let connectionTimer = 0;
  let testTimer = 0;
  let connectionRun = 0;
  let testRun = 0;
  let busy = false;

  const activeKey = () => q('#main_api').value === 'openai' ? q('#chat_completion_source').value : q('#textgen_type').value === 'generic' ? 'generic' : null;
  const selectedProfile = () => profiles.find(profile => profile.id === q('#connection_profiles').value);
  const currentModelSamples = () => q('#long-names').checked ? longSamples : modelSamples;
  const activeModel = () => q('#main_api').value === 'openai'
    ? q('#chat_completion_source').value === 'custom' ? q('#custom_model_id').value : q('#model_openai_select').value
    : q('#textgen_type').value === 'ollama' ? q('#ollama_model').value : q('#custom_model_textgenerationwebui').value;
  const activeAddress = () => q('#main_api').value === 'openai'
    ? q('#chat_completion_source').value === 'custom' ? q('#custom_api_url_text') : null
    : q('#textgen_type').value === 'ollama' ? q('#ollama_api_url_text') : q('#textgenerationwebui_api_url_text');
  const setProfileNote = message => { q('#profile-note').textContent = message; };
  const announce = message => { if (window.EF) window.EF.toast(message); };
  const option = (value, label = value) => new Option(label, value);
  const activeConnectButton = () => q(q('#main_api').value === 'openai' ? '#api_button_openai' : '#api_button_textgenerationwebui');
  const activeSourceControl = () => q(q('#main_api').value === 'openai' ? '#chat_completion_source' : '#textgen_type');
  const focusAvailable = node => Boolean(node?.isConnected && !node.disabled && !node.closest('[hidden]') && !node.classList.contains('select2-hidden-accessible'));

  function restoreRemovedFocus(previous, fallback) {
    if (!previous || previous === document.body || focusAvailable(previous)) return;
    const current = document.activeElement;
    if (current !== previous && current !== document.body && focusAvailable(current)) return;
    if (focusAvailable(fallback)) fallback.focus({preventScroll:true});
  }

  function showStatus(state, text) {
    const messages = {
      disconnected:'未连接',
      pending:'正在检查连接… 可以取消本次检查。',
      valid:'有效。已完成本地状态检查示例。',
      saved:'密钥已保存；请发送“测试消息”验证是否能收到回复。',
      bypass:'已跳过状态检查。此状态不代表测试消息已经成功。',
      invalid:'端点 URL 无效，请检查基础地址；请求可能失败。',
      failed:'无法连接。请检查地址、服务状态与凭据后重试。',
    };
    const status = q('#connection-status');
    status.dataset.state = state;
    q('#online_status_text').textContent = text || messages[state] || messages.disconnected;
    // This matches the host's broad success-class rule; the full text retains the meaning.
    q('.online_status_indicator').classList.toggle('success', ['valid','saved','bypass','invalid'].includes(state));
  }

  function setBusy(value, { restoreFocus = true } = {}) {
    const previous = document.activeElement;
    const actions = previous?.closest('.connection-actions');
    const fallback = previous?.classList.contains('api_loading') ? actions?.querySelector('.api_button') : null;
    busy = value;
    all('.api_button').forEach(button => { button.disabled = value; button.classList.toggle('disabled', value); });
    all('.api_loading').forEach(button => { button.hidden = !value; });
    if (!value && restoreFocus && fallback) restoreRemovedFocus(previous, fallback);
  }

  function resetTest() {
    testRun++;
    clearTimeout(testTimer);testTimer=0;
    q('#test_api_button').disabled = false;
    q('#test_api_button').setAttribute('aria-disabled','false');
    q('#test_api_button').textContent = '测试消息';
    q('#test-result').hidden = true;
  }

  function clearChecks({ restoreFocus = true } = {}) {
    connectionRun++;
    clearTimeout(connectionTimer); connectionTimer = 0;
    setBusy(false,{restoreFocus});
    resetTest();
  }

  function cancelConnection() {
    connectionRun++;
    clearTimeout(connectionTimer);connectionTimer=0;
    setBusy(false);
    showStatus('disconnected','连接检查已取消。已填写的地址和模型保留。');
  }

  function invalidatePendingSample() {
    if (!busy && !testTimer) return;
    clearChecks();
    showStatus('disconnected','示例内容已变更。上一次检查已结束，请重新连接或测试。');
  }

  function updateKeyDisplay(key) {
    const input = keyInputs[key];
    input.placeholder = keySaved[key] ? '✔ 已保存（本地示例）' : key === 'openai' ? '尚未保存，请填入示例值' : '尚未保存（可选）';
    q(`[data-for="${input.id}"]`).hidden = !input.value;
  }

  function syncCredentialControl() {
    const key = activeKey();
    q('#credential-state').disabled = !key;
    q('#credential-state').value = key ? keyInputs[key].value ? 'draft' : keySaved[key] ? 'saved' : 'empty' : 'empty';
  }

  function applyCredentialSample() {
    const key = activeKey();
    if (!key) return;
    invalidatePendingSample();
    const state = q('#credential-state').value;
    keySaved[key] = state === 'saved';
    keyInputs[key].value = state === 'draft' ? fakeKey : '';
    updateKeyDisplay(key);
  }

  function refreshProfileDetails() {
    const profile = selectedProfile();
    const value = activeModel() || '未选择模型';
    q('#profile-detail-text').textContent = profile ? `${profile.name} · ${q('#main_api').selectedOptions[0].text} · ${value}` : '未选择配置。可以新建一份本地示例。';
    ['update_connection_profile','edit_connection_profile','reload_connection_profile','delete_connection_profile'].forEach(id => { q(`#${id}`).disabled = !profile; });
  }

  function renderProfiles(selectedId = q('#connection_profiles').value) {
    const select = q('#connection_profiles');
    select.replaceChildren(option('', '不使用连接配置'));
    for (const profile of profiles) select.add(option(profile.id, q('#long-names').checked ? `${profile.name} · 面向长上下文角色对话与多语言书写的连接配置样本` : profile.name));
    select.value = profiles.some(profile => profile.id === selectedId) ? selectedId : '';
    refreshProfileDetails();
  }

  function captureProfile() {
    return {
      main:q('#main_api').value, source:q('#chat_completion_source').value, textType:q('#textgen_type').value,
      customUrl:q('#custom_api_url_text').value, customModel:q('#custom_model_id').value,
      openaiModel:q('#model_openai_select').value, ollamaUrl:q('#ollama_api_url_text').value, ollamaModel:q('#ollama_model').value,
      genericUrl:q('#textgenerationwebui_api_url_text').value, genericModel:q('#custom_model_textgenerationwebui').value,
    };
  }

  function applyProfile(profile) {
    if (!profile?.snapshot) return;
    const s = profile.snapshot;
    q('#main_api').value=s.main;q('#chat_completion_source').value=s.source;q('#textgen_type').value=s.textType;
    q('#custom_api_url_text').value=s.customUrl;q('#custom_model_id').value=s.customModel;q('#model_openai_select').value=s.openaiModel;
    q('#ollama_api_url_text').value=s.ollamaUrl;q('#ollama_model').value=s.ollamaModel;
    q('#textgenerationwebui_api_url_text').value=s.genericUrl;q('#custom_model_textgenerationwebui').value=s.genericModel;
    syncBranches();
    if (window.jQuery && jQuery('#ollama_model').hasClass('select2-hidden-accessible')) jQuery('#ollama_model').trigger('change.select2');
    q('#model_custom_select').value = [...q('#model_custom_select').options].some(entry=>entry.value===s.customModel) ? s.customModel : '';
    setProfileNote('已重载示例配置');
  }

  function updateOllamaWidget() {
    if (!window.jQuery?.fn.select2) return;
    const select = jQuery('#ollama_model');
    const active = q('#main_api').value === 'textgenerationwebui' && q('#textgen_type').value === 'ollama';
    const wanted = active && q('#model-widget').value === 'enhanced';
    const enhanced = select.hasClass('select2-hidden-accessible');
    if (wanted && enhanced) { select.trigger('change.select2');return; }
    const previous = document.activeElement;
    if (enhanced) { select.off('.connectionPreview');select.select2('destroy'); }
    if (!wanted) { restoreRemovedFocus(previous,active ? q('#ollama_model') : activeSourceControl());return; }
    select.select2({ width:'100%', dropdownCssClass:'connection-model-dropdown', placeholder:'选择示例模型', searchInputPlaceholder:'搜索示例模型…', language:{ noResults:()=>'没有匹配的示例模型', searching:()=>'正在搜索…' } });
    select.on('change.connectionPreview', () => { invalidatePendingSample();refreshProfileDetails(); });
    restoreRemovedFocus(previous,select.next('.select2-container').find('.select2-selection')[0]);
  }

  function renderModelLists({ preferLong = false } = {}) {
    const empty = q('#list-state').value === 'empty';
    const models = currentModelSamples();
    const customValue = q('#custom_model_id').value;
    const previousOllama = q('#ollama_model').value;
    const list = q('#model_custom_select');
    const fill = q('#model_custom_select_fill');
    const ollama = q('#ollama_model');
    if (window.jQuery && jQuery(ollama).hasClass('select2-hidden-accessible')) jQuery(ollama).select2('close');
    list.replaceChildren(option('',empty?'没有可用模型':'不选择 / None'));
    fill.replaceChildren();
    ollama.replaceChildren(option('',empty?'没有可用模型':'选择模型'));
    if (!empty) {
      for (const value of models) { list.add(option(value));fill.append(option(value));ollama.add(option(value)); }
      if (preferLong) q('#custom_model_id').value = models[0];
      list.value = models.includes(q('#custom_model_id').value) ? q('#custom_model_id').value : '';
      ollama.value = preferLong ? models[0] : models.includes(previousOllama) ? previousOllama : models[0];
    } else {
      q('#custom_model_id').value = customValue;
    }
    q('#custom-list-note').textContent = empty ? '列表为空。上方模型 ID 保留，可继续手动填写。' : '选择模型会回填上方 ID；“不选择”不会清空手填内容。';
    q('#ollama-list-note').textContent = empty ? '列表为空，请先连接并获取模型。' : '从可用模型中选择。';
    updateOllamaWidget();
    refreshProfileDetails();
  }

  function syncBranches() {
    const previous = document.activeElement;
    clearChecks({restoreFocus:false});
    const chat = q('#main_api').value === 'openai';
    q('#openai_api').hidden = !chat;
    q('#textgenerationwebui_api').hidden = chat;
    const source = q('#chat_completion_source').value;
    all('[data-source]').forEach(node => { node.hidden = !chat || node.dataset.source !== source; });
    const type = q('#textgen_type').value;
    all('[data-tg-type]').forEach(node => { node.hidden = chat || node.dataset.tgType !== type; });
    q('#additional-parameters').hidden = true;
    q('#customize_additional_parameters').setAttribute('aria-expanded','false');
    updateOllamaWidget();
    syncCredentialControl();
    refreshProfileDetails();
    showStatus('disconnected');
    restoreRemovedFocus(previous,activeSourceControl());
  }

  function connect() {
    if (busy) return;
    const key = activeKey();
    if (key && keyInputs[key].value.trim()) { keySaved[key] = true;keyInputs[key].value = '';updateKeyDisplay(key);syncCredentialControl(); }
    if (key === 'openai' && !keySaved.openai) { showStatus('disconnected','尚未保存 API 密钥。请填写示例凭据后再连接。');keyInputs.openai.focus();return; }
    if (!testTimer) q('#test-result').hidden = true;
    setBusy(true);
    showStatus('pending');
    let outcome = q('#connection-outcome').value;
    const address = activeAddress();
    if (address) { try { const url = new URL(address.value);if (!['http:','https:'].includes(url.protocol)) outcome='invalid'; } catch { outcome='invalid'; } }
    const run = ++connectionRun;
    connectionTimer = setTimeout(() => {
      if (run !== connectionRun) return;
      connectionTimer=0;setBusy(false);showStatus(outcome);
    },1800);
  }

  function testMessage() {
    if (testTimer) return;
    // Keep its keyboard focus while the timer guard prevents duplicate requests.
    q('#test_api_button').setAttribute('aria-disabled','true');
    q('#test_api_button').textContent = '测试中…';
    const result = q('#test-result');
    result.hidden = false;result.dataset.result='pending';result.textContent='正在等待本地示例回复…';
    const failed = q('#test-outcome').value === 'failed';
    const run = ++testRun;
    testTimer = setTimeout(() => {
      if (run !== testRun) return;
      testTimer=0;q('#test_api_button').setAttribute('aria-disabled','false');q('#test_api_button').textContent='测试消息';result.dataset.result=failed?'failed':'success';result.textContent=failed?'测试失败：没有收到回复。请检查连接设置或 API 密钥后重试。':'测试消息已收到示例回复。';
    },1000);
  }

  function closeProfileEditor() { q('#profile-editor').hidden=true;q('#profile-editor-error').textContent=''; }
  function openProfileDetails() { q('#connection_profile_details_content').hidden=false;q('#view_connection_profile').setAttribute('aria-expanded','true');refreshProfileDetails(); }
  function resetDemo() {
    const previous = document.activeElement;
    clearChecks({restoreFocus:false});
    q('#main_api').value='openai';q('#chat_completion_source').value='custom';q('#textgen_type').value='ollama';
    q('#preview-height').value='regular';stage.dataset.height='regular';q('#show-profiles').checked=true;q('#profile-block').hidden=false;
    q('#long-names').checked=false;q('#list-state').value='loaded';q('#connection-outcome').value='valid';q('#test-outcome').value='success';q('#model-widget').value=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?'native':'enhanced';
    q('#custom_api_url_text').value='https://example.invalid/v1';q('#custom_model_id').value=modelSamples[0];
    q('#ollama_api_url_text').value='https://example.invalid/ollama';q('#textgenerationwebui_api_url_text').value='https://example.invalid/completion/v1';q('#custom_model_textgenerationwebui').value='example-local/completion-model';q('#model_openai_select').selectedIndex=0;
    Object.assign(keySaved,{custom:true,openai:true,generic:false});Object.entries(keyInputs).forEach(([key,input])=>{input.value='';updateKeyDisplay(key);});
    q('#auto-connect-checkbox').checked=false;q('#example-post-processing').value='none';q('[data-toggle-motion]').checked=false;document.body.classList.remove('reduced-motion');
    closeProfileEditor();q('#connection_profile_details_content').hidden=true;q('#view_connection_profile').setAttribute('aria-expanded','false');
    profiles.splice(0,profiles.length,{id:'sample-1',name:'本地示例 · 日常对话',snapshot:null});nextProfile=2;
    renderProfiles('sample-1');renderModelLists();syncBranches();profiles[0].snapshot=captureProfile();setProfileNote('当前示例');q('#rm_api_block').scrollTop=0;
    restoreRemovedFocus(previous,activeConnectButton());
  }

  all('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
  ['main_api','chat_completion_source','textgen_type'].forEach(id=>q(`#${id}`).addEventListener('change',syncBranches));
  all('.api_button').forEach(button=>button.addEventListener('click',connect));
  all('.api_loading').forEach(button=>button.addEventListener('click',cancelConnection));
  q('#test_api_button').addEventListener('click',testMessage);
  q('#preview-height').addEventListener('change',()=>{stage.dataset.height=q('#preview-height').value;});
  q('#show-profiles').addEventListener('change',()=>{const previous=document.activeElement;q('#profile-block').hidden=!q('#show-profiles').checked;restoreRemovedFocus(previous,q('#show-profiles'));});
  q('#long-names').addEventListener('change',()=>{invalidatePendingSample();renderProfiles();renderModelLists({preferLong:true});});
  q('#list-state').addEventListener('change',()=>{invalidatePendingSample();renderModelLists();});
  q('#model-widget').addEventListener('change',updateOllamaWidget);
  q('#credential-state').addEventListener('change',applyCredentialSample);
  q('#connection-outcome').addEventListener('change',()=>{if(busy)cancelConnection();});
  q('#test-outcome').addEventListener('change',()=>{if(testTimer)resetTest();});
  q('#show-state').addEventListener('click',()=>{clearChecks();showStatus(q('#connection-outcome').value);});
  q('#reset-demo').addEventListener('click',resetDemo);
  Object.entries(keyInputs).forEach(([key,input])=>input.addEventListener('input',()=>{invalidatePendingSample();updateKeyDisplay(key);syncCredentialControl();}));
  ['custom_api_url_text','ollama_api_url_text','textgenerationwebui_api_url_text'].forEach(id=>q(`#${id}`).addEventListener('input',invalidatePendingSample));
  all('.manage-api-keys').forEach(button=>button.addEventListener('click',()=>announce(keySaved[button.dataset.key]?'已保存本地示例凭据；没有可读取的真实密钥。':'当前没有已保存的示例凭据。')));
  q('#viewSecrets').addEventListener('click',()=>{const key=activeKey();announce(key?keySaved[key]?'当前来源已保存示例凭据。':'当前来源尚未保存示例凭据。':'Ollama 示例没有凭据字段。');});
  q('#auto-connect-checkbox').addEventListener('change',()=>announce(q('#auto-connect-checkbox').checked?'已选中自动连接样本；页面不会发起连接。':'已关闭自动连接样本。'));
  q('#model_custom_select').addEventListener('change',()=>{invalidatePendingSample();if(q('#model_custom_select').value)q('#custom_model_id').value=q('#model_custom_select').value;refreshProfileDetails();});
  q('#custom_model_id').addEventListener('input',()=>{invalidatePendingSample();const value=q('#custom_model_id').value;q('#model_custom_select').value=[...q('#model_custom_select').options].some(entry=>entry.value===value)?value:'';refreshProfileDetails();});
  ['model_openai_select','ollama_model','custom_model_textgenerationwebui'].forEach(id=>q(`#${id}`).addEventListener('change',()=>{invalidatePendingSample();refreshProfileDetails();}));
  q('#custom_model_textgenerationwebui').addEventListener('input',invalidatePendingSample);
  q('#customize_additional_parameters').addEventListener('click',()=>{const hidden=!q('#additional-parameters').hidden;q('#additional-parameters').hidden=hidden;q('#customize_additional_parameters').setAttribute('aria-expanded',String(!hidden));});
  q('#connection_profiles').addEventListener('change',()=>{invalidatePendingSample();closeProfileEditor();const profile=selectedProfile();if(profile)applyProfile(profile);else refreshProfileDetails();setProfileNote(profile?'已载入示例配置':'未选择配置');});
  q('#view_connection_profile').addEventListener('click',()=>{const hidden=!q('#connection_profile_details_content').hidden;q('#connection_profile_details_content').hidden=hidden;q('#view_connection_profile').setAttribute('aria-expanded',String(!hidden));refreshProfileDetails();});
  q('#create_connection_profile').addEventListener('click',()=>{invalidatePendingSample();const index=nextProfile++;const profile={id:`sample-${index}`,name:`本地示例 · 配置 ${index}`,snapshot:captureProfile()};profiles.push(profile);renderProfiles(profile.id);setProfileNote('已创建示例配置');});
  q('#update_connection_profile').addEventListener('click',()=>{const profile=selectedProfile();if(!profile)return;profile.snapshot=captureProfile();setProfileNote('已更新当前示例');refreshProfileDetails();});
  q('#reload_connection_profile').addEventListener('click',()=>applyProfile(selectedProfile()));
  q('#delete_connection_profile').addEventListener('click',()=>{const index=profiles.findIndex(profile=>profile.id===q('#connection_profiles').value);if(index<0)return;const previous=document.activeElement;invalidatePendingSample();profiles.splice(index,1);closeProfileEditor();renderProfiles('');setProfileNote('已删除示例；可恢复');restoreRemovedFocus(previous,q('#connection_profiles'));});
  q('#edit_connection_profile').addEventListener('click',()=>{const profile=selectedProfile();if(!profile)return;openProfileDetails();q('#profile-editor').hidden=false;q('#profile-name').value=profile.name;q('#profile-editor-error').textContent='';q('#profile-name').focus();});
  q('#apply-profile-name').addEventListener('click',()=>{const profile=selectedProfile();if(!profile)return;const name=q('#profile-name').value.trim();if(!name){q('#profile-editor-error').textContent='请输入配置名称。';q('#profile-name').focus();return;}profile.name=name;renderProfiles(profile.id);closeProfileEditor();setProfileNote('名称已更新');q('#edit_connection_profile').focus();});
  q('#cancel-profile-name').addEventListener('click',()=>{closeProfileEditor();q('#edit_connection_profile').focus();});
  q('#profile-name').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();q('#apply-profile-name').click();}else if(event.key==='Escape'){event.preventDefault();q('#cancel-profile-name').click();}});
  document.addEventListener('ef:variant',()=>{if(window.jQuery&&jQuery('#ollama_model').hasClass('select2-hidden-accessible'))jQuery('#ollama_model').select2('close');});
  window.addEventListener('pagehide',()=>{connectionRun++;testRun++;clearTimeout(connectionTimer);clearTimeout(testTimer);});
  resetDemo();
})();
