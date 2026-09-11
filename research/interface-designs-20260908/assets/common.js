(() => {
  'use strict';
  const qa = new URLSearchParams(location.search).get('qa') === '1';
  const stored = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const normalizeVariant = (surface, variant) => ({menus:{paper:'a',dark:'b'},catalogs:{rows:'a',covers:'b'}}[surface]?.[variant] || variant);
  let toastTimer;
  const toast = message => {
    let node = document.querySelector('.demo-toast');
    if (!node) { node = document.createElement('div'); node.className = 'demo-toast'; node.setAttribute('role','status'); document.body.append(node); }
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2400);
  };
  const setVariant = (variant, { persist = true } = {}) => {
    const controls = [...document.querySelectorAll('.variant-picker [data-variant]')];
    if (!controls.some(button => button.dataset.variant === variant)) return;
    document.body.dataset.variant = variant;
    for (const button of controls) button.setAttribute('aria-pressed', String(button.dataset.variant === variant));
    for (const panel of document.querySelectorAll('[data-variant-note]')) panel.hidden = !panel.dataset.variantNote.split(' ').includes(variant);
    if (persist && !qa) save(`ef-design:${document.body.dataset.surface || location.pathname}:variant`, variant);
    document.dispatchEvent(new CustomEvent('ef:variant', { detail: { variant } }));
    if (parent !== window) parent.postMessage({type:'ef-design:variant',surface:document.body.dataset.surface,variant},location.origin);
  };
  const initialize = () => {
    document.body.classList.toggle('embedded-preview',parent!==window);
    const controls = [...document.querySelectorAll('.variant-picker [data-variant]')];
    if (controls.length) {
      const key = `ef-design:${document.body.dataset.surface || location.pathname}:variant`;
      const requested = normalizeVariant(document.body.dataset.surface,new URLSearchParams(location.search).get('variant') || (qa ? controls[0].dataset.variant : stored(key,controls[0].dataset.variant)));
      setVariant(controls.some(button=>button.dataset.variant===requested) ? requested : controls[0].dataset.variant,{persist:false});
      for (const button of controls) button.addEventListener('click',()=>setVariant(button.dataset.variant));
    }
    for (const control of document.querySelectorAll('[data-toggle-motion]')) control.addEventListener('change',()=>document.body.classList.toggle('reduced-motion',control.checked));
  };
  window.EF = Object.freeze({ toast, setVariant, stored, save, normalizeVariant });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{once:true}); else initialize();
})();
