// Independent proposal data. Nothing in this module reads or writes a host account.
export const personalInitialState = {
  settings: {
    search: '', language: '简体中文', theme: 'Endfield · 中性灰', themeNames: ['Endfield · 中性灰', '默认示例'], savedThemes: {},
    avatarStyle: '圆角', chatStyle: '平面', mediaStyle: '画廊', notificationPosition: '右下角',
    textColor: '#eeeeee', emphasisColor: '#fffa00', panelColor: '#303030', borderColor: '#555555',
    chatWidth: 80, fontScale: 1, blurStrength: 8, shadowWidth: 1,
    reducedMotion: false, noBlur: false, noShadow: true, visualNovel: false, messageActions: true, timestamps: true, messageTokens: false, compactInput: true,
    charSubheader: '角色版本', importTags: '询问', advancedSearch: true, preferCharPrompt: true, preferCharInstructions: false, animatedBackgrounds: false, spoilerFree: false,
    smoothStreaming: true, excludeThinking: true, streamingSpeed: 50, messageSound: false, restoreInput: true, markdownHotkeys: true, movablePanels: false,
    customCSS: '/* 本页示例；文本不会写入酒馆。 */\n.example-message {\n  line-height: 1.65;\n}', savedCSS: '',
    chatTruncation: 100, streamingFPS: 30, exampleBehavior: '逐渐挤出', sendOnEnter: '自动（电脑）', swipes: true, gestures: true, autoScroll: true, confirmDelete: true, externalMedia: false,
    autoSwipe: false, autoSwipeLength: 80, blacklist: '', blacklistCount: 1,
    autoContinue: false, allowChatCompletion: false, targetLength: 300,
    autocomplete: '输入长度 > 1', autocompleteMatching: '模糊匹配', autocompleteStyle: '跟随主题', autocompleteKeys: 'Tab 或 Enter', autocompleteDetails: true,
    strictEscaping: false, replaceGetvar: false,
  },
  backgrounds: {
    tab: 'global', search: '', sort: 'az', fitting: 'cover', folderId: '', selectionMode: false, selectedIds: [], thumbSize: 180,
    currentId: 'room', lockedId: 'room', nextId: 4,
    items: [
      { id: 'room', name: '室内', src: './assets/background-placeholder.svg', created: 1 },
      { id: 'night', name: '夜景', src: './assets/background-placeholder.svg', created: 2 },
      { id: 'base', name: '晴空', src: './assets/background-placeholder.svg', created: 3 },
    ],
    chatItems: [{ id: 'chat-base', name: '晴空 · 聊天示例', src: './assets/background-placeholder.svg', created: 4 }],
    folders: [{ id: 'folder-place', name: '场景', itemIds: ['room', 'base'] }, { id: 'folder-night', name: '夜间', itemIds: ['night'] }],
  },
  extensions: {
    notify: true, autoConnect: false, extrasURL: '', extrasKey: '', extrasStatus: '未连接',
    expressionAPI: '本地', expressionTranslate: false, expressionMultiple: true,
    imageSource: 'ComfyUI', imageWidth: 768, imageHeight: 1024, imageEditPrompt: true,
    ttsProvider: '浏览器语音', ttsAuto: false, ttsSpeed: 1,
    quickReplyEnabled: true, quickReplyText: '继续观察周围。', translationProvider: '禁用', translationMode: '仅输入',
    summaryEnabled: false, summaryInterval: 20, vectorSource: '本地', vectorChat: false, regexEnabled: true,
    items: [
      { id: 'assets', name: '资源下载', enabled: true, builtin: true, version: '内置', description: '查看示例资源项目。' },
      { id: 'expressions', name: '角色表情', enabled: true, builtin: true, version: '内置', description: '表情分类与立绘选择。' },
      { id: 'images', name: '图像生成', enabled: true, builtin: true, version: '内置', description: '生成来源与图片尺寸。' },
      { id: 'tts', name: '文字转语音', enabled: true, builtin: true, version: '内置', description: '语音来源与自动朗读。' },
      { id: 'quickreply', name: '快速回复', enabled: true, builtin: true, version: '内置', description: '常用文字与快捷操作。' },
      { id: 'translation', name: '聊天翻译', enabled: true, builtin: true, version: '内置', description: '翻译来源与作用范围。' },
      { id: 'regex', name: '正则', enabled: true, builtin: true, version: '内置', description: '文本规则示例。' },
      { id: 'vectors', name: '向量存储', enabled: true, builtin: true, version: '内置', description: '聊天记录的检索设置。' },
      { id: 'summary', name: '摘要', enabled: false, builtin: true, version: '内置', description: '按消息间隔整理摘要。' },
    ], nextId: 1, downloadedAssets: [],
  },
  personas: {
    search: '', sort: 'asc', grid: false, page: 1, selectedId: 'visitor', nextId: 4,
    defaultId: 'visitor', characterIds: ['recorder'], chatId: 'visitor', notifications: true, multipleConnections: true, autoLock: false,
    items: [
      { id: 'visitor', name: '访客', description: '一位刚到基地的访客。先观察环境，再决定接下来要做什么。', position: 'manager', depth: 2, role: 'system', lorebook: '' },
      { id: 'recorder', name: '记录员', description: '负责整理见闻与对话记录。表达清楚，重视时间、地点和事实。', position: 'depth', depth: 2, role: 'system', lorebook: '基地见闻 · 示例' },
      { id: 'traveler', name: '旅人', description: '一位短暂停留的旅人。随身带着笔记本，喜欢询问不熟悉的事物。', position: 'author-bottom', depth: 4, role: 'user', lorebook: '' },
    ],
  },
};

