// assets/js/sidebar.js

// 左侧可拖动导航球 + 侧边栏展开/收起逻辑 + 合并音乐球吸附播放功能（中心对齐）
// 新增：拖离音乐球自动停止音乐

const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle-btn');

if (sidebar && sidebarToggle) {

  let isDragging = false;
  let hasDragged = false;
  let startX, startY, initialLeft, initialTop;

  let isMergedWithMusic = false;   // 是否处于吸附状态

  const sidebarGap = 12;
  const sidebarWidth = 195 + 32;

  const ADSORB_DISTANCE = 200;
  const DETACH_DISTANCE = 200;

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

  sidebarToggle.addEventListener('click', (e) => {
    if (!isDragging && !hasDragged) {
      e.stopPropagation();
      toggleSidebar();
    }
  });

  // 拖动开始
  const startDrag = (clientX, clientY) => {

    if (sidebar.classList.contains('show')) return;

    isDragging = true;
    hasDragged = false;

    startX = clientX;
    startY = clientY;

    const rect = sidebarToggle.getBoundingClientRect();

    initialLeft = rect.left;
    initialTop = rect.top;
  };

  // 拖动中
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

      newLeft = Math.max(10, Math.min(window.innerWidth - 72, newLeft));
      newTop = Math.max(10, Math.min(window.innerHeight - 72, newTop));

      sidebarToggle.style.left = `${newLeft}px`;
      sidebarToggle.style.top = `${newTop}px`;

      sidebarToggle.classList.add('dragging');
    }
  };

  const stopDrag = () => {

    if (!isDragging) return;

    isDragging = false;

    if (hasDragged) {

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

        const dist = Math.hypot(
          navCenter.x - musicCenter.x,
          navCenter.y - musicCenter.y
        );

        if (dist < ADSORB_DISTANCE) {

          const targetLeft = Math.round(musicCenter.x - navRect.width / 2);
          const targetTop = Math.round(musicCenter.y - navRect.height / 2);

          sidebarToggle.style.transform = 'none';
          sidebarToggle.style.transition = 'left 0.28s ease, top 0.28s ease';

          sidebarToggle.style.left = `${targetLeft}px`;
          sidebarToggle.style.top = `${targetTop}px`;

          const audio = document.getElementById('bgm');

          if (audio) {

            const playBtn = document.getElementById('toggle-music');

            if (audio.paused) {

              if (playBtn) {
                playBtn.click();
              } else {
                audio.play().catch(() => {});
              }
            }
          }

          isMergedWithMusic = true;

          // 增加：吸附成功时添加 star-mode（触发 CSS 星星效果）
          sidebarToggle.classList.add('star-mode');

          localStorage.setItem('sidebarPosX', targetLeft);
          localStorage.setItem('sidebarPosY', targetTop);
        }
      }

      sidebarToggle.classList.remove('dragging');

    } else {

      sidebarToggle.classList.remove('dragging');
    }
  };

  // 鼠标
  sidebarToggle.addEventListener('mousedown', (e) => {
    startDrag(e.clientX, e.clientY);
  });

  document.addEventListener('mousemove', (e) => {
    doDrag(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', stopDrag);

  // 触摸
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

  document.addEventListener('click', (e) => {

    if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {

      if (sidebar.classList.contains('show')) {
        toggleSidebar();
      }
    }
  });

  // =============================
  // 新增：持续检测两球距离
  // =============================

  function checkDetach() {

    if (isMergedWithMusic) {

      const musicBall = document.getElementById('music-toggle-btn');
      const audio = document.getElementById('bgm');

      if (musicBall && audio) {

        const musicRect = musicBall.getBoundingClientRect();
        const navRect = sidebarToggle.getBoundingClientRect();

        const musicCenter = {
          x: musicRect.left + musicRect.width / 2,
          y: musicRect.top + musicRect.height / 2
        };

        const navCenter = {
          x: navRect.left + navRect.width / 2,
          y: navRect.top + navRect.height / 2
        };

        const dist = Math.hypot(
          navCenter.x - musicCenter.x,
          navCenter.y - musicCenter.y
        );

        if (dist > DETACH_DISTANCE) {

          if (!audio.paused) {

            const playBtn = document.getElementById('toggle-music');

            if (playBtn) {
              playBtn.click();
            } else {
              audio.pause();
            }
          }

          isMergedWithMusic = false;

          // 增加：解除吸附时移除 star-mode（恢复黑洞效果）
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

    const leftVal = parseInt(savedLeft);
    const topVal = parseInt(savedTop);

    if (!isNaN(leftVal) && !isNaN(topVal)) {

      sidebarToggle.style.left = leftVal + 'px';
      sidebarToggle.style.top = topVal + 'px';
      sidebarToggle.style.transform = 'none';
    }
  }
}