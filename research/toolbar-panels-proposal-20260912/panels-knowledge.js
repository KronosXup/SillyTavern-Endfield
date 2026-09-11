// Independent proposal data. All edits stay in ctx.state; no API requests are made.
const clone = value => JSON.parse(JSON.stringify(value));
const actionPrefix = 'knowledge:';
const apiOptions = [
    { value: 'textgenerationwebui', label: '文本补全' },
    { value: 'openai', label: '聊天补全' },
    { value: 'novel', label: 'NovelAI' },
    { value: 'koboldhorde', label: 'AI Horde' },
    { value: 'kobold', label: 'KoboldAI Classic' },
];
const sourceOptions = [
    ['custom', '自定义（兼容 OpenAI）'], ['openai', 'OpenAI'], ['claude', 'Claude'],
    ['openrouter', 'OpenRouter'], ['makersuite', 'Google AI Studio'], ['vertexai', 'Google Vertex AI'],
    ['deepseek', 'DeepSeek'], ['mistralai', 'MistralAI'], ['groq', 'Groq'],
    ['siliconflow', 'SiliconFlow'], ['minimax', 'MiniMax'], ['electronhub', 'Electron Hub'],
    ['chutes', 'Chutes'], ['nanogpt', 'NanoGPT'], ['workers_ai', 'Cloudflare Workers AI'],
    ['fireworks', 'Fireworks'], ['cometapi', 'CometAPI'], ['perplexity', 'Perplexity'],
    ['cohere', 'Cohere'], ['ai21', 'AI21'], ['xai', 'xAI'], ['aimlapi', 'AI/ML API'],
    ['pollinations', 'Pollinations'], ['moonshot', 'Moonshot AI'], ['zai', 'Z.AI'],
    ['azure_openai', 'Azure OpenAI'],
].map(([value, label]) => ({ value, label }));
const positions = [
    ['before', '角色定义前（↑Char）'], ['after', '角色定义后（↓Char）'],
    ['before-em', '示例消息前（↑EM）'], ['after-em', '示例消息后（↓EM）'],
    ['before-an', '作者注释前（↑AN）'], ['after-an', '作者注释后（↓AN）'],
    ['system', '[系统] 插入深度 @D'], ['user', '[用户] 插入深度 @D'],
    ['assistant', '[AI] 插入深度 @D'], ['outlet', '锚点'],
].map(([value, label]) => ({ value, label }));
const contextDefaults = {
    story: '{{#if system}}{{system}}\n\n{{/if}}{{description}}\n{{personality}}\n{{scenario}}\n{{mesExamples}}',
    position: 'top', depth: 0, role: 'system', exampleSeparator: '***', chatStart: '',
    forceName: false, singleLine: false, collapse: true, trimSpaces: true,
    trimSentences: false, separatorStops: true, nameStops: false,
};
const instructDefaults = {
    enabled: false, bindContext: false, regex: '', wrap: true, macros: true,
    sequenceStops: true, skipExamples: false, names: 'groups',
    storyPrefix: '', storySuffix: '', userPrefix: '<|user|>', userSuffix: '</s>',
    assistantPrefix: '<|assistant|>', assistantSuffix: '</s>', systemPrefix: '<|system|>',
    systemSuffix: '</s>', sameAsUser: false, firstAssistant: '', lastAssistant: '',
    firstUser: '', lastUser: '', systemInstruction: '', stop: '</s>', filler: '',
};
const systemDefaults = {
    enabled: true,
    content: '你正在参与一段虚构故事。遵循角色设定，清楚描述场景与对话。',
    postHistory: '延续当前场景，保留尚未解决的问题。',
};
const reasoningDefaults = {
    autoParse: true, autoExpand: false, showHidden: false, addToPrompts: false,
    maxAdditions: 1, prefix: '<think>', suffix: '</think>', separator: '\n\n',
};
const connectionDefaults = {
    api: 'openai', source: 'custom', endpoint: 'https://api.example.invalid/v1',
    apiKey: '', model: 'example-chat', textgenType: 'ollama', novelModel: 'kayra-v1',
    hordeModels: ['example-horde'], hordeContext: true, hordeResponse: true,
    hordeTrusted: false, bypassStatus: false, autoConnect: false,
    proxyEnabled: false, proxyUrl: '', proxyPassword: '',
    vertexAuth: 'key', vertexProject: 'example-project', vertexRegion: 'us-central1',
    azureDeployment: 'example-deployment', azureVersion: '2024-10-21',
    postProcessing: '', parameters: '{\n  "temperature": 0.8\n}',
};
const connectionSnapshotKeys = Object.keys(connectionDefaults).filter(key => !['apiKey', 'proxyPassword'].includes(key));
function connectionSnapshot(connection) {
    return Object.fromEntries(connectionSnapshotKeys.map(key => [key, clone(connection[key])]));
}
function entry(id, title, keys, content, extras = {}) {
    return {
        id, title, keys, content, active: true, mode: 'normal', filter: '', logic: 'and-any',
        position: 'before', depth: 4, order: 100, probability: 100, useProbability: true,
        scanDepth: 2, caseSensitive: 'global', wholeWords: 'global', groupScoring: 'global',
        outlet: '', automation: '', recursionLevel: 0, nonRecursive: false,
        preventRecursion: false, delayRecursion: false, ignoreBudget: false,
        group: '', prioritize: false, groupWeight: 100, sticky: 0, cooldown: 0, delay: 0,
        selective: true, addMemo: true, matchDescription: false, matchPersonality: false,
        matchScenario: false, matchPersona: false, matchNotes: false, matchCreator: false,
        characterFilter: '', triggerFilter: 'all', ...extras,
    };
}
export const knowledgeInitialState = {
    connection: {
        ...clone(connectionDefaults), profileId: 'profile-chat', _appliedProfile: 'profile-chat',
        profiles: [
            { id: 'profile-chat', name: '聊天补全 · 示例', values: connectionSnapshot(connectionDefaults) },
            { id: 'profile-local', name: '本机文本补全 · 示例', values: connectionSnapshot({ ...connectionDefaults, api: 'textgenerationwebui', endpoint: 'http://localhost:1234/v1', model: 'example-local' }) },
        ],
        status: 'idle', statusMessage: '示例尚未连接', connectedFingerprint: '', timer: null,
        showDetails: false, savedAt: '', nextProfile: 3,
    },
    formatting: {
        context: clone(contextDefaults), instruct: clone(instructDefaults), system: clone(systemDefaults), reasoning: clone(reasoningDefaults),
        contextPreset: 'context-default', instructPreset: 'instruct-default', systemPreset: 'system-default', reasoningPreset: 'reasoning-default',
        _contextPreset: 'context-default', _instructPreset: 'instruct-default', _systemPreset: 'system-default', _reasoningPreset: 'reasoning-default',
        contextPresets: [
            { id: 'context-default', name: '默认上下文 · 示例', values: clone(contextDefaults) },
            { id: 'context-compact', name: '简洁上下文 · 示例', values: { ...clone(contextDefaults), story: '{{system}}\n{{description}}\n{{scenario}}', exampleSeparator: '\n---\n' } },
        ],
        instructPresets: [
            { id: 'instruct-default', name: '角色序列 · 示例', values: clone(instructDefaults) },
            { id: 'instruct-plain', name: '纯文本序列 · 示例', values: { ...clone(instructDefaults), userPrefix: '用户：', assistantPrefix: '助手：', systemPrefix: '系统：', userSuffix: '', assistantSuffix: '', systemSuffix: '', stop: '' } },
        ],
        systemPresets: [{ id: 'system-default', name: '叙事提示词 · 示例', values: clone(systemDefaults) }],
        reasoningPresets: [{ id: 'reasoning-default', name: 'Think 标签 · 示例', values: clone(reasoningDefaults) }],
        stopping: '["用户："]', stoppingMacros: true, tokenizer: 'best', tokenPadding: 64,
        bindModel: false, markdownEscape: '', replyPrefix: '', showReplyPrefix: true, savedAt: '', nextPreset: 1,
    },
    world: {
        activeBooks: ['book-border'], selectedBook: 'book-border', selectedEntry: 'entry-station',
        query: '', sort: 'priority', page: 1, pageSize: 6, pinned: false, expanded: {}, savedAt: '',
        depth: 2, budget: 25, budgetCap: 0, minActivations: 0, maxDepth: 0, maxRecursion: 0,
        strategy: 'even', includeNames: true, recursive: true, caseSensitive: false,
        wholeWords: false, groupScoring: false, overflowAlert: true, nextBook: 3, nextEntry: 6,
        books: [
            { id: 'book-border', name: '边境档案 · 示例', entries: [
                entry('entry-station', '雾港车站', '雾港,车站,末班车', '雾港车站每天在钟声响起后关闭东侧检票口。站前有一块记着潮汐时间的旧告示牌。', { order: 100 }),
                entry('entry-beacon', '北岸信标', '北岸,信标,灯塔', '北岸信标每隔十二秒闪烁一次。只有维护员知道通往地下设备室的入口。', { order: 110, position: 'system', depth: 4 }),
                entry('entry-weather', '港区天气', '天气,薄雾', '故事发生在入秋后的沿海港区。夜间常有薄雾，白天的能见度较好。', { order: 90, mode: 'constant' }),
                entry('entry-clock', '旧钟楼', '钟楼,旧钟', '旧钟楼的机械钟比车站时钟慢三分钟。维护记录中留有这一误差的说明。', { active: false, order: 120 }),
            ] },
            { id: 'book-people', name: '人物关系 · 示例', entries: [
                entry('entry-inspector', '巡查员', '巡查员,林岚', '林岚负责夜间巡查。她熟悉港区道路，习惯先记录现场，再询问目击者。', { mode: 'vectorized', position: 'after' }),
            ] },
        ],
    },
};

