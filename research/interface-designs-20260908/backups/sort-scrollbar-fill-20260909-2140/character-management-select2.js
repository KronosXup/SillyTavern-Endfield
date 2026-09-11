'use strict';
// Isolated preview adapter for the vendored jQuery 3.5.1 / Select2 4.1.0-rc.0.
// The existing select and its native change listener remain the sorting authority.
(() => {
  const $ = window.jQuery;
  const select = document.querySelector('[data-panel="proposal"] .sort-order');
  const parent = select?.closest('.tag-controls');
  if (!$?.fn.select2 || !select || !parent) return;

  const $select = $(select);
  if ($select.data('select2')) return;
  const defaultMatcher = $.fn.select2.defaults.defaults.matcher;
  $select.select2({
    width: '100%',
    theme: 'endfield-sort',
    minimumResultsForSearch: Infinity,
    dropdownParent: $(parent),
    dropdownAutoWidth: true,
    dropdownCssClass: 'endfield-sort-dropdown',
    matcher: (params, data) => data.element?.hidden ? null : defaultMatcher(params, data),
  });

  const instance = $select.data('select2');
  instance.$selection
    .attr('aria-label', select.getAttribute('aria-label') || '角色排序顺序')
    .removeAttr('aria-labelledby');

  $select.on('change.managementSort', event => {
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
  select.addEventListener('management-sort:sync', sync);
  sync();
})();
