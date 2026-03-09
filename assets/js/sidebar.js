// assets/js/sidebar.js
// 导航黑洞球：只吸附左右两侧 + 作为音乐球黑洞中心（倒反天罡优化）
// 优化：点开导航面板时，导航球不再消失

const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle-btn');

if (sidebar && sidebarToggle) {

  let isDragging = false;
  let hasDragged = false;
  let startX, startY, initialLeft, initialTop;

  window.navBallMergedWithMusic = false;   // 全局状态，供 music.js 读取

  const sidebarGap = 12;
  const sidebarWidth = 195 + 32;

  const DETACH_DISTANCE = 320;

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
      // 展开面板：导航球保持可见，不隐藏
      sidebar.style.left = `${hideLeft}px`;
      sidebar.classList.add('show');
      requestAnimationFrame(() => { sidebar.style.left = `${showLeft}px`; });
      // 移除以下两行：不再隐藏导航球
      // sidebarToggle.style.opacity = '0';
      // sidebarToggle.style.pointerEvents = 'none';
    } else {
      // 收起面板：导航球恢复正常
      sidebar.style.left = `${showLeft}px`;
      requestAnimationFrame(() => { sidebar.style.left = `${hideLeft}px`; });
      setTimeout(() => {
        sidebar.classList.remove('show');
        sidebarToggle.style.opacity = '1';
        sidebarToggle.style.pointerEvents = 'auto';
      }, 450);
    }
  };

  sidebarToggle.addEventListener('click', (e) => {
    if (!isDragging && !hasDragged) {
      e.stopPropagation();
      toggleSidebar();
    }
  });

  const startDrag = (clientX, clientY) => {
    // 即使面板已展开，也允许拖动导航球（但不触发 toggleSidebar）
    isDragging = true;
    hasDragged = false;
    startX = clientX;
    startY = clientY;
    const rect = sidebarToggle.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
  };

  const doDrag = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const moved = Math.hypot(dx, dy) > 6;
    if (moved) {
      hasDragged = true;
      if (!sidebarToggle.style.left) {
        sidebarToggle.style.left = `${initialLeft}px`;
        sidebarToggle.style.top = `${initialTop}px`;
        sidebarToggle.style.transform = 'none';
      }
      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // 只限制左右边界，上下自由
      newLeft = Math.max(10, Math.min(window.innerWidth - 82, newLeft));
      // newTop 不限制

      sidebarToggle.style.left = `${newLeft}px`;
      sidebarToggle.style.top = `${newTop}px`;
      sidebarToggle.classList.add('dragging');
    }
  };

  const stopDrag = () => {
    if (!isDragging) return;
    isDragging = false;

    if (hasDragged) {
      // 只吸附左右两侧
      const rect = sidebarToggle.getBoundingClientRect();
      const winW = window.innerWidth;
      const dists = [
        { side: 'left',  val: rect.left },
        { side: 'right', val: winW - rect.right }
      ];
      const closest = dists.reduce((prev, curr) => prev.val < curr.val ? prev : curr);

      let targetX = rect.left;
      let targetY = rect.top;

      const EDGE_GAP = 12;

      if (closest.side === 'left') {
        targetX = EDGE_GAP;
      } else if (closest.side === 'right') {
        targetX = winW - rect.width - EDGE_GAP;
      }

      sidebarToggle.style.transition = 'left 0.42s cubic-bezier(0.34,1.56,0.64,1), top 0.42s cubic-bezier(0.34,1.56,0.64,1)';
      sidebarToggle.style.left = `${Math.round(targetX)}px`;
      // top 不变

      localStorage.setItem('sidebarPosX', targetX);
      localStorage.setItem('sidebarPosY', Math.round(targetY));
    }
    sidebarToggle.classList.remove('dragging');
  };

  // 鼠标 / 触摸事件
  sidebarToggle.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
  document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', stopDrag);

  sidebarToggle.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  });
  document.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length) {
      const touch = e.touches[0];
      doDrag(touch.clientX, touch.clientY);
      e.preventDefault();
    }
  });
  document.addEventListener('touchend', stopDrag);

  // 点击页面其他地方关闭面板（不变）
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {
      if (sidebar.classList.contains('show')) toggleSidebar();
    }
  });

  // 分离检测（停止音乐） - 不变
  function checkDetach() {
    if (window.navBallMergedWithMusic) {
      const musicBall = document.getElementById('music-toggle-btn');
      const audio = document.getElementById('bgm');
      if (musicBall && audio) {
        const musicCenter = { x: musicBall.getBoundingClientRect().left + musicBall.offsetWidth / 2, y: musicBall.getBoundingClientRect().top + musicBall.offsetHeight / 2 };
        const navCenter = { x: sidebarToggle.getBoundingClientRect().left + sidebarToggle.offsetWidth / 2, y: sidebarToggle.getBoundingClientRect().top + sidebarToggle.offsetHeight / 2 };
        const dist = Math.hypot(navCenter.x - musicCenter.x, navCenter.y - musicCenter.y);
        if (dist > DETACH_DISTANCE) {
          if (!audio.paused) {
            const playBtn = document.getElementById('toggle-music');
            if (playBtn) playBtn.click();
            else audio.pause();
          }
          window.navBallMergedWithMusic = false;
          sidebarToggle.classList.remove('star-mode');
        }
      }
    }
    requestAnimationFrame(checkDetach);
  }
  checkDetach();

  // 恢复位置
  const savedLeft = localStorage.getItem('sidebarPosX');
  const savedTop = localStorage.getItem('sidebarPosY');
  if (savedLeft !== null && savedTop !== null) {
    sidebarToggle.style.left = savedLeft + 'px';
    sidebarToggle.style.top = savedTop + 'px';
    sidebarToggle.style.transform = 'none';
  }

  // 黑洞优化：加大尺寸
  setTimeout(() => {
    sidebarToggle.style.width = '68px';
    sidebarToggle.style.height = '68px';
    sidebarToggle.style.fontSize = '28px';
  }, 100);
}