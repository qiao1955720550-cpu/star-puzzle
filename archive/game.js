/* ========================================
   星星网页 — 游戏主逻辑
   ======================================== */

'use strict';

// ========== 游戏状态 ==========
const gameState = {
  stories: [],           // 已解锁故事ID
  fragments: [],         // 已收集碎片ID
  puzzleCompleted: false // 拼图是否完成
};

// ========== 故事数据 ==========
const storyData = [
  { id: 1, item: '水杯', text: '姥姥总在杯子里泡好温水等我放学。杯子上还贴着她特意为我选的小兔贴纸。' },
  { id: 2, item: '窗台盆栽', text: '姥姥说花开了就带我去公园。她每天认真浇水，可花一直没开。后来我才知道，她种的是不会开花的绿萝。' },
  { id: 3, item: '故事书', text: '姥姥的普通话不标准，总把\'小王子\'念成\'小丸子\'。但那些夜晚，是我听过最好的故事。' },
  { id: 4, item: '布偶兔子', text: '姥姥缝的兔子一只耳朵长、一只耳朵短。她说这样的兔子最特别，但我知道其实是是因为线不够了。' },
  { id: 5, item: '台灯', text: '每到傍晚，姥姥就搬着小板凳坐到台灯旁，轻轻拧亮灯光，借着暖融融的光亮，低头一针一线织毛衣。' },
  { id: 6, item: '一张涂鸦画', text: '桌上有一张我小时候画的蜡笔画，歪歪扭扭的小人和花朵。姥姥一直留着，折痕都发白了也没舍得扔。' },
  { id: 7, item: '鱼缸里的金鱼', text: '姥姥养了两条小金鱼，一条叫小红，一条叫小白。她每天喂食的时候都跟它们聊天' }
];

// ========== 物品交互数据 ==========
// type: 'story' | 'fragment' | 'both'
const itemData = [
  { id: 'cup',      type: 'story',   storyId: 1, name: '水杯' },
  { id: 'flower',   type: 'story',   storyId: 2, name: '窗台盆栽' },
  { id: 'book',     type: 'story',   storyId: 3, name: '故事书' },
  { id: 'rabbit',   type: 'both',    storyId: 4, name: '布偶兔子' },
  { id: 'lamp',     type: 'both',    storyId: 5, name: '台灯' },
  { id: 'doodle',   type: 'story',   storyId: 6, name: '一张涂鸦画' },
  { id: 'goldfish', type: 'story',   storyId: 7, name: '鱼缸里的金鱼' },
  { id: 'pillow',   type: 'fragment', storyId: null, name: '枕头' },
  { id: 'clock',    type: 'fragment', storyId: null, name: '闹钟' },
  { id: 'frame',    type: 'fragment', storyId: null, name: '画框' },
  { id: 'musicbox', type: 'fragment', storyId: null, name: '音乐盒' }
];

// ========== DOM 引用 ==========
const dom = {};
function cacheDom() {
  dom.homeScreen     = document.getElementById('home-screen');
  dom.treasureScreen = document.getElementById('treasure-screen');
  dom.diyScreen      = document.getElementById('diy-screen');
  dom.puzzleScreen   = document.getElementById('puzzle-screen');
  dom.storyModal     = document.getElementById('story-modal');
  dom.storyText      = document.getElementById('story-text');
  dom.storyItemName  = document.getElementById('story-item-name');
  dom.storyIllust    = document.getElementById('story-illustration');
  dom.storyClose     = document.querySelector('.story-close');
  dom.homeButtons    = document.getElementById('home-buttons');
  dom.musicToggle    = document.getElementById('music-toggle');
  dom.bgm            = document.getElementById('bgm');
  dom.btnBack        = document.getElementById('btn-back');
  dom.btnPause       = document.getElementById('btn-pause');
  dom.btnRestore     = document.getElementById('btn-restore');
  dom.itemToast      = document.getElementById('item-toast');
  dom.storyCount     = document.getElementById('story-count');
  dom.fragmentCount  = document.getElementById('fragment-count');
  dom.roomItems      = document.querySelectorAll('.room-item');
  dom.puzzleGrid     = document.getElementById('puzzle-grid');
  dom.puzzleTray     = document.getElementById('puzzle-tray');
  dom.puzzleCelebration = document.getElementById('puzzle-celebration');
  dom.puzzleBack     = document.querySelector('.puzzle-back');
  dom.diyFurniture   = document.querySelectorAll('.diy-furniture');
  dom.diyRestore     = document.getElementById('diy-restore');
  dom.diyBack        = document.getElementById('diy-back');
}

