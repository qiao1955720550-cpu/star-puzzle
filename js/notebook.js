/* ========================================
   经折页手账本 — 交互脚本
   ======================================== */

(function() {
  'use strict';

  // ========== 数据 ==========
  var frontSpreads = [
    '#FFE8D6', '#FFDAC2', '#FFECD2', '#FFE0D0',
    '#FFF0E0', '#FFE8D8', '#FFF5E8'
  ];

  var backSpreads = [
    '#D8E8F0', '#D0E0EC', '#E0D8F0', '#D8D0E8',
    '#F0E0D8', '#E8D8D0', '#D8F0E0', '#D0E0F0'
  ];

  var coverImage = null;
  var spreadImages = {}; // 正反面分别存储：'front_0', 'back_3' 等

  var currentSide = 'front'; // 'front' | 'back'

  // ========== IndexedDB 持久化 ==========
  var DB_NAME = 'notebook_db';
  var DB_VERSION = 1;
  var STORE_NAME = 'images';

  function openDB() {
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function() { reject(req.error); };
    });
  }

  function saveToStorage(callback) {
    var data = {
      cover: coverImage,
      spreads: spreadImages
    };
    openDB().then(function(db) {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      store.put(data, 'notebook_data');
      tx.oncomplete = function() {
        db.close();
        if (callback) callback(true);
      };
      tx.onerror = function() {
        db.close();
        if (callback) callback(false);
      };
    }).catch(function() {
      if (callback) callback(false);
    });
  }

  function loadFromStorage(callback) {
    openDB().then(function(db) {
      var tx = db.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var req = store.get('notebook_data');
      req.onsuccess = function() {
        var data = req.result;
        if (data) {
          if (data.cover) coverImage = data.cover;
          if (data.spreads) spreadImages = data.spreads || {};
        }
        db.close();
        if (callback) callback(!!data);
      };
      req.onerror = function() {
        db.close();
        if (callback) callback(false);
      };
    }).catch(function() {
      if (callback) callback(false);
    });
  }

  // 启动时加载
  loadFromStorage(function() {
    applyCoverImage();
  });

  // ========== DOM引用 ==========
  var closedBook = document.getElementById('notebook-closed');
  var openedBook = document.getElementById('notebook-opened');
  var accordionStrip = document.getElementById('accordion-strip');
  var accordionViewport = document.querySelector('.accordion-viewport');
  var uploadInput = document.getElementById('upload-input');
  var coverFront = document.querySelector('.book-cover-front');
  var flipBackBtn = document.getElementById('flip-back-btn');
  var flipFrontBtn = document.getElementById('flip-front-btn');
  var closeBtn = document.getElementById('close-btn');
  var saveBtn = document.getElementById('save-btn');
  var saveToast = document.getElementById('save-toast');

  var editTarget = null;

  // ========== 滑动状态 ==========
  var currentOffset = 0;
  var targetSpeed = 0;
  var currentSpeed = 0;
  var maxOffset = 0;
  var panelWidth = 0;
  var isOpen = false;
  var animId = null;

  // ========== 获取当前侧数据 ==========
  function currentSpreads() {
    return currentSide === 'front' ? frontSpreads : backSpreads;
  }

  // ========== 初始化面板 ==========
  function buildPanels() {
    var spreads = currentSpreads();
    var html = '';
    var isBack = currentSide === 'back';

    // 正面：在最前面添加封面单页
    if (!isBack) {
      var coverImg = spreadImages['front_cover'];
      var coverBg = coverImg
        ? 'background: url(' + coverImg + ') center/cover no-repeat;'
        : 'background-color: #FDF5E6;';
      html +=
        '<div class="panel half-panel" data-index="cover" style="' + coverBg + '">' +
          '<div class="page-half"></div>' +
          '<div class="page-half page-hidden"></div>' +
          '<div class="spread-placeholder"' + (coverImg ? ' style="display:none"' : '') + '>封面</div>' +
          '<button class="upload-btn" title="上传图片">📷</button>' +
        '</div>';
    }

    // 反面：在最前面添加封底单页
    if (isBack) {
      var backCoverImg = spreadImages['back_cover'] || 'images/1234.jpg';
      var backCoverBg = 'background: url(' + backCoverImg + ') center/cover no-repeat;';
      html +=
        '<div class="panel half-panel" data-index="back_cover" style="' + backCoverBg + '">' +
          '<div class="page-half"></div>' +
          '<div class="page-half page-hidden"></div>' +
          '<button class="upload-btn" title="上传图片">📷</button>' +
        '</div>';
    }

    for (var i = 0; i < spreads.length; i++) {
      var key = currentSide + '_' + i;
      var img = spreadImages[key];
      var bgStyle = img
        ? 'background: url(' + img + ') center/cover no-repeat;'
        : 'background-color: ' + spreads[i] + ';';

      // 反面特殊处理
      if (isBack && i === 1) {
        // 对开页1（反面）：单页 + 开门交互
        var dKey = currentSide + '_' + i;
        var dLF = spreadImages[dKey + '_doorL_front'];
        var dLB = spreadImages[dKey + '_doorL_back'];
        var dRF = spreadImages[dKey + '_doorR_front'];
        var dRB = spreadImages[dKey + '_doorR_back'];
        var dInner = spreadImages[dKey + '_door_inner'];
        function dbg(img, c) { return img ? 'background: url(' + img + ') center/cover no-repeat;' : 'background-color: ' + c + ';'; }
        html +=
          '<div class="panel half-panel page-door" data-index="' + i + '" style="background-color:' + spreads[i] + ';">' +
            '<div class="door-flap door-left">' +
              '<div class="door-face door-face-front" style="' + dbg(dLF, '#E8DDD0') + '">' +
                '<button class="upload-btn door-upload" data-half="doorL_front" title="左门正面">📷</button>' +
              '</div>' +
              '<div class="door-face door-face-back" style="' + dbg(dLB, '#DDD0E0') + '">' +
                '<button class="upload-btn door-upload" data-half="doorL_back" title="左门背面">📷</button>' +
              '</div>' +
            '</div>' +
            '<div class="door-flap door-right">' +
              '<div class="door-face door-face-front" style="' + dbg(dRF, '#E8DDD0') + '">' +
                '<button class="upload-btn door-upload" data-half="doorR_front" title="右门正面">📷</button>' +
              '</div>' +
              '<div class="door-face door-face-back" style="' + dbg(dRB, '#DDD0E0') + '">' +
                '<button class="upload-btn door-upload" data-half="doorR_back" title="右门背面">📷</button>' +
              '</div>' +
            '</div>' +
            '<div class="door-content" style="' + dbg(dInner, spreads[i]) + '">' +
              '<div class="spread-placeholder"' + (dInner ? ' style="display:none"' : '') + '>✦</div>' +
              '<button class="upload-btn" data-half="door_inner" title="上传门内图片">📷</button>' +
            '</div>' +
            '<div class="door-hint">请点击打开</div>' +
          '</div>';
      } else if (isBack && i === 2) {
        // 对开页2（反面）：单页
        html += buildHalfPanel(i, spreads[i], img);
      } else if (i === 7) {
        // 对开页7（正反面均）：只保留左半页
        html += buildHalfPanel(i, spreads[i], img);
      } else {
        // 普通对开页
        html +=
          '<div class="panel" data-index="' + i + '" style="' + bgStyle + '">' +
            '<div class="page-half"></div>' +
            '<div class="page-half"></div>' +
            '<div class="spread-placeholder"' + (img ? ' style="display:none"' : '') + '>对开页 ' + i + '</div>' +
            '<button class="upload-btn" title="上传图片">📷</button>' +
          '</div>';
      }
    }
    accordionStrip.innerHTML = html;
  }

  function buildSplitPanel(index, color, hasImg) {
    var keyLeft = currentSide + '_' + index + '_left';
    var keyRight = currentSide + '_' + index + '_right';
    var keyDoorLFront = currentSide + '_' + index + '_doorL_front';
    var keyDoorLBack = currentSide + '_' + index + '_doorL_back';
    var keyDoorRFront = currentSide + '_' + index + '_doorR_front';
    var keyDoorRBack = currentSide + '_' + index + '_doorR_back';
    var keyDoorInner = currentSide + '_' + index + '_door_inner';

    var imgLeft = spreadImages[keyLeft];
    var imgRight = spreadImages[keyRight];
    var imgDLF = spreadImages[keyDoorLFront];
    var imgDLB = spreadImages[keyDoorLBack];
    var imgDRF = spreadImages[keyDoorRFront];
    var imgDRB = spreadImages[keyDoorRBack];
    var imgInner = spreadImages[keyDoorInner];

    function bg(img, c) { return img ? 'background: url(' + img + ') center/cover no-repeat;' : 'background-color: ' + c + ';'; }

    return (
      '<div class="panel split-panel" data-index="' + index + '" style="background-color:' + color + ';">' +
        // 左页
        '<div class="page-half page-left" style="' + bg(imgLeft, color) + '">' +
          '<div class="spread-placeholder"' + (imgLeft ? ' style="display:none"' : '') + '>对开页 ' + index + ' 左</div>' +
          '<button class="upload-btn" data-half="left" title="上传左页图片">📷</button>' +
        '</div>' +
        // 右页 — 门
        '<div class="page-half page-right page-door" id="door-page" style="' + bg(imgRight, color) + '">' +
          // 左门扇
          '<div class="door-flap door-left">' +
            '<div class="door-face door-face-front" style="' + bg(imgDLF, '#E8DDD0') + '">' +
              '<button class="upload-btn door-upload" data-half="doorL_front" title="左门正面">📷</button>' +
            '</div>' +
            '<div class="door-face door-face-back" style="' + bg(imgDLB, '#DDD0E0') + '">' +
              '<button class="upload-btn door-upload" data-half="doorL_back" title="左门背面">📷</button>' +
            '</div>' +
          '</div>' +
          // 右门扇
          '<div class="door-flap door-right">' +
            '<div class="door-face door-face-front" style="' + bg(imgDRF, '#E8DDD0') + '">' +
              '<button class="upload-btn door-upload" data-half="doorR_front" title="右门正面">📷</button>' +
            '</div>' +
            '<div class="door-face door-face-back" style="' + bg(imgDRB, '#DDD0E0') + '">' +
              '<button class="upload-btn door-upload" data-half="doorR_back" title="右门背面">📷</button>' +
            '</div>' +
          '</div>' +
          // 门内内容（可编辑）
          '<div class="door-content" style="' + bg(imgInner, color) + '">' +
            '<div class="spread-placeholder"' + (imgInner ? ' style="display:none"' : '') + '>✦</div>' +
            '<button class="upload-btn" data-half="door_inner" title="上传门内图片">📷</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildHalfPanel(index, color, hasImg) {
    var img = spreadImages[currentSide + '_' + index];
    var bg = img
      ? 'background: url(' + img + ') center/cover no-repeat;'
      : 'background-color: ' + color + ';';
    return (
      '<div class="panel half-panel" data-index="' + index + '" style="' + bg + '">' +
        '<div class="page-half"></div>' +
        '<div class="page-half page-hidden"></div>' +
        '<div class="spread-placeholder"' + (img ? ' style="display:none"' : '') + '>对开页 ' + index + '</div>' +
        '<button class="upload-btn" title="上传图片">📷</button>' +
      '</div>'
    );
  }

  // ========== 封面上传按钮 ==========
  function initCoverUpload() {
    var btn = document.createElement('button');
    btn.className = 'upload-btn';
    btn.title = '上传封面图片';
    btn.textContent = '📷';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.width = '40px';
    btn.style.height = '40px';
    btn.style.fontSize = '1.2rem';
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      editTarget = 'cover';
      uploadInput.click();
    });
    coverFront.appendChild(btn);
  }

  function applyCoverImage() {
    if (coverImage) {
      coverFront.style.background = 'url(' + coverImage + ') center/cover no-repeat';
    }
  }

  // ========== 图片上传 ==========
  function onPanelUploadClick(e) {
    var btn = e.target.closest('.upload-btn');
    if (!btn) return;
    e.stopPropagation();
    var panel = btn.closest('.panel');
    var indexAttr = panel.getAttribute('data-index');
    var index = (indexAttr === 'cover' || indexAttr === 'back_cover') ? indexAttr : parseInt(indexAttr);
    var half = btn.getAttribute('data-half'); // 'left' | 'right' | null
    editTarget = { panel: index, half: half || null };
    uploadInput.click();
  }

  uploadInput.addEventListener('change', function() {
    var file = uploadInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var dataUrl = ev.target.result;
      if (editTarget === 'cover') {
        coverImage = dataUrl;
        applyCoverImage();
      } else if (editTarget && editTarget.panel !== undefined) {
        var idx = editTarget.panel;
        var half = editTarget.half;
        var key;
        if (idx === 'cover') {
          key = 'front_cover';
        } else if (idx === 'back_cover') {
          key = 'back_cover';
        } else {
          key = currentSide + '_' + idx + (half ? '_' + half : '');
        }
        spreadImages[key] = dataUrl;

        var panel = accordionStrip.querySelector('.panel[data-index="' + idx + '"]');
        if (!panel) { editTarget = null; uploadInput.value = ''; return; }

        if (half === 'left') {
          var leftHalf = panel.querySelector('.page-left');
          if (leftHalf) {
            leftHalf.style.background = 'url(' + dataUrl + ') center/cover no-repeat';
            leftHalf.style.backgroundColor = 'transparent';
            var ph = leftHalf.querySelector('.spread-placeholder');
            if (ph) ph.style.display = 'none';
          }
        } else if (half && half.indexOf('door') === 0) {
          // 门扇正面/背面/内部: doorL_front, doorL_back, doorR_front, doorR_back, door_inner
          if (half === 'door_inner') {
            var inner = panel.querySelector('.door-content');
            if (inner) {
              inner.style.background = 'url(' + dataUrl + ') center/cover no-repeat';
              inner.style.backgroundColor = 'transparent';
              var ph = inner.querySelector('.spread-placeholder');
              if (ph) ph.style.display = 'none';
            }
          } else {
            var doorFace = panel.querySelector('[data-half="' + half + '"]');
            if (doorFace) {
              var faceEl = doorFace.closest('.door-face');
              if (faceEl) {
                faceEl.style.background = 'url(' + dataUrl + ') center/cover no-repeat';
                faceEl.style.backgroundColor = 'transparent';
              }
            }
          }
        } else {
          panel.style.background = 'url(' + dataUrl + ') center/cover no-repeat';
          panel.style.backgroundColor = 'transparent';
          var placeholder = panel.querySelector('.spread-placeholder');
          if (placeholder) placeholder.style.display = 'none';
        }
      }
      editTarget = null;
      uploadInput.value = '';
      saveToStorage(); // 自动保存（不关心结果）
    };
    reader.readAsDataURL(file);
  });

  accordionStrip.addEventListener('click', function(e) {
    // 门页交互
    var doorPage = e.target.closest('.page-door');
    if (doorPage) {
      var uploadBtn = e.target.closest('.upload-btn');
      if (uploadBtn) {
        onPanelUploadClick(e);
        return;
      }
      doorPage.classList.toggle('open');
      // 开门时提升面板层级，防止被相邻面板压住
      var panel = doorPage.closest('.panel');
      if (panel) {
        panel.style.zIndex = doorPage.classList.contains('open') ? '20' : '';
      }
      return;
    }
    onPanelUploadClick(e);
  });

  // ========== 翻面 ==========
  function flipToSide(side) {
    currentSide = side;
    resetPosition();
    buildPanels();
    recalcSizes();
  }

  function resetPosition() {
    targetSpeed = 0;
    currentSpeed = 0;
    // 反面从右端开始（右往左读），正面从左端开始
    if (currentSide === 'back') {
      currentOffset = -maxOffset;
    } else {
      currentOffset = 0;
    }
    accordionStrip.style.transform = 'translateX(' + currentOffset + 'px)';
    flipBackBtn.classList.add('hidden');
    flipFrontBtn.classList.add('hidden');
  }

  flipBackBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    flipToSide('back');
  });

  flipFrontBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    flipToSide('front');
  });

  // ========== 计算面板尺寸 ==========
  function recalcSizes() {
    var panel = accordionStrip.querySelector('.panel');
    if (!panel) return;
    panelWidth = panel.offsetWidth;
    var viewportWidth = accordionViewport.clientWidth;
    var stripWidth = accordionStrip.scrollWidth;
    maxOffset = Math.max(0, stripWidth - viewportWidth);
  }

  function checkFlipBtn() {
    // 翻到底时显示翻面按钮
    var atEnd;
    if (currentSide === 'front') {
      atEnd = currentOffset <= -maxOffset + 5;
    } else {
      atEnd = currentOffset >= -5; // 反面从-maxOffset开始，翻到0即为到底
    }
    if (atEnd) {
      if (currentSide === 'front') {
        flipBackBtn.classList.remove('hidden');
        flipFrontBtn.classList.add('hidden');
      } else {
        flipFrontBtn.classList.remove('hidden');
        flipBackBtn.classList.add('hidden');
      }
    } else {
      flipBackBtn.classList.add('hidden');
      flipFrontBtn.classList.add('hidden');
    }
  }

  // ========== 滑动动画循环 ==========
  function slideLoop() {
    var speedDiff = targetSpeed - currentSpeed;
    currentSpeed += speedDiff * 0.08;

    if (Math.abs(speedDiff) < 0.01 && Math.abs(targetSpeed) < 0.01) {
      currentSpeed = 0;
      animId = null;
      checkFlipBtn();
      return;
    }

    currentOffset += currentSpeed;

    if (currentOffset > 0) {
      currentOffset = 0;
      currentSpeed = 0;
    }
    if (currentOffset < -maxOffset) {
      currentOffset = -maxOffset;
      currentSpeed = 0;
    }

    accordionStrip.style.transform = 'translateX(' + currentOffset + 'px)';
    checkFlipBtn();
    animId = requestAnimationFrame(slideLoop);
  }

  function startLoop() {
    if (animId) return;
    animId = requestAnimationFrame(slideLoop);
  }

  // ========== 鼠标位置 → 滑动速度 ==========
  function onMouseMove(e) {
    if (!isOpen) return;
    var rect = accordionViewport.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var viewWidth = rect.width;
    var deadLeft = viewWidth * 0.3;
    var deadRight = viewWidth * 0.7;

    if (mouseX < deadLeft) {
      var ratio = 1 - (mouseX / deadLeft);
      targetSpeed = ratio * 3; // 向左滑动
    } else if (mouseX > deadRight) {
      var ratio2 = (mouseX - deadRight) / (viewWidth - deadRight);
      targetSpeed = -ratio2 * 3; // 向右滑动
    } else {
      targetSpeed = 0;
    }
    startLoop();
  }

  function onMouseLeave() {
    targetSpeed = 0;
  }

  // ========== 打开/关闭 ==========
  function openBook() {
    closedBook.classList.add('closing');
    closedBook.addEventListener('animationend', function handler() {
      closedBook.removeEventListener('animationend', handler);
      closedBook.classList.add('hidden');
      closedBook.classList.remove('closing');

      openedBook.classList.remove('hidden');
      void openedBook.offsetWidth;
      openedBook.classList.add('opening');

      currentSide = 'front';
      resetPosition();
      buildPanels();
      recalcSizes();
      isOpen = true;
      closeBtn.classList.remove('hidden');
      saveBtn.classList.remove('hidden');

      accordionViewport.addEventListener('mousemove', onMouseMove);
      accordionViewport.addEventListener('mouseleave', onMouseLeave);
      accordionViewport.addEventListener('touchmove', onTouchMove, { passive: false });
    });
  }

  function closeBook() {
    isOpen = false;
    targetSpeed = 0;
    currentSpeed = 0;
    if (animId) { cancelAnimationFrame(animId); animId = null; }

    accordionViewport.removeEventListener('mousemove', onMouseMove);
    accordionViewport.removeEventListener('mouseleave', onMouseLeave);
    accordionViewport.removeEventListener('touchmove', onTouchMove);

    openedBook.classList.add('hidden');
    openedBook.classList.remove('opening');
    flipBackBtn.classList.add('hidden');
    flipFrontBtn.classList.add('hidden');
    closeBtn.classList.add('hidden');
    saveBtn.classList.add('hidden');

    closedBook.classList.remove('hidden', 'closing');
  }

  closedBook.addEventListener('click', function(e) {
    if (e.target.closest('.upload-btn')) return;
    openBook();
  });

  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeBook();
  });

  saveBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    saveToStorage(function(ok) {
      if (ok) {
        saveToast.classList.add('show');
        setTimeout(function() { saveToast.classList.remove('show'); }, 2000);
      } else {
        alert('保存失败，请重试。');
      }
    });
  });

  // ========== 触摸支持 ==========
  function onTouchMove(e) {
    if (!isOpen) return;
    e.preventDefault();
    var touch = e.touches[0];
    var rect = accordionViewport.getBoundingClientRect();
    var touchX = touch.clientX - rect.left;
    var viewWidth = rect.width;
    var deadLeft = viewWidth * 0.3;
    var deadRight = viewWidth * 0.7;

    if (touchX < deadLeft) {
      var ratio = 1 - (touchX / deadLeft);
      targetSpeed = ratio * 3;
    } else if (touchX > deadRight) {
      var ratio2 = (touchX - deadRight) / (viewWidth - deadRight);
      targetSpeed = -ratio2 * 3;
    } else {
      targetSpeed = 0;
    }
    startLoop();
  }

  // ========== 初始化 ==========
  buildPanels();
  initCoverUpload();
  closeBtn.classList.add('hidden');
  saveBtn.classList.add('hidden');

  window.addEventListener('resize', function() {
    if (isOpen) {
      recalcSizes();
      if (currentOffset < -maxOffset) {
        currentOffset = -maxOffset;
        accordionStrip.style.transform = 'translateX(' + currentOffset + 'px)';
      }
    }
  });

})();
