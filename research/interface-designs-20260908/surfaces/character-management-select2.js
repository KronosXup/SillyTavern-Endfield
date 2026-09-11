'use strict';
// Isolated preview adapter for the vendored jQuery 3.5.1 / Select2 4.1.0-rc.0.
// Existing selects and their native change listeners remain the state authority.
(() => {
  const $ = window.jQuery;
  const proposal = document.querySelector('[data-panel="proposal"]');
  if (!$?.fn.select2 || !proposal) return;
  const defaultMatcher = $.fn.select2.defaults.defaults.matcher;

  function initializeSelect(select, parent, syncEvent, dropdownCssClass = 'endfield-sort-dropdown') {
    if (!select || !parent) return;
    const $select = $(select);
    if ($select.data('select2')) return;
    $select.select2({
      width: '100%',
      theme: 'endfield-sort',
      minimumResultsForSearch: Infinity,
      dropdownParent: $(parent),
      dropdownAutoWidth: true,
      dropdownCssClass,
      matcher: (params, data) => data.element?.hidden ? null : defaultMatcher(params, data),
    });

    const instance = $select.data('select2');
    instance.$selection
      .attr('aria-label', select.getAttribute('aria-label'))
      .removeAttr('aria-labelledby');

    // Continue row fills beneath the native scrollbar without replacing its controls.
    const results = instance.$results[0];
    let paintFrame = 0;
    function paintScrollbarRows() {
      paintFrame = 0;
      if (!results.isConnected) return;
      const listTop = results.getBoundingClientRect().top;
      for (const state of ['selected', 'highlighted']) {
        const row = results.querySelector(`.select2-results__option--${state}`);
        const bounds = row?.getBoundingClientRect();
        const clamp = value => Math.max(0, Math.min(results.clientHeight, value));
        const start = bounds ? clamp(bounds.top - listTop) : 0;
        const end = bounds ? clamp(bounds.bottom - listTop) : 0;
        results.style.setProperty(`--sort-${state}-start`, `${start}px`);
        results.style.setProperty(`--sort-${state}-end`, `${end}px`);
      }
    }
    function scheduleScrollbarPaint() {
      if (!paintFrame) paintFrame = requestAnimationFrame(paintScrollbarRows);
    }
    results.addEventListener('scroll', scheduleScrollbarPaint, { passive: true });
    new MutationObserver(scheduleScrollbarPaint).observe(results, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class'],
    });
    new ResizeObserver(scheduleScrollbarPaint).observe(results);
    $select.on('select2:open.managementSelect', scheduleScrollbarPaint);

    $select.on('change.managementSelect', event => {
      // Native changes already reach the main script; scoped refreshes are UI-only.
      if (event.originalEvent || event.namespace) return;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const searchOption = select.querySelector('option[value="search"]');
    let searchHidden = searchOption?.hidden;
    function sync() {
      $select.trigger('change.select2');
      const visibilityChanged = searchHidden !== searchOption?.hidden;
      searchHidden = searchOption?.hidden;
      if (visibilityChanged && instance.isOpen()) {
        // The pinned 4.1 build re-queries options here without closing or moving focus.
        instance.trigger('query', {});
      }
    }
    select.addEventListener(syncEvent, sync);
    sync();
  }

  const sort = proposal.querySelector('.sort-order');
  initializeSelect(sort, sort?.closest('.tag-controls'), 'management-sort:sync');

  const pageSize = proposal.querySelector('.page-size');
  if (pageSize && !$(pageSize).data('select2')) {
    // Keep the compact trigger and its menu in one local flex item.
    const control = document.createElement('span');
    control.className = 'page-size-control';
    pageSize.before(control);
    control.append(pageSize);
    initializeSelect(pageSize, control, 'management-page-size:sync', 'endfield-sort-dropdown endfield-page-size-dropdown');
  }
})();