// ========== 按钮交互 ==========
function setupHomeButtons() {
  dom.homeButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.entry-btn');
    if (!btn) return;
    btn.classList.remove('bounce');
    void btn.offsetWidth;
    btn.classList.add('bounce');
    setTimeout(() => navigateTo(btn.dataset.action), 350);
  });
}

// ========== 房间气泡按钮 ==========
function setupBubbleButtons() {
  if (dom.btnPause) {
    dom.btnPause.addEventListener('click', togglePause);
  }
  if (dom.btnRestore) {
    dom.btnRestore.addEventListener('click', handleRestore);
  }
}

function togglePause() {
  if (musicPlaying) {
    dom.bgm.pause();
    dom.musicToggle.classList.add('muted');
    dom.musicToggle.textContent = '♪';
    dom.btnPause.textContent = '▶️';
  } else {
    dom.bgm.play().catch(() => {});
    dom.musicToggle.classList.remove('muted');
    dom.musicToggle.textContent = '♫';
    dom.btnPause.textContent = '⏯️';
  }
  musicPlaying = !musicPlaying;
}

function handleRestore() {
  if (confirm('确定要还原进度吗？所有故事和碎片都会归零。')) {
    resetProgress();
    dom.roomItems.forEach(el => el.classList.remove('collected'));
    updateStatusBar();
    updatePuzzleEntry();
    showToast('已还原，重新探索吧 ✨', false);
  }
}

// ========== 音乐控制 ==========
let musicPlaying = false;
function setupMusic() {
  dom.musicToggle.addEventListener('click', () => {
    if (musicPlaying) {
      dom.bgm.pause();
      dom.musicToggle.classList.add('muted');
      dom.musicToggle.textContent = '♪';
    } else {
      dom.bgm.play().catch(() => {});
      dom.musicToggle.classList.remove('muted');
      dom.musicToggle.textContent = '♫';
    }
    musicPlaying = !musicPlaying;
  });
}

// ========== 房间物品交互 ==========
function setupRoomItems() {
  dom.roomItems.forEach(item => {
    item.addEventListener('click', () => handleItemClick(item));
  });
}

function handleItemClick(itemEl) {
  const itemId = itemEl.dataset.id;
  const item = itemData.find(d => d.id === itemId);
  if (!item) return;

  let alreadyDone = false;

  // 检查是否已收集过
  if (item.type === 'story' || item.type === 'both') {
    if (gameState.stories.includes(item.storyId)) alreadyDone = true;
  }
  if (item.type === 'fragment' || item.type === 'both') {
    // 检查碎片（用itemId判断）
    if (gameState.fragments.includes(itemId)) alreadyDone = true;
  }

  if (alreadyDone) {
    showToast('已经探索过啦 ✨', false);
    return;
  }

  let gotStory = false;
  let gotFragment = false;

  // 处理故事
  if ((item.type === 'story' || item.type === 'both') && item.storyId) {
    if (!gameState.stories.includes(item.storyId)) {
      gameState.stories.push(item.storyId);
      gotStory = true;
      openStory(item.storyId);
    }
  }

  // 处理碎片
  if (item.type === 'fragment' || item.type === 'both') {
    if (!gameState.fragments.includes(itemId)) {
      gameState.fragments.push(itemId);
      gotFragment = true;
    }
  }

  // 显示提示
  if (gotStory && gotFragment) {
    showToast('📖 发现故事 + 🧩 获得碎片！', true);
  } else if (gotStory) {
    showToast('📖 发现了一段回忆！', true);
  } else if (gotFragment) {
    showToast('🧩 找到一块拼图碎片！', true);
  }

  // 标记已收集
  updateItemState(itemEl, item);
  updateStatusBar();
  updatePuzzleEntry();
  saveProgress();
}

