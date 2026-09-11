(() => {
  'use strict';

  const frame = document.querySelector('#toolbar-frame');
  const holder = document.querySelector('#top-settings-holder');
  const workbench = document.querySelector('.stage-workbench');
  const entryReadout = document.querySelector('#entry-readout');
  const openReadout = document.querySelector('#open-readout');
  const widthControl = document.querySelector('#preview-width');
  const marksControl = document.querySelector('#show-marks');
  const connectionControl = document.querySelector('#demo-connected');
  const motionControl = document.querySelector('#demo-reduced-motion');
  const entryHint = entryReadout.textContent;
  const drawers = Array.from(holder.querySelectorAll(':scope > .drawer'), (root) => ({
    root,
    label: root.dataset.label,
    toggle: root.querySelector('.drawer-toggle'),
    icon: root.querySelector('.drawer-icon'),
    panel: root.querySelector('.drawer-content'),
    pin: root.querySelector('input[data-pin]'),
    open: false,
    pinned: false,
  }));
  const byPanel = new Map(drawers.map((drawer) => [drawer.panel.id, drawer]));
  const specialPanels = new Set(['WorldInfo', 'left-nav-panel', 'right-nav-panel']);
  let layer = 10;
  let pendingOpen = null;
  let openTimer = null;
  let markerTimer = null;
  let hoveredEntry = null;

  function updateReadout() {
    const open = drawers.filter((drawer) => drawer.open);
    const closedPinned = drawers.filter((drawer) => drawer.pinned && !drawer.open);
    const openText = open.length
      ? `当前打开：${open.map((drawer) => `${drawer.label}${drawer.pinned ? '（已固定）' : ''}`).join('、')}。`
      : '当前全部收起。';
    const pinText = closedPinned.length
      ? `保留固定：${closedPinned.map((drawer) => drawer.label).join('、')}。`
      : '';
    openReadout.textContent = openText + pinText;
  }

  function renderDrawer(drawer) {
    drawer.icon.classList.toggle('openIcon', drawer.open);
    drawer.icon.classList.toggle('closedIcon', !drawer.open);
    drawer.icon.classList.toggle('drawerPinnedOpen', drawer.pinned);
    drawer.icon.setAttribute('aria-expanded', String(drawer.open));
    drawer.panel.classList.toggle('openDrawer', drawer.open);
    drawer.panel.classList.toggle('closedDrawer', !drawer.open);
    drawer.panel.classList.toggle('pinnedOpen', drawer.pinned);
    drawer.panel.hidden = !drawer.open;
    if (drawer.pin) drawer.pin.checked = drawer.pinned;
  }

  function raiseDrawer(drawer) {
    drawer.panel.style.zIndex = String(++layer);
  }

  function cancelPendingOpen() {
    window.clearTimeout(openTimer);
    openTimer = null;
    pendingOpen = null;
  }

  function closeDrawer(drawer, returnFocus = false) {
    const containedFocus = drawer.panel.contains(document.activeElement);
    drawer.open = false;
    renderDrawer(drawer);
    if (returnFocus || containedFocus) drawer.icon.focus({ preventScroll: true });
  }

  function closeUnpinned() {
    cancelPendingOpen();
    drawers.filter((drawer) => drawer.open && !drawer.pinned).forEach((drawer) => closeDrawer(drawer));
    updateReadout();
  }

  function showDrawer(drawer) {
    // Recheck after a delayed switch in case a visible panel was just unpinned.
    drawers.filter((item) => item !== drawer && item.open && !item.pinned).forEach((item) => closeDrawer(item));
    drawer.open = true;
    raiseDrawer(drawer);
    renderDrawer(drawer);
    updateReadout();
  }

  function openDrawer(drawer) {
    cancelPendingOpen();
    if (drawer.open) {
      raiseDrawer(drawer);
      return;
    }
    const toClose = drawers.filter((item) => item.open && !item.pinned);
    toClose.forEach((item) => closeDrawer(item));
    updateReadout();
    const reduceMotion = motionControl.checked || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The native switch waits one 125 ms token after closing an ordinary drawer.
    if (toClose.length && !reduceMotion) {
      pendingOpen = drawer;
      openTimer = window.setTimeout(() => {
        pendingOpen = null;
        openTimer = null;
        showDrawer(drawer);
      }, 125);
    } else {
      showDrawer(drawer);
    }
  }

  function toggleDrawer(drawer) {
    if (drawer.open || pendingOpen === drawer) {
      cancelPendingOpen();
      closeDrawer(drawer);
      updateReadout();
      return;
    }
    openDrawer(drawer);
  }

  function updateEntryReadout(preferredEntry = null) {
    const focused = drawers.find((drawer) => drawer.toggle.contains(document.activeElement));
    const entry = preferredEntry || focused || hoveredEntry;
    entryReadout.textContent = entry ? `入口：${entry.label}` : entryHint;
  }

  function syncConnection() {
    const drawer = byPanel.get('rm_api_block');
    const connected = connectionControl.checked;
    drawer.icon.classList.toggle('fa-plug', connected);
    drawer.icon.classList.toggle('fa-plug-circle-exclamation', !connected);
    drawer.icon.classList.toggle('redOverlayGlow', !connected);
    drawer.icon.setAttribute('aria-label', `${drawer.label}，演示状态：${connected ? '已连接' : '未连接'}`);
  }

  function syncMotion() {
    document.body.classList.toggle('reduced-motion', motionControl.checked);
    if (motionControl.checked && pendingOpen) {
      const drawer = pendingOpen;
      cancelPendingOpen();
      showDrawer(drawer);
    }
  }

  function clearMarker() {
    window.clearTimeout(markerTimer);
    markerTimer = null;
    document.querySelectorAll('.marker-highlight').forEach((element) => element.classList.remove('marker-highlight'));
  }

  function clearDrawers() {
    cancelPendingOpen();
    drawers.forEach((drawer) => {
      drawer.pinned = false;
      closeDrawer(drawer);
      drawer.panel.style.removeProperty('z-index');
    });
    layer = 10;
    updateReadout();
  }

  drawers.forEach((drawer) => {
    renderDrawer(drawer);
    drawer.toggle.addEventListener('click', () => toggleDrawer(drawer));
    drawer.icon.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
      event.preventDefault();
      if (!event.repeat) drawer.icon.click();
    });
    drawer.toggle.addEventListener('pointerenter', () => {
      hoveredEntry = drawer;
      updateEntryReadout(drawer);
    });
    drawer.toggle.addEventListener('pointerleave', () => {
      if (hoveredEntry === drawer) hoveredEntry = null;
      updateEntryReadout();
    });
    drawer.toggle.addEventListener('focusin', () => updateEntryReadout(drawer));
    drawer.toggle.addEventListener('focusout', () => queueMicrotask(updateEntryReadout));
    drawer.pin?.addEventListener('change', () => {
      drawer.pinned = drawer.pin.checked;
      renderDrawer(drawer);
      if (!drawer.pinned && drawer.open && drawers.filter((item) => item.open).length > 1) {
        closeDrawer(drawer);
      }
      updateReadout();
    });
  });

  document.querySelectorAll('[data-close-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      const drawer = byPanel.get(button.dataset.closePanel);
      if (!drawer) return;
      cancelPendingOpen();
      closeDrawer(drawer, true);
      updateReadout();
    });
  });

  workbench.addEventListener('pointerdown', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.openDrawer, .drawer-toggle')) return;
    if (event.target === workbench || event.target.closest('#sheld')) closeUnpinned();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    const ordinary = drawers.filter((drawer) => drawer.open && !specialPanels.has(drawer.panel.id));
    // Native Escape returns after each priority tier; World Info ignores its pin.
    const targets = ordinary.length ? ordinary : [
      byPanel.get('WorldInfo'),
      byPanel.get('left-nav-panel'),
      byPanel.get('right-nav-panel'),
    ].filter((drawer) => drawer.open && (drawer.panel.id === 'WorldInfo' || !drawer.pinned)).slice(0, 1);
    if (!targets.length && !pendingOpen) return;
    event.preventDefault();
    cancelPendingOpen();
    targets.forEach((drawer) => closeDrawer(drawer));
    updateReadout();
  });

  widthControl.addEventListener('change', () => {
    const width = widthControl.value;
    frame.style.width = width === 'auto' ? '100%' : `${width}px`;
  });
  marksControl.addEventListener('change', () => frame.classList.toggle('show-marks', marksControl.checked));
  connectionControl.addEventListener('change', syncConnection);
  motionControl.addEventListener('change', syncMotion);

  document.querySelector('#demo-multi-open').addEventListener('click', () => {
    clearDrawers();
    ['left-nav-panel', 'WorldInfo'].forEach((id) => {
      const drawer = byPanel.get(id);
      drawer.pinned = true;
      showDrawer(drawer);
    });
  });

  document.querySelector('#demo-reset').addEventListener('click', () => {
    clearDrawers();
    clearMarker();
    connectionControl.checked = true;
    motionControl.checked = false;
    syncConnection();
    syncMotion();
  });

  document.querySelectorAll('[data-marker]').forEach((button) => {
    button.addEventListener('click', () => {
      clearMarker();
      let target = document.querySelector('#top-bar');
      if (button.dataset.marker === '2') {
        const drawer = byPanel.get('user-settings-block');
        openDrawer(drawer);
        target = drawer.toggle;
      }
      target.classList.add('marker-highlight');
      markerTimer = window.setTimeout(clearMarker, 1200);
    });
  });

  frame.style.width = widthControl.value === 'auto' ? '100%' : `${widthControl.value}px`;
  frame.classList.toggle('show-marks', marksControl.checked);
  syncConnection();
  syncMotion();
  updateReadout();
})();
