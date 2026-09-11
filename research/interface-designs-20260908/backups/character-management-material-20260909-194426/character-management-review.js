'use strict';
// Isolated proposal. All notes, tags and sorting values are fictional test data.
// No host APIs, persistence, imports, uploads or data mutations outside this page.
(() => {
  const $ = selector => document.querySelector(selector);
  const imageBase = '../research/operator-site-2026-09-09/';
  const longNames = {
    '1': '提弗洛斯 · 跨越世界尽头的长篇旅途与多角色分支互动记录',
    g: '东岸同行者 · 跨越世界尽头的长篇旅途与多角色分支互动记录',
    f: '长篇故事 · 跨越世界尽头的长篇旅途与多角色分支互动记录',
  };
  const longInlineTag = '包含多人物关系和跨世界观分支的长期互动标签';
  const longFilterTag = '跨世界观与多角色长期互动的详细分类标签（含分支剧情与人物关系）';
  const paginationPortraits = ['removed-reference.svg', 'removed-reference.svg', 'removed-reference.svg', 'removed-reference.svg', 'removed-reference.svg'];
  const examples = [
    { id: '1', name: '提弗洛斯', image: 'removed-reference.svg', version: 'v1.2', note: '示例备注：一段尚未写完的旅程。', tags: ['冒险', '长篇'], favorite: true },
    { id: '2', name: '管理员', image: 'removed-reference.svg', version: 'v0.8', note: '示例备注：这里保留角色作者的原始说明。', tags: ['日常', '多角色'] },
    { id: '3', name: '陈千语', image: 'removed-reference.svg', version: 'v2.0', note: '示例备注：短篇互动，适合从一个场景开始。', tags: ['短篇'], favorite: true },
    { id: '4', name: '佩丽卡', image: 'removed-reference.svg', note: '示例备注：普通方形头像也需要自然显示。', tags: ['日常'] },
    { id: '5', name: '没有头像的角色', note: '示例备注：缺少图片时仍能辨识条目。', tags: ['未分类'] },
    { id: '6', name: '仅有姓名的角色', image: 'removed-reference.svg', tags: [] },
    { id: 'g', kind: 'group', name: '东岸同行者', note: '示例成员：管理员、陈千语', tags: ['群聊'], count: 2 },
    { id: 'f', kind: 'folder', name: '长篇故事', note: '示例文件夹', tags: [], count: 3 },
    ...Array.from({ length: 19 }, (_, i) => ({
      id: String(i + 9),
      name: '示例角色 ' + String(i + 9).padStart(2, '0'),
      image: paginationPortraits[i % paginationPortraits.length],
      note: '示例备注：用于分页与筛选状态检查。',
      tags: [i % 2 === 0 ? '日常' : '冒险', i % 3 === 0 ? '长篇' : '短篇'],
      favorite: i % 4 === 0,
    })),
  ].map((item, index) => ({
    ...item,
    // Only drive the sort demo; these values do not describe the depicted characters.
    demoSort: { created: index, recent: (index * 7) % 27, chats: (index * 11) % 49, tokens: 1000 + index * 121 },
  }));
  const byId = new Map(examples.map(item => [item.id, item]));
  const defaults = () => ({
    query: '', searchOpen: false, sort: 'az', lastSort: 'az',
    filters: { favorites: 0, groups: 0, folders: 0 }, tagState: {}, showTags: false,
    longContent: false, longTags: false, extensions: false,
    pinned: false, hideHotswaps: false, emptyHotswaps: false,
    page: 1, size: 50, grid: false, bulk: false, selected: new Set(),
    lastSelected: null, lastSelectionMode: undefined,
    randomOrder: new Map(examples.map(item => [item.id, Math.random()])),
  });
  let state = defaults();
  const icons = {
    create: 'user-plus', file: 'file-import', url: 'cloud-arrow-down', group: 'users-gear',
    search: 'magnifying-glass', favorites: 'star', groups: 'users', folders: 'folder-plus',
    manage: 'gear', tags: 'tags', clear: 'filter-circle-xmark', grid: 'table-cells-large',
    bulk: 'pen-to-square', all: 'check-double', delete: 'trash-can', pin: 'unlock', characters: 'list-ul',
  };
  const labels = {
    create: '新建角色', file: '从文件导入角色', url: '从外部 URL 导入内容', group: '创建新群聊',
    search: '切换搜索栏', favorites: '仅显示收藏', groups: '仅显示群聊', folders: '仅显示文件夹',
    manage: '管理标签', tags: '显示标签列表', clear: '清除所有过滤器', grid: '切换角色网格视图',
    bulk: '批量编辑角色', all: '选择当前页全部角色', delete: '删除已选角色', extra: '扩展追加按钮',
    pin: '固定角色管理面板', characters: '返回角色列表',
  };
  const sortOptions = [
    ['search', '搜索'], ['az', 'A-Z'], ['za', 'Z-A'], ['new', '最新'], ['old', '最旧'],
    ['fav', '收藏夹'], ['recent', '最近'], ['mostChats', '最多聊天'], ['leastChats', '最少聊天'],
    ['mostTokens', '最多 Token'], ['leastTokens', '最少 Token'], ['random', '随机'],
  ];
  const filterStates = ['undefined', 'include', 'exclude'];
  const filterWords = ['不限', '包含', '排除'];
  const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });

  function iconButton(action, extra = '') {
    return `<button type="button" class="tool ${extra}" data-action="${action}" title="${labels[action]}" aria-label="${labels[action]}"><i class="fa-solid fa-${icons[action] || 'puzzle-piece'}" aria-hidden="true"></i></button>`;
  }
  function template() {
    return `<section class="example proposal">
      <header><h2>角色管理 · 合并预览</h2><span>可直接操作</span></header>
      <div class="drawer-slice" data-panel="proposal" role="region" aria-label="角色管理">
        <div class="manager-navigation" data-native="CharListButtonAndHotSwaps">
          <div class="manager-navigation-tools">${iconButton('pin')}${iconButton('characters')}</div>
          <div class="manager-hotswaps" aria-label="收藏角色快捷入口"></div>
        </div>
        <div class="tools" data-native="charListFixedTop">
          <div class="action-bar" data-native="rm_button_bar">
            ${iconButton('create')}${iconButton('file')}${iconButton('url')}${iconButton('group')}
            <div class="extra-buttons" data-native="rm_buttons_container"></div>
            <select class="sort-order" aria-label="角色排序顺序" title="角色排序顺序">${sortOptions.map(([value, label]) => `<option value="${value}" ${value === 'search' ? 'hidden' : ''}>${label}</option>`).join('')}</select>
            ${iconButton('search', 'search-toggle')}
          </div>
          <div class="search-form" data-native="form_character_search_form" id="proposal-search-form" hidden><input type="search" id="proposal-search" aria-label="搜索角色" placeholder="搜索…" autocomplete="off"></div>
          <div class="tag-controls" data-native="rm_tag_controls"><div class="tags">
            ${['favorites', 'groups', 'folders'].map(action => iconButton(action, 'filter-tool')).join('')}
            ${iconButton('manage', 'filter-tool manage-tags')}${iconButton('tags', 'filter-tool')}${iconButton('clear', 'filter-tool')}
            <div class="ordinary-tags" id="proposal-ordinary-tags" hidden></div>
          </div></div>
        </div>
        <div class="pagination" data-native="rm_print_characters_pagination">
          <div class="paginationjs">
            <div class="pagination-count" aria-live="polite"></div>
            <div class="page-buttons" aria-label="角色分页">${[['first', '«', '首页'], ['prev', '‹', '上一页'], ['next', '›', '下一页'], ['last', '»', '末页']].map(([action, text, label]) => `<button type="button" data-page="${action}" aria-label="${label}" title="${label}">${text}</button>`).join('')}</div>
            <select class="page-size" aria-label="每页角色数量">${[10, 25, 50, 100, 250, 500, 1000].map(size => `<option value="${size}">${size} / 页</option>`).join('')}</select>
          </div>
          ${iconButton('grid')}${iconButton('bulk')}
          <span class="bulk-count" hidden></span>${iconButton('all', 'bulk-option')}${iconButton('delete', 'bulk-option delete-button')}
        </div>
        <div id="role-collection" class="role-collection list-view stub-list" aria-label="示例角色、群聊与文件夹列表"></div>
      </div>
      <p class="example-footer">27 条虚构测试数据；肖像沿用角色列表稿，备注与标签仅用于预览。</p>
    </section>`;
  }

  $('#comparisons').innerHTML = template();
  const proposal = $('[data-panel="proposal"]');
  const list = $('#role-collection');
  const searchInput = $('#proposal-search');
  const actionButton = action => proposal.querySelector(`[data-action="${action}"]`);
  actionButton('search').setAttribute('aria-controls', 'proposal-search-form');
  actionButton('tags').setAttribute('aria-controls', 'proposal-ordinary-tags');
  actionButton('grid').setAttribute('aria-controls', 'role-collection');
  const say = text => { $('#demo-status').textContent = text; };
  function explain(title, body) {
    $('#dialog-title').textContent = title;
    $('#dialog-body').textContent = body;
    if (!$('#demo-dialog').open) $('#demo-dialog').showModal();
  }
  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function markIcon(name) {
    const element = make('i', 'fa-solid fa-' + name);
    element.setAttribute('aria-hidden', 'true');
    return element;
  }
  function picture(file) {
    const image = make('img');
    image.src = imageBase + file;
    image.alt = '';
    image.addEventListener('error', () => {
      const parent = image.parentElement;
      if (parent) {
        image.remove();
        parent.classList.add('no-picture');
        parent.append(markIcon('user'));
      }
    }, { once: true });
    return image;
  }
  function itemName(item) { return state.longContent && longNames[item.id] || item.name; }
  function itemTags(item) {
    return [...item.tags, ...(state.longTags && item.id === '1' ? [longInlineTag, longFilterTag] : [])];
  }
  function card(item) {
    const row = make('button', 'role-entry ' + (item.kind === 'group' ? 'group_select' : item.kind === 'folder' ? 'bogus_folder_select' : 'character_select'));
    row.type = 'button';
    row.dataset.item = item.id;
    row.dataset.id = item.id;
    row.classList.toggle('is_fav', !!item.favorite);
    row.title = itemName(item);
    row.setAttribute('aria-label', itemName(item) + (item.favorite ? '，已收藏' : '') + (item.kind === 'group' ? '，群聊' : item.kind === 'folder' ? '，文件夹' : ''));
    const avatar = make('span', 'avatar');
    avatar.setAttribute('aria-hidden', 'true');
    if (item.image) avatar.append(picture(item.image));
    else if (item.kind === 'group') {
      const group = make('span', 'group-avatars');
      group.append(picture('removed-reference.svg'), picture('removed-reference.svg'));
      avatar.append(group);
    } else if (item.kind === 'folder') avatar.append(markIcon('folder'));
    else {
      avatar.classList.add('no-picture');
      avatar.append(markIcon('user'), make('small', '', '无头像'));
    }
    const content = make('span', 'entry-content');
    const nameLine = make('span', 'character_name_block');
    nameLine.append(make('span', 'ch_name', itemName(item)));
    if (item.kind) nameLine.append(make('span', 'type-mark', (item.kind === 'group' ? '群聊 ' : '文件夹 ') + item.count));
    else if (item.version) {
      const version = make('small', 'character_version', state.longContent && item.id === '1' ? 'v1.2.0-beta / extended edition' : item.version);
      version.title = version.textContent;
      nameLine.append(version);
    }
    content.append(nameLine);
    if (item.note) {
      const note = make('span', 'ch_description', item.note);
      note.title = item.note;
      content.append(note);
    }
    const tags = make('span', 'tags_inline');
    for (const text of itemTags(item)) {
      const tag = make('span', 'tag', text);
      tag.title = text;
      tags.append(tag);
    }
    content.append(tags);
    if (item.kind === 'folder') {
      const dots = make('span', 'member-dots');
      dots.setAttribute('aria-hidden', 'true');
      dots.append(picture('removed-reference.svg'), picture('removed-reference.svg'), picture('removed-reference.svg'));
      content.append(dots);
    }
    row.append(avatar, content);
    if (item.favorite) {
      const star = make('span', 'favorite-mark');
      star.setAttribute('aria-hidden', 'true');
      star.append(markIcon('star'));
      row.append(star);
    }
    return row;
  }
  function matches(value, mode) { return mode === 0 || mode === 1 && value || mode === 2 && !value; }
  function byName(a, b) { return collator.compare(itemName(a), itemName(b)); }
  function searchRank(item) {
    const query = state.query.trim().toLocaleLowerCase();
    const name = itemName(item).toLocaleLowerCase();
    return name === query ? 0 : name.startsWith(query) ? 1 : name.includes(query) ? 2 : 3;
  }
  function results() {
    const query = state.query.trim().toLocaleLowerCase();
    const rows = examples.filter(item => {
      const tags = itemTags(item);
      const searchable = [itemName(item), item.note || '', ...tags].join(' ').toLocaleLowerCase();
      return (!query || searchable.includes(query)) && matches(!!item.favorite, state.filters.favorites)
        && matches(item.kind === 'group', state.filters.groups) && matches(item.kind === 'folder', state.filters.folders)
        && Object.entries(state.tagState).every(([tag, mode]) => matches(tags.includes(tag), mode));
    });
    const sorters = {
      az: byName, za: (a, b) => byName(b, a),
      new: (a, b) => b.demoSort.created - a.demoSort.created,
      old: (a, b) => a.demoSort.created - b.demoSort.created,
      fav: (a, b) => Number(!!b.favorite) - Number(!!a.favorite) || byName(a, b),
      recent: (a, b) => b.demoSort.recent - a.demoSort.recent,
      mostChats: (a, b) => b.demoSort.chats - a.demoSort.chats,
      leastChats: (a, b) => a.demoSort.chats - b.demoSort.chats,
      mostTokens: (a, b) => b.demoSort.tokens - a.demoSort.tokens,
      leastTokens: (a, b) => a.demoSort.tokens - b.demoSort.tokens,
      random: (a, b) => state.randomOrder.get(a.id) - state.randomOrder.get(b.id),
      search: (a, b) => searchRank(a) - searchRank(b) || byName(a, b),
    };
    return rows.sort(sorters[state.sort] || byName);
  }
  function currentRows() { return results().slice((state.page - 1) * state.size, state.page * state.size); }
  function resetSelection() {
    state.selected.clear();
    state.lastSelected = null;
    state.lastSelectionMode = undefined;
  }
  function reloadList() {
    state.page = 1;
    state.bulk = false;
    resetSelection();
    render();
    list.scrollTop = 0;
  }
  function setSearch(query) {
    const hadQuery = !!state.query.trim();
    state.query = query;
    if (query.trim() && !hadQuery) { state.lastSort = state.sort; state.sort = 'search'; }
    else if (!query.trim() && state.sort === 'search') state.sort = state.lastSort;
    reloadList();
  }
  function tagNames() { return [...new Set(examples.flatMap(itemTags))]; }
  function renderHotswaps() {
    const container = proposal.querySelector('.manager-hotswaps');
    const oldScroll = container.scrollLeft;
    container.hidden = state.hideHotswaps;
    const favorites = state.emptyHotswaps ? [] : examples.filter(item => item.favorite && !item.kind).slice(0, 25);
    container.replaceChildren(...favorites.map(item => {
      const button = make('button', 'hotswap-entry');
      button.type = 'button';
      button.dataset.hotswap = item.id;
      button.title = itemName(item);
      button.setAttribute('aria-label', '收藏角色：' + itemName(item));
      button.append(item.image ? picture(item.image) : markIcon('user'));
      return button;
    }));
    if (!favorites.length) {
      const empty = make('span', 'hotswap-empty');
      empty.append(markIcon('star'), document.createTextNode(' 暂无收藏快捷入口'));
      container.append(empty);
    }
    container.scrollLeft = oldScroll;
  }
  function renderTags() {
    const names = tagNames();
    for (const tag of Object.keys(state.tagState)) if (!names.includes(tag)) delete state.tagState[tag];
    proposal.querySelector('.ordinary-tags').replaceChildren(...names.map(tag => {
      const button = make('button', 'tag-name', tag);
      button.type = 'button';
      button.dataset.tag = tag;
      return button;
    }));
  }
  function render(rebuildList = true) {
    const rows = results();
    const pages = Math.max(1, Math.ceil(rows.length / state.size));
    state.page = Math.max(1, Math.min(state.page, pages));
    const visible = rows.slice((state.page - 1) * state.size, state.page * state.size);
    actionButton('pin').setAttribute('aria-pressed', String(state.pinned));
    actionButton('pin').setAttribute('aria-label', state.pinned ? '取消固定角色管理面板' : labels.pin);
    actionButton('pin').title = state.pinned ? '取消固定角色管理面板' : labels.pin;
    actionButton('pin').querySelector('i').className = 'fa-solid fa-' + (state.pinned ? 'lock' : 'unlock');
    proposal.querySelector('.search-form').hidden = !state.searchOpen;
    if (searchInput.value !== state.query) searchInput.value = state.query;
    actionButton('search').classList.toggle('active', state.searchOpen);
    actionButton('search').setAttribute('aria-expanded', String(state.searchOpen));
    const sort = proposal.querySelector('.sort-order');
    sort.querySelector('[value="search"]').hidden = !state.query.trim();
    sort.value = state.sort;
    proposal.querySelector('.ordinary-tags').hidden = !state.showTags;
    const activeTags = Object.values(state.tagState).filter(Boolean).length;
    actionButton('tags').setAttribute('aria-expanded', String(state.showTags));
    actionButton('tags').classList.toggle('active', state.showTags);
    actionButton('tags').classList.toggle('has-filters', activeTags > 0);
    actionButton('tags').setAttribute('aria-label', '显示标签列表' + (activeTags ? '，' + activeTags + ' 项筛选生效' : ''));
    for (const name of ['favorites', 'groups', 'folders']) {
      const button = actionButton(name), mode = state.filters[name];
      button.dataset.filter = name;
      button.dataset.state = filterStates[mode];
      button.setAttribute('aria-pressed', mode === 0 ? 'false' : mode === 1 ? 'true' : 'mixed');
      button.setAttribute('aria-label', labels[name] + '：' + filterWords[mode]);
    }
    proposal.querySelectorAll('[data-tag]').forEach(button => {
      const mode = state.tagState[button.dataset.tag] || 0;
      button.dataset.state = filterStates[mode];
      button.setAttribute('aria-pressed', mode === 0 ? 'false' : mode === 1 ? 'true' : 'mixed');
      button.setAttribute('aria-label', button.dataset.tag + '：' + filterWords[mode]);
    });
    proposal.querySelector('.pagination-count').textContent = rows.length ? `${(state.page - 1) * state.size + 1}–${Math.min(state.page * state.size, rows.length)} / ${rows.length}` : '0 / 0';
    proposal.querySelector('.page-size').value = String(state.size);
    for (const action of ['first', 'prev']) proposal.querySelector(`[data-page="${action}"]`).disabled = state.page === 1;
    for (const action of ['next', 'last']) proposal.querySelector(`[data-page="${action}"]`).disabled = state.page === pages;
    actionButton('grid').setAttribute('aria-pressed', String(state.grid));
    actionButton('grid').setAttribute('aria-label', state.grid ? '切换角色列表视图' : labels.grid);
    actionButton('grid').title = state.grid ? '切换角色列表视图' : labels.grid;
    actionButton('bulk').setAttribute('aria-pressed', String(state.bulk));
    proposal.classList.toggle('bulk-mode', state.bulk);
    proposal.querySelector('.pagination').classList.toggle('bulk-active', state.bulk);
    proposal.querySelector('.bulk-count').hidden = !state.bulk;
    proposal.querySelector('.bulk-count').textContent = state.bulk ? `已选 ${state.selected.size}` : '';
    proposal.querySelectorAll('.bulk-option').forEach(button => { button.hidden = !state.bulk; });
    actionButton('delete').disabled = state.selected.size === 0;
    const eligible = visible.filter(item => !item.kind);
    actionButton('all').disabled = eligible.length === 0;
    const allSelected = eligible.length > 0 && eligible.every(item => state.selected.has(item.id));
    actionButton('all').setAttribute('aria-pressed', String(allSelected));
    actionButton('all').setAttribute('aria-label', allSelected ? '取消选择当前页全部角色' : labels.all);
    list.classList.toggle('list-view', !state.grid);
    list.classList.toggle('grid-view', state.grid);
    list.classList.toggle('grid', state.grid);
    if (rebuildList) {
      const oldScroll = list.scrollTop;
      const focusedId = list.contains(document.activeElement) ? document.activeElement.closest('[data-item]')?.dataset.item : null;
      list.replaceChildren(...visible.map(card));
      if (!visible.length) list.append(make('p', 'empty-list empty-result', '没有符合条件的示例角色'));
      list.scrollTop = oldScroll;
      if (focusedId) list.querySelector(`[data-item="${focusedId}"]`)?.focus({ preventScroll: true });
    }
    list.querySelectorAll('[data-item]').forEach(row => {
      const item = byId.get(row.dataset.item);
      row.classList.toggle('character_selected', state.selected.has(item.id));
      row.disabled = state.bulk && !!item.kind;
      if (state.bulk && !item.kind) row.setAttribute('aria-pressed', String(state.selected.has(item.id)));
      else row.removeAttribute('aria-pressed');
      let check = row.querySelector('.bulk-check');
      if (state.bulk && !item.kind) {
        if (!check) { check = make('span', 'bulk-check'); check.setAttribute('aria-hidden', 'true'); row.append(check); }
        check.replaceChildren(...(state.selected.has(item.id) ? [markIcon('check')] : []));
      } else check?.remove();
    });
  }
  function toggleItem(id, range) {
    const visible = currentRows().filter(item => !item.kind), item = byId.get(id);
    if (!item || item.kind) return;
    const enabled = !state.selected.has(id);
    const oldIndex = visible.findIndex(row => row.id === state.lastSelected);
    const newIndex = visible.findIndex(row => row.id === id);
    if (range && oldIndex < 0) { say('请先单击当前页的一个角色，再使用 Shift 范围选择。'); return; }
    if (range && enabled !== state.lastSelectionMode) { say('这次 Shift 点击与上次选择方向不同，保持原选择。'); return; }
    const items = range ? visible.slice(Math.min(oldIndex, newIndex), Math.max(oldIndex, newIndex) + 1) : [item];
    for (const row of items) enabled ? state.selected.add(row.id) : state.selected.delete(row.id);
    if (!range) { state.lastSelected = id; state.lastSelectionMode = enabled; }
    render(false);
    say(`批量模式：已选 ${state.selected.size} 个示例角色。`);
  }

  proposal.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || !proposal.contains(target) || target.disabled) return;
    if (target.dataset.hotswap) {
      const item = byId.get(target.dataset.hotswap);
      explain(itemName(item), '这里演示收藏角色快捷入口，并显示完整姓名。快捷栏取自全部收藏示例，不受列表筛选影响；本页不切换真实聊天。');
      return;
    }
    if (target.dataset.page) {
      const total = Math.max(1, Math.ceil(results().length / state.size));
      state.page = ({ first: 1, prev: Math.max(1, state.page - 1), next: Math.min(total, state.page + 1), last: total })[target.dataset.page];
      state.bulk = false;
      resetSelection();
      render();
      list.scrollTop = 0;
      say(`第 ${state.page} 页，共 ${total} 页。`);
      return;
    }
    if (target.dataset.tag) {
      const tag = target.dataset.tag;
      state.tagState[tag] = ((state.tagState[tag] || 0) + 1) % 3;
      reloadList();
      say(tag + '：' + filterWords[state.tagState[tag]]);
      return;
    }
    if (target.dataset.item) {
      const item = byId.get(target.dataset.item);
      if (state.bulk) toggleItem(item.id, event.shiftKey);
      else explain(itemName(item), item.kind === 'folder'
        ? '这里演示文件夹入口。它用于归类角色；本预览仅显示打开反馈，不读取或修改真实文件夹。'
        : item.kind === 'group'
          ? '这里演示群聊入口。示例成员为管理员、陈千语；本预览不打开真实群聊或改变成员。'
          : '这里演示角色条目的打开反馈，并显示完整姓名。备注、标签和排序数据均为虚构测试内容；本页不读取或改变真实角色。');
      return;
    }
    const action = target.dataset.action;
    if (!action) return;
    if (action === 'pin') {
      state.pinned = !state.pinned;
      render(false);
      say(state.pinned ? '已显示固定状态；这里只切换预览图标。' : '已取消预览固定状态。');
      return;
    }
    if (action === 'characters') {
      state.grid = false;
      render(false);
      list.scrollTop = 0;
      say('已返回列表视图顶部；筛选、当前页与选择保持。');
      return;
    }
    if (['create', 'file', 'url', 'group', 'manage', 'extra'].includes(action)) {
      explain(labels[action], '这里演示入口位置与点击反馈。角色管理合并预览不会打开真实编辑器、读取文件、访问外部 URL、创建群聊或修改标签。');
      return;
    }
    if (action === 'search') {
      state.searchOpen = !state.searchOpen;
      render(false);
      if (state.searchOpen) searchInput.focus();
      say(state.searchOpen ? '搜索栏已展开。' : '搜索栏已收起；已有搜索词仍参与筛选。');
      return;
    }
    if (Object.hasOwn(state.filters, action)) {
      state.filters[action] = (state.filters[action] + 1) % 3;
      reloadList();
      say(labels[action] + '：' + filterWords[state.filters[action]]);
      return;
    }
    if (action === 'tags') {
      state.showTags = !state.showTags;
      render(false);
      say(state.showTags ? '标签列表已展开。' : '标签列表已收起；已选标签仍参与筛选。');
      return;
    }
    if (action === 'clear') {
      state.filters = { favorites: 0, groups: 0, folders: 0 };
      state.tagState = {};
      setSearch('');
      say('已清除搜索词和筛选条件。');
      return;
    }
    if (action === 'grid') {
      state.grid = !state.grid;
      render(false);
      say(`已切换为${state.grid ? '网格' : '列表'}视图；筛选、当前页与已选角色保持。`);
      return;
    }
    if (action === 'bulk') {
      state.bulk = !state.bulk;
      resetSelection();
      render(false);
      say(state.bulk ? '批量编辑已展开。可点选角色；Shift 点击选择当前页的一段，群聊和文件夹不参与。' : '已退出批量编辑。');
      return;
    }
    if (action === 'all') {
      const eligible = currentRows().filter(item => !item.kind);
      const allSelected = eligible.every(item => state.selected.has(item.id));
      for (const item of eligible) allSelected ? state.selected.delete(item.id) : state.selected.add(item.id);
      state.lastSelected = null;
      state.lastSelectionMode = undefined;
      render(false);
      say(allSelected ? '已取消当前页的全部选择。' : `已选择当前页 ${eligible.length} 个可编辑角色；群聊和文件夹不参与。`);
      return;
    }
    if (action === 'delete') explain('批量删除 · 入口预览', `已选择 ${state.selected.size} 个示例角色。这里仅演示删除入口的状态和点击反馈，没有删除任何数据。`);
  });
  proposal.addEventListener('contextmenu', event => {
    const row = event.target.closest('[data-item]');
    if (state.bulk && row && !row.disabled) {
      event.preventDefault();
      explain('批量角色操作', '这里保留批量模式的右键反馈。当前预览没有实现编辑菜单，也不会修改角色数据。');
    }
  });
  searchInput.addEventListener('input', event => { setSearch(event.target.value); say(`当前有 ${results().length} 个匹配示例。`); });
  proposal.querySelector('.sort-order').addEventListener('change', event => {
    state.sort = event.target.value;
    if (state.sort !== 'search') state.lastSort = state.sort;
    if (state.sort === 'random') state.randomOrder = new Map(examples.map(item => [item.id, Math.random()]));
    reloadList();
    say('排序：' + sortOptions.find(option => option[0] === state.sort)[1] + (['new', 'old', 'recent', 'mostChats', 'leastChats', 'mostTokens', 'leastTokens'].includes(state.sort) ? '（使用虚构测试数值）。' : '。'));
  });
  proposal.querySelector('.page-size').addEventListener('change', event => { state.size = Number(event.target.value); reloadList(); say(`每页 ${state.size} 项。`); });
  $('#preview-width').addEventListener('change', event => document.documentElement.style.setProperty('--preview-width', event.target.value + 'px'));
  $('#long-content').addEventListener('change', event => {
    state.longContent = event.target.checked;
    renderHotswaps();
    render();
    say(state.longContent ? '已展开角色、群聊、文件夹的长名称与长版本；点击条目可查看完整姓名。' : '已恢复原始名称与版本示例。');
  });
  $('#long-tags').addEventListener('change', event => {
    state.longTags = event.target.checked;
    state.showTags = state.longTags || state.showTags;
    renderTags();
    render();
    say(state.longTags ? '已加入长标签，筛选区与角色条目一起展示。' : '已移除长标签测试内容。');
  });
  $('#extension-buttons').addEventListener('change', event => {
    state.extensions = event.target.checked;
    proposal.querySelector('.extra-buttons').innerHTML = state.extensions ? iconButton('extra') + iconButton('extra') : '';
    say(state.extensions ? '模拟两个扩展追加按钮；顺序保持，空间不足时自然换行。' : '已收起扩展追加按钮。');
  });
  $('#short-height').addEventListener('change', event => {
    document.body.classList.toggle('short-height', event.target.checked);
    $('#workbench').classList.toggle('short-height', event.target.checked);
  });
  $('#reduce-motion').addEventListener('change', event => document.body.classList.toggle('reduced-motion', event.target.checked));
  $('#hide-hotswaps').addEventListener('change', event => {
    state.hideHotswaps = event.target.checked;
    proposal.querySelector('.manager-hotswaps').hidden = state.hideHotswaps;
    say(state.hideHotswaps ? '已隐藏收藏快捷栏；收藏筛选和条目标记保持。' : '已显示全部收藏角色的快捷入口。');
  });
  $('#empty-hotswaps')?.addEventListener('change', event => {
    state.emptyHotswaps = event.target.checked;
    renderHotswaps();
    say(state.emptyHotswaps ? '快捷区显示无收藏的示例状态；列表收藏标记保持。' : '已恢复收藏快捷入口。');
  });
  $('#search-empty').addEventListener('click', () => {
    state.searchOpen = true;
    setSearch('未收录的角色');
    searchInput.focus();
    say('无结果示例。可清空搜索词恢复。');
  });
  $('#reset-demo').addEventListener('click', () => {
    state = defaults();
    for (const id of ['long-content', 'long-tags', 'extension-buttons', 'short-height', 'reduce-motion', 'hide-hotswaps', 'empty-hotswaps']) {
      const control = $('#' + id);
      if (control) control.checked = false;
    }
    $('#preview-width').value = '295';
    document.documentElement.style.setProperty('--preview-width', '295px');
    document.body.classList.remove('short-height', 'reduced-motion');
    $('#workbench').classList.remove('short-height');
    proposal.querySelector('.extra-buttons').replaceChildren();
    if ($('#demo-dialog').open) $('#demo-dialog').close();
    renderHotswaps();
    renderTags();
    render();
    list.scrollTop = 0;
    say('已回到初始状态：295px、列表视图、A-Z 排序，共 27 项。');
  });
  document.documentElement.style.setProperty('--preview-width', $('#preview-width').value + 'px');
  renderHotswaps();
  renderTags();
  render();
})();