function updateItemState(itemEl, item) {
  const allDone = (item.type === 'story' || item.type === 'both')
    && item.storyId && gameState.stories.includes(item.storyId)
    && ((item.type === 'fragment' || item.type === 'both')
    && gameState.fragments.includes(itemEl.dataset.id))
    || (item.type === 'story' && gameState.stories.includes(item.storyId))
    || (item.type === 'fragment' && gameState.fragments.includes(itemEl.dataset.id));

  if (allDone) {
    itemEl.classList.add('collected');
  }
}

function restoreItemStates() {
  dom.roomItems.forEach(itemEl => {
    const itemId = itemEl.dataset.id;
    const item = itemData.find(d => d.id === itemId);
    if (!item) return;
    updateItemState(itemEl, item);
  });
}

// ========== 故事弹窗 + 打字机 ==========
let typewriterTimer = null;
const storyIllustrations = {
  1: '🫖', 2: '🪴', 3: '📚', 4: '🐰', 5: '💡', 6: '📄', 7: '🐠'
};

function openStory(storyId) {
  const story = storyData.find(s => s.id === storyId);
  if (!story) return;

  // 填充内容
  dom.storyItemName.textContent = '—— ' + story.item;
  dom.storyText.textContent = '';
  dom.storyText.classList.remove('typewriter-done');
  dom.storyIllust.textContent = storyIllustrations[storyId] || '💝';

  // 显示弹窗
  dom.storyModal.classList.remove('hidden');

  // 启动打字机
  typewriterEffect(story.text);
}

function typewriterEffect(text) {
  clearInterval(typewriterTimer);
  let index = 0;
  const chars = [...text]; // 支持中文逐字

  dom.storyText.textContent = '';

  typewriterTimer = setInterval(() => {
    if (index < chars.length) {
      dom.storyText.textContent += chars[index];
      index++;
    } else {
      clearInterval(typewriterTimer);
      // 添加光标
      const cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';
      dom.storyText.appendChild(cursor);
      dom.storyText.classList.add('typewriter-done');
    }
  }, 80);
}

function closeStory() {
  clearInterval(typewriterTimer);
  dom.storyModal.classList.add('hidden');
}

function setupStoryModal() {
  // 点击关闭按钮
  if (dom.storyClose) {
    dom.storyClose.addEventListener('click', closeStory);
  }
  // 点击弹窗外部关闭
  dom.storyModal.addEventListener('click', (e) => {
    if (e.target === dom.storyModal) closeStory();
  });
  // 打字完成后点击任意处关闭
  dom.storyModal.addEventListener('click', (e) => {
    if (dom.storyText.classList.contains('typewriter-done') && e.target !== dom.storyClose) {
      closeStory();
    }
  });
}