function button(ctx, label, action, opts = {}) {
    return ctx.button(label, actionPrefix + action, opts);
}
function field(ctx, prefix, key, label, opts = {}) {
    return ctx.field({ path: `${prefix}.${key}`, label, ...opts });
}
function toggle(ctx, prefix, key, label, opts = {}) {
    return ctx.toggle({ path: `${prefix}.${key}`, label, ...opts });
}
function section(ctx, title, body, id, open = true, meta) {
    return ctx.section(title, body, { id, open, meta });
}
function multiple(ctx, path, label, values, selected, help = '') {
    const id = `knowledge-${path.replaceAll('.', '-')}`;
    return `<div class="setting-row is-wide"><div class="field-label"><label for="${id}">${ctx.esc(label)}</label>${help ? `<p class="help-text" id="${id}-help">${ctx.esc(help)}</p>` : ''}</div><div class="control"><select id="${id}" multiple size="${Math.min(4, Math.max(2, values.length))}" data-field="${ctx.esc(path)}"${help ? ` aria-describedby="${id}-help"` : ''}>${values.map(({ value, label: text }) => `<option value="${ctx.esc(value)}" ${selected.includes(value) ? 'selected' : ''}>${ctx.esc(text)}</option>`).join('')}</select></div></div>`;
}
function fingerprint(c) {
    return JSON.stringify([...connectionSnapshotKeys.map(key => c[key]), c.apiKey, c.proxyPassword]);
}
function stopDemo(c) {
    if (c.timer !== null) clearTimeout(c.timer);
    c.timer = null;
}
function syncConnection(c) {
    if (c.profileId === c._appliedProfile) return;
    const profile = c.profiles.find(item => item.id === c.profileId);
    stopDemo(c);
    if (profile) Object.assign(c, clone(profile.values));
    c._appliedProfile = c.profileId;
    c.status = 'idle';
    c.statusMessage = '已载入本页示例配置，尚未演示连接';
    c.connectedFingerprint = '';
}
function renderConnection(ctx) {
    const c = ctx.state.connection;
    syncConnection(c);
    const busy = c.status === 'connecting';
    const profileSelected = c.profiles.some(item => item.id === c.profileId);
    const mismatch = c.status === 'connected' && c.connectedFingerprint !== fingerprint(c);
    const status = mismatch ? '示例配置已变更，请重新运行连接演示' : c.statusMessage;
    const profile = c.profiles.find(item => item.id === c.profileId);
    const profileBar = `<div class="preset-line">${field(ctx, 'connection', 'profileId', 'API 连接配置', { type: 'select', options: [{ value: '', label: '不使用连接配置' }, ...c.profiles.map(item => ({ value: item.id, label: item.name }))] })}<div class="actions">${button(ctx, '详情', 'profile-details', { icon: 'help', disabled: !profileSelected })}${button(ctx, '新建', 'profile-new', { icon: 'plus' })}${button(ctx, '保存', 'profile-save', { icon: 'save', disabled: !profileSelected })}${button(ctx, '重命名', 'profile-rename', { icon: 'edit', disabled: !profileSelected })}${button(ctx, '重载', 'profile-reload', { icon: 'reset', disabled: !profileSelected })}${button(ctx, '删除', 'profile-delete', { icon: 'trash', kind: 'danger', disabled: !profileSelected })}</div></div>`;
    const details = c.showDetails && profile ? `<div class="callout"><strong>${ctx.esc(profile.name)}</strong><p>${ctx.esc(apiOptions.find(item => item.value === c.api)?.label || c.api)} · ${ctx.esc(c.model)}</p><p class="help-text">仅记录本页配置；密钥不会写入连接配置。</p></div>` : '';
    let form = '';
    if (c.api === 'openai') {
        form += field(ctx, 'connection', 'source', '聊天补全来源', { type: 'select', options: sourceOptions });
        if (['custom', 'azure_openai'].includes(c.source)) form += field(ctx, 'connection', 'endpoint', c.source === 'custom' ? '自定义端点（基础 URL）' : 'Azure 端点', { type: 'url', placeholder: 'https://api.example.invalid/v1', help: '本页演示不会向此地址发送请求。' });
        form += `<div class="preset-line">${field(ctx, 'connection', 'apiKey', c.source === 'custom' ? '自定义 API 密钥（可选）' : 'API 密钥', { type: 'password', placeholder: '无需填写真实密钥', help: '只用于本页演示，不会保存或发送。' })}${button(ctx, '管理示例密钥', 'key-manage', { icon: 'lock', kind: 'ghost' })}</div>`;
        if (c.source === 'vertexai') form += field(ctx, 'connection', 'vertexAuth', '身份验证方式', { type: 'select', options: [{ value: 'key', label: 'API 密钥' }, { value: 'account', label: '服务账号（示例）' }] }) + field(ctx, 'connection', 'vertexProject', '项目 ID') + field(ctx, 'connection', 'vertexRegion', '区域', { type: 'select', options: ['us-central1', 'global', 'europe-west4'] });
        if (c.source === 'azure_openai') form += field(ctx, 'connection', 'azureDeployment', '部署名称') + field(ctx, 'connection', 'azureVersion', 'API 版本');
        form += field(ctx, 'connection', 'model', c.source === 'custom' ? '输入模型名' : '模型', { help: '示例名称，可编辑为任意文本；不会查询真实模型。' });
        form += `<div class="actions">${button(ctx, '查看可用模型（示例）', 'models', { icon: 'list' })}${button(ctx, '刷新模型示例', 'models-refresh', { icon: 'refresh' })}</div>`;
        form += field(ctx, 'connection', 'postProcessing', '提示词后处理', { type: 'select', options: [{ value: '', label: '无' }, { value: 'merge_tools', label: '合并连续角色（包含工具）' }, { value: 'semi_tools', label: '半严格：交替角色（包含工具）' }, { value: 'strict_tools', label: '严格：用户优先、交替角色（包含工具）' }, { value: 'merge', label: '合并连续角色（不含工具）' }, { value: 'semi', label: '半严格：交替角色（不含工具）' }, { value: 'strict', label: '严格：用户优先、交替角色（不含工具）' }, { value: 'single', label: '单条用户消息（不含工具）' }] });
        form += toggle(ctx, 'connection', 'bypassStatus', '绕过状态检查', { help: '只切换示例选项，不影响真实连接。' });
        if (['openai', 'claude', 'mistralai', 'makersuite', 'vertexai', 'deepseek', 'xai', 'zai', 'moonshot'].includes(c.source)) form += section(ctx, '反向代理', toggle(ctx, 'connection', 'proxyEnabled', '使用反向代理') + field(ctx, 'connection', 'proxyUrl', '代理地址', { type: 'url', disabled: !c.proxyEnabled }) + field(ctx, 'connection', 'proxyPassword', '代理密码', { type: 'password', disabled: !c.proxyEnabled }), 'connection-proxy', false);
    } else if (c.api === 'textgenerationwebui') {
        form += field(ctx, 'connection', 'textgenType', 'API 类型', { type: 'select', options: ['ollama', 'koboldcpp', 'llamacpp', 'vllm', 'ooba', 'aphrodite', 'tabby', 'huggingface'].map(value => ({ value, label: ({ ollama: 'Ollama', koboldcpp: 'KoboldCpp', llamacpp: 'llama.cpp', vllm: 'vLLM', ooba: 'Text Generation WebUI', aphrodite: 'Aphrodite', tabby: 'TabbyAPI', huggingface: 'Hugging Face' })[value] })) });
        form += field(ctx, 'connection', 'endpoint', 'API URL', { type: 'url', placeholder: 'http://localhost:1234/v1' }) + field(ctx, 'connection', 'model', '模型') + field(ctx, 'connection', 'apiKey', 'API 密钥（可选）', { type: 'password', placeholder: '无需填写真实密钥' }) + toggle(ctx, 'connection', 'bypassStatus', '绕过状态检查');
        form += button(ctx, '刷新模型示例', 'models-refresh', { icon: 'refresh' });
    } else if (c.api === 'novel') {
        form += field(ctx, 'connection', 'apiKey', 'Novel API 密钥', { type: 'password', placeholder: '无需填写真实密钥' }) + field(ctx, 'connection', 'novelModel', 'NovelAI 模型', { type: 'select', options: [{ value: 'clio-v1', label: 'Clio' }, { value: 'kayra-v1', label: 'Kayra' }, { value: 'llama-3-erato-v1', label: 'Erato' }] });
    } else if (c.api === 'koboldhorde') {
        form += field(ctx, 'connection', 'apiKey', 'API 密钥', { type: 'password', placeholder: '本页匿名示例' }) + toggle(ctx, 'connection', 'hordeContext', '根据工作节点能力调整上下文大小') + toggle(ctx, 'connection', 'hordeResponse', '根据工作节点能力调整回复长度') + toggle(ctx, 'connection', 'hordeTrusted', '仅可信工作节点');
        form += multiple(ctx, 'connection.hordeModels', '模型', [{ value: 'example-horde', label: 'Horde 模型 A · 示例' }, { value: 'example-horde-b', label: 'Horde 模型 B · 示例' }], c.hordeModels) + button(ctx, '刷新模型示例', 'models-refresh', { icon: 'refresh' });
    } else form += field(ctx, 'connection', 'endpoint', 'API URL', { type: 'url', placeholder: 'http://localhost:5000/api' });
    return `<div class="panel-body form-stack"><p class="panel-intro">所有配置与连接状态均为本页示例，不会访问 API 或修改酒馆设置。</p>${profileBar}${details}${field(ctx, 'connection', 'api', 'API', { type: 'select', options: apiOptions })}${section(ctx, '连接设置', form, 'connection-settings')}<div class="actions">${button(ctx, '运行连接示例', 'connect', { icon: 'plug', kind: 'primary', disabled: busy })}${busy ? button(ctx, '取消', 'connect-cancel', { icon: 'close' }) : ''}${c.api === 'openai' ? button(ctx, '发送测试消息（示例）', 'test', { icon: 'play', disabled: busy || c.status !== 'connected' || mismatch }) : ''}${c.api === 'openai' && c.source === 'custom' ? button(ctx, '附加参数', 'parameters', { icon: 'sliders' }) : ''}</div><div class="status-line" role="status">${ctx.icon(busy ? 'refresh' : c.status === 'connected' && !mismatch ? 'check' : 'plug')}<span>${ctx.esc(status)}</span></div>${toggle(ctx, 'connection', 'autoConnect', '自动连接到上次的服务器', { help: '在本页仅演示勾选状态；不会自动联网。' })}${c.savedAt ? `<p class="help-text">示例配置已保存 · ${ctx.esc(c.savedAt)}</p>` : ''}</div>`;
}

