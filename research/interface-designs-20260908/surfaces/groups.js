(() => {
  'use strict';

  const initialize = () => {
    const catalog = [
      { id: 'member-north', name: '林岚', longName: '林岚 · 折光观测站联合值守成员', detail: '地表测绘员 · 北区班组', initial: '林', tone: '#c8ceba', shape: 'a' },
      { id: 'member-archive', name: '林岚', longName: '林岚 · 折光观测站联合值守成员', detail: '档案校对员 · 白塔工作室', initial: '林', tone: '#c2cbd0', shape: 'b' },
      { id: 'member-night', name: '北方联合观测站夜航值守员·折枝', longName: '北方联合观测站夜航与极端天气联合值守员·折枝 / Night Shift', detail: '夜航记录员 · 第七观测点', initial: '折', tone: '#d2c8bd', shape: 'c' },
      { id: 'member-river', name: '闻溪', longName: '闻溪 · 河道采样与环境观测协作组', detail: '水文采样员 · 河岸工作站', initial: '闻', tone: '#bfd0c8', shape: 'a' },
      { id: 'member-radio', name: '沈迟', longName: '沈迟 · 山间中继台晚班通信联络员', detail: '通信联络员 · 山间中继台', initial: '沈', tone: '#c8c3d0', shape: 'b' },
      { id: 'member-garden', name: '白芷', longName: '白芷 · 温室植物样本与生长记录保管员', detail: '样本保管员 · 东侧温室', initial: '白', tone: '#d1d0ba', shape: 'c' },
      { id: 'member-cloud', name: '洛羽', longName: '洛羽 · 云层观察与气象仪器维护协作员', detail: '气象观察员 · 高台值守点', initial: '洛', tone: '#bec8d2', shape: 'a' },
      { id: 'member-workshop', name: '陆青', longName: '陆青 · 远行装备检修与补给记录负责人', detail: '装备检修员 · 西侧工坊', initial: '陆', tone: '#d1c4bd', shape: 'b' }
    ];
    const byId = new Map(catalog.map(member => [member.id, member]));
    const strategyNames = { '0': 'Natural', '1': 'List', '2': 'Manual', '3': 'Pooled' };
    const strategyHelp = {
      '0': '结合名称提及与话痨度选择，可能多人回复；无人入选时有随机兜底。本页不运行选择算法。',
      '1': '启用成员按完整名单顺序依次回复。本页只保存策略，不调用模型。',
      '2': '有用户输入时不自动选人；无用户输入的触发仍可随机选一位。本页不触发生成。',
      '3': '优先从上次用户发言后还没说过话的人中随机选一位。本页不运行抽取。'
    };
    const generationHelp = {
      '0': '每次使用当前发言成员的角色卡。本页只保存选择，不读取或处理真实角色卡。',
      '1': '拼接时排除停用成员的卡片内容；本页只保存选择，不执行真实拼接。',
      '2': '停用成员的卡片内容也可参与拼接，这不会启用其自动回复。本页不执行真实拼接。'
    };
    const actionSpecs = {
      disable: { text: '暂停', label: '暂停自动回复' },
      enable: { text: '启用', label: '启用自动回复' },
      speak: { text: '发言', label: '让此成员发言' },
      add: { text: '加入', label: '加入群组' },
      up: { icon: 'fa-arrow-up', label: '上移' },
      down: { icon: 'fa-arrow-down', label: '下移' },
      view: { icon: 'fa-address-card', label: '查看角色卡' },
      remove: { icon: 'fa-xmark', label: '移出群组' },
      more: { icon: 'fa-ellipsis', label: '更多成员操作' }
    };
    const secondaryActions = ['up', 'down', 'view', 'remove'];
    const query = new URLSearchParams(location.search);
    const get = id => document.getElementById(id);
    const modeControl = get('group-mode');
    const widthControl = get('preview-width');
    const heightControl = get('preview-height');
    const longControl = get('long-labels');
    const busyControl = get('generation-fixture');
    const panel = get('right-nav-panel');
    const content = get('rm_group_chats_block');
    const sectionsRoot = get('group-sections');
    const sections = {
      controls: get('group-controls-section'),
      members: get('group-members-section'),
      candidates: get('group-candidates-section')
    };
    const nameInput = get('rm_group_chat_name');
    const strategyInput = get('rm_group_activation_strategy');
    const generationInput = get('rm_group_generation_mode');
    const selfInput = get('rm_group_allow_self_responses');
    const autoInput = get('rm_group_automode');
    const delayInput = get('rm_group_automode_delay');
    const createButton = get('rm_group_submit');
    const deleteButton = get('rm_group_delete');
    const dialog = get('group-delete-dialog');
    const deleteCancel = get('group-delete-cancel');
    const restoreExample = get('restore-example');
    const lists = {
      members: {
        node: get('rm_group_members'), search: get('rm_group_members_filter'), clear: get('clear-members-search'),
        prev: get('members-prev'), next: get('members-next'), size: get('members-page-size'), info: get('members-page-info'),
        count: get('members-count'), empty: get('members-empty'), emptyText: get('members-empty-text'), emptyAction: get('members-empty-action')
      },
      candidates: {
        node: get('rm_group_add_members'), search: get('rm_group_filter'), clear: get('clear-candidates-search'),
        prev: get('candidates-prev'), next: get('candidates-next'), size: get('candidates-page-size'), info: get('candidates-page-info'),
        count: get('candidates-count'), empty: get('candidates-empty'), emptyText: get('candidates-empty-text'), emptyAction: get('candidates-empty-action')
      }
    };
    const makeListState = () => ({ search: '', page: 1, size: 5, feedback: '', feedbackId: null });
    const makeState = mode => ({
      created: mode === 'existing', deleted: false,
      name: mode === 'existing' ? '折光观测站 · 协作组' : '',
      members: mode === 'existing' ? catalog.slice(0, 6).map(member => member.id) : [],
      disabled: mode === 'existing' ? ['member-archive'] : [],
      strategy: '0', generationMode: '0', allowSelf: false, autoMode: false,
      delay: 5, delayDraft: '5', delayError: '',
      details: { controls: mode === 'new', members: true, candidates: mode === 'new' },
      lists: { members: makeListState(), candidates: makeListState() },
      feedback: mode === 'existing' ? '已有样例的修改直接保留在本页内存。' : '先加入成员，再创建这份本地样例。'
    });
    let states = { existing: makeState('existing'), new: makeState('new') };
    let activeMode = query.get('mode') === 'new' ? 'new' : 'existing';
    let renderedRows = { members: new Map(), candidates: new Map() };
    let openMenu = null;
    let deleteRequest = null;
    const currentState = () => states[activeMode];
    const isVariantB = () => document.body.dataset.variant === 'b';
    const displayName = member => longControl.checked ? member.longName : member.name;
    const identity = member => displayName(member) + '（' + member.detail + '）';
    const feedbackName = member => member.name + (catalog.some(other => other.id !== member.id && other.name === member.name)
      ? '（' + member.detail.split(' · ')[0] + '）' : '');
    const setText = (element, value) => { if (element.textContent !== value) element.textContent = value; };
    const makeNode = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };
    const normalize = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim();
    const listIds = kind => kind === 'members' ? currentState().members.slice() : catalog.filter(member => !currentState().members.includes(member.id)).map(member => member.id);
    const filteredIds = kind => {
      const needle = normalize(currentState().lists[kind].search);
      return listIds(kind).filter(id => {
        const member = byId.get(id);
        return !needle || normalize(member.name + ' ' + displayName(member) + ' ' + member.detail).includes(needle);
      });
    };
    const isElementAvailable = element => {
      if (!(element instanceof HTMLElement) || !element.isConnected || element.hidden || element.disabled || element.closest('[hidden]')) return false;
      let ancestor = element.parentElement;
      while (ancestor) {
        if (ancestor instanceof HTMLDetailsElement && !ancestor.open && !ancestor.querySelector(':scope > summary')?.contains(element)) return false;
        ancestor = ancestor.parentElement;
      }
      return true;
    };
    const focusTarget = (element, reveal = true) => {
      if (!isElementAvailable(element)) return false;
      element.focus({ preventScroll: true });
      if (reveal) element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      return document.activeElement === element;
    };
    const captureFocus = (element = document.activeElement) => {
      if (!(element instanceof HTMLElement)) return null;
      const row = element.closest('.group-member');
      if (row) {
        const kind = row.dataset.list;
        const id = row.dataset.memberId;
        return { kind: 'row', list: kind, id, action: element.closest('button[data-action]')?.dataset.action || null,
          index: filteredIds(kind).indexOf(id), wasMenu: !!element.closest('.member-menu') };
      }
      if (element.id && (sectionsRoot.contains(element) || element === restoreExample)) {
        const token = { kind: 'static', id: element.id };
        if (element instanceof HTMLInputElement && ['text', 'search'].includes(element.type)) {
          token.selection = [element.selectionStart, element.selectionEnd];
        }
        return token;
      }
      return null;
    };
    const planRowFocus = token => {
      if (!token || token.kind !== 'row') return token;
      const ids = filteredIds(token.list);
      if (!ids.length) return { kind: 'static', id: lists[token.list].search.id };
      const targetId = ids.includes(token.id) ? token.id : ids[Math.max(0, Math.min(token.index, ids.length - 1))];
      const state = currentState().lists[token.list];
      state.page = Math.floor(ids.indexOf(targetId) / state.size) + 1;
      return { ...token, id: targetId };
    };
    const closeMenu = ({ restoreFocus = false } = {}) => {
      if (!openMenu) return;
      const { list, id } = openMenu;
      const row = renderedRows[list].get(id);
      const menu = row?.querySelector('.member-menu');
      const trigger = row?.querySelector('[data-action="more"]');
      if (menu) { menu.hidden = true; for (const item of menu.querySelectorAll('button')) item.tabIndex = -1; }
      trigger?.setAttribute('aria-expanded', 'false');
      openMenu = null;
      if (restoreFocus) focusTarget(trigger);
    };
    const openMemberMenu = (kind, id, { action = null, last = false, focus = true } = {}) => {
      const row = renderedRows[kind].get(id);
      const menu = row?.querySelector('.member-menu');
      const trigger = row?.querySelector('[data-action="more"]');
      if (!menu || !trigger) return null;
      closeMenu();
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      openMenu = { list: kind, id };
      const enabled = [...menu.querySelectorAll('button')].filter(button => !button.disabled);
      let target = action ? enabled.find(button => button.dataset.action === action) : null;
      if (!target && action === 'up') target = enabled.find(button => button.dataset.action === 'down');
      if (!target && action === 'down') target = enabled.find(button => button.dataset.action === 'up');
      target ||= last ? enabled.at(-1) : enabled[0];
      for (const button of menu.querySelectorAll('button')) button.tabIndex = button === target ? 0 : -1;
      if (focus && target) focusTarget(target);
      return target || trigger;
    };
    const restoreFocus = (token, { allowMenu = true, reveal = true } = {}) => {
      if (!token) return null;
      if (currentState().deleted) { focusTarget(restoreExample, reveal); return restoreExample; }
      if (token.kind === 'static') {
        let target = get(token.id);
        if (!isElementAvailable(target)) target = get('groupControlsToggle');
        if (focusTarget(target, reveal) && token.selection && target instanceof HTMLInputElement) {
          target.setSelectionRange(...token.selection);
        }
        return target;
      }
      const row = renderedRows[token.list].get(token.id);
      if (!row) { focusTarget(lists[token.list].search, reveal); return lists[token.list].search; }
      if (token.list === 'members' && isVariantB() && secondaryActions.includes(token.action)) {
        if (allowMenu && token.wasMenu) return openMemberMenu(token.list, token.id, { action: token.action });
        const more = row.querySelector('[data-action="more"]');
        focusTarget(more, reveal);
        return more;
      }
      const directButtons = [...row.querySelectorAll('.member-actions > button')];
      let target = directButtons.find(button => button.dataset.action === token.action && !button.disabled);
      const alternative = { up: 'down', down: 'up', disable: 'enable', enable: 'disable', more: 'view' }[token.action];
      target ||= directButtons.find(button => button.dataset.action === alternative && !button.disabled);
      target ||= directButtons.find(button => !button.disabled);
      if (!target) target = lists[token.list].search;
      focusTarget(target, reveal);
      return target;
    };

    for (const [kind, controls] of Object.entries(lists)) {
      controls.feedback = makeNode('p', 'list-feedback');
      controls.feedback.id = kind + '-operation-feedback';
      controls.feedback.setAttribute('role', 'status');
      controls.feedback.hidden = true;
      controls.node.before(controls.feedback);
    }
    const placeListFeedback = (kind, preferredId = null) => {
      const state = currentState().lists[kind];
      const controls = lists[kind];
      const row = renderedRows[kind].get(preferredId || state.feedbackId);
      if (row) row.append(controls.feedback);
      else controls.node.before(controls.feedback);
      controls.feedback.hidden = !state.feedback;
      setText(controls.feedback, state.feedback);
      return controls.feedback;
    };
    // Reveal local feedback only if the focused action can remain visible too.
    const revealFeedbackNearFocus = (feedback, target) => {
      if (!feedback || feedback.hidden || !isElementAvailable(target) || !content.contains(target)) return;
      const viewport = content.getBoundingClientRect();
      const messageBox = feedback.getBoundingClientRect();
      const targetBox = target.getBoundingClientRect();
      const top = viewport.top + 10;
      const bottom = viewport.bottom - 10;
      let delta = 0;
      if (messageBox.bottom > bottom) delta = messageBox.bottom - bottom;
      else if (messageBox.top < top) delta = messageBox.top - top;
      if (targetBox.top - delta >= top && targetBox.bottom - delta <= bottom) content.scrollTop += delta;
    };
    const notifyGroup = (message, target = null) => {
      currentState().feedback = message;
      setText(get('group-feedback'), message);
      if (target) revealFeedbackNearFocus(get('group-feedback'), target);
    };
    const notifyList = (kind, message, target = null) => {
      const state = currentState().lists[kind];
      state.feedback = message;
      state.feedbackId = target?.closest('.group-member')?.dataset.memberId || null;
      const feedback = placeListFeedback(kind, state.feedbackId);
      revealFeedbackNearFocus(feedback, target);
    };
    const makeActionButton = (action, member, kind, menuItem = false) => {
      const spec = actionSpecs[action];
      const button = makeNode('button', 'member-action');
      button.type = 'button';
      button.dataset.action = action;
      button.setAttribute('aria-label', spec.label + '：' + identity(member));
      button.title = spec.label + '：' + identity(member);
      if (spec.icon) {
        const icon = makeNode('i', 'fa-solid ' + spec.icon);
        icon.setAttribute('aria-hidden', 'true');
        button.append(icon);
      }
      button.append(makeNode('span', !menuItem && spec.icon ? 'sr-only' : '', menuItem ? spec.label : spec.text || spec.label));
      const index = currentState().members.indexOf(member.id);
      button.disabled = (action === 'up' && index <= 0) || (action === 'down' && index === currentState().members.length - 1) || (action === 'view' && busyControl.checked);
      if (action === 'view' && busyControl.checked) button.title = '生成中样例：暂不可查看角色卡。';
      if (menuItem) { button.setAttribute('role', 'menuitem'); button.tabIndex = -1; }
      if (action === 'more') {
        button.id = 'member-more-' + activeMode + '-' + member.id;
        button.setAttribute('aria-haspopup', 'menu');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'member-menu-' + activeMode + '-' + member.id);
      }
      return button;
    };
    const buildMemberRow = (id, kind) => {
      const member = byId.get(id);
      const state = currentState();
      const isMember = kind === 'members';
      const paused = state.disabled.includes(id);
      const row = makeNode('div', 'group-member');
      row.dataset.memberId = id;
      row.dataset.list = kind;
      row.dataset.paused = String(paused);
      row.classList.toggle('disabled', isMember && paused);
      row.setAttribute('role', 'listitem');
      const labelId = 'member-name-' + activeMode + '-' + id;
      const detailId = 'member-detail-' + activeMode + '-' + id;
      const statusId = 'member-status-' + activeMode + '-' + id;
      row.setAttribute('aria-labelledby', labelId);
      row.setAttribute('aria-describedby', detailId + ' ' + statusId);
      const identityBlock = makeNode('div', 'member-identity');
      const avatar = makeNode('span', 'member-avatar', member.initial);
      avatar.setAttribute('aria-hidden', 'true');
      avatar.dataset.shape = member.shape;
      avatar.style.setProperty('--avatar-tone', member.tone);
      const copy = makeNode('div', 'member-copy');
      const name = makeNode('p', 'member-name', displayName(member));
      name.id = labelId;
      const detail = makeNode('p', 'member-detail', member.detail);
      detail.id = detailId;
      const position = state.members.indexOf(id) + 1;
      const status = makeNode('p', 'member-status', isMember
        ? (!state.created ? '待创建成员 · 名单第 ' + position + ' 位' : (paused ? '自动回复已暂停' : '自动回复已启用') + ' · 名单第 ' + position + ' 位')
        : paused ? '尚未加入 · 保留自动回复暂停记录' : '尚未加入此群组');
      status.id = statusId;
      copy.append(name, detail, status);
      identityBlock.append(avatar, copy);
      const actions = makeNode('div', 'member-actions');
      let primaryActions;
      if (!isMember) primaryActions = ['add', 'view'];
      else {
        primaryActions = state.created ? [paused ? 'enable' : 'disable', 'speak'] : [];
        primaryActions.push(...(isVariantB() ? ['more'] : secondaryActions));
      }
      for (const action of primaryActions) actions.append(makeActionButton(action, member, kind));
      row.append(identityBlock, actions);
      if (isMember && isVariantB()) {
        const menu = makeNode('div', 'member-menu');
        menu.id = 'member-menu-' + activeMode + '-' + id;
        menu.hidden = true;
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-labelledby', 'member-more-' + activeMode + '-' + id);
        for (const action of secondaryActions) menu.append(makeActionButton(action, member, kind, true));
        row.append(menu);
      }
      renderedRows[kind].set(id, row);
      return row;
    };
    const renderList = kind => {
      const controls = lists[kind];
      const state = currentState().lists[kind];
      const totalIds = listIds(kind);
      const ids = filteredIds(kind);
      const pages = Math.max(1, Math.ceil(ids.length / state.size));
      state.page = Math.max(1, Math.min(state.page, pages));
      renderedRows[kind] = new Map();
      controls.node.before(controls.feedback);
      controls.node.replaceChildren(...ids.slice((state.page - 1) * state.size, state.page * state.size).map(id => buildMemberRow(id, kind)));
      if (controls.search.value !== state.search) controls.search.value = state.search;
      controls.size.value = String(state.size);
      controls.clear.hidden = state.search.length === 0;
      controls.prev.disabled = state.page <= 1;
      controls.next.disabled = state.page >= pages;
      setText(controls.info, '第 ' + state.page + ' / ' + pages + ' 页 · ' + ids.length + ' 位');
      const pausedCount = currentState().members.filter(id => currentState().disabled.includes(id)).length;
      setText(controls.count, totalIds.length + ' 位' + (kind === 'members' && pausedCount ? ' · ' + pausedCount + ' 暂停' : ''));
      controls.empty.hidden = ids.length > 0;
      if (kind === 'members') {
        const noMembers = totalIds.length === 0;
        setText(controls.emptyText, noMembers ? '这份群组还没有成员。' : '没有匹配的当前成员。');
        setText(controls.emptyAction, noMembers ? '添加成员' : '清除搜索');
        controls.emptyAction.hidden = false;
        setText(get('members-search-note'), normalize(state.search)
          ? '搜索结果仍按完整名单排序；上移、下移交换完整名单中的相邻成员。'
          : '按完整成员名单排序。');
      } else {
        setText(controls.emptyText, totalIds.length === 0 ? '八位虚构成员都已加入此群组。' : '没有匹配的待添加成员。');
        controls.emptyAction.hidden = totalIds.length === 0 || !normalize(state.search);
      }
      placeListFeedback(kind);
    };
    const renderLists = () => {
      closeMenu();
      renderList('members');
      renderList('candidates');
    };
    const renderContext = () => {
      const state = currentState();
      const count = state.members.length;
      const enabledCount = state.members.filter(id => !state.disabled.includes(id)).length;
      const label = activeMode === 'existing' ? '已有样例' : state.created ? '新建样例 · 已创建' : '新建样例 · 待创建';
      setText(get('group-state-badge'), state.deleted ? '样例已删除' : label);
      setText(get('group-context'), state.deleted ? '仅删除了当前模式的本地样例，另一份样例保留。'
        : (state.name.trim() || (state.created ? '未命名样例群组' : '新建群组草稿')) + ' · ' + count + ' 位成员' + (state.created ? '，' + enabledCount + ' 位启用自动回复。' : '，尚未创建。'));
      setText(get('controls-readout'), state.created ? strategyNames[state.strategy] : '待创建');
      sectionsRoot.hidden = state.deleted;
      get('group-missing').hidden = !state.deleted;
      setText(get('group-feedback'), state.feedback);
      createButton.hidden = state.created || state.deleted;
      createButton.disabled = count === 0;
      deleteButton.hidden = !state.created || state.deleted;
      deleteButton.disabled = busyControl.checked;
      deleteButton.title = busyControl.checked ? '生成中样例：暂不可删除群组。' : '仅删除这份本地样例';
      get('creation-help').hidden = state.created || state.deleted;
    };
    const renderAutoState = () => {
      const state = currentState();
      let text = state.autoMode ? '自动模式已开启（本地样例）；不会计时或请求模型。' : '自动模式已关闭（本地样例）。';
      if (busyControl.checked) text += ' 当前显示生成中状态，未运行真实生成。';
      if (state.delayError) text += ' 间隔有输入待修正；最近有效值为 ' + state.delay + ' 秒。';
      setText(get('auto-state'), text);
    };
    const renderControls = () => {
      const state = currentState();
      if (nameInput.value !== state.name) nameInput.value = state.name;
      strategyInput.value = state.strategy;
      generationInput.value = state.generationMode;
      strategyInput.title = strategyInput.selectedOptions[0]?.textContent || strategyNames[state.strategy];
      generationInput.title = generationInput.selectedOptions[0]?.textContent || '';
      selfInput.checked = state.allowSelf;
      autoInput.checked = state.autoMode;
      get('self-responses-row').hidden = state.strategy !== '0';
      setText(get('strategy-help'), strategyHelp[state.strategy]);
      setText(get('generation-mode-help'), generationHelp[state.generationMode]);
      get('auto-mode-block').hidden = !state.created;
      if (delayInput.value !== state.delayDraft) delayInput.value = state.delayDraft;
      get('delay-error').hidden = !state.delayError;
      setText(get('delay-error'), state.delayError);
      if (state.delayError) delayInput.setAttribute('aria-invalid', 'true');
      else delayInput.removeAttribute('aria-invalid');
      delayInput.setCustomValidity(state.delayError);
      renderAutoState();
    };
    const applySectionOrder = () => {
      const order = isVariantB() ? [sections.members, sections.controls, sections.candidates] : [sections.controls, sections.members, sections.candidates];
      if (order.some((section, index) => sectionsRoot.children[index] !== section)) sectionsRoot.append(...order);
    };
    const updateReadout = () => {
      const box = panel.getBoundingClientRect();
      setText(get('panel-size'), Math.round(box.width) + ' × ' + Math.round(box.height) + 'px');
      setText(get('layout-readout'), isVariantB() ? '当前：成员在前，次要操作收纳。' : '当前：设置在前，成员动作直接展开。');
    };
    const renderAll = () => {
      closeMenu();
      applySectionOrder();
      for (const [key, section] of Object.entries(sections)) section.open = currentState().details[key];
      renderContext();
      renderControls();
      renderLists();
      updateReadout();
    };
    const mutationFeedback = () => currentState().created ? '已更新本页样例。' : '已更新新建草稿，尚未创建。';
    const redrawAfterMemberAction = (token, message) => {
      const plan = planRowFocus(token);
      renderContext();
      renderLists();
      const target = restoreFocus(plan);
      notifyList(token.list, message + mutationFeedback(), target);
    };
    const handleMemberAction = (kind, button) => {
      const row = button.closest('.group-member');
      if (!row || button.disabled || currentState().deleted) return;
      const id = row.dataset.memberId;
      const member = byId.get(id);
      const action = button.dataset.action;
      if (!member || !listIds(kind).includes(id)) return;
      const state = currentState();
      const token = captureFocus(button);
      const description = feedbackName(member);
      if (action === 'more') {
        if (openMenu?.id === id && openMenu.list === kind) closeMenu({ restoreFocus: true });
        else openMemberMenu(kind, id);
        return;
      }
      if (action === 'view') {
        if (busyControl.checked) return;
        notifyList(kind, description + '：仅展示虚构身份，未打开真实角色卡。', button);
        return;
      }
      if (action === 'add' && kind === 'candidates') {
        state.members.unshift(id);
        const paused = state.disabled.includes(id);
        redrawAfterMemberAction(token, description + ' 已加入名单首位。' + (paused ? '仍暂停自动回复。' : ''));
        return;
      }
      if (kind !== 'members') return;
      if (action === 'speak') {
        if (!state.created) return;
        notifyList(kind, '已演示点名 ' + description + '；本地样例未调用模型。', button);
        return;
      }
      if (action === 'disable' || action === 'enable') {
        if (!state.created) return;
        if (action === 'disable' && !state.disabled.includes(id)) state.disabled.push(id);
        if (action === 'enable') state.disabled = state.disabled.filter(memberId => memberId !== id);
        token.action = action === 'disable' ? 'enable' : 'disable';
        redrawAfterMemberAction(token, '已' + (action === 'disable' ? '暂停 ' : '启用 ') + description + ' 的自动回复；仍在群组内。');
        return;
      }
      if (action === 'remove') {
        state.members = state.members.filter(memberId => memberId !== id);
        redrawAfterMemberAction(token, description + ' 已移出本群，未删除角色。' + (state.disabled.includes(id) ? '暂停记录保留。' : ''));
        return;
      }
      if (action === 'up' || action === 'down') {
        const index = state.members.indexOf(id);
        const nextIndex = index + (action === 'up' ? -1 : 1);
        if (index < 0 || nextIndex < 0 || nextIndex >= state.members.length) return;
        [state.members[index], state.members[nextIndex]] = [state.members[nextIndex], state.members[index]];
        redrawAfterMemberAction(token, description + ' 已移至完整名单第 ' + (nextIndex + 1) + ' 位。');
      }
    };

    for (const [kind, controls] of Object.entries(lists)) {
      controls.node.addEventListener('click', event => {
        const button = event.target instanceof Element ? event.target.closest('button[data-action]') : null;
        if (button && controls.node.contains(button)) handleMemberAction(kind, button);
      });
      controls.node.addEventListener('keydown', event => {
        if (!(event.target instanceof HTMLElement)) return;
        const button = event.target.closest('button[data-action]');
        const row = button?.closest('.group-member');
        if (!button || !row) return;
        if (button.dataset.action === 'more' && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
          event.preventDefault();
          openMemberMenu(kind, row.dataset.memberId, { last: event.key === 'ArrowUp' });
          return;
        }
        const menu = button.closest('.member-menu');
        if (!menu || menu.hidden) return;
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu({ restoreFocus: true }); return; }
        if (event.key === 'Tab') {
          const trigger = row.querySelector('[data-action="more"]');
          const candidates = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]')]
            .filter(element => element.tabIndex >= 0 && !element.closest('.member-menu') && isElementAvailable(element) && element.getClientRects().length > 0);
          const index = candidates.indexOf(trigger);
          const next = candidates[index + (event.shiftKey ? -1 : 1)];
          event.preventDefault();
          closeMenu();
          focusTarget(next || trigger);
          return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const items = [...menu.querySelectorAll('button')].filter(item => !item.disabled);
        const index = items.indexOf(button);
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        const next = items[nextIndex];
        for (const item of items) item.tabIndex = item === next ? 0 : -1;
        focusTarget(next);
      });
      controls.search.addEventListener('input', () => {
        const state = currentState().lists[kind];
        state.search = controls.search.value;
        state.page = 1;
        state.feedback = '';
        state.feedbackId = null;
        closeMenu();
        renderList(kind);
      });
      const clearSearch = () => {
        const state = currentState().lists[kind];
        state.search = '';
        state.page = 1;
        state.feedback = '';
        state.feedbackId = null;
        closeMenu();
        renderList(kind);
        focusTarget(controls.search);
      };
      controls.clear.addEventListener('click', clearSearch);
      controls.emptyAction.addEventListener('click', () => {
        if (kind === 'members' && currentState().members.length === 0) {
          currentState().details.candidates = true;
          sections.candidates.open = true;
          focusTarget(lists.candidates.search);
        } else clearSearch();
      });
      for (const [button, direction] of [[controls.prev, -1], [controls.next, 1]]) {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          currentState().lists[kind].page += direction;
          closeMenu();
          renderList(kind);
          focusTarget(!button.disabled ? button : (!controls.prev.disabled ? controls.prev : !controls.next.disabled ? controls.next : controls.search));
        });
      }
      controls.size.addEventListener('change', () => {
        const value = Number(controls.size.value);
        if (![5, 10].includes(value)) return;
        currentState().lists[kind].size = value;
        currentState().lists[kind].page = 1;
        closeMenu();
        renderList(kind);
      });
    }
    document.addEventListener('pointerdown', event => {
      if (!openMenu || !(event.target instanceof Element)) return;
      const row = renderedRows[openMenu.list].get(openMenu.id);
      const menu = row?.querySelector('.member-menu');
      const trigger = row?.querySelector('[data-action="more"]');
      if (!menu?.contains(event.target) && !trigger?.contains(event.target)) closeMenu({ restoreFocus: !!menu?.contains(document.activeElement) });
    });
    document.addEventListener('focusin', event => {
      if (!openMenu || !(event.target instanceof Element)) return;
      const row = renderedRows[openMenu.list].get(openMenu.id);
      if (!row || !row.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && openMenu && !dialog.open) { event.preventDefault(); closeMenu({ restoreFocus: true }); }
    });
    for (const [key, section] of Object.entries(sections)) {
      section.addEventListener('toggle', () => { currentState().details[key] = section.open; });
    }
    nameInput.addEventListener('input', () => {
      currentState().name = nameInput.value;
      renderContext();
      notifyGroup('群组名称已在本页调整。' + mutationFeedback());
    });
    strategyInput.addEventListener('change', () => {
      if (!Object.hasOwn(strategyNames, strategyInput.value)) return;
      currentState().strategy = strategyInput.value;
      renderControls();
      renderContext();
      notifyGroup('已选择 ' + strategyNames[currentState().strategy] + ' 发言策略。' + mutationFeedback(), strategyInput);
    });
    generationInput.addEventListener('change', () => {
      if (!Object.hasOwn(generationHelp, generationInput.value)) return;
      currentState().generationMode = generationInput.value;
      renderControls();
      notifyGroup('角色卡处理方式已在本页调整；没有读取或拼接真实卡片。', generationInput);
    });
    selfInput.addEventListener('change', () => {
      currentState().allowSelf = selfInput.checked;
      notifyGroup('自然顺序的连续自答选项已在本页调整。' + mutationFeedback(), selfInput);
    });
    autoInput.addEventListener('change', () => {
      if (!currentState().created || currentState().deleted) return;
      currentState().autoMode = autoInput.checked;
      renderAutoState();
      notifyGroup('自动模式' + (autoInput.checked ? '已开启' : '已关闭') + '，仅为本地状态；不会计时、生成消息或停止真实请求。', autoInput);
    });
    const editDelay = (commit = false) => {
      const state = currentState();
      if (!state.created || state.deleted) return;
      const raw = delayInput.value;
      state.delayDraft = raw;
      const value = Number(raw);
      state.delayError = delayInput.validity.badInput || raw.trim() === '' || !Number.isInteger(value) || value < 1 || value > 999
        ? '请填写 1–999 的整数。本页保留输入，最近有效值为 ' + state.delay + ' 秒；这不代表宿主校验已修复。' : '';
      if (!state.delayError) {
        state.delay = value;
        if (commit) state.delayDraft = String(value);
      }
      renderControls();
      if (commit && !state.delayError) notifyGroup('本地检查间隔已设为 ' + state.delay + ' 秒；本页不启动定时器。', delayInput);
    };
    delayInput.addEventListener('input', () => editDelay());
    delayInput.addEventListener('change', () => editDelay(true));
    delayInput.addEventListener('blur', () => editDelay(true));
    delayInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); editDelay(true); }
    });
    createButton.addEventListener('click', () => {
      const state = currentState();
      if (state.created || state.deleted || !state.members.length) return;
      if (!state.name.trim()) state.name = '群组：' + state.members.map(id => byId.get(id).name).join('、');
      state.created = true;
      renderAll();
      notifyGroup('已创建这份本地样例，并留在“新建群组”槽继续编辑；没有写入酒馆。');
      focusTarget(nameInput);
    });
    deleteButton.addEventListener('click', () => {
      const state = currentState();
      if (!state.created || state.deleted || busyControl.checked || dialog.open) return;
      closeMenu();
      deleteRequest = { mode: activeMode, state, trigger: deleteButton };
      setText(get('group-delete-title'), '删除「' + (state.name.trim() || '未命名样例群组') + '」？');
      setText(get('group-delete-description'), '仅清空本页这份群组的成员和设置。另一份样例保留，不影响真实角色或聊天；删除后可恢复本例的初始数据。');
      dialog.showModal();
      dialog.querySelector('.group-dialog-copy').scrollTop = 0;
      deleteCancel.focus();
    });
    deleteCancel.addEventListener('click', () => dialog.close('cancelled'));
    dialog.addEventListener('cancel', () => { dialog.returnValue = 'cancelled'; });
    get('group-delete-form').addEventListener('submit', event => {
      event.preventDefault();
      if (!deleteRequest || deleteRequest.mode !== activeMode || deleteRequest.state !== currentState() || !currentState().created || currentState().deleted || busyControl.checked) {
        dialog.close('context-changed');
        return;
      }
      states[activeMode] = { ...makeState(activeMode), created: false, deleted: true, members: [], disabled: [], name: '', feedback: '已删除当前本地样例。可以恢复这份样例的初始数据。' };
      renderAll();
      dialog.close('deleted');
    });
    dialog.addEventListener('close', () => {
      const request = deleteRequest;
      deleteRequest = null;
      if (!request || ['context-changed', 'reset', 'mode-changed'].includes(dialog.returnValue)) return;
      if (dialog.returnValue === 'deleted') { focusTarget(restoreExample); return; }
      if (request.mode !== activeMode) return;
      notifyGroup('已取消删除，当前样例数据保留。');
      focusTarget(isElementAvailable(request.trigger) ? request.trigger : get('groupControlsToggle'));
    });
    restoreExample.addEventListener('click', () => {
      states[activeMode] = makeState(activeMode);
      renderAll();
      notifyGroup(activeMode === 'existing' ? '已恢复已有样例的初始六位成员与设置。' : '已恢复新建样例的空白草稿，尚未创建群组。');
      focusTarget(activeMode === 'existing' ? lists.members.search : nameInput);
    });
    modeControl.addEventListener('change', () => {
      if (!Object.hasOwn(states, modeControl.value)) return;
      if (dialog.open) dialog.close('mode-changed');
      closeMenu();
      activeMode = modeControl.value;
      renderAll();
      content.scrollTop = 0;
      setText(get('study-feedback'), '当前查看' + (activeMode === 'existing' ? '已有群组' : '新建群组') + '样例；两份数据、筛选和折叠状态分别保留。');
    });
    document.addEventListener('ef:variant', () => {
      const token = captureFocus();
      closeMenu();
      applySectionOrder();
      const plan = planRowFocus(token);
      renderLists();
      restoreFocus(plan, { allowMenu: false });
      updateReadout();
    });
    longControl.addEventListener('change', () => {
      const token = planRowFocus(captureFocus());
      renderLists();
      restoreFocus(token);
      setText(get('study-feedback'), longControl.checked ? '已显示更长名称；稳定成员身份和样例数据保持不变。' : '已恢复常规名称；同名成员仍由识别说明区分。');
    });
    busyControl.addEventListener('change', () => {
      const token = planRowFocus(captureFocus());
      if (busyControl.checked && dialog.open) dialog.close('context-changed');
      renderContext();
      renderAutoState();
      renderLists();
      restoreFocus(token);
      setText(get('study-feedback'), busyControl.checked ? '生成中样例：仅限制查看角色卡与删除群组，其他动作仍为本地演示。' : '已退出生成中样例；没有启动或停止真实生成。');
    });
    get('reset-demo').addEventListener('click', () => {
      if (dialog.open) dialog.close('reset');
      closeMenu();
      states = { existing: makeState('existing'), new: makeState('new') };
      renderAll();
      content.scrollTop = 0;
      setText(get('study-feedback'), '两份样例的数据、搜索、分页和折叠状态已重置；当前布局与画布设置保留。');
    });
    const updateFrame = () => {
      panel.style.setProperty('--preview-width', widthControl.value + 'px');
      panel.style.setProperty('--preview-height', heightControl.value + 'px');
      updateReadout();
    };
    widthControl.addEventListener('change', updateFrame);
    heightControl.addEventListener('change', updateFrame);
    new ResizeObserver(updateReadout).observe(panel);
    modeControl.value = activeMode;
    for (const [control, key] of [[widthControl, 'width'], [heightControl, 'height']]) {
      if ([...control.options].some(option => option.value === query.get(key))) control.value = query.get(key);
    }
    longControl.checked = query.get('long') === '1';
    busyControl.checked = query.get('busy') === '1';
    setText(get('delay-help'), '1–999 秒整数。本页使用本地输入校验，未修改宿主。间隔是周期检查，不是回复结束后的倒计时。');
    renderAll();
    updateFrame();
    setText(get('study-feedback'), '当前查看' + (activeMode === 'existing' ? '已有群组' : '新建群组') + '样例。首次载入不会自动移动焦点。');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