// ========== Toast 提示 ==========
let toastTimer;
function showToast(msg, isFragment) {
  clearTimeout(toastTimer);
  const toast = dom.itemToast;
  toast.textContent = msg;
  toast.className = 'show';
  if (isFragment) toast.classList.add('fragment-toast');
  toast.classList.add('show');
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// ========== 拼图系统 ==========
const PUZZLE_COLS = 2;
const PUZZLE_ROWS = 3;
const PIECE_W = 210;
const PIECE_H = 130;
const FULL_W = PIECE_W * PUZZLE_COLS;
const FULL_H = PIECE_H * PUZZLE_ROWS;

let puzzlePieces = [];
let placedCount = 0;
let puzzleComplete = false;
let puzzleSourceImg = null;  // 保存完整图用于完成展示

function updatePuzzleEntry() {
  let btn = document.getElementById('btn-puzzle-entry');
  if (gameState.fragments.length >= 6 && !gameState.puzzleCompleted) {
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btn-puzzle-entry';
      btn.textContent = '🧩 拼图';
      btn.style.cssText = 'position:fixed;bottom:6rem;left:50%;transform:translateX(-50%);z-index:10;padding:0.5rem 1.5rem;font-family:inherit;font-size:1rem;border-radius:24px;border:1.5px solid rgba(200,180,200,0.3);background:rgba(255,233,160,0.35);backdrop-filter:blur(6px);cursor:pointer;letter-spacing:0.1em;transition:all 0.2s ease;';
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,233,160,0.55)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,233,160,0.35)'; });
      btn.addEventListener('click', () => openPuzzle());
      dom.treasureScreen.appendChild(btn);
    }
    btn.style.display = '';
  } else if (btn) {
    btn.style.display = 'none';
  }
}

function openPuzzle() {
  dom.treasureScreen.classList.add('hidden');
  dom.puzzleScreen.classList.remove('hidden');
  dom.puzzleGrid.querySelectorAll('.puzzle-cell').forEach(c => c.remove());
  dom.puzzleTray.innerHTML = '';
  dom.puzzleGrid.style.opacity = '';
  dom.puzzleTray.style.display = '';
  dom.puzzleCelebration.classList.remove('active');
  const fp = document.getElementById('puzzle-full-photo');
  if (fp) fp.classList.remove('active');
  puzzlePieces = [];
  placedCount = 0;
  puzzleComplete = false;
  puzzleSourceImg = null;

  for (let r = 0; r < PUZZLE_ROWS; r++) {
    for (let c = 0; c < PUZZLE_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'puzzle-cell';
      cell.style.width = PIECE_W + 'px';
      cell.style.height = PIECE_H + 'px';
      cell.style.left = (c * PIECE_W) + 'px';
      cell.style.top = (r * PIECE_H) + 'px';
      cell.dataset.row = r;
      cell.dataset.col = c;
      dom.puzzleGrid.appendChild(cell);
    }
  }

  loadPuzzleImage();
}

function loadPuzzleImage() {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { puzzleSourceImg = img; createPuzzlePieces(img); };
  img.onerror = () => { const fb = createFallbackImage(); puzzleSourceImg = fb; createPuzzlePieces(fb); };
  img.src = 'images/puzzle/full-photo.png?' + Date.now();
}

function createFallbackImage() {
  const c = document.createElement('canvas');
  c.width = FULL_W;
  c.height = FULL_H;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, FULL_W, FULL_H);
  grad.addColorStop(0, '#FFD1DC');
  grad.addColorStop(0.5, '#C5E8F0');
  grad.addColorStop(1, '#E8D5F0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FULL_W, FULL_H);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '60px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧩', FULL_W / 2, FULL_H / 2 + 20);
  return c;
}

function createPuzzlePieces(sourceImg) {
  const pieces = [];

  for (let r = 0; r < PUZZLE_ROWS; r++) {
    for (let c = 0; c < PUZZLE_COLS; c++) {
      const pieceCanvas = document.createElement('canvas');
      pieceCanvas.width = PIECE_W;
      pieceCanvas.height = PIECE_H;
      const pctx = pieceCanvas.getContext('2d');
      pctx.drawImage(sourceImg, c * PIECE_W, r * PIECE_H, PIECE_W, PIECE_H, 0, 0, PIECE_W, PIECE_H);

      pieces.push({
        row: r, col: c,
        canvas: pieceCanvas,
        correctRow: r, correctCol: c
      });
    }
  }

  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }

  puzzlePieces = pieces;

  pieces.forEach((piece, idx) => {
    const el = document.createElement('div');
    el.className = 'puzzle-piece';
    el.style.width = PIECE_W + 'px';
    el.style.height = PIECE_H + 'px';
    el.style.backgroundImage = `url(${piece.canvas.toDataURL()})`;
    el.style.backgroundSize = '100% 100%';
    el.dataset.idx = idx;
    el.dataset.correctRow = piece.correctRow;
    el.dataset.correctCol = piece.correctCol;
    el.dataset.padX = '0';
    el.dataset.padY = '0';
    setupPieceDrag(el);
    dom.puzzleTray.appendChild(el);
  });
}