const groupLabels = { context: '上下文模板', instruct: '格式指引模板', system: '系统提示词', reasoning: '推理内容格式化' };
const groupDefaults = { context: contextDefaults, instruct: instructDefaults, system: systemDefaults, reasoning: reasoningDefaults };
function syncFormatting(f) {
    for (const group of Object.keys(groupLabels)) {
        if (f[`${group}Preset`] === f[`_${group}Preset`]) continue;
        const preset = f[`${group}Presets`].find(item => item.id === f[`${group}Preset`]);
        const enabled = f[group].enabled;
        if (preset) f[group] = clone(preset.values);
        if (typeof enabled === 'boolean') f[group].enabled = enabled;
        f[`_${group}Preset`] = f[`${group}Preset`];
    }
}
function presetControls(ctx, group, disabled = false) {
    const f = ctx.state.formatting;
    const attrs = `data-group="${group}"`;
    return `<div class="preset-line">${field(ctx, 'formatting', `${group}Preset`, `${groupLabels[group]}预设`, { type: 'select', options: f[`${group}Presets`].map(item => ({ value: item.id, label: item.name })), disabled })}<div class="actions">${button(ctx, '保存', 'format-save', { icon: 'save', disabled, attrs })}${button(ctx, '另存为', 'format-new', { icon: 'plus', disabled, attrs })}${button(ctx, '重命名', 'format-rename', { icon: 'edit', disabled, attrs })}${button(ctx, '恢复', 'format-restore', { icon: 'reset', disabled, attrs })}${button(ctx, '删除', 'format-delete', { icon: 'trash', kind: 'danger', disabled: disabled || f[`${group}Presets`].length < 2, attrs })}</div></div>`;
}
function editor(ctx, prefix, key, label, disabled = false, rows = 4, help) {
    return field(ctx, prefix, key, label, { type: 'textarea', rows, wide: true, disabled, help }) + `<div class="actions">${button(ctx, '展开编辑器', 'expand-editor', { icon: 'expand', kind: 'ghost', disabled, attrs: `data-path="${ctx.esc(`${prefix}.${key}`)}" data-label="${ctx.esc(label)}"` })}</div>`;
}
function renderFormatting(ctx) {
    const f = ctx.state.formatting;
    syncFormatting(f);
    const cc = ctx.state.connection.api === 'openai';
    const instructOff = cc || !f.instruct.enabled;
    let context = presetControls(ctx, 'context', cc) + editor(ctx, 'formatting.context', 'story', '故事字符串', cc, 7);
    context += field(ctx, 'formatting.context', 'position', '位置', { type: 'select', disabled: cc, options: [{ value: 'top', label: '默认（上下文顶部）' }, { value: 'depth', label: '聊天的特定深度' }] });
    if (f.context.position === 'depth') context += `<div class="field-pair">${field(ctx, 'formatting.context', 'depth', '深度', { type: 'number', min: 0, max: 100, disabled: cc })}${field(ctx, 'formatting.context', 'role', '身份', { type: 'select', disabled: cc, options: [{ value: 'system', label: '系统' }, { value: 'user', label: '用户' }, { value: 'assistant', label: '助手' }] })}</div>`;
    context += field(ctx, 'formatting.context', 'exampleSeparator', '示例分隔符', { disabled: cc }) + field(ctx, 'formatting.context', 'chatStart', '聊天开始', { disabled: cc });
    context += section(ctx, '上下文格式', toggle(ctx, 'formatting.context', 'forceName', '始终将角色名称添加到提示词', { disabled: cc }) + toggle(ctx, 'formatting.context', 'singleLine', '每次请求只生成一行', { disabled: cc }) + toggle(ctx, 'formatting.context', 'collapse', '折叠连续的换行符') + toggle(ctx, 'formatting.context', 'trimSpaces', '修剪空格') + toggle(ctx, 'formatting.context', 'trimSentences', '修剪不完整的句子') + toggle(ctx, 'formatting.context', 'separatorStops', '分隔符作为终止字符串', { disabled: cc }) + toggle(ctx, 'formatting.context', 'nameStops', '名称作为终止字符串', { disabled: cc }), 'format-context-options', false);
    let instruct = toggle(ctx, 'formatting.instruct', 'enabled', '启用格式指引', { disabled: cc }) + presetControls(ctx, 'instruct', instructOff) + toggle(ctx, 'formatting.instruct', 'bindContext', '与上下文模板绑定', { disabled: instructOff }) + field(ctx, 'formatting.instruct', 'regex', '激活正则表达式', { disabled: instructOff, placeholder: '可选' });
    instruct += toggle(ctx, 'formatting.instruct', 'wrap', '用换行符包裹序列', { disabled: instructOff }) + toggle(ctx, 'formatting.instruct', 'macros', '替换序列中的宏', { disabled: instructOff }) + toggle(ctx, 'formatting.instruct', 'sequenceStops', '将序列用作终止字符串', { disabled: instructOff }) + toggle(ctx, 'formatting.instruct', 'skipExamples', '跳过示例对话格式化', { disabled: instructOff }) + field(ctx, 'formatting.instruct', 'names', '包括名称', { type: 'select', disabled: instructOff, options: [{ value: 'never', label: '永不' }, { value: 'groups', label: '群聊和历史用户设定' }, { value: 'always', label: '总是' }] });
    const pairs = [
        ['故事字符串序列', 'storyPrefix', '故事字符串前缀', 'storySuffix', '故事字符串后缀'],
        ['用户消息序列', 'userPrefix', '用户消息前缀', 'userSuffix', '用户消息后缀'],
        ['助手消息序列', 'assistantPrefix', '助手消息前缀', 'assistantSuffix', '助手消息后缀'],
    ];
    for (const [title, a, al, b, bl] of pairs) instruct += section(ctx, title, field(ctx, 'formatting.instruct', a, al, { type: 'textarea', rows: 2, disabled: instructOff }) + field(ctx, 'formatting.instruct', b, bl, { type: 'textarea', rows: 2, disabled: instructOff }), `format-${a}`, title === '用户消息序列');
    instruct += section(ctx, '系统消息序列', toggle(ctx, 'formatting.instruct', 'sameAsUser', '系统与用户相同', { disabled: instructOff }) + field(ctx, 'formatting.instruct', 'systemPrefix', '系统消息前缀', { type: 'textarea', rows: 2, readonly: f.instruct.sameAsUser, disabled: instructOff || f.instruct.sameAsUser }) + field(ctx, 'formatting.instruct', 'systemSuffix', '系统消息后缀', { type: 'textarea', rows: 2, readonly: f.instruct.sameAsUser, disabled: instructOff || f.instruct.sameAsUser }), 'format-system-sequences', false);
    instruct += section(ctx, '其他序列', [['firstAssistant', '首条助手前缀'], ['lastAssistant', '末条助手前缀'], ['firstUser', '首条用户前缀'], ['lastUser', '末条用户前缀'], ['systemInstruction', '系统指令前缀'], ['stop', '停止序列'], ['filler', '用户填充消息']].map(([key, label]) => field(ctx, 'formatting.instruct', key, label, { type: 'textarea', rows: 2, disabled: instructOff })).join(''), 'format-other-sequences', false);
    const system = toggle(ctx, 'formatting.system', 'enabled', '启用系统提示词', { disabled: cc }) + presetControls(ctx, 'system', cc || !f.system.enabled) + editor(ctx, 'formatting.system', 'content', '提示词内容', cc || !f.system.enabled, 7) + editor(ctx, 'formatting.system', 'postHistory', '历史后置指令', cc || !f.system.enabled, 4);
    const stopping = editor(ctx, 'formatting', 'stopping', '自定义停止字符串', false, 3, 'JSON 序列化的字符串数组') + toggle(ctx, 'formatting', 'stoppingMacros', '替换自定义停止字符串中的宏') + button(ctx, '检查 JSON', 'validate-stopping', { icon: 'check' });
    const reasoning = toggle(ctx, 'formatting.reasoning', 'autoParse', '自动解析') + toggle(ctx, 'formatting.reasoning', 'autoExpand', '自动展开') + toggle(ctx, 'formatting.reasoning', 'showHidden', '显示隐藏内容') + toggle(ctx, 'formatting.reasoning', 'addToPrompts', '添加到提示词') + field(ctx, 'formatting.reasoning', 'maxAdditions', '最大值', { type: 'number', min: 0, max: 100, disabled: !f.reasoning.addToPrompts }) + presetControls(ctx, 'reasoning') + field(ctx, 'formatting.reasoning', 'prefix', '前缀') + field(ctx, 'formatting.reasoning', 'suffix', '后缀') + field(ctx, 'formatting.reasoning', 'separator', '分隔符', { type: 'textarea', rows: 2 });
    const misc = toggle(ctx, 'formatting', 'bindModel', '将模型与模板绑定', { disabled: cc, help: f.bindModel ? `当前示例模型：${ctx.state.connection.model}` : undefined }) + field(ctx, 'formatting', 'markdownEscape', '非 Markdown 字符串', { type: 'textarea', rows: 2 }) + field(ctx, 'formatting', 'replyPrefix', '以…开始回复', { type: 'textarea', rows: 2 }) + toggle(ctx, 'formatting', 'showReplyPrefix', '在聊天中显示回复前缀');
    return `<div class="panel-body form-stack"><div class="list-toolbar"><p class="panel-intro">编辑本页示例模板，查看不同 API 模式下的可用选项。</p><div class="actions">${button(ctx, '全局导入', 'format-import', { icon: 'import', disabled: cc })}${button(ctx, '全局导出', 'format-export', { icon: 'export', disabled: cc })}</div></div>${cc ? '<div class="callout">灰色选项在使用聊天补全 API 时无效。可到 API 连接面板切换为“文本补全”查看启用状态。</div>' : ''}<div class="columns"><div class="form-stack">${section(ctx, '上下文模板', context, 'format-context')}${section(ctx, '推理', reasoning, 'format-reasoning')}</div><div class="form-stack">${section(ctx, '格式指引模板与序列', instruct, 'format-instruct')}</div><div class="form-stack">${section(ctx, '系统提示词', system, 'format-system')}${section(ctx, '自定义停止字符串', stopping, 'format-stopping', false)}${section(ctx, '分词器', field(ctx, 'formatting', 'tokenizer', '分词器', { type: 'select', disabled: cc, options: [{ value: 'best', label: '最佳匹配（推荐）' }, { value: 'llama', label: 'Llama' }, { value: 'claude', label: 'Claude' }, { value: 'openai', label: 'OpenAI' }] }) + field(ctx, 'formatting', 'tokenPadding', 'Token 填充', { type: 'number', min: 0, max: 2048, disabled: cc }), 'format-tokenizer', false)}${section(ctx, '杂项', misc, 'format-misc', false)}</div></div>${f.savedAt ? `<p class="help-text">本页模板已保存 · ${ctx.esc(f.savedAt)}</p>` : ''}</div>`;
}