const clone = value => JSON.parse(JSON.stringify(value));
const attrs = (ctx, values) => Object.entries(values).map(([key, value]) => `data-${key}="${ctx.esc(value)}"`).join(' ');
const plain = (ctx, title, body) => `<section class="plain-section"><h3 class="group-title">${ctx.esc(title)}</h3>${body}</section>`;
const intro = text => `<p class="panel-intro muted">${text}</p>`;
const field = (ctx, prefix, name, label, extra = {}) => ctx.field({ path: `${prefix}.${name}`, label, ...extra });
const toggle = (ctx, prefix, name, label, extra = {}) => ctx.toggle({ path: `${prefix}.${name}`, label, ...extra });
const actionButton = (ctx, label, action, extra = {}) => ctx.button(label, action, extra);
const option = (value, label) => ({ value, label });
const selectedPersona = state => state.personas.items.find(item => item.id === state.personas.selectedId) || state.personas.items[0];
const allBackgrounds = state => [...state.backgrounds.items, ...state.backgrounds.chatItems];
const modalValue = (dialog, name) => String(dialog.querySelector(`[name="${name}"]`)?.value || '').trim();
const modalInput = (ctx, name, label, value = '', type = 'text') => `<label class="setting-row"><span class="field-label">${ctx.esc(label)}</span><input class="control" name="${name}" type="${type}" value="${ctx.esc(value)}" autocomplete="off"></label>`;
const modalSelect = (ctx, name, label, choices) => `<label class="setting-row"><span class="field-label">${ctx.esc(label)}</span><select class="control" name="${name}">${choices.map(item => `<option value="${ctx.esc(item.value)}">${ctx.esc(item.label)}</option>`).join('')}</select></label>`;

function highlightSettingsHTML(html, query, ctx) {
  if (!query.trim()) return html;
  let skip = '';
  return html.split(/(<[^>]+>)/g).map(part => {
    if (part.startsWith('<')) {
      const opening = part.match(/^<(h[1-6]|textarea|option|script|style)\b/i);
      if (opening) skip = opening[1].toLowerCase();
      if (skip && new RegExp(`^</${skip}\\s*>`, 'i').test(part)) skip = '';
      return part;
    }
    if (skip || !part.toLocaleLowerCase().includes(query.toLocaleLowerCase())) return part;
    const decoded = part.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
    return ctx.highlight(decoded, query);
  }).join('');
}

function renderSettings(ctx) {
  const s = ctx.state.settings;
  const f = (name, label, extra) => field(ctx, 'settings', name, label, extra);
  const t = (name, label, extra) => toggle(ctx, 'settings', name, label, extra);
  const ui = plain(ctx, 'UI 主题',
    `<div class="preset-line">${f('theme', '主题', { type: 'select', options: s.themeNames })}<div class="actions">${actionButton(ctx, '保存', 'personal-theme-save', { icon: 'save', title: '保存当前主题到本页' })}${actionButton(ctx, '另存为', 'personal-theme-save-as', { icon: 'plus' })}${actionButton(ctx, '导出', 'personal-theme-export', { icon: 'export' })}</div></div>` +
    f('avatarStyle', '头像样式', { type: 'select', options: ['圆形', '方形', '圆角', '矩形'] }) +
    f('chatStyle', '聊天样式', { type: 'select', options: ['平面', '气泡', '文档'] }) +
    f('mediaStyle', '媒体样式', { type: 'select', options: ['列表', '画廊'] }) +
    f('notificationPosition', '通知位置', { type: 'select', options: ['左上角', '右上角', '左下角', '右下角'] }));
  const colors = ctx.section('主题颜色',
    f('textColor', '主要文本', { type: 'color' }) + f('emphasisColor', '引用文本', { type: 'color' }) +
    f('panelColor', '界面背景', { type: 'color' }) + f('borderColor', '界面边框', { type: 'color' }), { id: 'personal-settings-colors', open: false, meta: '4 项示例' });
  const appearance = plain(ctx, '显示',
    f('chatWidth', '页面宽度', { type: 'range', min: 25, max: 100, step: 1 }) +
    f('fontScale', '字体比例', { type: 'range', min: 0.5, max: 1.5, step: 0.01 }) +
    f('blurStrength', '模糊强度', { type: 'range', min: 0, max: 30, step: 1, disabled: s.noBlur }) +
    f('shadowWidth', '文本阴影宽度', { type: 'range', min: 0, max: 5, step: 1, disabled: s.noShadow }) +
    t('reducedMotion', '减少动画') + t('noBlur', '无模糊效果') + t('noShadow', '无文本阴影') + t('visualNovel', '视觉小说模式') +
    t('messageActions', '展开消息操作') + t('timestamps', '聊天时间戳') + t('messageTokens', '显示消息 Token 数') + t('compactInput', '紧凑输入区域（移动端）'));
  const characters = plain(ctx, '角色处理',
    f('charSubheader', '角色列表副标题', { type: 'select', options: ['角色版本', '作者'] }) +
    f('importTags', '导入角色卡标签', { type: 'select', options: ['询问', '不导入', '全部', '已有标签'] }) +
    t('advancedSearch', '高级角色搜索') + t('preferCharPrompt', '优先使用角色卡提示词') + t('preferCharInstructions', '优先使用角色卡指令') +
    t('animatedBackgrounds', '背景缩略图动画') + t('spoilerFree', '无剧透模式'));
  const misc = plain(ctx, '杂项',
    t('smoothStreaming', '平滑流式输出') + t('excludeThinking', '排除“思考中…”', { disabled: !s.smoothStreaming }) +
    f('streamingSpeed', '流式输出速度', { type: 'range', min: 0, max: 100, step: 10, disabled: !s.smoothStreaming }) +
    t('messageSound', '消息提示音') + t('restoreInput', '恢复用户输入') + t('markdownHotkeys', 'Markdown 快捷键') + t('movablePanels', '可移动界面面板'));
  const css = plain(ctx, '自定义 CSS', f('customCSS', '样式文本', { type: 'textarea', rows: 8, wide: true, help: '此处只编辑本页示例文本。' }) +
    `<div class="actions">${actionButton(ctx, '保存示例文本', 'personal-css-save', { icon: 'save' })}${actionButton(ctx, '导出 CSS', 'personal-css-export', { icon: 'export' })}</div>`);
  const messages = plain(ctx, '聊天/消息处理',
    f('chatTruncation', '加载的消息数量', { type: 'range', min: 0, max: 1000, step: 5 }) +
    f('streamingFPS', '流式输出帧率', { type: 'range', min: 5, max: 100, step: 5 }) +
    f('exampleBehavior', '示例消息处理', { type: 'select', options: ['逐渐挤出', '始终包含示例', '从不包含示例'] }) +
    f('sendOnEnter', '按 Enter 发送', { type: 'select', options: ['禁用', '自动（电脑）', '启用'] }) +
    t('swipes', '备选回复') + t('gestures', '手势') + t('autoScroll', '自动滚动聊天') + t('confirmDelete', '删除消息前确认') + t('externalMedia', '禁止外部媒体'));
  const automatic = ctx.section('自动生成备选回复', t('autoSwipe', '启用') +
    f('autoSwipeLength', '最短生成消息长度', { type: 'number', min: 0, disabled: !s.autoSwipe }) +
    f('blacklist', '黑名单词语', { type: 'textarea', rows: 2, placeholder: '以逗号分隔', disabled: !s.autoSwipe }) +
    f('blacklistCount', '触发所需黑名单词数', { type: 'number', min: 1, disabled: !s.autoSwipe }), { id: 'personal-settings-auto-swipe', open: false }) +
    ctx.section('自动续写', t('autoContinue', '启用') + t('allowChatCompletion', '允许聊天补全 API', { disabled: !s.autoContinue }) +
    f('targetLength', '目标长度（Token）', { type: 'number', min: 0, max: 1024, disabled: !s.autoContinue }), { id: 'personal-settings-auto-continue', open: false });
  const completion = ctx.section('自动补全设置',
    f('autocomplete', '可见性', { type: 'select', options: ['不显示', '输入长度 > 1', '始终显示'] }) +
    f('autocompleteMatching', '匹配方式', { type: 'select', options: ['以此开头', '包含', '模糊匹配'] }) +
    f('autocompleteStyle', '样式', { type: 'select', options: ['跟随主题', '深色', '浅色'] }) +
    f('autocompleteKeys', '键盘选择', { type: 'select', options: ['Tab 或 Enter', '仅 Tab', '仅 Enter'] }) + t('autocompleteDetails', '自动隐藏详情'), { id: 'personal-settings-autocomplete', open: false }) +
    ctx.section('ST脚本设置', t('strictEscaping', 'STRICT_ESCAPING') + t('replaceGetvar', 'REPLACE_GETVAR'), { id: 'personal-settings-stscript', open: false });
  const html = `<div class="panel-body">${intro('主题、显示与聊天行为。搜索只高亮文字，保留各分组的位置。')}
    <div class="list-toolbar">${f('search', '搜索设置', { type: 'search', placeholder: '输入字段名称' })}${f('language', '语言', { type: 'select', options: ['简体中文', 'English'] })}${actionButton(ctx, '恢复本页示例', 'personal-settings-reset', { icon: 'reset' })}</div>
    <div class="columns"><div class="form-stack">${ui}${colors}${appearance}</div><div class="form-stack">${characters}${misc}${css}</div><div class="form-stack">${messages}${automatic}${completion}</div></div>
    </div>`;
  return highlightSettingsHTML(html, s.search, ctx);
}