// ========== 拖拽逻辑 ==========
let dragEl = null;
let dragStartX = 0, dragStartY = 0;
let dragOrigLeft = 0, dragOrigTop = 0;

function setupPieceDrag(el) {
  let hasMoved = false;

  el.addEventListener('pointerdown', (e) => {
    if (el.classList.contains('placed')) return;
    e.preventDefault();
    dragEl = el;
    hasMoved = false;
    const rect = el.getBoundingClientRect();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOrigLeft = rect.left;
    dragOrigTop = rect.top;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragEl || dragEl !== el) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!hasMoved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    if (!hasMoved) {
      hasMoved = true;
      el.style.position = 'fixed';
      el.style.left = dragOrigLeft + 'px';
      el.style.top = dragOrigTop + 'px';
      el.style.zIndex = '50';
      el.style.margin = '0';
      el.classList.add('dragging');
    }
    el.style.left = (dragOrigLeft + dx) + 'px';
    el.style.top = (dragOrigTop + dy) + 'px';
  });

  el.addEventListener('pointerup', () => {
    if (!dragEl || dragEl !== el) return;
    if (hasMoved) {
      el.classList.remove('dragging');
      el.style.zIndex = '';
      tryDropPiece(el);
    }
    dragEl = null;
  });
}

function tryDropPiece(el) {
  const pr = el.getBoundingClientRect();
  const pcx = pr.left + pr.width / 2;
  const pcy = pr.top + pr.height / 2;
  const cells = dom.puzzleGrid.querySelectorAll('.puzzle-cell:not(.filled)');
  let bestCell = null, bestDist = Infinity;

  cells.forEach(cell => {
    const cr = cell.getBoundingClientRect();
    const dist = Math.hypot(pcx - (cr.left + cr.width / 2), pcy - (cr.top + cr.height / 2));
    if (dist < bestDist) { bestDist = dist; bestCell = cell; }
  });

  if (bestCell && bestDist < 110) {
    const cr = parseInt(bestCell.dataset.row);
    const cc = parseInt(bestCell.dataset.col);
    if (parseInt(el.dataset.correctRow) === cr && parseInt(el.dataset.correctCol) === cc) {
      snapPieceToCell(el, bestCell);
      return;
    }
  }
  returnPieceToTray(el);
}

function snapPieceToCell(el, cell) {
  el.classList.add('placed');
  el.style.position = 'absolute';
  el.style.zIndex = '1';
  el.style.margin = '0';

  // 按正确行列定位，偏移padding让凹凸边缘重叠咬合
  const cr = parseInt(el.dataset.correctRow);
  const cc = parseInt(el.dataset.correctCol);
  const padX = parseFloat(el.dataset.padX) || 0;
  const padY = parseFloat(el.dataset.padY) || 0;
  el.style.left = (cc * PIECE_W - padX) + 'px';
  el.style.top = (cr * PIECE_H - padY) + 'px';

  cell.classList.add('filled');
  dom.puzzleGrid.appendChild(el);
  placedCount++;

  if (placedCount === PUZZLE_ROWS * PUZZLE_COLS) {
    setTimeout(finishPuzzle, 500);
  }
}

function returnPieceToTray(el) {
  el.style.position = '';
  el.style.left = '';
  el.style.top = '';
  el.style.zIndex = '';
  el.style.margin = '';
  el.style.width = '';
  dom.puzzleTray.appendChild(el);
}

// ========== 完成：线消失 + 完整大图 ==========
let fullPhotoEl = null;

