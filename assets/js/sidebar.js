// assets/js/sidebar.js

// 左侧可拖动导航球 + 侧边栏展开/收起逻辑 + 合并音乐球吸附播放功能（中心对齐）

// 修复：吸附时中心对齐，避免偏移；仅在音乐未播放时触发播放

const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle-btn');

if (sidebar && sidebarToggle) {
  let isDragging = false;
  let hasDragged = false;         // 记录是否真正拖动过（防止误触点击）
  let startX, startY, initialLeft, initialTop;

  const sidebarGap = 12;
  const sidebarWidth = 195 + 32;  // 侧边栏宽度 + 间距（根据你的 CSS 调整）

  // 切换侧边栏显示/隐藏 + 动态定位 + 智能判断左右弹出
  const toggleSidebar = () => {
    const toggleRect = sidebarToggle.getBoundingClientRect();
    const centerY = toggleRect.top + toggleRect.height / 2;

    sidebar.style.top = `${centerY}px`;
    sidebar.style.transform = 'translateY(-50%)';

    const isShow = !sidebar.classList.contains('show');
    const isLeftSide = toggleRect.left < window.innerWidth / 2;

    let showLeft, hideLeft;

    if (isLeftSide) {
      hideLeft = toggleRect.left - sidebarWidth - sidebarGap;
      showLeft = toggleRect.left + toggleRect.width + sidebarGap;
    } else {
      hideLeft = toggleRect.left + toggleRect.width + sidebarGap;
      showLeft = toggleRect.left - sidebarWidth - sidebarGap;
    }

    if (isShow) {
      sidebar.style.left = `${hideLeft}px`;
      sidebar.classList.add('show');
      requestAnimationFrame(() => {
        sidebar.style.left = `${showLeft}px`;
      });
      sidebarToggle.style.opacity = '0';
      sidebarToggle.style.pointerEvents = 'none';
    } else {
      sidebar.style.left = `${showLeft}px`;
      requestAnimationFrame(() => {
        sidebar.style.left = `${hideLeft}px`;
      });
      setTimeout(() => {
        sidebar.classList.remove('show');
        sidebarToggle.style.opacity = '1';
        sidebarToggle.style.pointerEvents = 'auto';
      }, 450);
    }
  };

  // 点击时才展开（拖动后不触发点击事件）
  sidebarToggle.addEventListener('click', (e) => {
    if (!isDragging && !hasDragged) {
      e.stopPropagation();
      toggleSidebar();
    }
  });

  // ── 自由拖动逻辑（支持鼠标 + 触屏） ──
  const startDrag = (clientX, clientY) => {
    if (sidebar.classList.contains('show')) return; // 已展开时不允许拖动按钮

    isDragging = true;
    hasDragged = false;

    startX = clientX;
    startY = clientY;

    const rect = sidebarToggle.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    // 注意：这里不立即修改内联样式，等到真正移动时才修改
  };

  const doDrag = (clientX, clientY) => {
    if (!isDragging) return;

    const dx = clientX - startX;
    const dy = clientY - startY;

    // 移动超过 6px 才算真正拖动（防误触）
    const moved = Math.hypot(dx, dy) > 6;
    if (moved) {
      hasDragged = true;

      // 只有在真正拖动时，才设置内联样式以覆盖 CSS 定位
      // 但需要确保第一次移动时设置初始位置
      if (!sidebarToggle.style.left) {
        // 第一次移动，设置初始 left/top 并禁用 transform
        sidebarToggle.style.left = `${initialLeft}px`;
        sidebarToggle.style.top = `${initialTop}px`;
        sidebarToggle.style.transform = 'none';
      }

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // 限制拖动范围，防止跑到屏幕外
      newLeft = Math.max(10, Math.min(window.innerWidth - 72, newLeft));
      newTop  = Math.max(10, Math.min(window.innerHeight - 72, newTop));

      sidebarToggle.style.left = `${newLeft}px`;
      sidebarToggle.style.top  = `${newTop}px`;
      sidebarToggle.classList.add('dragging');
    }
  };

  const stopDrag = () => {
    if (!isDragging) return;
    isDragging = false;

    if (hasDragged) {
      // 真正拖动过：检查是否靠近音乐球，若是则吸附并播放音乐
      const musicBall = document.getElementById('music-toggle-btn');
      if (musicBall) {
        const musicRect = musicBall.getBoundingClientRect();
        const musicCenter = {
          x: musicRect.left + musicRect.width / 2,
          y: musicRect.top + musicRect.height / 2
        };
        const navRect = sidebarToggle.getBoundingClientRect();
        const navCenter = {
          x: navRect.left + navRect.width / 2,
          y: navRect.top + navRect.height / 2
        };
        const dist = Math.hypot(navCenter.x - musicCenter.x, navCenter.y - musicCenter.y);
        const ADSORB_DISTANCE = 100; // 吸附阈值（像素）——适度增大以提高触发率
        const MERGE_DISTANCE = 40;   // 认为“合并”的距离阈值

        if (dist < ADSORB_DISTANCE) {
          // 吸附：将导航球中心与音乐球中心对齐（无视原 transform）
          const targetLeft = Math.round(musicCenter.x - navRect.width / 2);
          const targetTop  = Math.round(musicCenter.y - navRect.height / 2);

          // 先清除可能的 translate 偏移，确保计算绝对位置无误
          sidebarToggle.style.transform = 'none';
          // 平滑移动到目标位置
          sidebarToggle.style.transition = 'left 0.28s ease, top 0.28s ease';
          sidebarToggle.style.left = `${targetLeft}px`;
          sidebarToggle.style.top  = `${targetTop}px`;

          // 如果非常靠近，确保视觉上看起来是“合并” —— 放大光晕（music.js 也会放大）
          // 触发音乐播放（仅当音乐未播放时）
          const audio = document.getElementById('bgm');
          if (audio && audio.paused) {
            const playBtn = document.getElementById('toggle-music');
            if (playBtn) {
              playBtn.click(); // 模拟点击播放按钮
            } else {
              audio.play().catch(e => console.log('自动播放失败:', e));
            }
          }

          // 可选：保存吸附后的位置到 localStorage（数字形式）
          localStorage.setItem('sidebarPosX', targetLeft);
          localStorage.setItem('sidebarPosY', targetTop);

          // 清理 transition（防止影响后续拖动样式），在 transition 完成后移除 transition 样式
          const onTransEnd = (ev) => {
            if (ev.propertyName === 'left' || ev.propertyName === 'top') {
              sidebarToggle.style.transition = '';
              sidebarToggle.removeEventListener('transitionend', onTransEnd);
            }
          };
          sidebarToggle.addEventListener('transitionend', onTransEnd);
        } else {
          // 未吸附，保持原有拖动位置，清除 transition 以便下次拖动
          sidebarToggle.style.transition = '';
        }
      }

      sidebarToggle.classList.remove('dragging');
    } else {
      // 没有拖动（纯点击）：清除所有内联样式，恢复 CSS 默认定位
      sidebarToggle.style.left = '';
      sidebarToggle.style.top = '';
      sidebarToggle.style.transform = '';
      sidebarToggle.style.transition = '';
      sidebarToggle.classList.remove('dragging');
    }
    // hasDragged 会在下次 startDrag 时重置为 false
  };

  // 鼠标事件
  sidebarToggle.addEventListener('mousedown', (e) => {
    startDrag(e.clientX, e.clientY);
  });
  document.addEventListener('mousemove', (e) => {
    doDrag(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', stopDrag);

  // 触屏事件
  sidebarToggle.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  });
  document.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length) {
      const touch = e.touches[0];
      doDrag(touch.clientX, touch.clientY);
      e.preventDefault(); // 防止页面滚动
    }
  });
  document.addEventListener('touchend', stopDrag);

  // 点击页面空白处关闭侧边栏
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {
      if (sidebar.classList.contains('show')) {
        toggleSidebar();
      }
    }
  });

  // 可选：从 localStorage 恢复导航球位置（如果有保存）
  const savedLeft = localStorage.getItem('sidebarPosX');
  const savedTop = localStorage.getItem('sidebarPosY');
  if (savedLeft !== null && savedTop !== null) {
    // 兼容可能存在的 "100" 或 "100px" 两种存法
    const parse = (v) => (String(v).endsWith('px') ? parseInt(v, 10) : parseInt(v, 10));
    const leftVal = parse(savedLeft);
    const topVal = parse(savedTop);
    if (!isNaN(leftVal) && !isNaN(topVal)) {
      sidebarToggle.style.left = leftVal + 'px';
      sidebarToggle.style.top = topVal + 'px';
      sidebarToggle.style.transform = 'none';
    }
  }
}