function renderBackgroundCard(item, ctx) {
  const b = ctx.state.backgrounds;
  const active = b.currentId === item.id, locked = b.lockedId === item.id, selected = b.selectedIds.includes(item.id);
  const classes = ['resource-card', active && 'is-active', locked && 'is-locked', selected && 'is-batch'].filter(Boolean).join(' ');
  return `<article class="${classes}" ${attrs(ctx, { background: item.id })}>
    <button class="resource-preview" type="button" data-action="personal-bg-select" ${attrs(ctx, { id: item.id })} aria-label="${ctx.esc(`${b.selectionMode ? '切换批选' : '使用背景'}：${item.name}`)}" aria-pressed="${b.selectionMode ? selected : active}"><img src="${ctx.esc(item.src)}" alt="${ctx.esc(item.name)}" loading="lazy"></button>
    <div class="card-copy"><strong class="item-title">${ctx.esc(item.name)}</strong><div class="status-line">${active ? '<span class="tag">当前使用</span>' : ''}${locked ? `<span class="tag">${ctx.icon('lock')} 聊天锁定</span>` : ''}${selected ? `<span class="tag">${ctx.icon('check')} 已批选</span>` : ''}${!active && !locked && !selected ? '<span class="muted">可用背景</span>' : ''}</div>
    <div class="actions">${actionButton(ctx, locked ? '解锁' : '锁定', 'personal-bg-lock', { icon: locked ? 'unlock' : 'lock', attrs: attrs(ctx, { id: item.id }), kind: 'ghost' })}${actionButton(ctx, '改名', 'personal-bg-rename', { icon: 'edit', attrs: attrs(ctx, { id: item.id }), kind: 'ghost' })}${actionButton(ctx, '移除', 'personal-bg-delete', { icon: 'trash', attrs: attrs(ctx, { id: item.id }), kind: 'ghost' })}</div></div></article>`;
}