function finishPuzzle() {
  puzzleComplete = true;
  gameState.puzzleCompleted = true;
  saveProgress();
  updatePuzzleEntry();

  // 短暂延迟后隐藏网格碎片、显示完整大图
  setTimeout(() => {
    // 隐藏拼图网格
    dom.puzzleGrid.style.opacity = '0';
    dom.puzzleGrid.style.transition = 'opacity 0.4s ease';
    dom.puzzleTray.style.display = 'none';

    // 显示完整照片
    if (!fullPhotoEl) {
      fullPhotoEl = document.createElement('div');
      fullPhotoEl.id = 'puzzle-full-photo';
      document.body.appendChild(fullPhotoEl);
    }
    if (puzzleSourceImg) {
      const fw = FULL_W;
      const fh = FULL_H;
      fullPhotoEl.style.width = fw + 'px';
      fullPhotoEl.style.height = fh + 'px';
      if (puzzleSourceImg.tagName === 'CANVAS') {
        fullPhotoEl.style.backgroundImage = `url(${puzzleSourceImg.toDataURL()})`;
      } else {
        // Image element - draw to canvas for consistent rendering
        const tmp = document.createElement('canvas');
        tmp.width = fw; tmp.height = fh;
        tmp.getContext('2d').drawImage(puzzleSourceImg, 0, 0, fw, fh);
        fullPhotoEl.style.backgroundImage = `url(${tmp.toDataURL()})`;
      }
      fullPhotoEl.style.backgroundSize = '100% 100%';
    }
    fullPhotoEl.classList.add('active');

    // 庆祝星星
    showCelebration();
  }, 350);
}

function showCelebration() {
  dom.puzzleCelebration.classList.add('active');
  let starsDiv = dom.puzzleCelebration.querySelector('.celebration-stars');
  if (!starsDiv) {
    starsDiv = document.createElement('div');
    starsDiv.className = 'celebration-stars';
    dom.puzzleCelebration.appendChild(starsDiv);
  }

  for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    const tx = (Math.random() - 0.5) * 400;
    const ty = -Math.random() * 300 - 50;
    const dur = 1 + Math.random() * 2.5;
    const delay = Math.random() * 0.8;
    star.style.cssText = `
      position:absolute; left:${Math.random()*100}%; top:${Math.random()*100}%;
      width:${4+Math.random()*10}px; height:${4+Math.random()*10}px;
      background:${['#FFE9A0','#FFD1DC','#C5E8F0','#FFF','#FFB6C1'][Math.floor(Math.random()*5)]};
      border-radius:2px; pointer-events:none;
      animation:cs${i} ${dur}s ease-out ${delay}s forwards;
    `;
    const kf = document.createElement('style');
    kf.textContent = `@keyframes cs${i}{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(${tx}px,${ty}px) scale(0);opacity:0}}`;
    document.head.appendChild(kf);
    starsDiv.appendChild(star);
  }
  setTimeout(() => {
    dom.puzzleCelebration.classList.remove('active');
    starsDiv.innerHTML = '';
    // 恢复
    dom.puzzleGrid.style.opacity = '';
    dom.puzzleTray.style.display = '';
  }, 4500);
}

// ========== DIY房间 ==========
const diyDefaults = {};

function setupDIY() {
  // 保存默认位置（读取计算后的像素位置）
  dom.diyFurniture.forEach(el => {
    const id = el.dataset.furn;
    const cs = getComputedStyle(el);
    diyDefaults[id] = { left: cs.left, top: cs.top };
    setupFurnitureDrag(el);
  });

  // 还原按钮
  if (dom.diyRestore) {
    dom.diyRestore.addEventListener('click', restoreDIY);
  }
  // 返回按钮
  if (dom.diyBack) {
    dom.diyBack.addEventListener('click', () => navigateTo('home'));
  }
}

