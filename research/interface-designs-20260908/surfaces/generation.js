(() => {
  'use strict';

  const initialize = () => {
    const profiles = {
      chat: {
        caption: 'Chat · Custom',
        name: '聊天补全 · Custom 样本',
        presetId: 'settings_preset_openai',
        streamingId: 'stream_toggle',
        savesStreaming: true,
        fields: [
          { key: 'context', label: '上下文', longLabel: '完整上下文窗口（Context Size）', unit: 'tokens', id: 'openai_max_context', counter: 'openai_max_context_counter', min: 512, max: 4095, step: 1, group: 'length' },
          { key: 'response', label: '最大响应长度', longLabel: '单次回复的最大响应长度（Max Response Length）', unit: 'tokens', id: 'openai_max_tokens', counter: 'openai_max_tokens', min: 1, max: 128000, step: 1, group: 'length', numberOnly: true },
          { key: 'temperature', label: '温度', longLabel: '温度（Temperature）', id: 'temp_openai', counter: 'temp_counter_openai', min: 0, max: 2, step: 0.01, group: 'sampler' },
          { key: 'frequency', label: '频率惩罚', longLabel: '词频惩罚（Frequency Penalty）', id: 'freq_pen_openai', counter: 'freq_pen_counter_openai', min: -2, max: 2, step: 0.01, group: 'sampler' },
          { key: 'presence', label: '存在惩罚', longLabel: '已出现内容惩罚（Presence Penalty）', id: 'pres_pen_openai', counter: 'pres_pen_counter_openai', min: -2, max: 2, step: 0.01, group: 'sampler' },
          { key: 'topP', label: 'Top P', longLabel: '概率阈值（Top P）', id: 'top_p_openai', counter: 'top_p_counter_openai', min: 0, max: 1, step: 0.01, group: 'sampler' }
        ],
        presets: [
          { id: 'first', name: '基础样例', longName: '基础样例 · 用于检查长名称的聊天补全预设 / 中文与 English', values: { context: 4095, response: 300, temperature: 1, frequency: 0, presence: 0, topP: 1 }, streaming: false },
          { id: 'second', name: '另一份样例', longName: '另一份样例 · 仅供界面比较的较长聊天补全预设名称（本页内存）', values: { context: 3072, response: 768, temperature: 0.8, frequency: 0.2, presence: 0.1, topP: 0.92 }, streaming: true }
        ]
      },
      text: {
        caption: 'Text · Ooba',
        name: '文本补全 · Ooba 样本',
        presetId: 'settings_preset_textgenerationwebui',
        streamingId: 'streaming_textgenerationwebui',
        savesStreaming: false,
        fields: [
          { key: 'response', label: '响应长度', longLabel: '单次回复的响应长度（Response Length）', unit: 'tokens', id: 'amount_gen', counter: 'amount_gen_counter', min: 16, max: 2048, step: 1, group: 'length' },
          { key: 'context', label: '上下文', longLabel: '完整上下文窗口（Context Size）', unit: 'tokens', id: 'max_context', counter: 'max_context_counter', min: 512, max: 8192, step: 64, group: 'length' },
          { key: 'temperature', label: '温度', longLabel: '温度（Temperature）', id: 'temp_textgenerationwebui', counter: 'temp_counter_textgenerationwebui', min: 0, max: 5, step: 0.01, group: 'sampler', neutral: 1 },
          { key: 'topK', label: 'Top K', longLabel: '候选数量（Top K，Ooba 以 0 关闭）', id: 'top_k_textgenerationwebui', counter: 'top_k_counter_textgenerationwebui', min: 0, max: 500, step: 1, group: 'sampler', neutral: 0 },
          { key: 'topP', label: 'Top P', longLabel: '概率阈值（Top P）', id: 'top_p_textgenerationwebui', counter: 'top_p_counter_textgenerationwebui', min: 0, max: 1, step: 0.01, group: 'sampler', neutral: 1 },
          { key: 'repetition', label: '重复惩罚', longLabel: '重复内容惩罚（Repetition Penalty）', id: 'rep_pen_textgenerationwebui', counter: 'rep_pen_counter_textgenerationwebui', min: 1, max: 3, step: 0.01, group: 'sampler', neutral: 1 }
        ],
        presets: [
          { id: 'first', name: '基础样例', longName: '基础样例 · 用于检查长名称的文本补全预设 / 中文与 English', values: { response: 256, context: 8192, temperature: 0.7, topK: 40, topP: 0.5, repetition: 1.2 } },
          { id: 'second', name: '另一份样例', longName: '另一份样例 · 仅供界面比较的较长文本补全预设名称（本页内存）', values: { response: 512, context: 4096, temperature: 1, topK: 0, topP: 1, repetition: 1 } }
        ]
      }
    };
    const sourceSelect = document.querySelector('#generation-source');
    const widthSelect = document.querySelector('#preview-width');
    const heightSelect = document.querySelector('#preview-height');
    const longLabels = document.querySelector('#long-labels');
    const panel = document.querySelector('#left-nav-panel');
    const content = document.querySelector('#generation-content');
    const form = document.querySelector('#generation-form');
    const presetSelect = document.querySelector('.preset-select');
    const presetLabel = document.querySelector('#preset-label');
    const presetFeedback = document.querySelector('#preset-feedback');
    const samplerFeedback = document.querySelector('#sampler-feedback');
    const streamingRow = document.querySelector('#streaming-row');
    const streamingInput = streamingRow.querySelector('input');
    const restoreButton = document.querySelector('#restore-preset');
    const neutralizeButton = document.querySelector('#neutralize-samplers');
    const dialog = document.querySelector('#restore-dialog');
    const dialogForm = document.querySelector('#restore-form');
    const cancelRestore = document.querySelector('#restore-cancel');
    const studyFeedback = document.querySelector('#study-feedback');
    const params = new URLSearchParams(location.search);
    let activeSource = Object.hasOwn(profiles, params.get('source')) ? params.get('source') : 'chat';
    let fieldRefs = new Map();
    let restoreRequest = null;

    const makeStates = () => Object.fromEntries(Object.entries(profiles).map(([key, profile]) => {
      const presets = structuredClone(profile.presets);
      return [key, { selected: presets[0].id, values: { ...presets[0].values }, streaming: profile.savesStreaming ? presets[0].streaming : false, presets, drafts: {}, errors: {} }];
    }));
    let states = makeStates();
    const currentProfile = () => profiles[activeSource];
    const currentState = () => states[activeSource];
    const selectedPreset = () => currentState().presets.find(preset => preset.id === currentState().selected);
    const presetName = preset => longLabels.checked ? preset.longName : preset.name;
    const decimals = field => (String(field.step).split('.')[1] || '').length;
    const formatValue = (field, value) => Number(value).toFixed(decimals(field));
    const setText = (node, value) => { if (node.textContent !== value) node.textContent = value; };
    const node = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };
    const notify = (target, message, state = 'neutral', reveal = false) => {
      target.hidden = false;
      target.dataset.state = state;
      setText(target, message);
      if (reveal) target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    };
    const numericIssue = (field, raw, badInput = false) => {
      if (badInput || String(raw).trim() === '' || !Number.isFinite(Number(raw))) return '请填写数字，范围 ' + field.min + '–' + field.max + '。';
      const value = Number(raw);
      if (value < field.min || value > field.max) return '请输入 ' + field.min + '–' + field.max + ' 之间的数值。';
      const steps = (value - field.min) / field.step;
      if (Math.abs(steps - Math.round(steps)) > 0.0000001) return '请从 ' + field.min + ' 起按 ' + field.step + ' 递增。';
      return '';
    };
    const setFieldError = (ref, message) => {
      const state = states[ref.source];
      if (message) state.errors[ref.field.key] = message;
      else delete state.errors[ref.field.key];
      ref.error.hidden = !message;
      setText(ref.error, message);
      if (message) ref.number.setAttribute('aria-invalid', 'true');
      else ref.number.removeAttribute('aria-invalid');
      ref.number.setCustomValidity(message);
    };
    const hasPendingInput = () => currentProfile().fields.some(field => Object.hasOwn(currentState().drafts, field.key) && numericIssue(field, currentState().drafts[field.key]));
    const updatePresetComparison = () => {
      const state = currentState();
      const preset = selectedPreset();
      const changed = currentProfile().fields.some(field => state.values[field.key] !== preset.values[field.key]) || (currentProfile().savesStreaming && state.streaming !== preset.streaming);
      notify(presetFeedback, hasPendingInput() ? '有输入待修正，更新预设前会先校验。' : changed ? '当前值已调整；更新预设才会覆盖样例。' : '当前参数与已存样例相同。');
    };
    const updateBudget = () => {
      const state = currentState();
      const remaining = state.values.context - state.values.response;
      const lengthPending = currentProfile().fields.filter(field => field.group === 'length').some(field => Object.hasOwn(state.drafts, field.key) && numericIssue(field, state.drafts[field.key]));
      const budget = document.querySelector('#prompt-budget');
      const warning = document.querySelector('#budget-warning');
      setText(budget, remaining > 0 ? new Intl.NumberFormat('zh-CN').format(remaining) + ' tokens' : '无可用预算');
      budget.setAttribute('for', currentProfile().fields.filter(field => field.group === 'length').map(field => field.counter).join(' '));
      setText(document.querySelector('#budget-note'), lengthPending ? '按最近有效长度计算。请先修正长度输入。' : '上下文 − 响应上限；尚未扣除提示词实际占用。');
      warning.hidden = remaining > 0;
      setText(warning, remaining > 0 ? '' : '响应上限已达到或超过上下文。请降低响应上限，或在可用范围内增加上下文。');
    };
    const syncField = ref => {
      const state = states[ref.source];
      ref.number.value = Object.hasOwn(state.drafts, ref.field.key) ? state.drafts[ref.field.key] : formatValue(ref.field, state.values[ref.field.key]);
      if (ref.range) ref.range.value = String(state.values[ref.field.key]);
      setFieldError(ref, state.errors[ref.field.key] || '');
    };
    const editNumber = (ref, commit = false) => {
      if (!ref.row.isConnected || ref.source !== activeSource || ref.composing) return true;
      const state = states[ref.source];
      const raw = ref.number.value;
      state.drafts[ref.field.key] = raw;
      const issue = numericIssue(ref.field, raw, ref.number.validity.badInput);
      if (issue) {
        if (commit || state.errors[ref.field.key]) setFieldError(ref, issue);
      } else {
        state.values[ref.field.key] = Number(raw);
        if (ref.range) ref.range.value = String(Number(raw));
        setFieldError(ref, '');
        if (commit) {
          delete state.drafts[ref.field.key];
          ref.number.value = formatValue(ref.field, state.values[ref.field.key]);
        }
        samplerFeedback.hidden = true;
      }
      updateBudget();
      updatePresetComparison();
      return !issue;
    };
    const validateAll = () => {
      let firstInvalid = null;
      for (const ref of fieldRefs.values()) if (!editNumber(ref, true) && !firstInvalid) firstInvalid = ref;
      if (!firstInvalid) return true;
      notify(presetFeedback, '请先修正标出的数值，再更新样例预设。', 'error');
      firstInvalid.number.focus();
      firstInvalid.row.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      return false;
    };
    const buildField = field => {
      const source = activeSource;
      const row = node('div', 'parameter-row range-block');
      row.dataset.key = field.key;
      const label = node('label', 'parameter-label');
      label.id = 'generation-' + source + '-' + field.key + '-label';
      label.htmlFor = field.counter;
      const labelText = node('span', 'parameter-label-text', longLabels.checked ? field.longLabel : field.label);
      label.append(labelText);
      if (field.unit) label.append(node('span', 'parameter-unit', field.unit));
      const controls = node('div', 'parameter-control' + (field.numberOnly ? ' number-only' : ''));
      const number = node('input', 'parameter-number');
      number.type = 'number';
      number.id = field.counter;
      number.min = String(field.min);
      number.max = String(field.max);
      number.step = String(field.step);
      number.autocomplete = 'off';
      number.spellcheck = false;
      const error = node('p', 'field-error');
      error.id = 'generation-' + source + '-' + field.key + '-error';
      error.setAttribute('role', 'status');
      error.hidden = true;
      number.setAttribute('aria-describedby', error.id);
      let range = null;
      if (!field.numberOnly) {
        range = node('input', 'parameter-slider');
        range.type = 'range';
        range.id = field.id;
        range.min = String(field.min);
        range.max = String(field.max);
        range.step = String(field.step);
        range.setAttribute('aria-labelledby', label.id);
        number.dataset.for = field.id;
        controls.append(range);
      }
      controls.append(number);
      row.append(label, controls, error);
      const ref = { source, field, row, labelText, number, range, error, composing: false };
      fieldRefs.set(field.key, ref);
      number.addEventListener('compositionstart', () => { ref.composing = true; });
      number.addEventListener('compositionend', () => { ref.composing = false; editNumber(ref); });
      number.addEventListener('input', () => editNumber(ref));
      number.addEventListener('change', () => editNumber(ref, true));
      number.addEventListener('blur', () => editNumber(ref, true));
      number.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (event.isComposing || ref.composing || event.keyCode === 229) return;
        editNumber(ref, true);
      });
      range?.addEventListener('input', () => {
        if (!row.isConnected || source !== activeSource) return;
        const value = Number(range.value);
        if (!Number.isFinite(value)) return;
        const state = states[source];
        state.values[field.key] = value;
        delete state.drafts[field.key];
        number.value = formatValue(field, value);
        setFieldError(ref, '');
        samplerFeedback.hidden = true;
        updateBudget();
        updatePresetComparison();
      });
      syncField(ref);
      return row;
    };
    const updatePresetOptions = () => {
      for (const option of presetSelect.options) {
        const preset = currentState().presets.find(item => item.id === option.value);
        if (preset) { option.textContent = presetName(preset); option.title = presetName(preset); }
      }
      presetSelect.title = presetName(selectedPreset());
    };
    const syncValues = () => {
      for (const ref of fieldRefs.values()) syncField(ref);
      streamingInput.checked = currentState().streaming;
      samplerFeedback.hidden = true;
      updateBudget();
      updatePresetComparison();
    };
    const renderProfile = () => {
      const profile = currentProfile();
      const state = currentState();
      const lengthFields = document.querySelector('#length-fields');
      const samplerFields = document.querySelector('#sampler-fields');
      fieldRefs = new Map();
      lengthFields.replaceChildren();
      samplerFields.replaceChildren();
      presetSelect.id = profile.presetId;
      presetLabel.htmlFor = profile.presetId;
      presetSelect.replaceChildren(...state.presets.map(preset => {
        const option = node('option', '', presetName(preset));
        option.value = preset.id;
        return option;
      }));
      presetSelect.value = state.selected;
      streamingInput.id = profile.streamingId;
      streamingRow.htmlFor = profile.streamingId;
      for (const field of profile.fields) {
        const row = buildField(field);
        (field.group === 'length' ? lengthFields : samplerFields).append(row);
        if (activeSource === 'text' && field.key === 'response') lengthFields.append(streamingRow);
      }
      if (activeSource === 'chat') lengthFields.append(streamingRow);
      restoreButton.hidden = activeSource !== 'text';
      neutralizeButton.hidden = activeSource !== 'text';
      setText(document.querySelector('#profile-caption'), profile.caption);
      setText(document.querySelector('#preset-scope'), profile.savesStreaming ? '样例预设包含六项参数与流式开关。' : '样例预设仅保存六项参数；流式开关保持当前值。');
      setText(document.querySelector('#sampler-scope'), activeSource === 'text' ? '中性化只处理下面四项，长度与流式开关保留。' : '这些控件属于 Custom 样本，不代表所有来源。');
      updatePresetOptions();
      syncValues();
    };
    const applyPreset = preset => {
      const state = currentState();
      state.selected = preset.id;
      state.values = { ...preset.values };
      state.drafts = {};
      state.errors = {};
      if (currentProfile().savesStreaming) state.streaming = Boolean(preset.streaming);
      presetSelect.value = state.selected;
      updatePresetOptions();
      syncValues();
    };
    const updateReadout = () => {
      const box = panel.getBoundingClientRect();
      setText(document.querySelector('#panel-size'), Math.round(box.width) + ' × ' + Math.round(box.height) + 'px');
      setText(document.querySelector('#layout-readout'), document.body.dataset.variant === 'b' && panel.clientWidth >= 520 ? '当前：宽面板横向对齐' : '当前：紧凑排列');
    };
    const updateFrame = () => {
      panel.style.setProperty('--preview-width', widthSelect.value + 'px');
      panel.style.setProperty('--preview-height', heightSelect.value + 'px');
      updateReadout();
    };

    form.addEventListener('submit', event => event.preventDefault());
    sourceSelect.addEventListener('change', () => {
      if (!Object.hasOwn(profiles, sourceSelect.value)) return;
      if (dialog.open) dialog.close('context-changed');
      activeSource = sourceSelect.value;
      renderProfile();
      content.scrollTop = 0;
      setText(studyFeedback, '当前显示' + currentProfile().name + '。两种样本的数值分别保留。');
    });
    presetSelect.addEventListener('change', () => {
      const preset = currentState().presets.find(item => item.id === presetSelect.value);
      if (!preset) { presetSelect.value = currentState().selected; return; }
      applyPreset(preset);
      notify(presetFeedback, currentProfile().savesStreaming ? '已载入样例参数与流式开关。' : '已载入六项样例参数；流式开关保持当前值。', 'success', true);
    });
    streamingInput.addEventListener('change', () => {
      currentState().streaming = streamingInput.checked;
      if (currentProfile().savesStreaming) updatePresetComparison();
      else notify(presetFeedback, '流式开关已在本页调整；文本样例预设不保存它。');
    });
    document.querySelector('#update-preset').addEventListener('click', () => {
      if (!validateAll()) return;
      const preset = selectedPreset();
      preset.values = { ...currentState().values };
      if (currentProfile().savesStreaming) preset.streaming = currentState().streaming;
      notify(presetFeedback, '当前样例预设已更新；刷新页面会还原。', 'success', true);
    });
    restoreButton.addEventListener('click', () => {
      if (activeSource !== 'text' || dialog.open) return;
      restoreRequest = { source: activeSource, presetId: currentState().selected, trigger: restoreButton };
      setText(document.querySelector('#restore-title'), '恢复「' + presetName(selectedPreset()) + '」的已存参数？');
      setText(document.querySelector('#restore-description'), '重新载入这份样例上次保存的六项参数。流式开关保留当前值。');
      dialog.showModal();
      dialog.querySelector('.restore-copy').scrollTop = 0;
      cancelRestore.focus();
    });
    cancelRestore.addEventListener('click', () => dialog.close('cancelled'));
    dialog.addEventListener('cancel', () => { dialog.returnValue = 'cancelled'; });
    dialogForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!restoreRequest || restoreRequest.source !== activeSource || restoreRequest.presetId !== currentState().selected) { dialog.close('context-changed'); return; }
      applyPreset(selectedPreset());
      dialog.close('restored');
    });
    dialog.addEventListener('close', () => {
      const request = restoreRequest;
      restoreRequest = null;
      if (!request || dialog.returnValue === 'context-changed' || dialog.returnValue === 'reset') return;
      const target = request.source === activeSource && request.trigger.isConnected && !request.trigger.hidden ? request.trigger : sourceSelect;
      target.focus();
      if (dialog.returnValue === 'restored') notify(presetFeedback, '已恢复上次保存的六项样例参数；流式开关保持当前值。', 'success', true);
      else notify(presetFeedback, '已取消恢复，当前样例数值保留。', 'neutral', true);
    });
    neutralizeButton.addEventListener('click', () => {
      if (activeSource !== 'text') return;
      const state = currentState();
      for (const field of currentProfile().fields.filter(item => item.group === 'sampler')) {
        state.values[field.key] = field.neutral;
        delete state.drafts[field.key];
        delete state.errors[field.key];
        syncField(fieldRefs.get(field.key));
      }
      updatePresetComparison();
      notify(samplerFeedback, '四项采样已中性化；长度和流式开关保留。', 'success', true);
    });
    longLabels.addEventListener('change', () => {
      for (const ref of fieldRefs.values()) ref.labelText.textContent = longLabels.checked ? ref.field.longLabel : ref.field.label;
      updatePresetOptions();
      setText(studyFeedback, longLabels.checked ? '已启用长标签与长预设名样本。' : '已恢复短标签与短预设名。');
    });
    document.querySelector('#reset-demo').addEventListener('click', () => {
      if (dialog.open) dialog.close('reset');
      states = makeStates();
      renderProfile();
      content.scrollTop = 0;
      setText(studyFeedback, '两种样例的参数与预设已重置。');
    });
    widthSelect.addEventListener('change', updateFrame);
    heightSelect.addEventListener('change', updateFrame);
    document.addEventListener('ef:variant', updateReadout);
    new ResizeObserver(updateReadout).observe(panel);
    sourceSelect.value = activeSource;
    for (const [control, key] of [[widthSelect, 'width'], [heightSelect, 'height']]) {
      if ([...control.options].some(option => option.value === params.get(key))) control.value = params.get(key);
    }
    longLabels.checked = params.get('long') === '1';
    renderProfile();
    updateFrame();
    setText(studyFeedback, '当前显示' + currentProfile().name + '。');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
