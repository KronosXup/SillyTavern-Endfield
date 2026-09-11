(() => {
    'use strict';

    const byId = (id) => document.getElementById(id);
    const control = (name) => document.querySelector(`input[name="${name}"]`);
    const formShell = byId('form_sheld');
    const sendForm = byId('send_form');
    const textarea = byId('send_textarea');
    if (!formShell || !sendForm || !textarea) return;

    const state = {
        generating: false,
        generationTimer: null,
        generationMessage: null,
        script: 'idle',
        scriptTimer: null,
        scriptProgress: 0,
        scriptFailure: false,
        scriptFeedback: '',
        files: [],
        sampleFiles: false,
        deleting: false,
        menu: null,
        menuTrigger: null,
    };

    const menuItems = {
        options: [
            ['option_toggle_AN', '作者注释'],
            ['option_toggle_CFG', 'CFG 缩放'],
            ['option_toggle_logprobs', 'Token 概率'],
            ['option_start_new_chat', '开始新聊天'],
            ['option_close_chat', '关闭聊天'],
            ['option_select_chat', '管理聊天文件'],
            ['option_delete_mes', '删除消息'],
            ['option_regenerate', '重新生成'],
            ['option_impersonate', 'AI 帮答'],
            ['option_continue', '续写'],
        ],
        extensionsMenu: [
            ['manageAttachments', '打开数据库'],
            ['hide-helper-wand-button', '隐藏助手'],
            ['attachFile', '附加文件'],
            ['sd_gen', '生成图片'],
            ['send_picture', '生成图片描述'],
            ['show_gallery_wand_button', '展示图库'],
            ['ttsExtensionNarrateAll', '朗读全部聊天'],
            ['token_counter', 'Token 计数器'],
            ['translate_chat', '翻译聊天'],
            ['translate_input_message', '翻译输入'],
            ['sp_open_wand', '构画'],
            ['', '提示词查看器'],
            ['', '变量管理器'],
            ['', '日志查看器'],
            ['pca-wand-btn', '✧ 预设对比'],
        ],
    };

    function announce(message) {
        const status = byId('demo-status');
        if (status) status.textContent = message;
    }

    function checked(name, fallback = false) {
        return control(name)?.checked ?? fallback;
    }

    function visible(element, show) {
        if (!element) return;
        element.hidden = !show;
        element.classList.toggle('displayNone', !show);
    }

    function render() {
        const connected = checked('connected', true);
        const executing = state.script !== 'idle';
        sendForm.classList.toggle('no-connection', !connected);
        sendForm.classList.toggle('compact', checked('compact', true));
        formShell.classList.toggle('isExecutingCommandsFromChatInput', executing);
        formShell.classList.toggle('script_paused', state.script === 'paused');
        for (const feedback of ['success', 'error', 'aborted']) {
            formShell.classList.toggle(`script_${feedback}`, state.scriptFeedback === feedback);
        }
        if (state.generating) document.body.dataset.generating = 'true';
        else delete document.body.dataset.generating;

        textarea.placeholder = textarea.getAttribute(connected ? 'connected_text' : 'no_connection_text')
            || (connected ? '输入消息，或输入 /? 查看帮助' : '未连接到 API');
        textarea.style.setProperty('--prog', `${state.scriptProgress}%`);
        textarea.style.setProperty('--progDone', '0');

        visible(sendForm, !state.deleting);
        visible(byId('dialogue_del_mes'), state.deleting);
        visible(byId('send_but'), connected && !state.generating && !executing);
        visible(byId('mes_continue'), connected && checked('quick') && !state.generating && !executing);
        visible(byId('mes_impersonate'), connected && checked('quick') && !state.generating);
        visible(byId('mes_stop'), state.generating);
        visible(byId('stscript_pause'), state.script === 'running');
        visible(byId('stscript_continue'), state.script === 'paused');
        visible(byId('stscript_stop'), executing);
        visible(byId('message_preview_btn'), checked('preview'));
        visible(byId('qr--bar'), checked('qr'));
        visible(byId('qr-bar'), false);
        visible(byId('file_form'), state.files.length > 0);
        updateAttachment();
        positionMenu();
    }

    function resizeInput() {
        if (window.CSS?.supports('field-sizing', 'content')) return;
        const styles = getComputedStyle(textarea);
        const minHeight = Number.parseFloat(styles.minHeight) || 36;
        const maxHeight = Number.parseFloat(styles.maxHeight) || window.innerHeight * 0.5;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight))}px`;
    }

    function setDraft(text) {
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus({ preventScroll: true });
    }

    function addTranscript(role, text) {
        const transcript = byId('demo-transcript');
        if (!transcript) return null;
        const article = document.createElement('article');
        article.className = `demo-message demo-message--${role}`;
        const label = document.createElement('strong');
        label.textContent = role === 'user' ? '本地输入' : '本地演示';
        const body = document.createElement('p');
        body.textContent = text;
        article.append(label, body);
        transcript.append(article);
        return body;
    }

    function beginGeneration({ fromInput = false, description = '生成' } = {}) {
        if (!checked('connected', true)) {
            announce('当前演示为未连接状态。连接开关只切换本地外观，不会连接真实 API。');
            return;
        }
        if (state.generating) {
            announce('本地生成演示正在进行，可使用生成停止按钮结束。');
            return;
        }
        if (state.deleting) return;
        if (fromInput) {
            const draft = textarea.value.trim();
            if (!draft && !state.files.length) {
                announce('先输入一段文字或选择附件，再试本地发送。');
                textarea.focus();
                return;
            }
            const attachments = state.files.length ? `\n附件：${state.files.map((file) => file.name).join('、')}` : '';
            addTranscript('user', `${draft}${attachments}`);
            textarea.value = '';
            clearAttachments(false);
            resizeInput();
        }
        state.generating = true;
        state.generationMessage = addTranscript('assistant', `正在演示${description}……`);
        render();
        announce(`本地${description}演示中。停止键可用；没有发送网络请求。`);
        state.generationTimer = window.setTimeout(() => {
            state.generationTimer = null;
            state.generating = false;
            if (state.generationMessage) {
                state.generationMessage.textContent = '本地演示完成。这里仅展示输入、生成与停止的布局变化，没有调用真实 API。';
            }
            state.generationMessage = null;
            render();
            announce(`本地${description}演示已完成。${state.script !== 'idle' ? '脚本演示仍独立运行。' : ''}`);
        }, 4200);
    }

    function stopGeneration() {
        if (!state.generating) return;
        window.clearTimeout(state.generationTimer);
        state.generationTimer = null;
        state.generating = false;
        if (state.generationMessage) state.generationMessage.textContent = '本地生成演示已停止。';
        state.generationMessage = null;
        render();
        announce(`已停止本地生成演示。${state.script !== 'idle' ? '脚本仍保持原来的运行或暂停状态。' : '没有操作真实请求。'}`);
    }

    function finishScript(feedback) {
        window.clearInterval(state.scriptTimer);
        state.scriptTimer = null;
        state.script = 'idle';
        state.scriptFeedback = feedback;
        if (feedback === 'success') state.scriptProgress = 100;
        render();
        const result = { success: '完成', error: '遇到示例错误', aborted: '已中止' }[feedback];
        announce(`本地脚本演示${result}。${state.generating ? '生成演示仍独立运行，可用它自己的停止键结束。' : '没有执行真实脚本。'}`);
    }

    function beginScript(fail = false) {
        window.clearInterval(state.scriptTimer);
        state.script = 'running';
        state.scriptProgress = 0;
        state.scriptFeedback = '';
        state.scriptFailure = fail;
        state.deleting = false;
        render();
        announce('本地脚本演示开始。可暂停、继续或中止；进度线与聚焦黄线独立。');
        state.scriptTimer = window.setInterval(() => {
            if (state.script !== 'running') return;
            state.scriptProgress = Math.min(100, state.scriptProgress + 5);
            if (state.scriptFailure && state.scriptProgress >= 55) finishScript('error');
            else if (state.scriptProgress >= 100) finishScript('success');
            else render();
        }, 260);
    }

    function pauseScript() {
        if (state.script !== 'running') return;
        state.script = 'paused';
        render();
        byId('stscript_continue')?.focus({ preventScroll: true });
        announce('本地脚本已暂停；继续和中止仍可用。');
    }

    function continueScript() {
        if (state.script !== 'paused') return;
        state.script = 'running';
        render();
        byId('stscript_pause')?.focus({ preventScroll: true });
        announce('本地脚本继续运行。');
    }

    function formatSize(size) {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10240 ? 1 : 0)} KB`;
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }

    function updateAttachment() {
        const form = byId('file_form');
        if (!form) return;
        const name = form.querySelector('.file_name');
        const size = form.querySelector('.file_size');
        const names = state.files.map((file) => file.name);
        const total = state.files.reduce((sum, file) => sum + file.size, 0);
        if (name) {
            name.textContent = names.length === 1 ? names[0] : `已选择 ${names.length} 个文件`;
            name.title = names.join('\n');
        }
        if (size) {
            size.textContent = formatSize(total);
            size.title = `${total} 字节`;
        }
    }

    function clearAttachments(report = true) {
        state.files = [];
        state.sampleFiles = false;
        if (byId('file_form_input')) byId('file_form_input').value = '';
        if (byId('embed_file_input')) byId('embed_file_input').value = '';
        visible(byId('file_form'), false);
        updateAttachment();
        if (report) announce('已移除本地选择的整批附件，没有上传或删除磁盘文件。');
    }

    function sampleAttachment() {
        clearAttachments(false);
        state.files = [{ name: '四号谷地边境事务交接与连续观测记录_含角色关系补充和修订说明_第十七版.txt', size: 167936 }];
        state.sampleFiles = true;
        render();
        announce('已载入长文件名样本，只展示附件资料条；没有读取磁盘文件。');
    }

    function selectFiles(files) {
        if (!files.length) return;
        state.files = Array.from(files, (file) => ({ name: file.name, size: file.size }));
        state.sampleFiles = false;
        render();
        announce(`已在本地选择 ${state.files.length} 个文件，仅显示名称和大小，不读取内容、不上传。`);
    }

    function enterDeletion() {
        closeMenu();
        if (state.generating) {
            announce('先结束本地生成演示，再查看删除确认条。');
            return;
        }
        state.deleting = true;
        render();
        byId('dialogue_del_mes_cancel')?.focus({ preventScroll: true });
        announce('正在展示原生删除确认条的位置。此页面不连接酒馆消息。');
    }

    function leaveDeletion(confirmed = false) {
        state.deleting = false;
        render();
        textarea.focus({ preventScroll: true });
        announce(confirmed ? '已确认本地删除条演示并恢复输入，没有删除酒馆消息。' : '已取消删除条演示，草稿仍保留。');
    }

    function openPreview() {
        const dialog = byId('preview-dialog');
        const content = byId('preview-content');
        if (!dialog || !content) return;
        const files = state.files.length ? `\n\n附件（仅元数据）：\n${state.files.map((file) => `${file.name} · ${formatSize(file.size)}`).join('\n')}` : '';
        content.textContent = `${textarea.value || '当前草稿为空。'}${files}`;
        dialog.hidden = false;
        if (typeof dialog.showModal === 'function') {
            if (!dialog.open) dialog.showModal();
        } else dialog.setAttribute('open', '');
        announce('此处只预览本地草稿，没有实现或调用真实请求拦截。');
    }

    function closePreview() {
        const dialog = byId('preview-dialog');
        if (!dialog) return;
        if (typeof dialog.close === 'function' && dialog.open) dialog.close();
        else dialog.removeAttribute('open');
        const target = checked('preview') ? byId('message_preview_btn') : textarea;
        target?.focus({ preventScroll: true });
    }

    function buildMenus() {
        for (const [id, items] of Object.entries(menuItems)) {
            const menu = byId(id);
            if (!menu) continue;
            menu.replaceChildren();
            menu.setAttribute('role', 'menu');
            menu.setAttribute('aria-label', id === 'options' ? '聊天菜单' : '魔杖菜单');
            menu.hidden = true;
            const content = document.createElement('div');
            content.className = id === 'options' ? 'options-content' : 'extensionsMenuExtension';
            for (const [itemId, label] of items) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'menu-action';
                button.setAttribute('role', 'menuitem');
                if (itemId) button.id = itemId;
                button.textContent = label;
                button.addEventListener('click', () => {
                    closeMenu();
                    if (itemId === 'attachFile') byId('file_form_input')?.click();
                    else if (itemId === 'option_delete_mes') enterDeletion();
                    else announce(`「${label}」是酒馆中的真实菜单项；此独立页面仅展示入口，不执行该宿主功能。`);
                });
                content.append(button);
            }
            menu.append(content);
        }
    }

    function positionMenu() {
        if (!state.menu || !state.menuTrigger) return;
        const menu = byId(state.menu);
        if (!menu || menu.hidden) return;
        const anchor = state.menuTrigger.getBoundingClientRect();
        const gutter = 10;
        const maxWidth = Math.max(160, Math.min(300, window.innerWidth - gutter * 2));
        menu.style.position = 'fixed';
        menu.style.width = `${maxWidth}px`;
        menu.style.maxWidth = `calc(100vw - ${gutter * 2}px)`;
        menu.style.overflowY = 'auto';
        menu.style.overscrollBehavior = 'contain';
        const rect = menu.getBoundingClientRect();
        const desiredHeight = Math.min(menu.scrollHeight, window.innerHeight - gutter * 2);
        const availableAbove = anchor.top - gutter - 8;
        const availableBelow = window.innerHeight - anchor.bottom - gutter - 8;
        const above = desiredHeight <= availableAbove || availableAbove >= availableBelow;
        menu.style.maxHeight = `${Math.max(80, above ? availableAbove : availableBelow)}px`;
        const height = menu.getBoundingClientRect().height;
        menu.style.left = `${Math.max(gutter, Math.min(anchor.left, window.innerWidth - rect.width - gutter))}px`;
        menu.style.top = `${Math.max(gutter, Math.min(above ? anchor.top - height - 8 : anchor.bottom + 8, window.innerHeight - height - gutter))}px`;
    }

    function closeMenu(restoreFocus = false) {
        const trigger = state.menuTrigger;
        for (const id of Object.keys(menuItems)) {
            const menu = byId(id);
            if (menu) menu.hidden = true;
        }
        byId('options_button')?.setAttribute('aria-expanded', 'false');
        byId('extensionsMenuButton')?.setAttribute('aria-expanded', 'false');
        state.menu = null;
        state.menuTrigger = null;
        if (restoreFocus) trigger?.focus({ preventScroll: true });
    }

    function toggleMenu(id, trigger) {
        if (state.menu === id) {
            closeMenu(true);
            return;
        }
        closeMenu();
        const menu = byId(id);
        if (!menu) return;
        state.menu = id;
        state.menuTrigger = trigger;
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        positionMenu();
        menu.querySelector('[role="menuitem"]')?.focus({ preventScroll: true });
    }

    function reset() {
        window.clearTimeout(state.generationTimer);
        window.clearInterval(state.scriptTimer);
        state.generationTimer = null;
        state.scriptTimer = null;
        state.generating = false;
        state.generationMessage = null;
        state.script = 'idle';
        state.scriptProgress = 0;
        state.scriptFeedback = '';
        state.deleting = false;
        for (const name of ['connected', 'compact', 'quick', 'qr', 'preview']) {
            if (control(name)) control(name).checked = ['connected', 'compact'].includes(name);
        }
        textarea.value = '';
        clearAttachments(false);
        byId('demo-transcript')?.replaceChildren();
        closeMenu();
        closePreview();
        visible(byId('img_form'), false);
        render();
        resizeInput();
        announce('已恢复默认输入状态。所有演示都只在这张独立网页内进行。');
    }

    const actions = {
        send_but: () => beginGeneration({ fromInput: true }),
        mes_stop: stopGeneration,
        stscript_pause: pauseScript,
        stscript_continue: continueScript,
        stscript_stop: () => state.script !== 'idle' && finishScript('aborted'),
        mes_continue: () => beginGeneration({ description: '续写' }),
        mes_impersonate: () => announce('AI 帮答的真实作用是替用户撰写消息；这里只保留入口，不调用模型或改写草稿。'),
        message_preview_btn: openPreview,
        dialogue_del_mes_ok: () => leaveDeletion(true),
        dialogue_del_mes_cancel: () => leaveDeletion(false),
        'preview-close': closePreview,
    };
    for (const [id, action] of Object.entries(actions)) byId(id)?.addEventListener('click', action);
    byId('options_button')?.addEventListener('click', (event) => toggleMenu('options', event.currentTarget));
    byId('extensionsMenuButton')?.addEventListener('click', (event) => toggleMenu('extensionsMenu', event.currentTarget));
    for (const [trigger, menu] of [['options_button', 'options'], ['extensionsMenuButton', 'extensionsMenu']]) {
        byId(trigger)?.setAttribute('aria-controls', menu);
        byId(trigger)?.setAttribute('aria-haspopup', 'menu');
        byId(trigger)?.setAttribute('aria-expanded', 'false');
    }

    document.addEventListener('keydown', (event) => {
        if (event.isComposing) return;
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        if (state.menu && target.closest(`#${state.menu}`)) {
            const items = Array.from(byId(state.menu).querySelectorAll('[role="menuitem"]'));
            const index = items.indexOf(target.closest('[role="menuitem"]'));
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                let next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                    : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
                items[next]?.focus();
                return;
            }
            if (event.key === 'Tab') closeMenu(true);
        }
        if (event.key === 'Escape' && state.menu) {
            event.preventDefault();
            closeMenu(true);
            return;
        }
        const action = target.closest('[role="button"]');
        if (action && !action.matches('button, input, a, textarea') && ['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (!event.repeat && !action.hidden && action.getAttribute('aria-disabled') !== 'true') action.click();
        }
    });

    document.addEventListener('pointerdown', (event) => {
        if (!state.menu) return;
        const target = event.target;
        if (!byId(state.menu)?.contains(target) && !state.menuTrigger?.contains(target)) closeMenu();
    });

    textarea.addEventListener('input', () => {
        if (state.script === 'idle') {
            state.scriptFeedback = '';
            state.scriptProgress = 0;
            render();
        }
        resizeInput();
    });
    textarea.addEventListener('paste', (event) => {
        if (!event.clipboardData?.files.length) return;
        event.preventDefault();
        selectFiles(event.clipboardData.files);
    });
    formShell.addEventListener('dragover', (event) => {
        if (Array.from(event.dataTransfer?.types || []).includes('Files')) event.preventDefault();
    });
    formShell.addEventListener('drop', (event) => {
        if (!event.dataTransfer?.files.length) return;
        event.preventDefault();
        selectFiles(event.dataTransfer.files);
    });
    for (const id of ['file_form_input', 'embed_file_input']) {
        byId(id)?.addEventListener('change', (event) => selectFiles(event.target.files));
    }
    byId('file_form')?.addEventListener('reset', () => clearAttachments());
    for (const name of ['connected', 'compact', 'quick', 'qr', 'preview']) {
        control(name)?.addEventListener('change', () => {
            render();
            resizeInput();
            announce('已切换本地演示条件；未修改酒馆设置。');
        });
    }

    const qrBar = byId('qr--bar');
    if (qrBar) {
        qrBar.replaceChildren();
        for (const label of ['继续这个场景', '整理当前线索', '补充一段更完整的角色行动与环境描述']) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'qr--button menu_button';
            button.textContent = label;
            button.addEventListener('click', () => {
                setDraft(`${textarea.value}${textarea.value ? '\n' : ''}${label}`);
                announce('已将本地快捷回复样本填入草稿，没有运行酒馆脚本。');
            });
            qrBar.append(button);
        }
    }

    const demos = {
        multiline: () => setDraft('风从厂房之间穿过，远处的信号灯仍亮着。\n她停在门边，把刚才的记录重新看了一遍。\n“继续说，我在听。”'),
        long: () => setDraft(`https://example.invalid/local-layout-review/${'LongUnbrokenReference0123456789'.repeat(12)}\n${'这是一段用于观察窄屏换行与输入滚动的连续中文长文本'.repeat(12)}`),
        attachment: sampleAttachment,
        script: () => beginScript(false),
        'script-error': () => beginScript(true),
        generate: () => beginGeneration(),
        delete: enterDeletion,
        reset,
    };
    document.querySelectorAll('[data-demo]').forEach((button) => {
        button.addEventListener('click', () => demos[button.dataset.demo]?.());
    });
    byId('preview-width')?.addEventListener('change', (event) => {
        const frame = byId('stage-frame');
        const value = event.target.value;
        if (frame) frame.style.width = ['780', '524', '390', '320'].includes(value) ? `${value}px` : '100%';
        window.requestAnimationFrame(() => { resizeInput(); positionMenu(); });
    });
    byId('show-marks')?.addEventListener('change', (event) => {
        byId('stage-frame')?.classList.toggle('show-marks', event.target.checked);
    });
    document.querySelectorAll('[data-marker]').forEach((button) => {
        button.addEventListener('click', () => {
            const marker = button.dataset.marker;
            const target = marker === '1' ? sendForm : marker === '2' ? byId('send_but') : textarea;
            if (!target || target.hidden || state.deleting) return;
            if (marker === '1') target.tabIndex = -1;
            target.focus({ preventScroll: true });
        });
    });
    window.addEventListener('resize', () => { resizeInput(); positionMenu(); });
    window.addEventListener('scroll', (event) => {
        if (state.menu && event.target instanceof Node && byId(state.menu)?.contains(event.target)) return;
        positionMenu();
    }, { passive: true, capture: true });

    buildMenus();
    visible(byId('img_form'), false);
    byId('stage-frame')?.classList.toggle('show-marks', Boolean(byId('show-marks')?.checked));
    render();
    resizeInput();
    announce('独立输入栏方案。所有交互均在本页本地演示，不会发送消息、上传文件或改变酒馆设置。');
})();