function selectedBook(w) { return w.books.find(book => book.id === w.selectedBook) || null; }
function selectedEntry(w) { return selectedBook(w)?.entries.find(item => item.id === w.selectedEntry) || null; }
function entryModeLabel(mode) { return ({ normal: '关键词', constant: '永久', vectorized: '向量化' })[mode] || '关键词'; }
function worldVisibleEntries(w, book) {
    const query = w.query.trim().toLocaleLowerCase();
    const list = book.entries.filter(item => !query || `${item.title} ${item.keys} ${item.filter} ${item.content}`.toLocaleLowerCase().includes(query));
    return list.sort((a, b) => w.sort === 'title' ? a.title.localeCompare(b.title, 'zh-CN') : w.sort === 'title-desc' ? b.title.localeCompare(a.title, 'zh-CN') : w.sort === 'tokens' ? a.content.length - b.content.length : w.sort === 'tokens-desc' ? b.content.length - a.content.length : w.sort === 'depth' ? a.depth - b.depth : w.sort === 'probability' ? b.probability - a.probability : a.order - b.order);
}
function renderWorldEntry(ctx, book, item) {
    const w = ctx.state.world;
    const prefix = `world.books.${w.books.indexOf(book)}.entries.${book.entries.indexOf(item)}`;
    const mode = field(ctx, prefix, 'mode', '条目状态', { type: 'select', options: [{ value: 'constant', label: '永久' }, { value: 'normal', label: '关键词' }, { value: 'vectorized', label: '向量化' }] });
    let main = `<div class="detail-heading"><h3>${ctx.esc(item.title || '未命名条目')}</h3><div class="actions">${button(ctx, '复制条目', 'entry-copy', { icon: 'copy' })}${button(ctx, '删除条目', 'entry-delete', { icon: 'trash', kind: 'danger' })}</div></div>`;
    main += toggle(ctx, prefix, 'active', '启用条目') + field(ctx, prefix, 'title', '条目标题/备忘录') + mode;
    main += field(ctx, prefix, 'keys', '主要关键字', { type: 'textarea', rows: 2, help: '多个关键字使用逗号分隔；保存后仍可继续编辑。' });
    main += `<div class="field-pair">${field(ctx, prefix, 'logic', '逻辑', { type: 'select', options: [{ value: 'and-any', label: '与任意' }, { value: 'and-all', label: '与所有' }, { value: 'not-all', label: '非所有' }, { value: 'not-any', label: '非任何' }] })}${field(ctx, prefix, 'filter', '可选过滤器', { help: '若为空则忽略' })}</div>`;
    main += editor(ctx, prefix, 'content', '内容', false, 9, '此处是虚构的世界书示例。内容编辑仅保留在本页。');
    main += field(ctx, prefix, 'position', '位置', { type: 'select', options: positions });
    if (['system', 'user', 'assistant'].includes(item.position)) main += field(ctx, prefix, 'depth', '深度', { type: 'number', min: 0, max: 1000 });
    if (item.position === 'outlet') main += field(ctx, prefix, 'outlet', '锚点名称');
    main += `<div class="field-pair">${field(ctx, prefix, 'order', '顺序', { type: 'number', min: 0, max: 99999 })}${field(ctx, prefix, 'probability', '触发 %', { type: 'number', min: 0, max: 100, disabled: !item.useProbability })}</div>`;
    const globalOptions = [{ value: 'global', label: '使用全局' }, { value: 'yes', label: '是' }, { value: 'no', label: '否' }];
    const advanced = field(ctx, prefix, 'scanDepth', '扫描深度', { type: 'number', min: 0, max: 1000 }) + field(ctx, prefix, 'caseSensitive', '区分大小写', { type: 'select', options: globalOptions }) + field(ctx, prefix, 'wholeWords', '完整单词', { type: 'select', options: globalOptions }) + field(ctx, prefix, 'groupScoring', '组评分', { type: 'select', options: globalOptions }) + field(ctx, prefix, 'automation', '自动化 ID') + field(ctx, prefix, 'recursionLevel', '递归等级', { type: 'number', min: 0, max: 100 }) + toggle(ctx, prefix, 'nonRecursive', '不可递归（不会被其他条目激活）') + toggle(ctx, prefix, 'preventRecursion', '防止进一步递归') + toggle(ctx, prefix, 'delayRecursion', '延迟到递归') + toggle(ctx, prefix, 'ignoreBudget', '无视回复限额') + field(ctx, prefix, 'group', '包含组') + toggle(ctx, prefix, 'prioritize', '确定优先级') + field(ctx, prefix, 'groupWeight', '组权重', { type: 'number', min: 0, max: 1000 }) + `<div class="inline-fields">${['sticky', 'cooldown', 'delay'].map((key, i) => field(ctx, prefix, key, ['黏性', '冷却', '延迟'][i], { type: 'number', min: 0, max: 1000 })).join('')}</div>` + field(ctx, prefix, 'characterFilter', '绑定到角色或标签', { placeholder: '可选；本页不读取角色列表' }) + field(ctx, prefix, 'triggerFilter', '筛选生成触发器', { type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'normal', label: '正常' }, { value: 'continue', label: '续写' }, { value: 'impersonate', label: 'AI 帮答' }, { value: 'swipe', label: '备选回复' }, { value: 'regenerate', label: '重新生成' }, { value: 'quiet', label: '静默' }] }) + toggle(ctx, prefix, 'selective', '选择性') + toggle(ctx, prefix, 'useProbability', '使用概率') + toggle(ctx, prefix, 'addMemo', '添加备忘录');
    const matching = [['matchDescription', '角色描述'], ['matchPersonality', '角色性格'], ['matchScenario', '情景'], ['matchPersona', '用户设定描述'], ['matchNotes', '角色备注'], ['matchCreator', '创作者的注释']].map(([key, label]) => toggle(ctx, prefix, key, label)).join('');
    return main + section(ctx, '条目高级设置', advanced, `world-advanced-${item.id}`, false) + section(ctx, '额外匹配来源', matching, `world-matching-${item.id}`, false) + `<div class="actions">${button(ctx, '保存示例', 'world-save', { icon: 'save', kind: 'primary' })}</div><p class="help-text">${ctx.esc(item.id)} · ${item.content.length} 字符${w.savedAt ? ` · 本页已保存 ${ctx.esc(w.savedAt)}` : ''}</p>`;
}
function renderWorld(ctx) {
    const w = ctx.state.world;
    const book = selectedBook(w);
    if (book && !book.entries.some(item => item.id === w.selectedEntry)) w.selectedEntry = book.entries[0]?.id || '';
    const item = selectedEntry(w);
    const global = `<div class="columns"><div class="form-stack">${field(ctx, 'world', 'depth', '扫描深度', { type: 'range', min: 0, max: 100 })}${field(ctx, 'world', 'budget', '上下文百分比', { type: 'range', min: 1, max: 100 })}${field(ctx, 'world', 'budgetCap', 'Token 预算上限', { type: 'number', min: 0, max: 65536, help: '0 = 不设置单独上限' })}${field(ctx, 'world', 'minActivations', '最小激活数', { type: 'number', min: 0, max: 100, disabled: Number(w.maxRecursion) > 0 })}${field(ctx, 'world', 'maxDepth', '最大深度', { type: 'number', min: 0, max: 100, disabled: Number(w.maxRecursion) > 0 })}${field(ctx, 'world', 'maxRecursion', '最大递归深度', { type: 'number', min: 0, max: 10, disabled: Number(w.minActivations) > 0 })}${field(ctx, 'world', 'strategy', '插入策略', { type: 'select', options: [{ value: 'even', label: '均匀排序' }, { value: 'character', label: '角色世界书优先' }, { value: 'global', label: '全局世界书优先' }] })}</div><div class="form-stack">${[['includeNames', '包括名称'], ['recursive', '递归扫描'], ['caseSensitive', '区分大小写'], ['wholeWords', '匹配整个单词'], ['groupScoring', '使用群组评分'], ['overflowAlert', '溢出警报']].map(([key, label]) => toggle(ctx, 'world', key, label)).join('')}</div></div>`;
    const top = `<div class="list-toolbar"><p class="panel-intro">虚构世界书示例。全局启用可多选，下面的编辑对象独立选择。</p>${toggle(ctx, 'world', 'pinned', '固定世界书面板')}</div>${multiple(ctx, 'world.activeBooks', '已启用的世界书（全局有效）', w.books.map(b => ({ value: b.id, label: b.name })), w.activeBooks, '可选择多本世界书；不会改变下方正在编辑的对象。')}${section(ctx, '全局世界书激活设置', global, 'world-global', false)}`;
    const toolbar = `<div class="preset-line">${field(ctx, 'world', 'selectedBook', '选择以编辑', { type: 'select', options: [{ value: '', label: '— 选择以编辑 —' }, ...w.books.map(b => ({ value: b.id, label: b.name }))] })}<div class="actions">${button(ctx, '创建', 'book-new', { icon: 'plus' })}${button(ctx, '导入', 'book-import', { icon: 'import' })}${button(ctx, '导出', 'book-export', { icon: 'export', disabled: !book })}${button(ctx, '重命名', 'book-rename', { icon: 'edit', disabled: !book })}${button(ctx, '复制', 'book-copy', { icon: 'copy', disabled: !book })}${button(ctx, '删除', 'book-delete', { icon: 'trash', kind: 'danger', disabled: !book })}</div></div>`;
    if (!book) return `<div class="panel-body form-stack">${top}${toolbar}<div class="empty-state">选择或创建一本世界书，开始编辑本页示例。</div></div>`;
    const all = worldVisibleEntries(w, book);
    const pages = Math.max(1, Math.ceil(all.length / w.pageSize));
    w.page = Math.min(pages, Math.max(1, Number(w.page) || 1));
    const visible = all.slice((w.page - 1) * w.pageSize, w.page * w.pageSize);
    const search = `<div class="search-row">${field(ctx, 'world', 'query', '搜索条目', { type: 'search', placeholder: '搜索标题、关键字或内容' })}${button(ctx, '搜索', 'world-search', { icon: 'search' })}${w.query ? button(ctx, '清除', 'world-search-clear', { icon: 'close', kind: 'ghost' }) : ''}${field(ctx, 'world', 'sort', '排序', { type: 'select', options: [{ value: 'priority', label: '优先级' }, { value: 'title', label: '标题 A 到 Z' }, { value: 'title-desc', label: '标题 Z 到 A' }, { value: 'tokens', label: '内容长度 ↑' }, { value: 'tokens-desc', label: '内容长度 ↓' }, { value: 'depth', label: '深度 ↑' }, { value: 'probability', label: '触发 % ↓' }] })}</div>`;
    const actions = `<div class="list-toolbar"><span class="count">${all.length} / ${book.entries.length} 个条目</span><div class="actions">${button(ctx, '新建条目', 'entry-new', { icon: 'plus' })}${button(ctx, '展开全部', 'entry-expand-all', { icon: 'expand' })}${button(ctx, '折叠全部', 'entry-collapse-all', { icon: 'close' })}${button(ctx, '填充空标题', 'entry-fill-titles', { icon: 'edit' })}${button(ctx, '应用当前排序', 'entry-apply-sort', { icon: 'list' })}${button(ctx, '刷新', 'world-refresh', { icon: 'refresh' })}</div></div>`;
    const list = visible.map(e => `<article class="resource-item ${item?.id === e.id ? 'is-selected' : ''}"><button type="button" class="item-copy" data-action="knowledge:entry-select" data-id="${ctx.esc(e.id)}" aria-pressed="${item?.id === e.id}"><span class="item-title">${ctx.highlight(e.title || '未命名条目', w.query)}</span><span class="item-meta">${ctx.esc(entryModeLabel(e.mode))} · ${e.active ? '启用' : '已禁用'} · 顺序 ${Number(e.order)}</span></button><div class="item-actions">${button(ctx, w.expanded[e.id] ? '收起预览' : '展开预览', 'entry-expand', { icon: 'chevron', kind: 'ghost', attrs: `data-id="${ctx.esc(e.id)}" aria-expanded="${!!w.expanded[e.id]}"` })}${button(ctx, e.active ? '停用' : '启用', 'entry-toggle', { icon: e.active ? 'check' : 'close', kind: 'ghost', attrs: `data-id="${ctx.esc(e.id)}"` })}</div>${w.expanded[e.id] ? `<p class="item-meta">${ctx.highlight(e.keys || '无关键字', w.query)}</p><p>${ctx.highlight(e.content, w.query)}</p>` : ''}</article>`).join('');
    const pagination = `<div class="pagination">${button(ctx, '上一页', 'world-prev', { icon: 'back', disabled: w.page <= 1 })}<span>${w.page} / ${pages}</span>${button(ctx, '下一页', 'world-next', { icon: 'chevron', disabled: w.page >= pages })}</div>`;
    return `<div class="panel-body form-stack">${top}${toolbar}${search}${actions}<div class="list-detail"><div class="resource-list" aria-label="世界书条目">${list || '<div class="empty-state">没有匹配条目。可清除搜索，或新建条目。</div>'}${pagination}</div><div class="detail-pane">${item ? renderWorldEntry(ctx, book, item) : '<div class="empty-state">这本世界书还没有条目。点击“新建条目”开始。</div>'}</div></div></div>`;
}