function renderBackgrounds(ctx) {
  const b = ctx.state.backgrounds;
  const folder = b.folders.find(item => item.id === b.folderId);
  let items = [...(b.tab === 'chat' ? b.chatItems : b.items)];
  if (b.tab === 'global' && folder) items = items.filter(item => folder.itemIds.includes(item.id));
  if (b.search.trim()) items = items.filter(item => item.name.toLocaleLowerCase().includes(b.search.trim().toLocaleLowerCase()));
  items.sort((a, z) => b.sort === 'newest' ? z.created - a.created : b.sort === 'oldest' ? a.created - z.created : a.name.localeCompare(z.name, 'zh-CN') * (b.sort === 'za' ? -1 : 1));
  const folders = b.tab === 'global' && !folder && !b.search.trim() ? `<div class="folder-row">${b.folders.map(item => actionButton(ctx, `${item.name} · ${item.itemIds.length}`, 'personal-bg-folder', { icon: 'folder', attrs: attrs(ctx, { id: item.id }) })).join('')}</div>` : '';
  const breadcrumb = folder && b.tab === 'global' ? `<div class="folder-row">${actionButton(ctx, '所有文件夹', 'personal-bg-folder', { icon: 'back', attrs: 'data-id=""', kind: 'ghost' })}<strong>${ctx.esc(folder.name)}</strong><span class="muted">${items.length} 张</span>${actionButton(ctx, '重命名文件夹', 'personal-bg-folder-rename', { icon: 'edit', kind: 'ghost' })}</div>` : '';
  const batch = b.selectionMode && b.tab === 'global' ? `<div class="selection-bar"><span>已选择 <strong>${b.selectedIds.length}</strong> 张</span>${actionButton(ctx, '加入文件夹', 'personal-bg-batch-folder', { icon: 'folder', disabled: !b.selectedIds.length })}${folder ? actionButton(ctx, '从此文件夹移出', 'personal-bg-batch-remove', { icon: 'back', disabled: !b.selectedIds.length }) : ''}${actionButton(ctx, '清空选择', 'personal-bg-batch-clear', { kind: 'ghost', disabled: !b.selectedIds.length })}</div>` : '';
  return `<div class="panel-body">${intro('示例素材库。当前背景、聊天锁定和批量选择分别标记。')}
    <div class="list-toolbar">${field(ctx, 'backgrounds', 'fitting', '背景图片尺寸', { type: 'select', options: [option('classic', '经典'), option('cover', '填充'), option('contain', '不变换'), option('stretch', '拉伸'), option('center', '居中')] })}<div class="actions">${actionButton(ctx, '自动选择', 'personal-bg-auto', { icon: 'refresh' })}${actionButton(ctx, '新建文件夹', 'personal-bg-new-folder', { icon: 'folder' })}${actionButton(ctx, '添加背景', 'personal-bg-add', { icon: 'upload', kind: 'primary' })}</div></div>
    <div class="search-row">${field(ctx, 'backgrounds', 'search', '搜索背景', { type: 'search', placeholder: '搜索名称' })}${field(ctx, 'backgrounds', 'sort', '排序', { type: 'select', options: [option('az', 'A–Z'), option('za', 'Z–A'), option('newest', '最新'), option('oldest', '最早')] })}</div>
    <div class="list-toolbar"><div class="tabs" role="tablist" aria-label="背景来源">${['global', 'chat'].map(tab => `<button type="button" class="tab ${b.tab === tab ? 'is-active' : ''}" role="tab" aria-selected="${b.tab === tab}" data-action="personal-bg-tab" data-tab="${tab}">${tab === 'global' ? '全局' : '聊天'}</button>`).join('')}</div><div class="actions">${b.tab === 'global' ? actionButton(ctx, b.selectionMode ? '完成批选' : '批量选择', 'personal-bg-selection-mode', { icon: b.selectionMode ? 'check' : 'edit', kind: b.selectionMode ? 'primary' : 'secondary' }) : ''}${actionButton(ctx, '缩小', 'personal-bg-zoom', { icon: 'grid', attrs: 'data-delta="-20"', disabled: b.thumbSize <= 120 })}${actionButton(ctx, '放大', 'personal-bg-zoom', { icon: 'grid', attrs: 'data-delta="20"', disabled: b.thumbSize >= 260 })}</div></div>
    ${breadcrumb}${folders}${batch}<div class="resource-grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,${b.thumbSize}px),1fr))">${items.map(item => renderBackgroundCard(item, ctx)).join('') || '<div class="empty-state">这里还没有匹配的背景。</div>'}</div>
    ${b.tab === 'chat' ? '<p class="help-text">宿主中，图像生成扩展创建的聊天背景会出现在这里。此处使用一张演示素材。</p>' : ''}</div>`;
}

function extensionSection(id, ctx) {
  const s = ctx.state.extensions;
  const item = s.items.find(candidate => candidate.id === id);
  if (!item?.enabled) return '';
  const f = (name, label, extra) => field(ctx, 'extensions', name, label, extra);
  const t = (name, label, extra) => toggle(ctx, 'extensions', name, label, extra);
  let body = '';
  if (id === 'assets') body = `<p class="help-text">资源区域的本页示例。</p><div class="resource-item"><span class="item-copy"><strong class="item-title">示例表情包</strong><span class="item-meta">用于检查资源条目与下载状态</span></span>${actionButton(ctx, s.downloadedAssets.includes('expressions') ? '已加入本页' : '加入示例', 'personal-extension-asset', { icon: 'import', disabled: s.downloadedAssets.includes('expressions') })}</div>`;
  if (id === 'expressions') body = f('expressionAPI', '分类器 API', { type: 'select', options: ['本地', '主 API', 'WebLLM', '禁用'] }) + t('expressionTranslate', '分类前将文本翻译成英语') + t('expressionMultiple', '每个表情允许多个立绘') + '<p class="help-text">打开聊天后，宿主会在此显示角色表情。这里不加载角色素材。</p>';
  if (id === 'images') body = f('imageSource', '来源', { type: 'select', options: ['ComfyUI', 'Automatic1111', '主 API'] }) + `<div class="field-pair">${f('imageWidth', '宽度', { type: 'number', min: 64, max: 2048, step: 64 })}${f('imageHeight', '高度', { type: 'number', min: 64, max: 2048, step: 64 })}</div>` + t('imageEditPrompt', '生成前编辑提示词') + '<p class="help-text">演示选择与尺寸字段；不发送生成请求。</p>';
  if (id === 'tts') body = f('ttsProvider', '语音来源', { type: 'select', options: ['浏览器语音', '系统语音', '自定义服务'] }) + t('ttsAuto', '自动朗读新消息') + f('ttsSpeed', '语速', { type: 'range', min: 0.5, max: 2, step: 0.1 });
  if (id === 'quickreply') body = t('quickReplyEnabled', '启用快速回复') + f('quickReplyText', '回复内容', { type: 'textarea', rows: 3, disabled: !s.quickReplyEnabled }) + actionButton(ctx, '预览回复', 'personal-extension-quickreply', { icon: 'eye', disabled: !s.quickReplyEnabled });
  if (id === 'translation') body = f('translationProvider', '翻译来源', { type: 'select', options: ['禁用', '主 API', '自定义服务'] }) + f('translationMode', '翻译范围', { type: 'select', options: ['仅输入', '仅回复', '输入和回复'], disabled: s.translationProvider === '禁用' });
  if (id === 'regex') body = t('regexEnabled', '启用正则处理') + `<div class="resource-item"><span class="item-copy"><strong class="item-title">清理多余空行 · 示例</strong><span class="item-meta">全局脚本 · 显示文本</span></span>${actionButton(ctx, '查看规则', 'personal-extension-regex', { icon: 'code' })}</div>`;
  if (id === 'vectors') body = f('vectorSource', '向量化来源', { type: 'select', options: ['本地', '主 API', '自定义服务'] }) + t('vectorChat', '启用聊天向量化') + '<p class="help-text">检索设置示例。页面不读取聊天记录。</p>';
  if (id === 'summary') body = t('summaryEnabled', '自动生成摘要') + f('summaryInterval', '消息间隔', { type: 'number', min: 1, max: 200, disabled: !s.summaryEnabled });
  if (!item.builtin) body = `<p class="help-text">${ctx.esc(item.description)}</p><span class="tag">本页演示项目</span>`;
  return ctx.section(item.name, body, { id: `personal-extension-${item.id}`, open: ['assets', 'expressions', 'quickreply', 'regex'].includes(id), meta: item.builtin ? '' : '演示' });
}

