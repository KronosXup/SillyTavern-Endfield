(() => {
  'use strict';
  const id = value => document.getElementById(value);
  const create = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const fixture = {
    characters: [
      { id: 'c1', name: '边界记录员', long: '边界记录员——负责记录每一条岔路与长途行程的同行者', description: '负责整理行程与途中见闻。这是一份用于排版验收的虚构样例。', tags: ['常用', '探索'], favorite: true, version: 'V1.2' },
      { id: 'c2', name: '夜班观测站', long: '夜班观测站与永远没有填完的值班记录', description: '多角色场景样例。将人物关系留给简介，不把说明塞进名字。', tags: ['日常', '长篇叙事与人物关系'], version: 'V2.0' },
      { id: 'c3', name: '回程列车', long: '回程列车：尚未到站的旅人及其不肯说完的故事', description: '一段缓慢的旅途，用来检查两行以上标题与中文标点。', tags: ['探索'], version: 'V1.0' },
      { id: 'c4', name: '没有头像的档案', long: '没有头像的档案也需要一个完整且可以读清楚的名称', description: '头像缺失的示例。保留原来的尺寸和文字位置。', tags: ['日常'], missing: true, version: 'V0.9' },
      { id: 'c5', name: '旧港维修员', long: '旧港维修员——NorthHarborMaintenanceArchiveWithoutAbbreviation', description: '混合中文与连续英文字符，验证窄抽屉是否溢出。', tags: ['常用', '日常'], favorite: true, version: 'V1.1' },
      { id: 'c6', name: '长路的另一端', long: '长路的另一端：关于一个漫长约定的补充叙事与人物关系记录', description: '较长说明不会挤掉标签，完整内容仍可在预览区阅读。', tags: ['探索', '长篇叙事与人物关系'], version: 'V3.0' },
    ],
    personas: [
      { id: 'p1', name: '随行记录者', long: '随行记录者——与当前队伍同行并负责整理所有见闻的用户角色', description: '一位习惯先观察再开口的同行者。仅为 persona 排版样例。', title: '记录者', defaultPersona: true, locked: true },
      { id: 'p2', name: '临时访客', long: '临时访客：没有预设身份与背景约束的新来者', description: '可以用于不同会话的简短用户角色。', title: '访客' },
      { id: 'p3', name: '没有头像的用户角色', long: '没有头像的用户角色仍然保留名称、简介和原生状态信息', description: '这里演示缺图状态，不代表读取失败的真实账号。', title: '未设置头像', missing: true },
      { id: 'p4', name: '远行者', long: '远行者与一份没有缩写也没有省略任何地名的自我介绍', description: '一段稍长的自我介绍，用来检查封面卡片下方的文本与状态是否完整。', title: '远行者', characterLocked: true },
    ],
    worlds: [
      { id: 'w1', name: '边境通用档案', long: '边境通用档案——区域、设施、岗位与基本生活资料' },
      { id: 'w2', name: '旧港设施与岗位', long: '旧港设施与岗位：所有港区设施及对应管理职能的说明' },
      { id: 'w3', name: '人物关系记录', long: '人物关系记录（包括从前的约定、当前状态与尚未完成的事项）' },
      { id: 'w4', name: '沿途见闻', long: '沿途见闻——NorthboundJourneyNotesWithoutAbbreviation' },
      { id: 'w5', name: '会话补充设定', long: '会话补充设定：仅供这个排版样例使用的一份较长标题' },
    ],
  };
  const meta = {
    characters: { title: '角色档案', eyebrow: 'CHARACTER ARCHIVE', source: '原生角色目录', search: '搜索名称、说明或标签…', entry: '角色', actions: [['user-plus','新增角色'],['file-import','导入角色'],['cloud-arrow-down','从 URL 导入'],['users-gear','创建群聊']] },
    personas: { title: '用户角色', eyebrow: 'PERSONA ARCHIVE', source: '原生用户角色目录', search: '搜索名称或角色描述…', entry: '用户角色', actions: [['person-circle-question','创建用户角色'],['image','上传头像'],['file-export','备份用户角色'],['file-import','恢复用户角色']] },
    worlds: { title: '世界书', eyebrow: 'WORLDS & LOREBOOKS', source: '待编辑选择 / 桌面对照样例', search: '搜索世界书名称…', entry: '世界书', actions: [['globe','新增世界书'],['file-import','导入世界书'],['file-export','导出世界书'],['pencil','重命名世界书'],['clone','复制世界书'],['trash-can','删除世界书']] },
  };
  const createViewStates = () => Object.fromEntries(Object.keys(fixture).map(kind => [kind, { query: '', sort: 'default', filter: 'all', batch: false, empty: false }]));
  const state = { kind: 'characters', filter: 'all', batch: false, selected: new Set(), opened: { characters: 'c1', personas: 'p1', worlds: 'w1' }, views: createViewStates(), worldComparison: { narrow: false, wide: true } };
  const lists = id('catalog-items');
  const search = id('catalog-search');
  const shell = document.querySelector('.catalog-shell');
  const searchTools = id('catalog-search-tools');
  const searchHome = document.createComment('Original catalog search position');
  searchTools.before(searchHome);
  const comparisonControls = id('world-comparison-controls');
  const comparisonToggle = id('world-comparison-toggle');
  const comparisonSearch = id('world-comparison-search');
  const comparisonList = id('catalog-comparison-list');
  const comparisonWidthMode = () => shell.clientWidth <= 620 ? 'narrow' : 'wide';
  let lastComparisonWidthMode = comparisonWidthMode();
  const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
  const titleOf = item => id('catalog-long-titles').checked && item.long ? item.long : item.name;
  const itemInKind = key => fixture[state.kind].find(item => item.id === key);

  function syncWorldComparison(focusBefore = document.activeElement) {
    const isWorld = state.kind === 'worlds';
    const expanded = !isWorld || state.worldComparison[comparisonWidthMode()];
    const searchHadFocus = searchTools.contains(focusBefore);
    const listHadFocus = comparisonList.contains(focusBefore);
    const hiddenByKind = (!isWorld && (comparisonControls.contains(focusBefore) || id('world-selector-strip').contains(focusBefore)))
      || (state.kind !== 'characters' && (id('catalog-filter-row').contains(focusBefore) || id('catalog-batch').contains(focusBefore)))
      || (isWorld && focusBefore === id('catalog-show-missing'));
    let searchMoved = false;
    if (isWorld && searchTools.parentElement !== comparisonSearch) {
      comparisonSearch.append(searchTools); searchMoved = true;
    } else if (!isWorld && searchTools.previousSibling !== searchHome) {
      searchHome.after(searchTools); searchMoved = true;
    }
    comparisonControls.hidden = !isWorld;
    comparisonSearch.hidden = !isWorld || !expanded;
    comparisonList.hidden = !expanded;
    id('catalog-count').hidden = !expanded;
    comparisonToggle.setAttribute('aria-expanded', String(expanded));
    id('world-comparison-label').textContent = expanded ? '收起桌面列表样式' : '查看桌面列表样式';
    document.body.classList.toggle('world-comparison-collapsed', isWorld && !expanded);
    if (!expanded && (searchHadFocus || listHadFocus)) {
      comparisonToggle.focus({ preventScroll: true });
    } else if (hiddenByKind) {
      document.querySelector('.catalog-kind-switch [data-kind="' + state.kind + '"]')?.focus({ preventScroll: true });
    } else if (searchMoved && searchHadFocus) {
      focusBefore.focus({ preventScroll: true });
    }
  }

  function statusLabels(item) {
    if (state.kind === 'characters') return item.tags || [];
    if (state.kind === 'personas') return [
      ...(item.defaultPersona ? ['默认角色'] : []),
      ...(item.locked ? ['锁定当前聊天'] : []),
      ...(item.characterLocked ? ['锁定当前角色'] : []),
      ...(state.opened.personas === item.id ? ['当前角色'] : []),
    ];
    return ['待编辑世界书'];
  }

  function buildAvatar(item, index) {
    const avatar = create('div', 'avatar' + (item.missing ? ' missing-avatar' : ''));
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', item.missing ? '头像缺失的本地样例' : '抽象几何占位，不代表角色形象');
    if (item.missing) {
      const icon = create('i', 'fa-solid fa-image'); icon.setAttribute('aria-hidden', 'true');
      avatar.append(icon, create('small', '', 'NO IMAGE'));
    } else {
      avatar.style.setProperty('--geometry-angle', (index * 14 + 15) + 'deg');
      avatar.style.setProperty('--geometry-radius', index % 2 ? '0%' : '50%');
      const number = create('span', 'geometry-index', String(index + 1).padStart(2, '0'));
      number.setAttribute('aria-hidden', 'true');
      avatar.append(number);
    }
    return avatar;
  }

  function buildItem(item, index) {
    if (state.kind === 'worlds') {
      const button = create('button', 'world-row select2-results__option');
      button.type = 'button'; button.dataset.id = item.id;
      const selected = state.opened.worlds === item.id;
      button.classList.toggle('select2-results__option--selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.append(create('span', 'world-title', titleOf(item)));
      return button;
    }
    const row = create('div', 'catalog-item ' + (state.kind === 'characters' ? 'character_select entity_block' : 'avatar-container'));
    row.dataset.id = item.id; row.tabIndex = 0; row.setAttribute('role','button');
    row.setAttribute('aria-label', titleOf(item));
    if (state.kind === 'characters') {
      row.setAttribute('data-chid', item.id);
      row.classList.toggle('is_fav', Boolean(item.favorite));
      row.classList.toggle('character_selected', state.selected.has(item.id));
      if (state.batch) row.setAttribute('aria-pressed', String(state.selected.has(item.id)));
    } else {
      row.setAttribute('data-avatar-id', item.id);
      row.classList.toggle('selected', state.opened.personas === item.id);
      row.classList.toggle('default_persona', Boolean(item.defaultPersona));
      row.classList.toggle('locked_to_chat', Boolean(item.locked));
      row.classList.toggle('locked_to_character', Boolean(item.characterLocked));
      row.setAttribute('aria-pressed', String(state.opened.personas === item.id));
    }
    const mark = create('span','bulk-mark'); mark.setAttribute('aria-hidden','true');
    row.append(mark, buildAvatar(item, index));
    const text = create('div','character_select_container');
    const name = create('div','character_name_block');
    name.append(create('span','ch_name',titleOf(item)));
    if (item.favorite) { const fav=create('i','ch_fav_icon fa-solid fa-star'); fav.setAttribute('aria-label','收藏'); name.append(fav); }
    name.append(create('small','ch_additional_info',item.version || item.title || ''));
    text.append(name, create('p','ch_description',item.description || ''));
    const labels = create('div', state.kind === 'characters' ? 'tags tags_inline' : 'avatar_container_states');
    for (const label of statusLabels(item)) {
      let className = state.kind === 'characters' ? 'tag' : 'avatar_state';
      if (label === '默认角色') className += ' default';
      if (label.startsWith('锁定')) className += ' locked';
      if (label === '当前角色') className += ' current';
      labels.append(create('span',className,label));
    }
    text.append(labels);
    row.append(text);
    return row;
  }

  function filteredItems() {
    if (id('catalog-empty-toggle').checked) return [];
    const query = search.value.trim().toLocaleLowerCase();
    let items = fixture[state.kind].filter(item => {
      if (item.missing && !id('catalog-show-missing').checked) return false;
      if (state.kind === 'characters' && state.filter !== 'all' && !(item.tags || []).includes(state.filter)) return false;
      const haystack = [item.name,item.long,item.description,...(item.tags || [])].filter(Boolean).join(' ').toLocaleLowerCase();
      return !query || haystack.includes(query);
    });
    const sort = id('catalog-sort').value;
    if (sort !== 'default') items = [...items].sort((a,b) => collator.compare(titleOf(a),titleOf(b)) * (sort === 'desc' ? -1 : 1));
    return items;
  }

  function updateDetail() {
    const item = itemInKind(state.opened[state.kind]);
    if (!item || id('catalog-empty-toggle').checked) {
      id('detail-title').textContent = '等待选择';
      id('detail-description').textContent = id('catalog-empty-toggle').checked
        ? (state.kind === 'worlds' && document.body.classList.contains('world-comparison-collapsed') ? '当前为空列表示例。取消“空列表”，或展开桌面样例后恢复。' : '恢复样例后，可以继续查看标题、标签和选中状态。')
        : '从当前目录选择一项，完整名称会显示在这里。';
      id('detail-index').textContent = '—';
      id('detail-kicker').textContent = 'PREVIEW RECORD';
      id('detail-tags').replaceChildren();
      id('detail-state').textContent = '暂无可预览条目。管理入口仍然保留。';
      return;
    }
    id('detail-title').textContent = titleOf(item);
    id('detail-description').textContent = item.description || '这是原生世界书选择列表的本地样例，没有读取实际条目或书内数据。';
    id('detail-index').textContent = String(fixture[state.kind].indexOf(item) + 1).padStart(2,'0');
    id('detail-kicker').textContent = state.kind === 'worlds' ? 'PICK TO EDIT' : state.kind === 'personas' ? 'CURRENT PERSONA' : 'PREVIEW RECORD';
    id('detail-tags').replaceChildren(...statusLabels(item).map(label=>create('span','',label)));
    const messages = {
      characters: state.batch ? '黄色勾选属于批量选择，与当前聊天身份无关。' : '点角色仅更新此处，不打开真实聊天。',
      personas: '当前 persona、默认 persona 与聊天锁定分别保留标记。',
      worlds: '选中仅表示待编辑，不自动改变全局世界书激活状态。',
    };
    const filteredOut = !document.body.classList.contains('world-comparison-collapsed') && !filteredItems().some(entry => entry.id === item.id);
    id('detail-state').textContent = messages[state.kind] + (filteredOut ? ' 当前预览项位于筛选结果之外。' : '');
  }

  function renderList({ focusId } = {}) {
    const items = filteredItems();
    lists.className = 'catalog-items' + (state.batch && state.kind === 'characters' ? ' bulk_select' : '');
    lists.setAttribute('aria-label',meta[state.kind].entry + '样例条目');
    lists.replaceChildren(...items.map(item => buildItem(item,fixture[state.kind].indexOf(item))));
    const empty = items.length === 0;
    id('catalog-empty').hidden = !empty;
    lists.hidden = empty;
    const forced = id('catalog-empty-toggle').checked;
    id('catalog-empty-title').textContent = forced ? '这里还没有' + meta[state.kind].entry + '样例' : '没有匹配的档案';
    id('catalog-empty-description').textContent = forced ? '原生管理入口仍在上面。当前仅演示空列表。' : '尝试换一个词或清空筛选。没有删除任何条目。';
    id('catalog-restore').textContent = forced ? '恢复样例' : '清空筛选';
    id('catalog-count').textContent = items.length + ' 项样例';
    id('catalog-result-note').textContent = items.length + ' / ' + fixture[state.kind].length + ' 个本地样例';
    id('catalog-batch-count').textContent = state.kind === 'characters' && state.batch ? '已勾选 ' + state.selected.size + ' 项' : '';
    id('catalog-selection-hint').textContent = state.kind === 'characters' ? (state.batch ? '批量勾选，不执行编辑' : '点条目查看示例') : state.kind === 'personas' ? '选择当前用户角色样例' : '选择待编辑的世界书';
    updateDetail();
    if (focusId) [...lists.querySelectorAll('[data-id]')].find(node => node.dataset.id === focusId)?.focus({preventScroll:true});
  }

  function refreshWorldSelect() {
    const select = id('world_editor_select');
    select.replaceChildren(create('option','','请选择'));
    select.options[0].value = '';
    if (id('catalog-empty-toggle').checked) {
      select.options[0].textContent = '暂无世界书样例';
      select.disabled = true;
      return;
    }
    select.disabled = false;
    for (const item of fixture.worlds) {
      const option = create('option','',titleOf(item)); option.value = item.id; select.append(option);
    }
    select.value = state.opened.worlds || '';
  }

  function renderHeader() {
    const focusBefore = document.activeElement;
    const info = meta[state.kind];
    document.body.dataset.kind = state.kind;
    id('catalog-title').textContent = info.title;
    id('catalog-eyebrow').textContent = info.eyebrow;
    id('catalog-source').textContent = info.source;
    search.placeholder = info.search;
    id('catalog-filter-row').hidden = state.kind !== 'characters';
    id('catalog-batch').hidden = state.kind !== 'characters';
    id('catalog-batch').setAttribute('aria-pressed',String(state.batch));
    id('world-selector-strip').hidden = state.kind !== 'worlds';
    id('world-mode-notice').hidden = state.kind !== 'worlds';
    id('catalog-show-missing').disabled = state.kind === 'worlds';
    id('catalog-list-label').textContent = state.kind === 'worlds' ? '桌面选择列表样例' : '档案列表';
    id('native-entry-actions').replaceChildren(...info.actions.map(([icon,label]) => {
      const button=create('button',''); button.type='button';button.title=label;button.setAttribute('aria-label',label);
      button.dataset.nativeAction=label;
      if (label.startsWith('删除')) button.dataset.danger='true';
      const glyph=create('i','fa-solid fa-'+icon);glyph.setAttribute('aria-hidden','true');button.append(glyph);
      return button;
    }));
    for (const button of document.querySelectorAll('.catalog-kind-switch [data-kind]')) button.setAttribute('aria-pressed',String(button.dataset.kind===state.kind));
    refreshWorldSelect();
    syncWorldComparison(focusBefore);
  }

  function selectItem(key) {
    const item=itemInKind(key);if(!item)return;
    state.opened[state.kind]=key;
    if (state.kind==='characters' && state.batch) {
      if (state.selected.has(key)) state.selected.delete(key); else state.selected.add(key);
    }
    if (state.kind==='worlds') id('world_editor_select').value=key;
    renderList({focusId:key});
  }

  for(const button of document.querySelectorAll('.catalog-kind-switch [data-kind]')) {
    button.addEventListener('click',()=> {
      if (state.kind === button.dataset.kind) return;
      state.views[state.kind] = { query: search.value, sort: id('catalog-sort').value, filter: state.filter, batch: state.batch, empty: id('catalog-empty-toggle').checked };
      state.kind=button.dataset.kind;
      const view = state.views[state.kind]; state.filter=view.filter; state.batch=view.batch;
      search.value=view.query; id('catalog-sort').value=view.sort; id('catalog-empty-toggle').checked=view.empty;
      for(const filter of document.querySelectorAll('[data-filter]'))filter.setAttribute('aria-pressed',String(filter.dataset.filter===state.filter));
      id('catalog-action-result').textContent='尚未调用管理入口。';
      renderHeader();renderList();
    });
  }
  lists.addEventListener('click',event=> {
    const target=event.target.closest('[data-id]');if(target)selectItem(target.dataset.id);
  });
  lists.addEventListener('keydown',event=> {
    if((event.key!=='Enter'&&event.key!==' ')||event.target.tagName==='BUTTON')return;
    const target=event.target.closest('[data-id]');if(!target)return;
    event.preventDefault();selectItem(target.dataset.id);
  });

  id('native-entry-actions').addEventListener('click',event=> {
    const button=event.target.closest('[data-native-action]');if(!button)return;
    const text=button.dataset.nativeAction + '：仅展示入口反馈，没有修改或传输任何真实数据。';
    id('catalog-action-result').textContent=text;
    window.EF.toast('示例入口：'+button.dataset.nativeAction);
  });
  id('catalog-batch').addEventListener('click',()=> {
    state.batch=!state.batch;if(!state.batch)state.selected.clear();
    id('catalog-batch').setAttribute('aria-pressed',String(state.batch));
    renderList();
  });
  search.addEventListener('input',()=>renderList());
  id('catalog-clear-search').addEventListener('click',()=> { search.value='';renderList();search.focus({preventScroll:true}); });
  id('catalog-sort').addEventListener('change',()=>renderList());
  id('catalog-long-titles').addEventListener('change',()=> { refreshWorldSelect();renderList(); });
  id('catalog-show-missing').addEventListener('change',()=>renderList());
  id('catalog-empty-toggle').addEventListener('change',()=> { refreshWorldSelect();renderList(); });
  id('catalog-narrow-toggle').addEventListener('change',event=>document.body.classList.toggle('catalog-narrow',event.target.checked));
  comparisonToggle.addEventListener('click',()=> {
    const mode = comparisonWidthMode();
    state.worldComparison[mode] = !state.worldComparison[mode];
    syncWorldComparison(); updateDetail();
  });
  new ResizeObserver(()=> {
    const mode = comparisonWidthMode();
    if (mode === lastComparisonWidthMode) return;
    lastComparisonWidthMode = mode;
    syncWorldComparison(); updateDetail();
  }).observe(shell);
  for(const button of document.querySelectorAll('[data-filter]')) {
    button.addEventListener('click',()=> {
      state.filter=button.dataset.filter;
      for(const filter of document.querySelectorAll('[data-filter]'))filter.setAttribute('aria-pressed',String(filter===button));
      renderList();
    });
  }
  id('world_editor_select').addEventListener('change',event=> {
    state.opened.worlds=event.target.value || null;renderList();
    window.EF.toast(event.target.value ? '已选择待编辑世界书样例' : '已清除待编辑世界书选择');
  });

  function clearFilters() {
    search.value='';state.filter='all';id('catalog-sort').value='default';
    id('catalog-show-missing').checked=true;id('catalog-empty-toggle').checked=false;
    for(const filter of document.querySelectorAll('[data-filter]'))filter.setAttribute('aria-pressed',String(filter.dataset.filter==='all'));
  }
  id('catalog-restore').addEventListener('click',()=> { clearFilters();refreshWorldSelect();renderList();search.focus({preventScroll:true}); });
  id('catalog-reset').addEventListener('click',()=> {
    clearFilters();state.batch=false;state.selected.clear();
    state.views=createViewStates(); state.worldComparison={narrow:false,wide:true};
    state.opened={characters:'c1',personas:'p1',worlds:'w1'};
    id('catalog-long-titles').checked=false;id('catalog-narrow-toggle').checked=false;
    document.body.classList.remove('catalog-narrow');
    id('catalog-action-result').textContent='尚未调用管理入口。';
    renderHeader();renderList();window.EF.toast('已重置目录样例');
  });
  renderHeader();renderList();
})();
