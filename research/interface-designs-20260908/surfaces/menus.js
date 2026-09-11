(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const stage = byId('menu-workspace');
  const panels = { chat: byId('options'), extensions: byId('extensionsMenu') };
  const triggers = { chat: byId('options_button'), extensions: byId('extensionsMenuButton') };
  const submenu = byId('sd_dropdown');
  const submenuTrigger = byId('image-submenu-trigger');
  const source = byId('menu-origin');
  let activeMenu = 'chat';
  let selectedChoice = '边境通用档案';

  function focusFirst(node) {
    const candidate = node.querySelector('button:not(:disabled), a[tabindex], [role="button"][tabindex]');
    candidate?.focus();
  }

  function closeSubmenu({ returnFocus = false } = {}) {
    const wasOpen = !submenu.hidden;
    submenu.hidden = true;
    submenuTrigger.setAttribute('aria-expanded', 'false');
    stage.classList.remove('has-submenu');
    if (returnFocus && wasOpen) submenuTrigger.focus({ preventScroll: true });
  }

  function closeMenus({ returnFocus = false } = {}) {
    const previous = activeMenu;
    closeSubmenu();
    for (const key of Object.keys(panels)) {
      panels[key].hidden = true;
      triggers[key].setAttribute('aria-expanded', 'false');
    }
    activeMenu = null;
    stage.classList.remove('has-open-menu');
    source.textContent = '选择一个菜单入口';
    if (returnFocus && previous) triggers[previous].focus({ preventScroll: true });
  }

  function openMenu(key, { keyboard = false } = {}) {
    closeSubmenu();
    for (const name of Object.keys(panels)) {
      panels[name].hidden = name !== key;
      triggers[name].setAttribute('aria-expanded', String(name === key));
    }
    activeMenu = key;
    stage.classList.add('has-open-menu');
    source.textContent = key === 'chat' ? '原生聊天菜单' : '内置扩展 + 第三方样例';
    if (keyboard) focusFirst(panels[key]);
  }

  for (const [key, trigger] of Object.entries(triggers)) {
    trigger.addEventListener('click', event => {
      if (activeMenu === key) closeMenus({ returnFocus: true });
      else openMenu(key, { keyboard: event.detail === 0 });
    });
  }

  submenuTrigger.addEventListener('click', () => {
    if (!submenu.hidden) return closeSubmenu({ returnFocus: true });
    submenu.hidden = false;
    submenuTrigger.setAttribute('aria-expanded', 'true');
    stage.classList.add('has-submenu');
    focusFirst(submenu);
  });
  byId('submenu-back').addEventListener('click', () => closeSubmenu({ returnFocus: true }));

  function recordAction(target) {
    if (target.getAttribute('aria-disabled') === 'true') {
      window.EF.toast('此项在当前示例中不可用');
      return;
    }
    const action = target.dataset.action;
    if (!action) return;
    let detail = '本地示例已选择；没有向酒馆发送操作。';
    if (target.dataset.toggleAction) {
      const next = target.getAttribute('aria-pressed') !== 'true';
      target.setAttribute('aria-pressed', String(next));
      detail = next ? '作者注释已在示例中标记为启用。' : '作者注释已在示例中标记为停用。';
    }
    if (target.dataset.danger) detail = '仅展示危险操作的反馈，没有删除任何消息。';
    if (target.dataset.thirdParty) detail = '第三方占位入口，仅演示不同包装层中的菜单项。';
    byId('action-result').textContent = action;
    byId('action-detail').textContent = detail;
    closeMenus({ returnFocus: true });
    window.EF.toast('已选择：' + action);
  }

  stage.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (target) recordAction(target);
  });

  // Native-host div/a controls use the host keyboard module. This is local-only behavior.
  stage.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const control = event.target.closest('[role="button"]');
    if (!control || control.tagName === 'BUTTON') return;
    event.preventDefault();
    control.click();
  });

  document.addEventListener('click', event => {
    const protectedTarget = event.target.closest('.menu-shell, .dock-button, #long-labels, #short-stage, .lab-toolbar, .variant-picker');
    if (activeMenu && !protectedTarget) closeMenus();
  });

  byId('long-labels').addEventListener('change', event => {
    for (const label of document.querySelectorAll('[data-short][data-long]')) {
      label.textContent = event.target.checked ? label.dataset.long : label.dataset.short;
    }
    stage.classList.toggle('long-labels', event.target.checked);
  });
  byId('short-stage').addEventListener('change', event => document.body.classList.toggle('short-stage', event.target.checked));

  const selectorTrigger = byId('lorebook-trigger');
  const dropdown = byId('lorebook-dropdown');
  const search = byId('lorebook-search');
  const results = byId('lorebook-results');
  const choices = [...results.querySelectorAll('[data-choice]')];

  function toggleDropdown(open, { focus = false } = {}) {
    dropdown.hidden = !open;
    selectorTrigger.setAttribute('aria-expanded', String(open));
    if (focus && open) search.focus({ preventScroll: true });
    if (focus && !open) selectorTrigger.focus({ preventScroll: true });
  }

  function filterChoices() {
    const query = search.value.toLocaleLowerCase().replace(/\s+/g, '');
    let count = 0;
    let disabled = 0;
    for (const choice of choices) {
      const visible = choice.dataset.choice.toLocaleLowerCase().replace(/\s+/g, '').includes(query);
      choice.parentElement.hidden = !visible;
      if (visible) { count++; if (choice.disabled) disabled++; }
    }
    for (const label of results.querySelectorAll('[data-group-label]')) {
      const group = label.dataset.groupLabel;
      label.hidden = ![...results.querySelectorAll('[data-group]')].some(row => row.dataset.group === group && !row.hidden);
    }
    byId('no-results').hidden = count !== 0;
    byId('search-count').textContent = count ? count + ' 条资料' + (disabled ? '，' + disabled + ' 条不可用' : '') : '没有匹配项';
  }

  selectorTrigger.addEventListener('click', () => toggleDropdown(dropdown.hidden, { focus: true }));
  document.addEventListener('click', event => {
    if (!dropdown.hidden && !event.target.closest('.selector-card, .variant-picker, .lab-toolbar')) {
      toggleDropdown(false);
    }
  });
  search.addEventListener('input', filterChoices);
  byId('clear-search').addEventListener('click', () => {
    search.value = '';
    filterChoices();
    search.focus({ preventScroll: true });
  });
  byId('show-no-results').addEventListener('click', () => {
    toggleDropdown(true);
    search.value = '没有这一条资料';
    filterChoices();
    search.focus({ preventScroll: true });
  });

  for (const choice of choices) {
    choice.addEventListener('click', () => {
      if (choice.disabled) return;
      selectedChoice = choice.dataset.choice;
      for (const row of choices) {
        const selected = row === choice;
        row.classList.toggle('select2-results__option--selected', selected);
        row.setAttribute('aria-pressed', String(selected));
      }
      byId('lorebook-choice').textContent = selectedChoice;
      byId('choice-receipt-title').textContent = selectedChoice;
      byId('choice-receipt-detail').textContent = '已选择此份本地资料。重新打开列表，黄色标记仍会保留。';
      toggleDropdown(false, { focus: true });
      window.EF.toast('已选择：' + selectedChoice);
    });
    choice.addEventListener('focus', () => choice.classList.add('select2-results__option--highlighted'));
    choice.addEventListener('blur', () => choice.classList.remove('select2-results__option--highlighted'));
  }

  byId('native-management').addEventListener('change', event => {
    const value = event.target.value;
    if (!value) return;
    byId('choice-receipt-title').textContent = value;
    byId('choice-receipt-detail').textContent = '原生选择器已返回这一项。当前页面没有执行真实管理操作。';
    window.EF.toast('原生下拉已选择：' + value);
  });

  // Escape exists for preview convenience; no claim is made about #options in the host.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.isComposing) return;
    if (!submenu.hidden) {
      event.preventDefault();
      closeSubmenu({ returnFocus: true });
      return;
    }
    if (!dropdown.hidden && dropdown.contains(document.activeElement)) {
      event.preventDefault();
      toggleDropdown(false, { focus: true });
      return;
    }
    if (activeMenu) {
      event.preventDefault();
      closeMenus({ returnFocus: true });
      return;
    }
    if (!dropdown.hidden) {
      event.preventDefault();
      toggleDropdown(false, { focus: true });
    }
  });

  byId('reset-menus').addEventListener('click', () => {
    byId('long-labels').checked = false;
    byId('long-labels').dispatchEvent(new Event('change'));
    byId('short-stage').checked = false;
    byId('short-stage').dispatchEvent(new Event('change'));
    byId('action-result').textContent = '等待一个操作';
    byId('action-detail').textContent = '所有操作仅在这一页演示。';
    stage.querySelector('[data-toggle-action]').setAttribute('aria-pressed', 'false');
    search.value = '';
    filterChoices();
    selectedChoice = '边境通用档案';
    for (const row of choices) {
      const selected = row.dataset.choice === selectedChoice;
      row.classList.toggle('select2-results__option--selected', selected);
      row.setAttribute('aria-pressed', String(selected));
    }
    byId('lorebook-choice').textContent = selectedChoice;
    byId('choice-receipt-title').textContent = selectedChoice;
    byId('choice-receipt-detail').textContent = '已选中的行保留黄色标记。移动焦点后，选择不会消失。';
    byId('native-management').value = '';
    toggleDropdown(true);
    openMenu('chat');
    byId('options').querySelector('.options-content').scrollTop = 0;
    window.EF.toast('已重置菜单和列表样例');
  });

  openMenu('chat');
  filterChoices();
})();
