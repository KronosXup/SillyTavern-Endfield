(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const status = $('#preview-status');
  const menuData = {
    options: [
      ['option_toggle_AN', '作者注释', 'fa-note-sticky'],
      ['option_toggle_CFG', 'CFG 缩放', 'fa-scale-balanced'],
      ['option_toggle_logprobs', 'Token 概率', 'fa-pie-chart'],
      null,
      ['option_start_new_chat', '开始新聊天', 'fa-comments'],
      ['option_close_chat', '关闭聊天', 'fa-times'],
      ['option_select_chat', '管理聊天文件', 'fa-address-book'],
      null,
      ['option_delete_mes', '删除消息', 'fa-trash-can'],
      ['option_regenerate', '重新生成', 'fa-repeat'],
      ['option_impersonate', 'AI 帮答', 'fa-user-secret'],
      ['option_continue', '续写', 'fa-arrow-right'],
    ],
    extensionsMenu: [
      ['manageAttachments', '打开数据库', 'fa-book-open-reader', 'data_bank'],
      ['hide-assistant-preview', '隐藏助手', 'fa-ghost', 'assistant'],
      ['attachFile', '附加文件', 'fa-paperclip', 'attach_file'],
      ['sd_gen', '生成图片', 'fa-paintbrush', 'sd'],
      ['send_picture', '生成图片描述', 'fa-image', 'caption'],
      ['gallery-preview', '展示图库', 'fa-sd-card', 'gallery'],
      ['tts-preview', '朗读全部聊天', 'fa-radio', 'tts'],
      ['tokens-preview', 'Token 计数器', 'fa-1', 'token_counter'],
      ['translate_chat', '翻译聊天', 'fa-language', 'translate'],
      ['translate_input_message', '翻译输入', 'fa-keyboard', 'translate'],
      ['calendar-preview', '构画', 'fa-calendar-days', 'calendar'],
      ['prompt-inspector-preview', '提示词查看器', 'fa-magnifying-glass', 'prompt_inspector'],
      ['helper-variables-preview', '变量管理器', 'fa-square-root-variable', 'helper_variables'],
      ['helper-logs-preview', '日志查看器', 'fa-file-invoice', 'helper_logs'],
      ['helper-preset-compare-preview', '✧ 预设对比', 'fa-code-compare', 'helper_preset_compare'],
    ],
  };
  const variants = [
    { key: 'current', title: '无底纹对照', note: '安装前底面', caption: '灰白外壳、灰色悬停反馈；不加角落纹理。' },
    { key: 'candidate', title: '渐隐网点', note: '纸面印刷感', caption: '细网点从底部渐显，保留上方文字面的干净。' },
  ];
  const materials = {
    original: {
      title: '平面拼纹', note: '原创 · 少量变化', caption: '实填与斜线保持规律，只在四处用双带替换实填。',
      heading: '原创 / 两种主纹，少量变化',
      description: '以实填和斜线的规律交替为主，36格中仅4格换成双带。变化分散在几处，形状、转向和间距保持统一。',
      source: '../assets/menu-original-flat-varied.svg', width: 156, height: 132, crop: '0 0 156 132',
      sourceCaption: '这次新画的完整平面纹样，深色便于观察实虚关系；菜单里使用浅灰。不是游戏贴图。',
      fit: '图块仍为22px、接缝1px、斜线节距4px。保留相同浅灰印色与周围渐隐，整组156×132px按原大小显示一次。',
    },
    ribbon: {
      title: '扭转条带', note: 'R01 · 结构修订', caption: '短横条沿弯曲束面逐渐错移，中右部收紧，下方长条向内回缩。',
      heading: 'R01 / 交易货品卡片的扭转条带',
      description: '按原图可见关系重建：上方短条束的端点逐渐错移，在中右形成窄腰；下方更长的横条沿内凹边界回缩。条带右侧仍延出画面，不补画未知的闭合部分。',
      source: '../research/game-ui-references-2026-09-08/removed-reference.svg', width: 2955, height: 1510, crop: '2570 320 310 170',
      sourceCaption: '原游戏截图局部。候选是结构重建，不是游戏原始贴图。此前“扇面”命名已纠正；完整结构是否闭合，截图没有交代。',
      fit: '一组216×121.5px的条带，横条间距约3.6px、线厚约1.1px。只取可见局部，边缘渐隐；不使用等角扇区，也不随条目重复。',
      patternCaption: '重建的可见条带局部，非完整环带或游戏原始贴图。此处加深验形，菜单内用浅灰。',
    },
    folds: {
      title: '息壤方格', note: '透明底 · 单色纹理', caption: '正方形反向旋转、错位拼接；空隙透明，直接露出菜单底色。',
      heading: '息壤 / 方形单元的斜向拼接',
      description: '用同样大小的正方形逐行反向旋转、错位重复。只绘制中性灰方块，去掉青绿色和整块底面，斜向间隙保持透明。',
      source: '../assets/menu-xirang-squares.svg', width: 156, height: 156, crop: '0 0 156 156',
      sourceCaption: '本次用正方形重新绘制的纹样，按原图可见结构构建；菜单使用此重绘稿，不再铺原PNG。',
      fit: '方块边长约26px，逐行旋转约±19.7°并错位半格、相邻接角。尺寸和排列保持，透明底直接叠在菜单上，不加底色或混合蒙层。',
    },
    quietfragments: {
      title: '浅印修订', note: '07R · 抽象浅印', caption: '只在下方侧边露出一层很浅的折面，文字区保留更多留白。',
      heading: '07R / 将不规则拼片退到纸面底层',
      description: '沿用恢复理智白底中的抽象拼片关系，减少显现范围和印刷浓度。这里采用不带具体物件或场景含义的折面与缺口。',
      source: '../research/game-ui-references-2026-09-08/removed-reference.svg', width: 2925, height: 1048, crop: '2100 395 815 495',
      sourceCaption: 'B04 原画面局部。候选继续使用按参考重建的矢量图案，非游戏原始底图。',
      fit: '图案保持原来大小，印色减至原稿约四成；显现高度从194px收为160px，左侧加长淡入，给图标和文字起点更多留白。',
      patternCaption: '这里用较深灰色展示重建图案的完整形状；菜单中仅用低浓度的侧边局部。',
    },
    fragments: {
      title: '三角拼片', note: '07 · 按参考重建', caption: '大小、朝向不同的三角面片连成一组，填片与空心折角之间保留大片空白。',
      heading: '07 / 恢复理智页面的三角拼片',
      description: 'B04 白色内容区右侧出现不规则三角拼接。细密网印落在部分面片内部，其他部分只留轮廓，整组图案从右侧进入画面。',
      source: '../research/game-ui-references-2026-09-08/removed-reference.svg', width: 2925, height: 1048, crop: '2100 395 815 495',
      sourceCaption: 'B04 原图 2925×1048，展示白底右侧。尚未定位到对应的完整底图；候选按可见轮廓与留白关系重建。',
      fit: '一组 216×179px 的拼片，大小和方向不均匀；右侧与底边局部裁切，保留完整填片和空心折角。菱形细孔留在面片内部。',
      patternCaption: '菜单构图重建，非游戏原图。这里用较深灰色展示整组，菜单内降低浓度。',
    },
    brokenprint: {
      title: '破碎灰印', note: '08 · 游戏原始底图', caption: '破碎灰面、参差断边与局部网印跨过数行，留下大小不一的浅色缺口。',
      heading: '08 / 醚质提交页的破碎灰印',
      description: 'A06 左侧白底在球体周围和下方铺有破碎灰印，灰块的边界、留白与网点密度都不均匀。候选取这层背景图案。',
      source: '../research/game-ui-references-2026-09-08/removed-reference.svg', width: 3020, height: 1318, crop: '20 380 790 660',
      sourceCaption: 'A06 原图 3020×1318，展示左侧对象区域。发光球、数量和放射圆环属于对象展示，不作为菜单装饰。',
      fit: '原始底图 648×520，等比显示为 220×176.5px。菜单裁去左右外沿，保留中央的破碎灰面和亮色缺口；整组只出现一次。',
      patternCaption: '游戏原始底图 deco_bg_1；此处用较深的灰色展示形状，菜单内降低浓度。文件保留原样，以透明通道着灰色。',
    },
    dots: {
      title: '渐隐网点', note: '纸面印刷感', caption: '网点落在下部约 100px，向上渐隐；细小、均匀，没有大幅底图。',
      heading: '01 / 浅纸底部的渐隐网点',
      description: 'C01 浅色表单的底边可见渐隐网点；官网公告正文与弹窗也采用小点阵平铺。候选使用已核过的官网点阵单元，取它作为纸面底纹的用途。',
      source: '../research/game-ui-references-2026-09-08/removed-reference.svg', width: 833, height: 968, crop: '24 855 783 56',
      sourceCaption: 'C01 原图 833×968，展示底边局部。候选另用官网 24×24 点阵单元；没有把这张截图直接铺进菜单。',
      fit: '24×24 的点阵单元按 12×12px 平铺；这是单元尺寸，内部还含多个点。底部最高 5.5% 强度，100px 内渐隐。适合两种菜单共用。',
    },
    grid: {
      title: '定位网格', note: '中性纸面母版', caption: '细方格配两个稀疏定位十字，像浅印在纸上的制图底层。',
      heading: '02 / 说明长图中的细网格与定位十字',
      description: '帝江更新说明的白色正文纸面同时出现细方格和稀疏十字。这里取文字底层的结构：方格保持小尺度，十字与网格交点并非一一对应。',
      source: '../research/menu-material-sources/removed-reference.svg', width: 1000, height: 2800, crop: '40 425 920 70',
      sourceCaption: '官方长图原尺寸 1000×2800，展示首段正文下的留白；原资料记录约 10px 网格、160px 十字周期。',
      fit: '用网页细线重建 10px 方格，限于下部 128px；只放两个 7px 十字。格线和定位线均弱于原有分组线，不缩放整张长图。',
    },
    modules: {
      title: '灰白几何', note: '武陵来源 · 备选', caption: '半圆与四分圆组成底部几何带；地区特征更明显，需要单独判断是否协调。',
      heading: '03 / 武陵引导页的灰白几何模块',
      description: '武陵引导页资产由低差灰白方格、半圆和四分圆组成。候选保留这一地区图形的出处，只出现一次，不跟着每行菜单重复。',
      source: '../research/menu-material-sources/deco_guide_wuling_6.png', width: 920, height: 152, crop: '0 0 920 152',
      sourceCaption: '原资产 920×152，单格约 66px；此处完整展示原图。候选取右侧局部，保持原长宽比。',
      fit: '整张资产等比缩为 306.7×50.7px，单格约 22px；菜单底部只显示右侧约 156px 宽的一段，并向左、向上淡出。没有 cover 拉伸或假定无缝平铺。',
    },
    directory: {
      title: '目录纸面', note: '新增 04 · 圆环与网点', caption: '左上淡圆弧、底部细网点，中段留净；两端图案各自保持原来的大小。',
      heading: '04 / 行动手册目录的上下纸纹',
      description: '补充视频18秒的目录上缘可见淡圆环，底部是渐显圆点。14秒与18秒选中行改变后，点阵仍在相同位置；候选取这套常驻纸面的上下分工。',
      source: '../research/video-03/removed-reference.svg', width: 2560, height: 1440, crop: '324 400 466 198',
      sourceCaption: '原视频2560×1440，18秒帧。这里展示上缘圆环，点击完整帧可看底部点阵；截图仅作来源对照。',
      fit: '圆心移到左上边界外，圆弧按4px节距绘制，68px半径内渐隐；底部点阵限62px高，最高6.5%强度。上下图案均不跟随菜单高度缩放。',
    },
    offset: {
      title: '错位双框', note: '新增 05 · 薄片边缘', caption: '在原有外框内添一层轻微错位的细框和亮边，纸面保持干净。',
      heading: '05 / 圆盘主菜单的错位细框',
      description: '补充视频42秒的浅灰按钮同时有内框和略微错位的轮廓。这里抽取边线之间的层次，按紧凑菜单的原有内边距重做。',
      source: '../research/video-03/removed-reference.svg', width: 2560, height: 1440, crop: '92 375 625 530',
      sourceCaption: '原视频2560×1440，42秒帧；参考按钮的弧形与透视服务于圆盘布局。候选只采用错位框的层次关系。',
      fit: '次框为1px浅灰线，左上内收2px、右下内收4px，配1px柔和亮边。两框都收在原有160px外壳中，未增加行内边距或挤占滚动槽。',
    },
    registration: {
      title: '定位细框', note: '新增 06 · 留白与收边', caption: '对角两处短细框，加两个小定位十字；正文区域不铺网格。',
      heading: '06 / 内容纸面边缘的定位结构',
      description: '补充视频14秒的内容纸面用细线和稀疏十字标出边缘。候选把它收缩成对角两处局部结构，与02的满区细网格形成不同处理。',
      source: '../research/video-03/removed-reference.svg', width: 2560, height: 1440, crop: '800 950 420 275',
      sourceCaption: '原视频2560×1440，14秒帧，展示内容纸面左下边缘。原框线约1–2px、十字约16–20px，均为观察估计。',
      fit: '边线1px，局部长度44–58px；只保留两个7px十字。右侧结构止于滚动槽之前，线段与十字不随菜单增高而拉伸。',
    },
  };
  const panels = [];
  let openMenu = 'options';
  let lastTrigger = null;
  let positionFrame = 0;

  for (const variant of variants) {
    const fragment = $('#panel-template').content.cloneNode(true);
    const panel = $('.comparison-panel', fragment);
    panel.classList.add(variant.key);
    panel.dataset.variant = variant.key;
    $('.panel-heading h2', panel).textContent = variant.title;
    $('.panel-heading span', panel).textContent = variant.note;
    $('.panel-caption', panel).textContent = variant.caption;
    const menu = $('.menu-popover', panel);
    menu.id = `${variant.key}-menu`;
    $$('.input-entry', panel).forEach(button => button.setAttribute('aria-controls', menu.id));
    const input = $('textarea', panel);
    input.setAttribute('aria-label', `${variant.title}：本地输入草稿`);
    panels.push(panel);
    $('#comparison').append(fragment);
  }

  function announce(message) { status.textContent = message; }
  function setMaterial(key, notify = true) {
    const material = materials[key];
    if (!material) return;
    const panel = panels.find(item => item.classList.contains('candidate'));
    panel.dataset.material = key;
    $('.panel-heading h2', panel).textContent = material.title;
    $('.panel-heading span', panel).textContent = material.note;
    $('.panel-caption', panel).textContent = material.caption;
    $('textarea', panel).setAttribute('aria-label', `${material.title}：本地输入草稿`);
    $$('.material-picker button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.material === key)));
    $('#reference-title').textContent = material.heading;
    $('#reference-description').textContent = material.description;
    $('#reference-caption').textContent = material.sourceCaption;
    $('#material-fit').textContent = material.fit;
    $('#material-reference').href = material.source;
    $('#material-reference').dataset.material = key;
    $('#material-reference').setAttribute('aria-label', `打开${material.title}参考原图`);
    $('#reference-crop').setAttribute('viewBox', material.crop);
    const source = $('#reference-source');
    source.setAttribute('href', material.source);
    source.setAttribute('width', material.width);
    source.setAttribute('height', material.height);
    $('#pattern-study').hidden = !material.patternCaption;
    $('#pattern-swatch').dataset.material = key;
    $('#pattern-caption').textContent = material.patternCaption || '';
    if (notify) announce(`右列已切换为「${material.title}」，菜单与滚动位置保持不变。`);
  }
  $$('.material-picker button').forEach(button => button.addEventListener('click', () => setMaterial(button.dataset.material)));
  function itemsFor(kind) {
    const items = menuData[kind].slice();
    if ($('#long-label').checked) {
      items.push(null, ['long-label-test', '长标签测试：查看当前角色的全部附件和聊天资料（此项只用于检查文字换行）', 'fa-file-lines', 'test', 'a']);
    }
    return items;
  }
  function buildMenu(panel, kind) {
    const scroller = $('.menu-scroll', panel);
    scroller.replaceChildren();
    scroller.dataset.hostMenu = kind;
    scroller.setAttribute('aria-label', `${panel.classList.contains('candidate') ? '材质对照' : '无底纹对照'}：${kind === 'options' ? '聊天菜单' : '魔棒菜单'}（本地预览）`);
    const groups = new Map();
    for (const item of itemsFor(kind)) {
      if (!item) { scroller.append(document.createElement('hr')); continue; }
      const [hostId, label, glyph, groupName, tag] = item;
      const row = document.createElement(kind === 'options' || tag === 'a' ? 'a' : 'div');
      row.className = 'menu-row list-group-item';
      row.id = `${panel.dataset.variant}-${hostId}`;
      row.dataset.hostId = hostId;
      row.setAttribute('role', 'menuitem');
      row.tabIndex = -1;
      if (row.tagName === 'A') row.setAttribute('href', '#local-preview');
      const icon = document.createElement(kind === 'options' || tag === 'a' ? 'i' : 'div');
      icon.className = `fa-solid ${glyph}${icon.tagName === 'DIV' ? ' extensionsMenuExtensionButton' : ''}`;
      icon.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.textContent = label;
      row.append(icon, text);
      if (kind === 'extensionsMenu') {
        const groupKey = groupName || hostId;
        if (!groups.has(groupKey)) {
          const group = document.createElement('div');
          group.className = 'extension_container';
          group.dataset.group = groupKey;
          groups.set(groupKey, group);
          scroller.append(group);
        }
        groups.get(groupKey).append(row);
      } else scroller.append(row);
      row.addEventListener('click', event => {
        event.preventDefault();
        const trigger = $(`.input-entry[data-menu="${kind}"]`, panel);
        setOpenMenu(null);
        trigger.focus({ preventScroll: true });
        announce(`预览「${label}」：未执行酒馆操作。`);
      });
    }
    $('.menu-row', scroller)?.setAttribute('tabindex', '0');
  }
  function placeMenus() {
    positionFrame = 0;
    if (!openMenu) return;
    for (const panel of panels) {
      const menu = $('.menu-popover', panel);
      const stage = $('.stage', panel);
      const trigger = $(`.input-entry[data-menu="${openMenu}"]`, panel);
      const stageRect = stage.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const available = Math.max(40, triggerRect.top - stageRect.top - 20);
      menu.style.maxWidth = `${Math.max(0, Math.min(330, stage.clientWidth - 24))}px`;
      menu.style.maxHeight = `${Math.min(470, available)}px`;
      const menuRect = menu.getBoundingClientRect();
      menu.style.left = `${Math.max(12, Math.min(triggerRect.left - stageRect.left, stage.clientWidth - menuRect.width - 12))}px`;
      menu.style.top = `${Math.max(12, triggerRect.top - stageRect.top - menuRect.height - 8)}px`;
    }
  }
  function schedulePlacement() {
    if (!positionFrame) positionFrame = requestAnimationFrame(placeMenus);
  }
  function setOpenMenu(kind, trigger = null, focusFirst = false) {
    const changed = openMenu !== kind;
    openMenu = kind;
    if (trigger) lastTrigger = trigger;
    for (const panel of panels) {
      const menu = $('.menu-popover', panel);
      if (kind && (changed || !$('.menu-row', panel))) buildMenu(panel, kind);
      menu.hidden = !kind;
      $$('.input-entry', panel).forEach(button => button.setAttribute('aria-expanded', String(button.dataset.menu === kind)));
    }
    if (kind) {
      placeMenus();
      if (focusFirst && trigger) $('.menu-row', trigger.closest('.comparison-panel'))?.focus({ preventScroll: true });
    }
  }
  for (const panel of panels) {
    $$('.input-entry', panel).forEach(button => {
      button.addEventListener('click', () => {
        const next = openMenu === button.dataset.menu ? null : button.dataset.menu;
        setOpenMenu(next, button);
        announce(next ? `两列已同步为${next === 'options' ? '聊天菜单' : '魔棒菜单'}，可滚动与悬停比较。` : '菜单已收起，点击入口可重新展开。');
      });
      button.addEventListener('keydown', event => {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        setOpenMenu(button.dataset.menu, button, true);
      });
    });
    const scroller = $('.menu-scroll', panel);
    scroller.addEventListener('keydown', event => {
      const rows = $$('.menu-row', scroller);
      const index = rows.indexOf(document.activeElement);
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % rows.length;
      else if (event.key === 'ArrowUp') next = (index - 1 + rows.length) % rows.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = rows.length - 1;
      else if (event.key === ' ' && event.target.matches('.menu-row')) { event.preventDefault(); event.target.click(); return; }
      else if (event.key === 'Enter' && event.target.tagName === 'DIV' && event.target.matches('.menu-row')) { event.preventDefault(); event.target.click(); return; }
      else return;
      if (!rows.length) return;
      event.preventDefault();
      rows.forEach((row, i) => row.tabIndex = i === next ? 0 : -1);
      rows[next].focus({ preventScroll: true });
      const row = rows[next];
      if (row.offsetTop < scroller.scrollTop) scroller.scrollTop = row.offsetTop;
      else if (row.offsetTop + row.offsetHeight > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = row.offsetTop + row.offsetHeight - scroller.clientHeight;
    });
    scroller.addEventListener('scroll', () => {
      const range = scroller.scrollHeight - scroller.clientHeight;
      const ratio = range > 0 ? scroller.scrollTop / range : 0;
      for (const other of panels) {
        if (other === panel) continue;
        const target = $('.menu-scroll', other);
        const top = ratio * Math.max(0, target.scrollHeight - target.clientHeight);
        if (Math.abs(target.scrollTop - top) > .5) target.scrollTop = top;
      }
    }, { passive: true });
    $('textarea', panel).addEventListener('input', event => {
      panels.forEach(other => { if (other !== panel) $('textarea', other).value = event.target.value; });
      schedulePlacement();
    });
    $('.send-entry', panel).addEventListener('click', () => announce('发送按钮仅供查看外观，草稿没有提交到任何服务。'));
  }
  $('#canvas-width').addEventListener('change', event => {
    document.documentElement.style.setProperty('--canvas-width', event.target.value === 'auto' ? '100%' : `${event.target.value}px`);
    schedulePlacement();
  });
  $('#long-label').addEventListener('change', () => {
    if (!openMenu) return;
    panels.forEach(panel => buildMenu(panel, openMenu));
    placeMenus();
    announce($('#long-label').checked ? '两列已加入相同的长标签测试项。' : '长标签测试项已移除，保留菜单入口样例。');
  });
  $('#scroll-bottom').addEventListener('click', () => {
    if (!openMenu) setOpenMenu('options');
    panels.forEach(panel => { const scroller = $('.menu-scroll', panel); scroller.scrollTop = scroller.scrollHeight; });
    announce('已滚到两列菜单底部，可将鼠标移到最后几行比较纹理。');
  });
  $('#close-menus').addEventListener('click', () => { setOpenMenu(null); announce('菜单已收起，点击输入栏入口可重新展开。'); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !openMenu) return;
    event.preventDefault();
    setOpenMenu(null);
    lastTrigger?.focus({ preventScroll: true });
    announce('菜单已收起。');
  });
  document.addEventListener('click', event => {
    if (event.target.closest('.menu-popover, .input-entry, .review-controls, .material-picker')) return;
    if (openMenu) setOpenMenu(null);
  });
  window.addEventListener('resize', schedulePlacement);
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(schedulePlacement);
    panels.forEach(panel => { observer.observe($('.stage', panel)); observer.observe($('.composer-slot', panel)); });
  }
  setMaterial('modules', false);
  setOpenMenu('options');
  document.fonts?.ready.then(schedulePlacement);
})();