function renderExtensions(ctx) {
  const s = ctx.state.extensions;
  const left = ['assets', 'expressions', 'images', 'tts'];
  const right = ['quickreply', 'translation', 'regex', 'vectors', 'summary', ...s.items.filter(item => !item.builtin).map(item => item.id)];
  const activeCount = s.items.filter(item => item.enabled).length;
  return `<div class="panel-body">${intro('扩展按各自内容展开；下面保留原生的两列折叠结构。')}
    <div class="list-toolbar">${toggle(ctx, 'extensions', 'notify', '在扩展程序更新时通知')}<div class="actions">${actionButton(ctx, '管理扩展程序', 'personal-extensions-manage', { icon: 'cubes' })}${actionButton(ctx, '安装扩展程序', 'personal-extensions-install', { icon: 'import', kind: 'primary' })}<span class="muted extension-count">${activeCount} 个已启用</span></div></div>
    <div class="columns"><div class="form-stack">${left.map(id => extensionSection(id, ctx)).join('') || '<p class="empty-state">此列的示例扩展均已禁用。</p>'}</div><div class="form-stack">${right.map(id => extensionSection(id, ctx)).join('') || '<p class="empty-state">此列的示例扩展均已禁用。</p>'}</div></div>
    ${plain(ctx, '（已弃用）扩展 API', `<div class="status-line"><span>${ctx.esc(s.extrasStatus)}</span>${toggle(ctx, 'extensions', 'autoConnect', '自动连接')}</div><div class="field-pair">${field(ctx, 'extensions', 'extrasURL', '扩展 API 地址', { type: 'url', placeholder: 'http://localhost:5100' })}${field(ctx, 'extensions', 'extrasKey', '扩展 API 密钥（可选）', { type: 'password', placeholder: '无需填写真实密钥' })}</div><div class="actions">${actionButton(ctx, '演示连接状态', 'personal-extras-connect', { icon: 'plug' })}</div>`)}
    </div>`;
}

function renderPersonas(ctx) {
  const p = ctx.state.personas;
  const persona = selectedPersona(ctx.state);
  let filtered = p.items.filter(item => `${item.name} ${item.description}`.toLocaleLowerCase().includes(p.search.trim().toLocaleLowerCase()));
  filtered.sort((a, z) => a.name.localeCompare(z.name, 'zh-CN') * (p.sort === 'desc' ? -1 : 1));
  const pages = Math.max(1, Math.ceil(filtered.length / 4)), page = Math.min(p.page, pages);
  const visible = filtered.slice((page - 1) * 4, page * 4);
  const list = visible.map(item => `<button type="button" class="resource-item ${item.id === persona?.id ? 'is-active' : ''}" data-action="personal-persona-select" ${attrs(ctx, { id: item.id })} aria-pressed="${item.id === persona?.id}"><span class="avatar" aria-hidden="true">${ctx.esc(item.name.slice(0, 1))}</span><span class="item-copy"><strong class="item-title">${ctx.esc(item.name)}</strong><span class="item-meta">${ctx.esc(item.description || '暂无用户设定描述')}</span><span class="status-line">${p.defaultId === item.id ? '<span class="tag">默认</span>' : ''}${p.chatId === item.id ? '<span class="tag">聊天绑定</span>' : ''}${p.characterIds.includes(item.id) ? '<span class="tag">角色绑定</span>' : ''}</span></span></button>`).join('');
  let detail = '<div class="empty-state">先创建一个用户设定。</div>';
  if (persona) {
    const index = p.items.findIndex(item => item.id === persona.id), prefix = `personas.items.${index}`;
    const f = (name, label, extra) => field(ctx, prefix, name, label, extra);
    const isDefault = p.defaultId === persona.id, isCharacter = p.characterIds.includes(persona.id), isChat = p.chatId === persona.id;
    const depth = persona.position === 'depth' ? `<div class="field-pair">${f('depth', '深度', { type: 'number', min: 0, max: 9999 })}${f('role', '角色', { type: 'select', options: [option('system', '系统'), option('user', '用户'), option('assistant', '助手')] })}</div>` : '';
    detail = `<div class="detail-heading"><span class="avatar" aria-hidden="true">${ctx.esc(persona.name.slice(0, 1))}</span><div class="item-copy"><span class="muted">当前人设</span><h3>${ctx.esc(persona.name)}</h3></div></div>
      <div class="actions">${actionButton(ctx, '改名', 'personal-persona-rename', { icon: 'edit' })}${actionButton(ctx, '复制', 'personal-persona-duplicate', { icon: 'copy' })}${actionButton(ctx, '关联世界书', 'personal-persona-lorebook', { icon: 'book' })}${actionButton(ctx, '删除', 'personal-persona-delete', { icon: 'trash', kind: 'ghost' })}</div>
      ${f('description', '用户设定描述', { type: 'textarea', rows: 8, wide: true, placeholder: '描述这个用户设定的身份、习惯或背景' })}
      <div class="status-line">${actionButton(ctx, '展开编辑', 'personal-persona-expand', { icon: 'expand', kind: 'ghost' })}</div>
      ${f('position', '插入位置', { type: 'select', options: [option('none', '无（已禁用）'), option('manager', '在故事字符串/提示词管理器中'), option('author-top', '作者注释的顶部'), option('author-bottom', '作者注释的底部'), option('depth', '聊天的特定深度')] })}${depth}
      ${plain(ctx, '链接', `<div class="actions">${actionButton(ctx, '默认', 'personal-persona-default', { icon: 'star', kind: isDefault ? 'primary' : 'secondary', attrs: `aria-pressed="${isDefault}"` })}${actionButton(ctx, '角色', 'personal-persona-character', { icon: isCharacter ? 'lock' : 'unlock', kind: isCharacter ? 'primary' : 'secondary', attrs: `aria-pressed="${isCharacter}"` })}${actionButton(ctx, '聊天', 'personal-persona-chat', { icon: isChat ? 'lock' : 'unlock', kind: isChat ? 'primary' : 'secondary', attrs: `aria-pressed="${isChat}"` })}</div><p class="help-text">${isDefault ? '用于新的示例聊天。' : '未设为默认。'}${isCharacter ? '已关联到示例角色。' : ''}${isChat ? '已绑定当前示例聊天。' : ''}</p><p class="status-line"><span class="muted">世界书</span><span>${ctx.esc(persona.lorebook || '未关联')}</span></p>`)}
      ${plain(ctx, '全局设置', toggle(ctx, 'personas', 'notifications', '切换用户设定时显示通知') + toggle(ctx, 'personas', 'multipleConnections', '允许每个角色与多个用户设定绑定') + toggle(ctx, 'personas', 'autoLock', '自动将选择的用户设定绑定到聊天'))}`;
  }
  return `<div class="panel-body">${intro('使用虚构姓名和首字头像。左侧切换设定，右侧编辑描述及绑定。')}
    <div class="list-toolbar"><span class="muted">${p.items.length} 个用户设定</span><div class="actions">${actionButton(ctx, '备份', 'personal-personas-backup', { icon: 'export' })}${actionButton(ctx, '恢复示例', 'personal-personas-restore', { icon: 'import' })}</div></div>
    <div class="list-detail"><div class="resource-list ${p.grid ? 'is-grid' : ''}"><div class="list-toolbar">${actionButton(ctx, '创建', 'personal-persona-create', { icon: 'plus', kind: 'primary' })}${actionButton(ctx, p.grid ? '列表视图' : '网格视图', 'personal-persona-grid', { icon: p.grid ? 'list' : 'grid' })}</div>
    <div class="search-row">${field(ctx, 'personas', 'search', '搜索用户设定', { type: 'search', placeholder: '名称或描述' })}${field(ctx, 'personas', 'sort', '排序', { type: 'select', options: [option('asc', 'A–Z'), option('desc', 'Z–A')] })}</div>
    ${list || '<div class="empty-state">没有匹配的用户设定。</div>'}<div class="pagination">${actionButton(ctx, '上一页', 'personal-persona-page', { icon: 'back', attrs: 'data-delta="-1"', disabled: page <= 1 })}<span>${page} / ${pages}</span>${actionButton(ctx, '下一页', 'personal-persona-page', { icon: 'chevron', attrs: 'data-delta="1"', disabled: page >= pages })}</div></div><div class="detail-pane">${detail}</div></div></div>`;
}

