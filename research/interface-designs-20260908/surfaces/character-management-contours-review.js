'use strict';
(() => {
  const restorePreviewDefaults=()=>{
    document.querySelector('#list-entry-motion').checked=true;
    const empty=document.querySelector('#empty-hotswaps');
    empty.checked=true;
    empty.dispatchEvent(new Event('change',{bubbles:true}));
  };
  restorePreviewDefaults();
  document.querySelector('#reset-demo').addEventListener('click',restorePreviewDefaults);
  for(const button of document.querySelectorAll('[data-texture]'))button.addEventListener('click',()=>{
    document.body.dataset.contours=button.dataset.texture;
    for(const peer of document.querySelectorAll('[data-texture]'))peer.setAttribute('aria-pressed',String(peer===button));
    const labels={new:'新绘疏密等高线在深灰底上的独立展示',previous:'上一版等高线在深灰底上的展示',old:'当前实装长图裁切在深灰底上的展示'};
    document.querySelector('.terrain-swatch').setAttribute('aria-label',labels[button.dataset.texture]);
  });
})();