export function renderKnowledgePanel(id, ctx) {
    if (id === 'connection') return renderConnection(ctx);
    if (id === 'formatting') return renderFormatting(ctx);
    if (id === 'world') return renderWorld(ctx);
    return null;
}

function timestamp() { return new Date().toLocaleTimeString('zh-CN', { hour12: false }); }
function nameDialog(ctx, title, initial, onName) {
    ctx.modal({ title, body: `<label class="field-label" for="knowledge-name">名称</label><input id="knowledge-name" class="control" maxlength="100" value="${ctx.esc(initial)}" autocomplete="off">`, confirmLabel: '保存到本页', onConfirm(dialog) {
        const name = dialog.querySelector('#knowledge-name').value.trim();
        if (!name) { ctx.announce('请填写名称。'); return false; }
        onName(name); ctx.render();
    } });
}
function confirmLocal(ctx, title, description, onConfirm) {
    ctx.modal({ title, body: `<p>${ctx.esc(description)}</p>`, confirmLabel: '确认删除', onConfirm() { onConfirm(); ctx.render(); } });
}
function readJSON(ctx, onData) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json'; input.hidden = true;
    document.body.appendChild(input);
    input.addEventListener('cancel', () => input.remove(), { once: true });
    input.addEventListener('change', async () => {
        const file = input.files?.[0]; input.remove(); if (!file) return;
        try {
            if (file.size > 2 * 1024 * 1024) throw new Error('示例页支持 2 MB 以内的 JSON 文件。');
            const data = JSON.parse(await file.text());
            if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('请选择有效的 JSON 对象。');
            onData(data, file.name); ctx.render();
        } catch (error) { ctx.announce(`导入失败：${error.message}`); }
    }, { once: true });
    input.click();
}
function getPath(state, path) { return path.split('.').reduce((value, key) => value?.[key], state); }
function setPath(state, path, value) {
    const keys = path.split('.');
    if (keys.some(key => ['__proto__', 'constructor', 'prototype'].includes(key))) return;
    const final = keys.pop();
    const target = keys.reduce((object, key) => object?.[key], state);
    if (target && Object.hasOwn(target, final)) target[final] = value;
}
function importGroup(source, defaults) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('模板分组格式不正确。');
    const result = clone(defaults);
    for (const key of Object.keys(defaults)) if (typeof source[key] === typeof defaults[key]) result[key] = source[key];
    return result;
}
function importBook(data, filename, w) {
    const source = data.entries ?? data.data?.entries;
    if (!source || typeof source !== 'object') throw new Error('文件中没有世界书 entries。');
    const entries = Array.isArray(source) ? source : Object.values(source);
    if (entries.length > 200) throw new Error('本页示例最多导入 200 个条目。');
    const imported = entries.map((raw, index) => {
        if (!raw || typeof raw !== 'object') throw new Error(`第 ${index + 1} 个条目格式不正确。`);
        const text = (v, fallback = '') => typeof v === 'string' ? v : fallback;
        const n = (v, fallback, min, max) => Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback;
        const keys = Array.isArray(raw.key) ? raw.key.map(String).join(', ') : text(raw.keys);
        const retained = importGroup(raw, entry('', '', '', ''));
        for (const key of ['id', 'title', 'keys', 'content']) delete retained[key];
        return entry(`entry-import-${w.nextEntry++}`, text(raw.title, text(raw.comment, `导入条目 ${index + 1}`)), keys, text(raw.content), {
            ...retained,
            active: typeof raw.active === 'boolean' ? raw.active : raw.disable !== true,
            mode: ['constant', 'normal', 'vectorized'].includes(raw.mode) ? raw.mode : raw.constant ? 'constant' : raw.vectorized ? 'vectorized' : 'normal',
            filter: Array.isArray(raw.keysecondary) ? raw.keysecondary.map(String).join(', ') : text(raw.filter),
            position: positions.some(p => p.value === raw.position) ? raw.position : ['before', 'after', 'before-an', 'after-an', 'system', 'before-em', 'after-em', 'outlet'][Number(raw.position)] || 'before',
            depth: n(raw.depth, 4, 0, 1000), order: n(raw.order, 100, 0, 99999), probability: n(raw.probability, 100, 0, 100),
        });
    });
    const id = `book-${w.nextBook++}`;
    w.books.push({ id, name: typeof data.name === 'string' ? data.name.slice(0, 100) : filename.replace(/\.json$/i, ''), entries: imported });
    w.selectedBook = id; w.selectedEntry = imported[0]?.id || ''; w.query = ''; w.page = 1;
}