export function renderPersonalPanel(id, ctx) {
  if (id === 'settings') return renderSettings(ctx);
  if (id === 'backgrounds') return renderBackgrounds(ctx);
  if (id === 'extensions') return renderExtensions(ctx);
  if (id === 'personas') return renderPersonas(ctx);
  return null;
}

function finish(ctx, message) {
  ctx.render();
  if (message) ctx.announce(message);
  return true;
}

function nameModal(ctx, title, label, value, apply) {
  ctx.modal({ title, body: modalInput(ctx, 'name', label, value), confirmLabel: '保存到本页', onConfirm(dialog) {
    const name = modalValue(dialog, 'name');
    if (!name) { ctx.announce('请先填写名称。'); return false; }
    apply(name);
    finish(ctx, '已更新本页示例。');
  } });
  return true;
}

function themeSnapshot(settings) {
  return Object.fromEntries(Object.entries(settings).filter(([key]) => !['savedThemes', 'themeNames', 'search', 'savedCSS'].includes(key)));
}

function showExtensionManager(ctx) {
  const s = ctx.state.extensions;
  const group = (title, items) => plain(ctx, title, items.map(item => `<label class="resource-item ${item.enabled ? '' : 'is-disabled'}"><input type="checkbox" name="extension-${ctx.esc(item.id)}" ${item.enabled ? 'checked' : ''}><span class="item-copy"><strong class="item-title">${ctx.esc(item.name)}</strong><span class="item-meta">${ctx.esc(item.description)}</span></span><span class="tag">${ctx.esc(item.version)}</span></label>`).join('') || '<p class="empty-state">尚无第三方演示项目。</p>');
  ctx.modal({ title: '管理扩展程序 · 本页演示', wide: true,
    body: '<p class="callout">这里改变示例扩展的启用状态。不会管理酒馆中安装的扩展。</p>' + group('内置扩展', s.items.filter(item => item.builtin)) + group('第三方扩展', s.items.filter(item => !item.builtin)),
    confirmLabel: '应用到本页', onConfirm(dialog) {
      for (const item of s.items) item.enabled = Boolean(dialog.querySelector(`[name="extension-${item.id}"]`)?.checked);
      finish(ctx, '已应用示例扩展状态。');
    },
  });
  return true;
}

