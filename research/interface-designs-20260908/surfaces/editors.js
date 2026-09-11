(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const clone = value => structuredClone(value);
  const characterSeed = {
    name: '边界记录员',
    description: '负责整理谷地站点之间的行程、天气与途中见闻。她习惯在回答之前看一眼手边的记录，而不是急着给出结论。\n\n工作时说话简洁，会把确定的事与猜测分开。她不替同行者决定路线，但会指出地图上还没有核实的部分。\n\n随身带着一册纸质巡检簿。封面已经磨白，空白页仍然留得很整齐。',
    firstMessage: '雨刚停。廊檐上的水沿着细缝滴下来，落在你脚边。\n\n她把摊开的巡检簿往里收了半寸，抬头看向你。\n\n“东侧通道可以走。北边那条，我还没有确认。”\n\n笔尖停在地图的一处空白上。\n\n“先坐一会儿吧。你想从哪一段开始？”',
    creatorNotes: '用于编辑器排版与交互检查的虚构角色。\n可以修改本页文字、关闭窗口后再打开检查保值。',
    version: '样例 1.0',
    systemPrompt: '',
    postHistory: '',
    personality: '谨慎、耐心，善于记录。面对不确定的信息会明确保留余地。熟悉之后，会用很短的玩笑缓解紧张。',
    scenario: '连续降雨后的傍晚，临时站点正在重新核对通行路线。你来到廊下，询问下一段旅程。',
    note: '记住双方尚未核实北侧通道。只描述眼前能观察到的环境，不替同行者作选择。',
    noteDepth: '4',
    noteRole: 'system',
    examples: '<START>\n{{user}}：北边一定走不了吗？\n{{char}}：“不一定。我只能说，现在没有足够的记录。”她翻过一页，“你若愿意等，我可以先去问问值班员。”\n\n<START>\n{{user}}：你的本子怎么这么整齐？\n{{char}}：“因为乱的那一本没有拿出来。”',
  };
  const newCharacterSeed = Object.fromEntries(Object.keys(characterSeed).map(key => [key, '']));
  newCharacterSeed.noteDepth = '4';
  newCharacterSeed.noteRole = 'system';
  const entrySeed = {
    uid: 101, comment: '', state: 'normal', position: '4', depth: '4', order: '100', probability: '100',
    active: true, key: '', keySecondary: '', logic: '0', scanDepth: '', caseSensitive: 'inherit',
    wholeWords: 'inherit', automationId: '', content: '', excludeRecursion: false, preventRecursion: false,
    group: '', groupWeight: '100', sticky: '0', cooldown: '0', matchCharacterDescription: false,
    matchScenario: false, matchCreatorNotes: false,
  };
  const worldSeeds = [
    { ...entrySeed, uid: 101, comment: '雨后巡检路线与尚待核实的北侧通道', key: '巡检, 北侧通道, 雨后', keySecondary: '路线, 通行', content: '东侧步行通道已经完成初步检查，可供人员通行。\n\n北侧通道的记录仍不完整。值班员尚未提交新的巡检结果，不应仅凭旧地图判断路况。\n\n询问通行情况时，可以说明已确认的东侧路线，并明确北侧信息仍待核实。', group: '路线记录', matchScenario: true },
    { ...entrySeed, uid: 102, comment: '临时站点 · 值班交接与公共物品', active: false, position: '0', key: '站点, 值班, 交接', content: '公共物品登记在入口侧面的清单上。交接时只核对本班新增与变更的事项。\n\n这条样例初始停用，用来检查停用状态下的文字可读性。', order: '90' },
    { ...entrySeed, uid: 103, comment: '巡检簿的写法', state: 'constant', position: '1', key: '巡检簿, 记录', content: '记录分为日期、地点、观察和待确认事项。\n\n观察写已经发生的事实，待确认事项另起一段。不要把猜测直接写成结论。', order: '80', preventRecursion: true },
  ];
  const paragraph = '从廊下向外看，积水把路标的倒影分成几段。记录员先核对时间，再将观察到的情况写进巡检簿；没有到达的地点仍留在“待确认”一栏。同行者可以询问路线、等待新的消息，也可以先整理手边的物品。';
  const longText = Array.from({ length: 12 }, (_, index) => `第 ${index + 1} 段记录\n${paragraph}`).join('\n\n');

  let existingCharacter = clone(characterSeed);
  let draftCharacter = clone(newCharacterSeed);
  let entries = clone(worldSeeds);
  let nextUid = 104;
  let openEntries = new Set([101]);
  let characterMode = 'existing';
  let reviewKind = 'character';
  let descriptionsHidden = false;
  let expandedSource = null;
  let pendingDelete = null;
  let noticeTimer;
  const returnFocus = new Map();

  const currentCharacter = () => characterMode === 'new' ? draftCharacter : existingCharacter;
  const entryByUid = uid => entries.find(entry => entry.uid === Number(uid));

  function announce(message = '本页样例已更新。', delay = 280) {
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      $('editor-feedback').textContent = message;
      if ($('character_popup').open) $('advanced-feedback').textContent = message;
      if ($('expanded-editor').open) $('expanded-feedback').textContent = message;
    }, delay);
  }

  function updateCounters() {
    document.querySelectorAll('[data-count-target]').forEach(counter => {
      const field = $(counter.dataset.countTarget);
      if (field) counter.textContent = `${Array.from(field.value).length.toLocaleString('zh-CN')} 个样例字符`;
    });
  }

  function fitTitle(field) {
    if (!field || !field.isConnected || !field.getClientRects().length) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(Math.max(field.scrollHeight + 2, 44), 160)}px`;
  }

  function fitTitles() {
    requestAnimationFrame(() => document.querySelectorAll('.entry-title-field textarea').forEach(fitTitle));
  }

  function syncStageTitle() {
    $('editor-context-label').textContent = reviewKind === 'world' ? '世界书条目' : characterMode === 'new' ? '新建角色草稿' : '角色定义';
    $('editor-stage-title').textContent = reviewKind === 'world' ? '谷地巡检手册' : currentCharacter()?.name || (characterMode === 'new' ? '给角色一个名字' : '角色样例已删除');
    $('advanced-title').textContent = `${currentCharacter()?.name || '未命名角色'} · 高级定义`;
  }

  function populateCharacter() {
    const character = currentCharacter();
    $('rm_ch_create_block').hidden = !character;
    $('character-empty').hidden = !!character;
    $('create_button').hidden = characterMode !== 'new';
    $('delete_button').hidden = characterMode === 'new';
    $('character_name_pole').required = characterMode === 'new';
    $('character-name-error').hidden = true;
    $('character_name_pole').removeAttribute('aria-invalid');
    document.querySelectorAll('[data-character-field]').forEach(field => {
      field.value = character?.[field.dataset.characterField] ?? '';
    });
    $('creator_notes_spoiler').textContent = character?.creatorNotes || '还没有创作者注释。';
    $('descriptionWrapper').hidden = descriptionsHidden;
    $('firstMessageWrapper').hidden = descriptionsHidden;
    $('creators_note_desc_hidden').hidden = !descriptionsHidden;
    $('spoiler_free_desc_button').setAttribute('aria-pressed', String(descriptionsHidden));
    $('spoiler_free_desc_button').setAttribute('aria-label', descriptionsHidden ? '显示描述与开场白' : '隐藏描述与开场白');
    syncStageTitle();
    updateCounters();
  }

  function showReview(kind) {
    reviewKind = kind;
    $('character-sample').hidden = kind !== 'character';
    $('world-sample').hidden = kind !== 'world';
    $('character-mode-control').hidden = kind === 'world';
    $('editor-scroll').scrollTop = 0;
    syncStageTitle();
    fitTitles();
  }

  function showDialog(dialog, trigger, focusTarget) {
    if (dialog.open) return;
    returnFocus.set(dialog, trigger || document.activeElement);
    dialog.showModal();
    if (focusTarget) requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
  }

  function openAdvanced(trigger) {
    if (!currentCharacter()) {
      $('review-surface').value = 'character';
      announce('当前角色样例已删除。先恢复样例或切换到新建草稿。', 0);
      $('restore-character').focus();
      return;
    }
    showReview('character');
    $('review-surface').value = 'advanced';
    $('advanced-feedback').textContent = '输入更新本页样例，关闭后保留。';
    showDialog($('character_popup'), trigger, $('character_popup').querySelector('[data-close-dialog]'));
  }

  function toggleFold(button, content, open) {
    content.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    const icon = button.querySelector('.inline-drawer-icon');
    if (icon) { icon.classList.toggle('up', open); icon.classList.toggle('down', !open); }
  }

  function fillEntryFields(root, entry) {
    root.querySelectorAll('[data-world-field]').forEach(field => {
      const key = field.dataset.worldField;
      field.id = `wi_${entry.uid}_${key}`;
      if (field.type === 'checkbox') field.checked = !!entry[key];
      else field.value = entry[key] ?? '';
    });
    root.querySelectorAll('[data-label-field]').forEach(label => label.htmlFor = `wi_${entry.uid}_${label.dataset.labelField}`);
    root.querySelectorAll('[data-expand-field]').forEach(button => button.dataset.for = `wi_${entry.uid}_${button.dataset.expandField}`);
    root.querySelectorAll('[data-counter-field]').forEach(counter => counter.dataset.countTarget = `wi_${entry.uid}_${counter.dataset.counterField}`);
    const matchToggle = root.querySelector('[data-entry-fold]');
    const matchContent = root.querySelector('[data-entry-fold-content]');
    if (matchToggle && matchContent) {
      matchContent.id = `wi_${entry.uid}_matching_sources`;
      matchToggle.setAttribute('aria-controls', matchContent.id);
    }
  }

  function updateEntryHeader(card, entry) {
    const open = openEntries.has(entry.uid);
    const title = entry.comment.trim() || '未命名条目';
    const toggle = card.querySelector('.entry-toggle');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', `${open ? '收起' : '展开'}条目：${title}`);
    toggle.querySelector('i').classList.toggle('up', open);
    toggle.querySelector('i').classList.toggle('down', !open);
    const kill = card.querySelector('.killSwitch');
    kill.setAttribute('aria-pressed', String(entry.active));
    kill.setAttribute('aria-label', `${entry.active ? '停用' : '启用'}条目：${title}`);
    kill.querySelector('span').textContent = entry.active ? '已启用' : '已停用';
    kill.querySelector('i').className = `fa-solid ${entry.active ? 'fa-toggle-on' : 'fa-toggle-off'}`;
    card.querySelector('.wi-card-entry').classList.toggle('disabledWIEntry', !entry.active);
    const inactiveDepth = entry.position !== '4';
    card.querySelector('.depth-control').classList.toggle('is-inactive', inactiveDepth);
    card.querySelector('[name=depth]').disabled = inactiveDepth;
    card.querySelector('.duplicate_entry_button').setAttribute('aria-label', `复制条目：${title}`);
    card.querySelector('.delete_entry_button').setAttribute('aria-label', `删除条目：${title}`);
  }

  function setEntryOpen(card, entry, open) {
    const outlet = card.querySelector('.inline-drawer-outlet');
    if (open) {
      openEntries.add(entry.uid);
      if (!outlet.firstElementChild) {
        const editor = $('entry_edit_template').content.cloneNode(true);
        fillEntryFields(editor, entry);
        outlet.replaceChildren(editor);
      }
      outlet.hidden = false;
    } else {
      openEntries.delete(entry.uid);
      outlet.hidden = true;
      // Inputs update the memory record immediately; the editor can now be discarded.
      outlet.replaceChildren();
    }
    updateEntryHeader(card, entry);
    updateCounters();
  }

  function renderWorld() {
    const fragment = document.createDocumentFragment();
    entries.forEach(entry => {
      const card = $('world-entry-template').content.firstElementChild.cloneNode(true);
      card.dataset.uid = String(entry.uid);
      card.id = `world-entry-${entry.uid}`;
      const outlet = card.querySelector('.inline-drawer-outlet');
      outlet.id = `world-entry-outlet-${entry.uid}`;
      card.querySelector('.entry-toggle').setAttribute('aria-controls', outlet.id);
      card.querySelector('.entry-uid').textContent = `UID ${entry.uid}`;
      fillEntryFields(card, entry);
      setEntryOpen(card, entry, openEntries.has(entry.uid));
      fragment.append(card);
    });
    $('world_popup_entries_list').replaceChildren(fragment);
    $('entry-count').textContent = `${entries.length} 条样例`;
    $('world-empty').hidden = entries.length > 0;
    $('OpenAllWIEntries').disabled = entries.length === 0;
    $('CloseAllWIEntries').disabled = entries.length === 0;
    fitTitles();
    updateCounters();
  }

  function askDelete({ title, description, trigger, run, fallback }) {
    pendingDelete = { run, fallback };
    $('confirm-title').textContent = title;
    $('confirm-description').textContent = description;
    showDialog($('editor-confirm'), trigger, $('confirm-cancel'));
  }

  function updateNumericField(field) {
    if (field.type !== 'number' || field.value === '') return;
    const number = Number(field.value);
    if (!Number.isFinite(number)) return;
    const lower = field.min === '' ? -Infinity : Number(field.min);
    const upper = field.max === '' ? Infinity : Number(field.max);
    field.value = String(Math.min(upper, Math.max(lower, number)));
  }

  function onFieldInput(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
    if (event.type === 'change') updateNumericField(field);
    if (field.hasAttribute('data-character-field')) {
      const character = currentCharacter();
      if (!character) return;
      character[field.dataset.characterField] = field.value;
      if (field.dataset.characterField === 'name') {
        syncStageTitle();
        if (field.value.trim()) {
          $('character-name-error').hidden = true;
          field.removeAttribute('aria-invalid');
        }
      }
      if (field.dataset.characterField === 'creatorNotes') $('creator_notes_spoiler').textContent = field.value || '还没有创作者注释。';
      updateCounters();
      announce(characterMode === 'new' ? '本页样例已更新 · 新建草稿。' : '本页样例已更新。');
    } else if (field.hasAttribute('data-world-field')) {
      const card = field.closest('.world_entry');
      const entry = card && entryByUid(card.dataset.uid);
      if (!entry) return;
      entry[field.dataset.worldField] = field.type === 'checkbox' ? field.checked : field.value;
      updateEntryHeader(card, entry);
      if (field.dataset.worldField === 'comment') fitTitle(field);
      updateCounters();
      announce(`本页样例已更新 · UID ${entry.uid}。`);
    }
  }

  document.addEventListener('input', onFieldInput);
  document.addEventListener('change', onFieldInput);
  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button) return;
    if (button.hasAttribute('data-close-dialog')) button.closest('dialog').close();
    else if (button.hasAttribute('data-fold')) {
      const content = $(button.dataset.fold);
      toggleFold(button, content, content.hidden);
    } else if (button.hasAttribute('data-entry-fold')) {
      const content = button.closest('.matching-sources').querySelector('[data-entry-fold-content]');
      toggleFold(button, content, content.hidden);
    } else if (button.classList.contains('editor_maximize')) {
      const source = $(button.dataset.for);
      if (!source) return;
      expandedSource = source;
      $('expanded-title').textContent = source.labels?.[0]?.textContent.trim() || '正文';
      $('expanded-content').value = source.value;
      $('expanded-content').dataset.for = source.id;
      $('expanded-feedback').textContent = '输入同步至本页原字段，关闭后保留。';
      showDialog($('expanded-editor'), button, $('expanded-content'));
    }
  });

  document.querySelectorAll('.editor-modal').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (dialog.id === 'editor-confirm') pendingDelete = null;
      if (dialog.id === 'expanded-editor') expandedSource = null;
      if (dialog.id === 'character_popup') $('review-surface').value = reviewKind;
      const trigger = returnFocus.get(dialog);
      returnFocus.delete(dialog);
      if (trigger?.isConnected && !trigger.disabled) trigger.focus();
    });
  });

  $('expanded-content').addEventListener('input', () => {
    if (!expandedSource?.isConnected) return;
    expandedSource.value = $('expanded-content').value;
    expandedSource.dispatchEvent(new Event('input', { bubbles: true }));
  });
  $('advanced_div').addEventListener('click', event => openAdvanced(event.currentTarget));
  $('spoiler_free_desc_button').addEventListener('click', () => {
    descriptionsHidden = !descriptionsHidden;
    populateCharacter();
  });
  $('review-surface').addEventListener('change', event => {
    if (event.target.value === 'advanced') openAdvanced(event.target);
    else showReview(event.target.value);
  });
  $('review-character-mode').addEventListener('change', event => {
    characterMode = event.target.value;
    populateCharacter();
    announce(characterMode === 'new' ? '已切换到本页新建草稿；填写名称后可创建示例。' : '已切换到本页已有角色样例。', 0);
  });
  $('review-width').addEventListener('change', event => {
    document.body.style.setProperty('--review-width', event.target.value === 'wide' ? '1080px' : `${event.target.value}px`);
    fitTitles();
  });
  $('review-height').addEventListener('change', event => {
    document.body.dataset.panelHeight = event.target.value;
    document.body.style.setProperty('--panel-height', `${event.target.value}px`);
  });
  $('form_create').addEventListener('submit', event => {
    event.preventDefault();
    if (characterMode !== 'new') return;
    if (!draftCharacter.name.trim()) {
      $('character-name-error').hidden = false;
      $('character_name_pole').setAttribute('aria-invalid', 'true');
      $('character_name_pole').setAttribute('aria-describedby', 'character-name-error');
      $('character_name_pole').focus();
      announce('先填写角色名称，再创建本页示例。', 0);
      return;
    }
    existingCharacter = clone(draftCharacter);
    characterMode = 'existing';
    $('review-character-mode').value = 'existing';
    draftCharacter = clone(newCharacterSeed);
    populateCharacter();
    $('advanced_div').focus();
    announce('本页样例已更新 · 新角色示例已创建。', 0);
  });
  $('delete_button').addEventListener('click', event => {
    if (!existingCharacter) return;
    askDelete({
      title: '删除这张角色样例？', description: existingCharacter.name || '未命名角色', trigger: event.currentTarget,
      run: () => { existingCharacter = null; populateCharacter(); announce('本页样例已更新 · 角色样例已删除。', 0); },
      fallback: () => $('restore-character'),
    });
  });
  $('restore-character').addEventListener('click', () => {
    existingCharacter = clone(characterSeed);
    populateCharacter();
    $('character_name_pole').focus();
    announce('本页样例已更新 · 角色样例已恢复。', 0);
  });

  $('world_popup_entries_list').addEventListener('submit', event => event.preventDefault());
  $('world_popup_entries_list').addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    const card = button?.closest('.world_entry');
    const entry = card && entryByUid(card.dataset.uid);
    if (!entry) return;
    if (button.classList.contains('entry-toggle')) {
      setEntryOpen(card, entry, !openEntries.has(entry.uid));
    } else if (button.classList.contains('killSwitch')) {
      entry.active = !entry.active;
      updateEntryHeader(card, entry);
      announce(`本页样例已更新 · UID ${entry.uid} 已${entry.active ? '启用' : '停用'}，正文保留。`, 0);
    } else if (button.classList.contains('duplicate_entry_button')) {
      const duplicate = { ...clone(entry), uid: nextUid++, comment: `${entry.comment || '未命名条目'} · 副本` };
      entries.splice(entries.indexOf(entry) + 1, 0, duplicate);
      openEntries.add(duplicate.uid);
      renderWorld();
      $(`wi_${duplicate.uid}_comment`).focus();
      announce(`本页样例已更新 · 已复制为 UID ${duplicate.uid}。`, 0);
    } else if (button.classList.contains('delete_entry_button')) {
      const index = entries.indexOf(entry);
      const adjacentUid = entries[index + 1]?.uid ?? entries[index - 1]?.uid;
      askDelete({
        title: '删除这个条目样例？', description: `${entry.comment || '未命名条目'}（UID ${entry.uid}）`, trigger: button,
        run: () => {
          entries = entries.filter(item => item.uid !== entry.uid);
          openEntries.delete(entry.uid);
          renderWorld();
          announce(`本页样例已更新 · UID ${entry.uid} 已删除。`, 0);
        },
        fallback: () => $(`world-entry-${adjacentUid}`)?.querySelector('.entry-toggle') || $('world_popup_new'),
      });
    }
  });
  $('world_popup_new').addEventListener('click', () => {
    const entry = { ...clone(entrySeed), uid: nextUid++, comment: '新条目' };
    entries.push(entry);
    openEntries.add(entry.uid);
    renderWorld();
    $(`wi_${entry.uid}_comment`).focus();
    announce(`本页样例已更新 · 新建 UID ${entry.uid}。`, 0);
  });
  $('OpenAllWIEntries').addEventListener('click', () => {
    openEntries = new Set(entries.map(entry => entry.uid));
    renderWorld();
    announce('已展开本页全部条目。', 0);
  });
  $('CloseAllWIEntries').addEventListener('click', () => {
    openEntries.clear();
    renderWorld();
    announce('已收起本页全部条目，正文保留。', 0);
  });
  $('confirm-cancel').addEventListener('click', () => $('editor-confirm').close());
  $('confirm-delete').addEventListener('click', () => {
    const action = pendingDelete;
    if (!action) return;
    action.run();
    returnFocus.set($('editor-confirm'), action.fallback());
    pendingDelete = null;
    $('editor-confirm').close();
  });

  $('fill-long-sample').addEventListener('click', () => {
    if (reviewKind === 'world') {
      if (!entries.length) entries.push({ ...clone(entrySeed), uid: nextUid++ });
      const entry = entries[0];
      entry.comment = '连续降雨后的谷地巡检记录——北侧临时通道、值班交接与尚未获得现场确认的通行条件';
      entry.key = '连续降雨, 北侧临时通道, 尚未获得现场确认的通行条件, 巡检记录, 值班交接';
      entry.content = longText;
      openEntries.add(entry.uid);
      renderWorld();
    } else {
      if (!currentCharacter()) existingCharacter = clone(characterSeed);
      const character = currentCharacter();
      character.name = '边界记录员 · 巡检簿与尚未写下的下一段旅程';
      character.description = longText;
      character.firstMessage = `${characterSeed.firstMessage}\n\n${longText}`;
      character.examples = Array.from({ length: 6 }, () => characterSeed.examples).join('\n\n');
      populateCharacter();
    }
    announce('本页样例已更新 · 已填入多行长文本。', 0);
  });
  $('reset-editors').addEventListener('click', () => {
    document.querySelectorAll('.editor-modal[open]').forEach(dialog => dialog.close());
    existingCharacter = clone(characterSeed);
    draftCharacter = clone(newCharacterSeed);
    entries = clone(worldSeeds);
    nextUid = 104;
    openEntries = new Set([101]);
    descriptionsHidden = false;
    document.querySelectorAll('[data-fold]').forEach(button => toggleFold(button, $(button.dataset.fold), false));
    populateCharacter();
    renderWorld();
    announce('本页样例已重置。面板宽度、高度与候选选择保留。', 0);
  });
  window.addEventListener('resize', fitTitles);
  document.addEventListener('ef:variant', fitTitles);

  populateCharacter();
  renderWorld();
  showReview('character');
})();
