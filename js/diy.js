/* ========================================
   DIY房间 — 家具拖拽与还原
   ======================================== */

const diyDefaults = {};

function initDIY() {
  if (!dom || !dom.diyFurniture) { setTimeout(initDIY, 100); return; }

  dom.diyFurniture.forEach(el => {
    const id = el.dataset.furn;
    const cs = getComputedStyle(el);
    diyDefaults[id] = { left: cs.left, top: cs.top };
    setupFurnitureDrag(el);
  });

  if (dom.diyRestore) {
    dom.diyRestore.addEventListener('click', restoreDIY);
  }
  if (dom.diyBack) {
    dom.diyBack.addEventListener('click', () => navigateTo('home'));
  }
}

let diyTopZ = 10;

function setupFurnitureDrag(el) {
  let startX, startY, origLeft, origTop, offsetX, offsetY;

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.classList.add('dragging');
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = rect.left;
    origTop = rect.top;

    el.style.position = 'fixed';
    el.style.left = origLeft + 'px';
    el.style.top = origTop + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.margin = '0';
    el.style.zIndex = diyTopZ++;
  });

  el.addEventListener('pointermove', (e) => {
    if (!el.classList.contains('dragging')) return;
    el.style.left = (origLeft + e.clientX - startX) + 'px';
    el.style.top = (origTop + e.clientY - startY) + 'px';
  });

  el.addEventListener('pointerup', () => {
    el.classList.remove('dragging');
    const rect = el.getBoundingClientRect();
    const parentRect = dom.diyScreen.getBoundingClientRect();
    el.style.position = '';
    el.style.left = (rect.left - parentRect.left) + 'px';
    el.style.top = (rect.top - parentRect.top) + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.margin = '';
  });
}

function restoreDIY() {
  dom.diyFurniture.forEach(el => {
    const id = el.dataset.furn;
    if (diyDefaults[id]) {
      el.style.position = '';
      el.style.left = diyDefaults[id].left;
      el.style.top = diyDefaults[id].top;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.margin = '';
      el.style.zIndex = '';
    }
  });
}

// 等待 game.js 初始化完成后自动启动
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initDIY, 50);
});