export function handlePersonalAction(action, el, ctx) {
  if (!action.startsWith('personal-')) return false;
  const s = ctx.state.settings, b = ctx.state.backgrounds, x = ctx.state.extensions, p = ctx.state.personas;
  const id = el?.dataset?.id;
  if (action === 'personal-theme-save') { s.savedThemes[s.theme] = themeSnapshot(s); return finish(ctx, '当前主题参数已保存在本页。'); }
  if (action === 'personal-theme-save-as') return nameModal(ctx, '另存主题 · 本页演示', '主题名称', `${s.theme} 副本`, name => { if (!s.themeNames.includes(name)) s.themeNames.push(name); s.theme = name; s.savedThemes[name] = themeSnapshot(s); });
  if (action === 'personal-theme-export') { ctx.download('Endfield-theme-proposal.json', JSON.stringify(themeSnapshot(s), null, 2), 'application/json'); ctx.announce('已导出本页主题参数。'); return true; }
  if (action === 'personal-css-save') { s.savedCSS = s.customCSS; return finish(ctx, '样式文本已保存在本页。'); }
  if (action === 'personal-css-export') { ctx.download('Endfield-proposal.css', s.customCSS, 'text/css'); return true; }
  if (action === 'personal-settings-reset') {
    ctx.modal({ title: '恢复本页设置示例', body: '<p>将重置当前方案页中的设置字段。</p>', confirmLabel: '恢复示例', onConfirm() { ctx.state.settings = clone(personalInitialState.settings); finish(ctx, '本页设置已恢复。'); } }); return true;
  }
  if (action === 'personal-bg-tab') { b.tab = el.dataset.tab; b.selectionMode = false; b.selectedIds = []; return finish(ctx); }
  if (action === 'personal-bg-folder') { b.folderId = id || ''; b.selectedIds = []; return finish(ctx); }
  if (action === 'personal-bg-selection-mode') { b.selectionMode = !b.selectionMode; b.selectedIds = []; return finish(ctx, b.selectionMode ? '批选已开启。点击图片可切换选择。' : '批选已结束。'); }
  if (action === 'personal-bg-batch-clear') { b.selectedIds = []; return finish(ctx); }
  if (action === 'personal-bg-select') {
    if (!allBackgrounds(ctx.state).some(item => item.id === id)) return true;
    if (b.selectionMode && b.tab === 'global') b.selectedIds = b.selectedIds.includes(id) ? b.selectedIds.filter(value => value !== id) : [...b.selectedIds, id];
    else b.currentId = id;
    return finish(ctx, b.selectionMode ? `已批选 ${b.selectedIds.length} 张。` : '已切换本页当前背景标记。');
  }
  if (action === 'personal-bg-lock') { b.lockedId = b.lockedId === id ? '' : id; if (b.lockedId) b.currentId = id; return finish(ctx, b.lockedId ? '已锁定到本页示例聊天。' : '已解除示例聊天锁定。'); }
  if (action === 'personal-bg-auto') { const items = b.tab === 'chat' ? b.chatItems : b.items; if (!items.length) { ctx.announce('请先添加示例背景。'); return true; } const index = items.findIndex(item => item.id === b.currentId); b.currentId = items[(index + 1) % items.length].id; return finish(ctx, '已轮换到下一张示例背景。'); }
  if (action === 'personal-bg-zoom') { b.thumbSize = Math.max(120, Math.min(260, b.thumbSize + Number(el.dataset.delta))); return finish(ctx); }
  if (action === 'personal-bg-new-folder') return nameModal(ctx, '新建文件夹', '文件夹名称', '', name => b.folders.push({ id: `folder-${b.nextId++}`, name, itemIds: [] }));
  if (action === 'personal-bg-folder-rename') { const folder = b.folders.find(item => item.id === b.folderId); if (!folder) return true; return nameModal(ctx, '重命名文件夹', '文件夹名称', folder.name, name => { folder.name = name; }); }
  if (action === 'personal-bg-rename') { const item = allBackgrounds(ctx.state).find(candidate => candidate.id === id); if (!item) return true; return nameModal(ctx, '背景改名', '背景名称', item.name, name => { item.name = name; }); }
  if (action === 'personal-bg-add') {
    ctx.modal({ title: '添加背景 · 本页演示', body: '<p class="help-text">选择一张附带素材，添加一个新的背景条目。</p>' + modalInput(ctx, 'name', '背景名称', '新背景') + modalSelect(ctx, 'src', '示例素材', [option('./assets/background-placeholder.svg', '室内'), option('./assets/background-placeholder.svg', '夜景'), option('./assets/background-placeholder.svg', '晴空')]), confirmLabel: '添加到本页', onConfirm(dialog) {
      const name = modalValue(dialog, 'name'); if (!name) { ctx.announce('请填写背景名称。'); return false; }
      const newItem = { id: `background-${b.nextId++}`, name, src: modalValue(dialog, 'src'), created: Date.now() };
      (b.tab === 'chat' ? b.chatItems : b.items).push(newItem);
      if (b.tab === 'global' && b.folderId) b.folders.find(item => item.id === b.folderId)?.itemIds.push(newItem.id);
      b.search = ''; finish(ctx, '已添加本页背景条目。');
    } }); return true;
  }
  if (action === 'personal-bg-delete') {
    const item = allBackgrounds(ctx.state).find(candidate => candidate.id === id); if (!item) return true;
    ctx.modal({ title: '移除本页背景', body: `<p>从本页移除「${ctx.esc(item.name)}」？</p>`, confirmLabel: '移除', onConfirm() {
      b.items = b.items.filter(candidate => candidate.id !== id); b.chatItems = b.chatItems.filter(candidate => candidate.id !== id);
      b.folders.forEach(folder => { folder.itemIds = folder.itemIds.filter(value => value !== id); }); b.selectedIds = b.selectedIds.filter(value => value !== id);
      if (b.currentId === id) b.currentId = allBackgrounds(ctx.state)[0]?.id || ''; if (b.lockedId === id) b.lockedId = '';
      finish(ctx, '已移除本页背景条目。');
    } }); return true;
  }
  if (action === 'personal-bg-batch-folder') {
    if (!b.selectedIds.length) return true;
    if (!b.folders.length) { ctx.announce('请先新建文件夹。'); return true; }
    ctx.modal({ title: '加入文件夹', body: `<p>将 ${b.selectedIds.length} 张已选背景加入文件夹。</p>` + modalSelect(ctx, 'folder', '目标文件夹', b.folders.map(item => option(item.id, item.name))), confirmLabel: '加入', onConfirm(dialog) {
      const folder = b.folders.find(item => item.id === modalValue(dialog, 'folder')); if (!folder) return false;
      folder.itemIds = [...new Set([...folder.itemIds, ...b.selectedIds])]; b.selectedIds = []; finish(ctx, '已加入所选文件夹。');
    } }); return true;
  }
  if (action === 'personal-bg-batch-remove') { const folder = b.folders.find(item => item.id === b.folderId); if (folder) folder.itemIds = folder.itemIds.filter(value => !b.selectedIds.includes(value)); b.selectedIds = []; return finish(ctx, '已从此文件夹移出。'); }
  if (action === 'personal-extensions-manage') return showExtensionManager(ctx);
  if (action === 'personal-extensions-install') {
    ctx.modal({ title: '安装扩展程序 · 本页演示', body: '<p class="callout">只创建一个示例项目，不访问仓库，也不会安装到酒馆。</p>' + modalInput(ctx, 'name', '扩展显示名称', '示例扩展') + modalInput(ctx, 'url', '仓库地址（可留空）', '', 'url'), confirmLabel: '添加演示项目', onConfirm(dialog) {
      const name = modalValue(dialog, 'name'); if (!name) { ctx.announce('请填写显示名称。'); return false; }
      x.items.push({ id: `demo-${x.nextId++}`, name, enabled: true, builtin: false, version: '演示', description: '从安装流程创建的本页示例。未连接或下载仓库。' }); finish(ctx, '演示项目已加入扩展列表。');
    } }); return true;
  }
  if (action === 'personal-extension-asset') { if (!x.downloadedAssets.includes('expressions')) x.downloadedAssets.push('expressions'); return finish(ctx, '示例资源已加入本页。'); }
  if (action === 'personal-extension-quickreply') { ctx.modal({ title: '快速回复预览', body: `<div class="paper-surface"><p>${ctx.esc(x.quickReplyText || '（空白回复）')}</p></div><p class="help-text">预览不会发送消息。</p>`, confirmLabel: '关闭', onConfirm() {} }); return true; }
  if (action === 'personal-extension-regex') { ctx.modal({ title: '正则规则 · 本页示例', body: '<div class="paper-surface"><p>查找</p><code>\\n{3,}</code><p>替换为</p><code>\\n\\n</code></div><p class="help-text">将连续三个及以上换行压缩为两个。</p>', confirmLabel: '关闭', onConfirm() {} }); return true; }
  if (action === 'personal-extras-connect') { x.extrasStatus = x.extrasStatus.startsWith('演示：') ? '未连接' : '演示：已连接（未发起请求）'; return finish(ctx, x.extrasStatus); }
  if (action === 'personal-persona-select') { if (!p.items.some(item => item.id === id)) return true; p.selectedId = id; if (p.autoLock) p.chatId = id; return finish(ctx, p.notifications ? `已切换到${selectedPersona(ctx.state).name}。` : ''); }
  if (action === 'personal-persona-grid') { p.grid = !p.grid; return finish(ctx); }
  if (action === 'personal-persona-page') { const filtered = p.items.filter(item => `${item.name} ${item.description}`.toLocaleLowerCase().includes(p.search.trim().toLocaleLowerCase())); const pages = Math.max(1, Math.ceil(filtered.length / 4)); p.page = Math.max(1, Math.min(pages, p.page + Number(el.dataset.delta))); return finish(ctx); }
  if (action === 'personal-persona-create') return nameModal(ctx, '创建用户设定', '名称', '', name => { const item = { id: `persona-${p.nextId++}`, name, description: '', position: 'manager', depth: 2, role: 'system', lorebook: '' }; p.items.push(item); p.selectedId = item.id; p.search = ''; if (p.autoLock) p.chatId = item.id; });
  if (action === 'personal-personas-backup') { ctx.download('personas-proposal.json', JSON.stringify(p, null, 2), 'application/json'); ctx.announce('已导出本页虚构用户设定。'); return true; }
  if (action === 'personal-personas-restore') { ctx.modal({ title: '恢复用户设定示例', body: '<p>将恢复访客、记录员、旅人三个初始示例，并清除本页新增的设定。</p>', confirmLabel: '恢复示例', onConfirm() { ctx.state.personas = clone(personalInitialState.personas); finish(ctx, '用户设定示例已恢复。'); } }); return true; }
  const persona = selectedPersona(ctx.state);
  if (!persona) return action.startsWith('personal-persona-');
  if (action === 'personal-persona-rename') return nameModal(ctx, '重命名用户设定', '名称', persona.name, name => { persona.name = name; });
  if (action === 'personal-persona-duplicate') { const copy = { ...clone(persona), id: `persona-${p.nextId++}`, name: `${persona.name} 副本` }; p.items.push(copy); p.selectedId = copy.id; p.search = ''; if (p.autoLock) p.chatId = copy.id; return finish(ctx, '已复制当前用户设定。'); }
  if (action === 'personal-persona-delete') { ctx.modal({ title: '删除本页用户设定', body: `<p>删除「${ctx.esc(persona.name)}」及它在本页的绑定？</p>`, confirmLabel: '删除', onConfirm() { p.items = p.items.filter(item => item.id !== persona.id); p.characterIds = p.characterIds.filter(value => value !== persona.id); if (p.defaultId === persona.id) p.defaultId = ''; if (p.chatId === persona.id) p.chatId = ''; p.selectedId = p.items[0]?.id || ''; finish(ctx, '已删除本页用户设定。'); } }); return true; }
  if (action === 'personal-persona-default') { p.defaultId = p.defaultId === persona.id ? '' : persona.id; return finish(ctx, p.defaultId ? '已设为本页默认用户设定。' : '已取消默认。'); }
  if (action === 'personal-persona-chat') { p.chatId = p.chatId === persona.id ? '' : persona.id; return finish(ctx, p.chatId ? '已绑定示例聊天。' : '已解除聊天绑定。'); }
  if (action === 'personal-persona-character') { p.characterIds = p.characterIds.includes(persona.id) ? p.characterIds.filter(value => value !== persona.id) : p.multipleConnections ? [...p.characterIds, persona.id] : [persona.id]; return finish(ctx, '已更新示例角色绑定。'); }
  if (action === 'personal-persona-lorebook') { ctx.modal({ title: '关联用户设定世界书', body: modalSelect(ctx, 'lorebook', '世界书', [option('', '不关联'), option('基地见闻 · 示例', '基地见闻 · 示例'), option('旅行笔记 · 示例', '旅行笔记 · 示例')]), confirmLabel: '关联到本页', onConfirm(dialog) { persona.lorebook = modalValue(dialog, 'lorebook'); finish(ctx, '已更新世界书关联。'); } }); return true; }
  if (action === 'personal-persona-expand') { ctx.modal({ title: `${persona.name} · 用户设定描述`, wide: true, body: `<label class="setting-row is-wide is-textarea"><span class="field-label">用户设定描述</span><textarea class="control editor" name="description" rows="14">${ctx.esc(persona.description)}</textarea></label>`, confirmLabel: '保存描述', onConfirm(dialog) { persona.description = String(dialog.querySelector('[name="description"]')?.value || ''); finish(ctx, '已保存用户设定描述。'); } }); return true; }
  return false;
}
