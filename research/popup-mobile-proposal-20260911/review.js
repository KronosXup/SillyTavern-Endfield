const controls = Object.fromEntries(['case','width','height','view'].map(key => [key,document.querySelector(`#${key}-select`)]));
const comparison = document.querySelector('#comparison');
const frames = { current: document.querySelector('#current-frame'), candidate: document.querySelector('#candidate-frame') };
if (matchMedia('(max-width:700px)').matches) { controls.view.value = 'candidate'; controls.width.value = 'auto'; }
function update() {
  const width = controls.width.value === 'auto' ? document.documentElement.clientWidth : Number(controls.width.value);
  comparison.dataset.view = controls.view.value;
  comparison.dataset.device = width > 620 ? 'desktop' : 'mobile';
  comparison.style.setProperty('--frame-width', `${width}px`);
  comparison.style.setProperty('--frame-height', `${controls.height.value}px`);
  for (const frame of Object.values(frames)) {
    if (frame.dataset.case !== controls.case.value) {
      frame.contentWindow.postMessage({type:'popup-preview-case',case:controls.case.value},location.origin);
      frame.dataset.case = controls.case.value;
    }
  }
  const chosen = controls.view.value === 'current' ? 'current' : 'candidate';
  document.querySelector('#full-link').href = `stage.html?variant=${chosen}&case=${controls.case.value}`;
  document.querySelector('#mobile-note').hidden = !matchMedia('(max-width:700px)').matches;
}
Object.values(controls).forEach(control => control.addEventListener('change', update));
Object.values(frames).forEach(frame=>frame.addEventListener('load',()=>{delete frame.dataset.case;update();}));
window.addEventListener('resize', update);
window.addEventListener('message', event => {
  if (event.origin !== location.origin || !Object.values(frames).some(frame=>frame.contentWindow===event.source)) return;
  if (event.data?.type !== 'popup-preview-size') return;
  const variant = Object.entries(frames).find(([,frame])=>frame.contentWindow===event.source)?.[0];
  if (variant) document.querySelector(`#${variant}-metric`).textContent = `${event.data.width} × ${event.data.height}`;
});
update();
