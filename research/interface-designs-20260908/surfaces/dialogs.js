(() => {
  'use strict';

  const initialize = () => {
    const dialog = document.querySelector('#operation-dialog');
    const form = document.querySelector('#dialog-form');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const icon = document.querySelector('#dialog-icon');
    const description = document.querySelector('#dialog-description');
    const fields = document.querySelector('#dialog-fields');
    const error = document.querySelector('#dialog-error');
    const content = document.querySelector('#dialog-content');
    const reading = document.querySelector('#dialog-reading');
    const cancelButton = document.querySelector('#dialog-cancel');
    const primaryButton = document.querySelector('#dialog-primary');
    const cancelLabel = cancelButton.querySelector('.dialog-button-label');
    const primaryLabel = primaryButton.querySelector('.dialog-button-label');
    const footerNote = document.querySelector('#dialog-footer-note');
    const feedback = document.querySelector('#session-feedback');
    const initialName = '谷地见闻 · 雨夜巡检';
    const state = { name: initialName, deleted: false, copied: false, read: false, selected: new Set(['messages', 'characters']) };
    const optionData = [
      { id: 'messages', title: '聊天正文', detail: '保留完整消息顺序与说话者。' },
      { id: 'characters', title: '角色名称', detail: '在每段消息之前显示角色名。' },
      { id: 'timestamps', title: '消息时间', detail: '包含已有的发送时间；缺失时保持空白。' },
      { id: 'notes', title: '作者注释与补充说明', detail: '保留本次聊天中用于辅助阅读的文字。' },
      { id: 'metadata', title: '模型与生成参数等较长的附加信息', detail: '适合归档检查；普通阅读时可以不包含。' }
    ];
    const scenarios = {
      confirm: { title: '保存聊天副本', category: '操作确认', icon: 'fa-solid fa-copy', description: '为这段聊天保留一份副本，方便之后继续不同的故事。', primary: '保存副本' },
      delete: { title: '删除这条聊天？', category: '删除确认', icon: 'fa-solid fa-trash-can', description: '请确认需要删除的聊天记录。', primary: '删除示例记录' },
      rename: { title: '重命名聊天', category: '编辑档案', icon: 'fa-solid fa-pen', description: '换一个更容易辨认的名字。聊天内容保持不变。', primary: '保存名称' },
      long: { title: '聊天归档说明', category: '阅读说明', icon: 'fa-solid fa-file-lines', description: '归档之前，可以先查看内容范围与整理方式。', primary: '标记为已读', cancel: '稍后阅读' },
      options: { title: '选择导出内容', category: '归档选项', icon: 'fa-solid fa-list-check', description: '选择需要保留的内容。至少选择一项，关闭前的调整会在本次确认后生效。', primary: '应用选项' },
      error: { title: '暂时无法读取档案', category: '操作未完成', icon: 'fa-solid fa-circle-exclamation', description: '这次读取没有完成。当前编辑内容已保留，可以重新尝试。', primary: '重新尝试', cancel: '稍后再试' },
      notice: { title: '副本已准备好', category: '操作完成', icon: 'fa-solid fa-circle-check', description: '示例副本已保存在本页状态中，可以继续查看或整理记录。', primary: '知道了', single: true }
    };
    let currentScenario = 'confirm';
    let returnFocus = null;
    let composing = false;
    const confirmationScenarios = new Set(['confirm', 'delete']);
    const isConfirmationBand = () => document.body.dataset.variant === 'c';
    const defaultFeedback = '可以保存副本、重命名或删除这条示例记录。';
    const bandFeedback = '可以保存副本或删除这条示例记录。';

    const element = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const showFeedback = message => {
      feedback.textContent = message;
      window.EF?.toast(message);
    };
    const renderSample = () => {
      document.querySelector('#record-name').textContent = state.name;
      document.querySelector('#sample-record').hidden = state.deleted;
      document.querySelector('#sample-empty').hidden = !state.deleted;
      document.querySelector('#record-status').textContent = state.copied ? '已为当前示例保存副本' : '保存在当前示例中';
      document.querySelector('#selected-summary').textContent = optionData.filter(option => state.selected.has(option.id)).map(option => option.title).join('、');
    };
    const subject = () => {
      const node = element('div', 'record-subject');
      node.append(element('strong', '', state.name), element('small', '', '24 条消息 · 本页示例记录'));
      return node;
    };
    const renderConfirmation = () => {
      const config = scenarios[currentScenario];
      const band = isConfirmationBand();
      const deleting = currentScenario === 'delete';
      fields.replaceChildren();
      title.textContent = band ? (deleting ? `是否删除「${state.name}」？` : `是否为「${state.name}」保存副本？`) : config.title;
      description.textContent = band ? (deleting ? '删除后从本页列表移除，可用“恢复示例”还原。' : '副本仅保存在本页示例中。') : config.description;
      primaryLabel.textContent = band && deleting ? '确认删除' : config.primary;
      primaryButton.disabled = deleting && state.deleted;
      if (!band) {
        fields.append(subject());
        if (deleting) fields.append(element('p', 'consequence-note', '确认后，这条记录会从本页示例列表移除。可用“恢复示例”重新查看，不涉及真实聊天。'));
      }
      if (deleting && state.deleted) description.textContent = band ? '这条示例记录已删除，可用“恢复示例”还原。' : '这条示例记录已经删除。关闭弹窗后，可点击“恢复示例”继续试用。';
    };
    const clearError = () => {
      error.hidden = true;
      error.textContent = '';
      fields.querySelector('[aria-invalid]')?.removeAttribute('aria-invalid');
    };
    const showError = (message, target) => {
      error.textContent = message;
      error.hidden = false;
      if (target) {
        target.setAttribute('aria-invalid', 'true');
        if (target.tagName === 'FIELDSET') error.focus();
        else target.focus();
      }
    };
    const appendRename = () => {
      const label = element('label', 'field-label', '聊天名称');
      label.htmlFor = 'rename-input';
      const input = element('input', 'rename-field');
      input.id = 'rename-input';
      input.name = 'chatName';
      input.type = 'text';
      input.value = state.name;
      input.autocomplete = 'off';
      input.setAttribute('aria-describedby', 'rename-hint dialog-error');
      const hint = element('p', 'input-hint');
      hint.id = 'rename-hint';
      const hintText = element('span', '', '最多 60 个字符；不使用 / \\ : * ? " < > |');
      const counter = element('span', '', `${[...input.value].length} / 60`);
      hint.append(hintText, counter);
      input.addEventListener('input', () => { counter.textContent = `${[...input.value].length} / 60`; clearError(); });
      input.addEventListener('compositionstart', () => { composing = true; });
      input.addEventListener('compositionend', () => { composing = false; });
      input.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.isComposing || composing)) event.preventDefault(); });
      fields.append(label, input, hint);
    };
    const selectedInputs = () => [...fields.querySelectorAll('input[name="exportOption"]:checked')];
    const appendOptions = () => {
      const summary = element('div', 'option-summary');
      const count = element('span');
      count.id = 'option-count';
      count.setAttribute('aria-live', 'polite');
      const toggle = element('button', 'text-action');
      toggle.type = 'button';
      const group = element('fieldset', 'export-options');
      group.setAttribute('aria-describedby', 'dialog-error');
      group.append(element('legend', 'sr-only', '导出内容，可多选'));
      const update = () => {
        count.textContent = `已选择 ${selectedInputs().length} 项`;
        toggle.textContent = selectedInputs().length === optionData.length ? '清空选择' : '全部选择';
        clearError();
      };
      for (const option of optionData) {
        const row = element('label', 'export-choice');
        const checkbox = element('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'exportOption';
        checkbox.value = option.id;
        checkbox.checked = state.selected.has(option.id);
        checkbox.addEventListener('change', update);
        const text = element('span');
        text.append(element('strong', '', option.title), element('small', '', option.detail));
        row.append(checkbox, text);
        group.append(row);
      }
      toggle.addEventListener('click', () => {
        const select = selectedInputs().length !== optionData.length;
        for (const input of group.querySelectorAll('input')) input.checked = select;
        update();
      });
      summary.append(count, toggle);
      fields.append(summary, group);
      update();
    };
    const appendLongDocument = () => {
      const toolbar = element('div', 'reading-toolbar');
      toolbar.append(element('span', '', state.read ? '这份说明已读' : '正文可独立滚动'));
      const jump = element('button', '', '跳至末尾');
      jump.type = 'button';
      toolbar.append(jump);
      const documentNode = element('article', 'reading-document');
      const sections = [
        ['保留对话的原有顺序', '归档按消息在聊天中的先后顺序排列。角色的回复、你的输入和后续补充会留在原来的位置，便于重新理解当时的语境。', '如果一段聊天包含多次分支，请先确认正在整理的是哪一个版本。单独保存副本，可以让不同走向都有一个清楚的起点。'],
        ['为记录起一个具体的名字', '名字可以包含场景、日期或这一段故事的主要内容，例如“谷地见闻 · 雨夜巡检”。清楚的名称比一串连续编号更容易寻找。', '重命名只调整档案名称。它不会替换角色名，也不会改写正文中已经出现的内容。'],
        ['按用途选择附加内容', '准备阅读时，聊天正文与角色名称通常已经足够。需要排查生成过程时，再加入时间、模型和生成参数等信息。', '导出选项并不等于将所有内容都公开。分享之前仍应检查具体文件中包含了哪些文字，选择适合当前用途的范围。'],
        ['长段内容保持可读', '保留自然段和消息之间的边界，比把所有文字压缩在同一个信息框里更清楚。此处的长正文样本专门用于检查滚动区域。', '无论内容有多少，窗口底部的“稍后阅读”和“标记为已读”都应能够到达。滚动正文不应拖走标题或主要操作。'],
        ['整理完成之后', '再次检查聊天名称、消息顺序和所选附加信息。若发现不需要的选项，可以返回并调整，无需重新建立所有内容。', '本页所有行为都作用于示例状态。关闭或重新加载页面后，不会修改任何真实聊天、角色卡或账号中的数据。']
      ];
      for (const [heading, ...paragraphs] of sections) {
        const section = element('section');
        section.append(element('h3', '', heading));
        for (const paragraph of paragraphs) section.append(element('p', '', paragraph));
        documentNode.append(section);
      }
      const end = element('span', 'reading-end', '说明结束');
      end.tabIndex = -1;
      documentNode.append(end);
      jump.addEventListener('click', () => { end.scrollIntoView({ block: 'end' }); end.focus({ preventScroll: true }); });
      fields.append(toolbar, documentNode);
    };
    const openScenario = (scenario, trigger) => {
      if (!Object.hasOwn(scenarios, scenario)) return;
      if (isConfirmationBand() && !confirmationScenarios.has(scenario)) {
        showFeedback('C 只比较短确认；表单和长内容请切换 A/B。');
        return;
      }
      if (dialog.open) dialog.close('switch');
      currentScenario = scenario;
      composing = false;
      returnFocus = trigger || document.querySelector(`[data-scenario="${scenario}"]`);
      const config = scenarios[scenario];
      dialog.classList.toggle('scenario-danger', scenario === 'delete');
      dialog.classList.toggle('scenario-error', scenario === 'error');
      dialog.dataset.scenario = scenario;
      title.textContent = config.title;
      category.textContent = config.category;
      icon.className = config.icon;
      description.textContent = config.description;
      primaryLabel.textContent = config.primary;
      primaryButton.disabled = false;
      cancelLabel.textContent = config.cancel || '取消';
      cancelButton.hidden = Boolean(config.single);
      footerNote.textContent = scenario === 'long' ? '说明 / 5 节' : '仅修改示例';
      fields.replaceChildren();
      clearError();
      content.tabIndex = isConfirmationBand() ? -1 : 0;

      if (confirmationScenarios.has(scenario)) renderConfirmation();
      if (scenario === 'rename') appendRename();
      if (scenario === 'options') appendOptions();
      if (scenario === 'long') appendLongDocument();
      if (scenario === 'error') fields.append(element('div', 'error-details', '示例原因：读取连接暂时中断。重新尝试将模拟一次成功读取，不会访问网络。'));
      if (scenario === 'notice') {
        const list = element('dl', 'notice-details');
        list.append(element('dt', '', '聊天名称'), element('dd', '', state.name), element('dt', '', '保存位置'), element('dd', '', '本页示例状态'), element('dt', '', '真实数据'), element('dd', '', '未读取或修改'));
        fields.append(list);
      }
      dialog.returnValue = '';
      dialog.showModal();
      content.scrollTop = 0;
      reading.scrollTop = 0;
      if (scenario === 'rename') {
        const input = fields.querySelector('input');
        input.focus();
        input.select();
      } else if (scenario === 'delete' || scenario === 'long') cancelButton.focus();
      else if (scenario === 'options') fields.querySelector('input').focus();
      else primaryButton.focus();
    };

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (composing) return;
      if (currentScenario === 'rename') {
        const input = fields.querySelector('#rename-input');
        const value = input.value.trim();
        if (!value) return showError('请填写一个聊天名称，名称不能只有空格。', input);
        if ([...value].length > 60) return showError('名称过长。请缩短至 60 个字符以内。', input);
        if (/[\\/:*?"<>|]/u.test(value)) return showError('名称中不能包含 / \\ : * ? " < > |，请替换后再保存。', input);
        state.name = value;
        showFeedback(`示例名称已改为“${value}”。`);
      } else if (currentScenario === 'options') {
        const chosen = selectedInputs();
        if (!chosen.length) return showError('请至少选择一项需要导出的内容。', fields.querySelector('fieldset'));
        state.selected = new Set(chosen.map(input => input.value));
        showFeedback(`已应用 ${state.selected.size} 项导出内容，仅用于本页示例。`);
      } else if (currentScenario === 'confirm') {
        state.copied = true;
        showFeedback('已为当前示例保存一份聊天副本。');
      } else if (currentScenario === 'delete') {
        if (state.deleted) return;
        state.deleted = true;
        showFeedback('示例记录已删除。可以随时恢复。');
      } else if (currentScenario === 'long') {
        state.read = true;
        showFeedback('归档说明已标记为已读。');
      } else if (currentScenario === 'error') {
        showFeedback('模拟重试成功，示例档案现在可以读取。');
      } else showFeedback('已关闭完成通知。');
      renderSample();
      dialog.close('confirmed');
    });

    const close = () => dialog.close('cancelled');
    const syncVariantScope = () => {
      const band = isConfirmationBand();
      if ([defaultFeedback, bandFeedback].includes(feedback.textContent)) feedback.textContent = band ? bandFeedback : defaultFeedback;
      if (!dialog.open) return;
      if (band && !confirmationScenarios.has(currentScenario)) {
        returnFocus = document.querySelector('.variant-picker [data-variant="c"]');
        dialog.close('scope-changed');
        feedback.textContent = 'C 只比较短确认；表单和长内容请切换 A/B。';
        return;
      }
      content.tabIndex = band ? -1 : 0;
      if (confirmationScenarios.has(currentScenario)) renderConfirmation();
    };
    document.addEventListener('ef:variant', syncVariantScope);
    document.querySelector('#dialog-close').addEventListener('click', close);
    cancelButton.addEventListener('click', close);
    dialog.addEventListener('cancel', () => { dialog.returnValue = 'cancelled'; });
    dialog.addEventListener('close', () => {
      composing = false;
      if (dialog.returnValue === 'cancelled') feedback.textContent = '已取消本次操作，示例内容保持不变。';
      if (dialog.returnValue === 'switch') return;
      const fallback = document.querySelector(`.scenario-grid [data-scenario="${currentScenario}"]`);
      const target = returnFocus?.isConnected && !returnFocus.closest('[hidden]') ? returnFocus : fallback;
      target?.focus({ preventScroll: true });
    });
    for (const trigger of document.querySelectorAll('[data-scenario]')) trigger.addEventListener('click', () => openScenario(trigger.dataset.scenario, trigger));
    const restore = event => {
      const fromEmptyState = event.currentTarget.hasAttribute('data-restore');
      state.name = initialName;
      state.deleted = false;
      state.copied = false;
      state.read = false;
      state.selected = new Set(['messages', 'characters']);
      renderSample();
      if (fromEmptyState) document.querySelector(`#sample-record [data-scenario="${isConfirmationBand() ? 'delete' : 'rename'}"]`).focus({ preventScroll: true });
      showFeedback('示例记录和选项已恢复。');
    };
    document.querySelector('#restore-demo').addEventListener('click', restore);
    for (const button of document.querySelectorAll('[data-restore]')) button.addEventListener('click', restore);
    document.querySelector('#short-height').addEventListener('change', event => document.body.classList.toggle('short-dialog', event.target.checked));
    renderSample();
    syncVariantScope();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