export function handleKnowledgeAction(action, el, ctx) {
    if (!action.startsWith(actionPrefix)) return false;
    const name = action.slice(actionPrefix.length);
    const c = ctx.state.connection, f = ctx.state.formatting, w = ctx.state.world;
    const book = selectedBook(w), currentEntry = selectedEntry(w);
    const group = el?.dataset?.group;
    const notify = message => { ctx.announce(message); ctx.render(); };
    switch (name) {
        case 'profile-details': c.showDetails = !c.showDetails; ctx.render(); return true;
        case 'profile-new':
            nameDialog(ctx, '新建 API 连接配置', '新连接配置 · 示例', value => { const id = `profile-${c.nextProfile++}`; c.profiles.push({ id, name: value, values: connectionSnapshot(c) }); c.profileId = id; c._appliedProfile = id; c.savedAt = timestamp(); ctx.announce('已在本页创建示例配置。'); }); return true;
        case 'profile-save': {
            const p = c.profiles.find(item => item.id === c.profileId); if (p) p.values = connectionSnapshot(c);
            c.savedAt = timestamp(); notify('示例配置已保存到本页；不包含密钥。'); return true;
        }
        case 'profile-rename': {
            const p = c.profiles.find(item => item.id === c.profileId); if (p) nameDialog(ctx, '重命名示例配置', p.name, value => { p.name = value; }); return true;
        }
        case 'profile-reload': c._appliedProfile = null; syncConnection(c); notify('已恢复这份配置上次保存在本页的内容。'); return true;
        case 'profile-delete': {
            const p = c.profiles.find(item => item.id === c.profileId); if (p) confirmLocal(ctx, '删除示例连接配置', `仅从本页删除“${p.name}”。`, () => { c.profiles = c.profiles.filter(item => item.id !== p.id); c.profileId = ''; c._appliedProfile = ''; }); return true;
        }
        case 'connect': {
            stopDemo(c);
            if (['textgenerationwebui', 'kobold'].includes(c.api) || (c.api === 'openai' && ['custom', 'azure_openai'].includes(c.source))) {
                try { const url = new URL(c.endpoint); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
                catch { c.status = 'error'; c.statusMessage = '示例校验未通过：请填写 http 或 https 地址'; notify(c.statusMessage); return true; }
            }
            if (c.api === 'openai' && !c.model.trim()) { c.status = 'error'; c.statusMessage = '示例校验未通过：请填写模型名'; notify(c.statusMessage); return true; }
            c.status = 'connecting'; c.statusMessage = '正在运行本页连接示例…';
            const startedFingerprint = fingerprint(c);
            c.timer = setTimeout(() => { c.timer = null; if (fingerprint(c) !== startedFingerprint) { c.status = 'idle'; c.statusMessage = '示例配置已变更，本次演示已停止'; } else { c.status = 'connected'; c.connectedFingerprint = startedFingerprint; c.statusMessage = '示例连接成功 · 未访问真实服务器'; } ctx.render(); ctx.announce(c.statusMessage); }, 650);
            ctx.render(); return true;
        }
        case 'connect-cancel': stopDemo(c); c.status = 'idle'; c.statusMessage = '已取消本页连接示例'; notify(c.statusMessage); return true;
        case 'test':
            if (c.status !== 'connected' || c.connectedFingerprint !== fingerprint(c)) { notify('请先运行当前配置的连接示例。'); return true; }
            ctx.modal({ title: '测试消息 · 本页示例', body: '<p>示例消息：你好。</p><div class="paper-surface"><p>示例回复：你好，连接面板的演示流程已经完成。</p></div><p class="help-text">没有发送 API 请求，也不会产生费用。</p>', confirmLabel: '关闭', onConfirm() {} }); return true;
        case 'key-manage':
            ctx.modal({ title: '示例密钥', body: `<p>${c.apiKey ? '本页输入框中已有内容。' : '尚未填写示例密钥。'}</p><p>此页不会读取酒馆密钥，也不会将输入内容写入连接配置。</p>`, confirmLabel: '清空本页输入', onConfirm() { c.apiKey = ''; ctx.render(); ctx.announce('已清空本页密钥输入。'); } }); return true;
        case 'models':
            ctx.modal({ title: '可用模型 · 示例', body: '<p>这些是固定的示例名称，没有查询服务器。</p><label class="field-label" for="knowledge-model">模型</label><select id="knowledge-model" class="control"><option>example-chat</option><option>example-reasoning</option><option>example-long-context</option></select>', confirmLabel: '使用此示例', onConfirm(dialog) { c.model = dialog.querySelector('#knowledge-model').value; ctx.render(); } }); return true;
        case 'models-refresh': notify('模型示例已刷新；未查询任何服务器。'); return true;
        case 'parameters':
            ctx.modal({ title: '附加参数 · 示例', body: `<label class="field-label" for="knowledge-parameters">JSON 参数</label><textarea id="knowledge-parameters" class="control editor" rows="10">${ctx.esc(c.parameters)}</textarea>`, confirmLabel: '保存到本页', onConfirm(dialog) { const value = dialog.querySelector('#knowledge-parameters').value; try { const parsed = JSON.parse(value); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); } catch { ctx.announce('请填写有效的 JSON 对象。'); return false; } c.parameters = value; ctx.render(); ctx.announce('附加参数已保存到本页。'); }, wide: true }); return true;
        case 'expand-editor': {
            const path = el.dataset.path;
            if (!path || !/^(formatting\.|world\.books\.\d+\.entries\.\d+\.)/.test(path)) return true;
            ctx.modal({ title: el.dataset.label || '编辑内容', body: `<label class="visually-hidden" for="knowledge-expanded">${ctx.esc(el.dataset.label || '内容')}</label><textarea id="knowledge-expanded" class="control editor" rows="18">${ctx.esc(getPath(ctx.state, path) || '')}</textarea>`, confirmLabel: '应用到本页', onConfirm(dialog) { setPath(ctx.state, path, dialog.querySelector('#knowledge-expanded').value); ctx.render(); }, wide: true }); return true;
        }
        case 'format-save':
        case 'format-new':
        case 'format-rename':
        case 'format-restore':
        case 'format-delete': {
            if (!Object.hasOwn(groupLabels, group)) return true;
            const presets = f[`${group}Presets`], preset = presets.find(item => item.id === f[`${group}Preset`]);
            if (name === 'format-save') { if (preset) preset.values = clone(f[group]); f.savedAt = timestamp(); notify(`${groupLabels[group]}已保存到本页。`); }
            if (name === 'format-new') nameDialog(ctx, `另存${groupLabels[group]}`, `${groupLabels[group]} · 新示例`, value => { const id = `${group}-saved-${f.nextPreset++}`; presets.push({ id, name: value, values: clone(f[group]) }); f[`${group}Preset`] = id; f[`_${group}Preset`] = id; f.savedAt = timestamp(); });
            if (name === 'format-rename' && preset) nameDialog(ctx, '重命名模板', preset.name, value => { preset.name = value; });
            if (name === 'format-restore' && preset) { const enabled = f[group].enabled; f[group] = clone(preset.values); if (typeof enabled === 'boolean') f[group].enabled = enabled; notify('已恢复这个模板上次保存的内容。'); }
            if (name === 'format-delete' && preset && presets.length > 1) confirmLocal(ctx, '删除本页模板', `删除“${preset.name}”后会选择另一份示例模板。`, () => { f[`${group}Presets`] = presets.filter(item => item.id !== preset.id); f[`${group}Preset`] = f[`${group}Presets`][0].id; });
            return true;
        }
        case 'validate-stopping':
            try { const data = JSON.parse(f.stopping); if (!Array.isArray(data) || data.some(item => typeof item !== 'string')) throw new Error(); notify(`JSON 有效，共 ${data.length} 个停止字符串。`); } catch { notify('格式应为只包含字符串的 JSON 数组，例如 ["用户："]。'); } return true;
        case 'format-export':
            ctx.download('formatting-example.json', JSON.stringify({ type: 'toolbar-formatting-example', version: 1, ...Object.fromEntries(Object.keys(groupLabels).map(key => [key, f[key]])), stopping: f.stopping, stoppingMacros: f.stoppingMacros, tokenizer: f.tokenizer, tokenPadding: f.tokenPadding, bindModel: f.bindModel, markdownEscape: f.markdownEscape, replyPrefix: f.replyPrefix, showReplyPrefix: f.showReplyPrefix }, null, 2), 'application/json'); ctx.announce('已导出本页格式化示例。'); return true;
        case 'format-import':
            readJSON(ctx, data => { const source = data.formatting || data; if (!Object.keys(groupLabels).some(key => source[key] && typeof source[key] === 'object')) throw new Error('没有找到上下文、格式指引、系统或推理模板分组。'); const staged = {}; for (const key of Object.keys(groupLabels)) if (source[key]) staged[key] = importGroup(source[key], groupDefaults[key]); Object.assign(f, staged); for (const key of ['stopping', 'stoppingMacros', 'tokenizer', 'tokenPadding', 'bindModel', 'markdownEscape', 'replyPrefix', 'showReplyPrefix']) if (typeof source[key] === typeof f[key]) f[key] = source[key]; ctx.announce('已将 JSON 模板载入本页，可检查后再保存。'); }); return true;
        case 'world-search': w.page = 1; ctx.render(); return true;
        case 'world-search-clear': w.query = ''; w.page = 1; ctx.render(); return true;
        case 'world-prev': w.page--; ctx.render(); return true;
        case 'world-next': w.page++; ctx.render(); return true;
        case 'world-refresh': notify('已刷新本页世界书视图。'); return true;
        case 'world-save': w.savedAt = timestamp(); if (book) book.savedEntries = clone(book.entries); notify('世界书示例已保存到本页。'); return true;
        case 'book-new':
            nameDialog(ctx, '创建世界书', '新世界书 · 示例', value => { const id = `book-${w.nextBook++}`; w.books.push({ id, name: value, entries: [] }); w.selectedBook = id; w.selectedEntry = ''; w.query = ''; w.page = 1; }); return true;
        case 'book-rename': if (book) nameDialog(ctx, '重命名世界书', book.name, value => { book.name = value; }); return true;
        case 'book-copy':
            if (book) { const copy = clone(book); copy.id = `book-${w.nextBook++}`; copy.name += ' · 副本'; delete copy.savedEntries; copy.entries.forEach(e => { e.id = `entry-copy-${w.nextEntry++}`; }); w.books.push(copy); w.selectedBook = copy.id; w.selectedEntry = copy.entries[0]?.id || ''; w.query = ''; w.page = 1; notify('已复制为独立的本页世界书。'); } return true;
        case 'book-delete':
            if (book) confirmLocal(ctx, '删除示例世界书', `仅删除本页的“${book.name}”及其示例条目。`, () => { w.books = w.books.filter(b => b.id !== book.id); w.activeBooks = w.activeBooks.filter(id => id !== book.id); w.selectedBook = ''; w.selectedEntry = ''; w.query = ''; w.page = 1; }); return true;
        case 'book-import': readJSON(ctx, (data, file) => { importBook(data, file, w); ctx.announce('世界书已导入本页；尚未加入全局启用列表。'); }); return true;
        case 'book-export': if (book) { ctx.download('worldbook-example.json', JSON.stringify({ type: 'toolbar-worldbook-example', name: book.name, entries: book.entries }, null, 2), 'application/json'); ctx.announce('已导出当前本页世界书。'); } return true;
        case 'entry-new':
            if (book) nameDialog(ctx, '创建条目', '新条目', value => { const item = entry(`entry-${w.nextEntry++}`, value, '', ''); book.entries.push(item); w.selectedEntry = item.id; w.query = ''; w.page = Math.ceil(book.entries.length / w.pageSize); }); return true;
        case 'entry-select': if (book?.entries.some(e => e.id === el.dataset.id)) w.selectedEntry = el.dataset.id; ctx.render(); return true;
        case 'entry-expand': w.expanded[el.dataset.id] = !w.expanded[el.dataset.id]; ctx.render(); return true;
        case 'entry-expand-all': if (book) book.entries.forEach(e => { w.expanded[e.id] = true; }); ctx.render(); return true;
        case 'entry-collapse-all': if (book) book.entries.forEach(e => { w.expanded[e.id] = false; }); ctx.render(); return true;
        case 'entry-toggle': { const e = book?.entries.find(item => item.id === el.dataset.id); if (e) e.active = !e.active; ctx.render(); return true; }
        case 'entry-copy':
            if (book && currentEntry) { const copy = clone(currentEntry); copy.id = `entry-${w.nextEntry++}`; copy.title += ' · 副本'; book.entries.push(copy); w.selectedEntry = copy.id; w.query = ''; notify('已复制条目，两个条目可独立编辑。'); } return true;
        case 'entry-delete':
            if (book && currentEntry) confirmLocal(ctx, '删除示例条目', `删除“${currentEntry.title || '未命名条目'}”？`, () => { book.entries = book.entries.filter(e => e.id !== currentEntry.id); w.selectedEntry = book.entries[0]?.id || ''; }); return true;
        case 'entry-fill-titles': {
            let count = 0; if (book) book.entries.forEach(e => { if (!e.title.trim() && e.keys.trim()) { e.title = e.keys.split(/[,，\n]/)[0].trim(); count++; } }); notify(`已填充 ${count} 个空标题。`); return true;
        }
        case 'entry-apply-sort':
            if (book) { const visible = worldVisibleEntries(w, book); const ids = new Set(visible.map(e => e.id)); const rest = book.entries.filter(e => !ids.has(e.id)); [...visible, ...rest].forEach((e, i) => { e.order = (i + 1) * 10; }); w.sort = 'priority'; notify('已将当前排序写入本页条目的顺序值。'); } return true;
        default: return false;
    }
}