function setupFurnitureDrag(el) {
  let startX, startY, origLeft, origTop, offsetX, offsetY;

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.classList.add('dragging');
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    // 让家具中心对齐鼠标
    offsetX = rect.width / 2;
    offsetY = rect.height / 2;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = rect.left - offsetX;
    origTop = rect.top - offsetY;

    el.style.position = 'fixed';
    el.style.left = origLeft + 'px';
    el.style.top = origTop + 'px';
    el.style.margin = '0';
    el.style.zIndex = '10';
  });

  el.addEventListener('pointermove', (e) => {
    if (!el.classList.contains('dragging')) return;
    el.style.left = (origLeft + e.clientX - startX) + 'px';
    el.style.top = (origTop + e.clientY - startY) + 'px';
  });

  el.addEventListener('pointerup', () => {
    el.classList.remove('dragging');
    el.style.zIndex = '';
  });
}

function restoreDIY() {
  dom.diyFurniture.forEach(el => {
    const id = el.dataset.furn;
    if (diyDefaults[id]) {
      el.style.position = '';
      el.style.left = diyDefaults[id].left;
      el.style.top = diyDefaults[id].top;
      el.style.zIndex = '';
    }
  });
}

// ========== 状态栏更新 ==========
function updateStatusBar() {
  if (dom.storyCount) dom.storyCount.textContent = gameState.stories.length;
  if (dom.fragmentCount) dom.fragmentCount.textContent = gameState.fragments.length;
}

// ========== 页面导航 ==========
function navigateTo(target) {
  switch (target) {
    case 'treasure':
      dom.homeScreen.classList.add('hidden');
      dom.treasureScreen.classList.remove('hidden');
      dom.treasureScreen.classList.add('screen-fade');
      restoreItemStates();
      updateStatusBar();
      updatePuzzleEntry();
      break;
    case 'diy':
      dom.homeScreen.classList.add('hidden');
      dom.diyScreen.classList.remove('hidden');
      dom.diyScreen.classList.add('screen-fade');
      break;
    case 'continue':
      dom.homeScreen.classList.add('hidden');
      dom.treasureScreen.classList.remove('hidden');
      dom.treasureScreen.classList.add('screen-fade');
      break;
    case 'home':
      dom.treasureScreen.classList.add('hidden');
      dom.diyScreen.classList.add('hidden');
      dom.puzzleScreen.classList.add('hidden');
      dom.storyModal.classList.add('hidden');
      dom.homeScreen.classList.remove('hidden');
      dom.homeScreen.classList.add('screen-fade');
      dom.puzzleGrid.style.opacity = '';
      dom.puzzleTray.style.display = '';
      if (fullPhotoEl) fullPhotoEl.classList.remove('active');
      dom.puzzleCelebration.classList.remove('active');
      updatePuzzleEntry();
      break;
  }
}

// ========== 初始化 ==========
function init() {
  cacheDom();
  loadProgress();
  setupHomeButtons();
  setupMusic();
  setupBubbleButtons();
  setupRoomItems();
  setupStoryModal();
  setupDIY();
  restoreItemStates();
  updateStatusBar();

  if (dom.btnBack) {
    dom.btnBack.addEventListener('click', () => navigateTo('home'));
  }
  if (dom.puzzleBack) {
    dom.puzzleBack.addEventListener('click', () => navigateTo('home'));
  }
  updatePuzzleEntry();

  console.log('✨ 星星网页初始化完成');
  console.log('已解锁故事:', gameState.stories);
  console.log('已收集碎片:', gameState.fragments);
}

// ========== 进度存取 ==========
function loadProgress() {
  try {
    const saved = localStorage.getItem('starroom_save');
    if (saved) {
      const data = JSON.parse(saved);
      gameState.stories = data.stories || [];
      gameState.fragments = data.fragments || [];
      gameState.puzzleCompleted = data.puzzleCompleted || false;
    }
  } catch (e) {
    console.warn('读取存档失败:', e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem('starroom_save', JSON.stringify(gameState));
  } catch (e) {
    console.warn('保存存档失败:', e);
  }
}

function resetProgress() {
  gameState.stories = [];
  gameState.fragments = [];
  gameState.puzzleCompleted = false;
  saveProgress();
}

// ========== 启动 ==========
document.addEventListener('DOMContentLoaded', init);
