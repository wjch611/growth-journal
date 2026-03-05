// assets/js/music.js - 完整音乐控件：拖动 + 点击展开 + 播放控制 + 播放时旋转音乐球 + 磁吸交互（增强版）

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('music-toggle-btn');
  const panel = document.getElementById('music-panel');
  const audio = document.getElementById('bgm');

  if (!toggleBtn || !panel || !audio) {
    console.error('音乐控件元素缺失');
    return;
  }

  // 创建 widget 包裹（用于拖动）
  const widget = document.createElement('div');
  widget.id = 'music-widget';
  toggleBtn.parentNode.insertBefore(widget, toggleBtn);
  widget.appendChild(toggleBtn);
  widget.appendChild(panel);

  let isDragging = false;
  let hasDragged = false;
  let startX, startY, initialLeft, initialTop;
  const moveThreshold = 8; // 拖动阈值（像素）

  // 恢复位置
  const savedX = localStorage.getItem('musicPosX');
  const savedY = localStorage.getItem('musicPosY');
  if (savedX !== null && savedY !== null) {
    widget.style.left = savedX + 'px';
    widget.style.top = savedY + 'px';
    widget.style.right = 'auto';
  } else {
    widget.style.right = '20px';
    widget.style.top = '45%';
  }

  function updatePanelDirection() {
    const rect = widget.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    panel.classList.remove('panel-left', 'panel-right', 'panel-top', 'panel-bottom');
    const dL = rect.left, dR = winW - rect.right;
    const dT = rect.top, dB = winH - rect.bottom;
    const minD = Math.min(dL, dR, dT, dB);
    if (minD === dR) panel.classList.add('panel-right');
    else if (minD === dL) panel.classList.add('panel-left');
    else if (minD === dT) panel.classList.add('panel-top');
    else if (minD === dB) panel.classList.add('panel-bottom');
  }

  // 拖动开始
  const startDrag = (clientX, clientY) => {
    isDragging = true;
    hasDragged = false;
    startX = clientX;
    startY = clientY;
    const rect = widget.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    widget.style.transition = 'none';
    panel.classList.remove('expanded');  // 拖动开始强制收起
  };

  // 球体半径（用于碰撞检测，根据实际 CSS 尺寸调整）
  const BALL_RADIUS = 30; // 约 widget 宽度的一半

  // 拖动中（增强：添加碰撞检测，防止与导航球重叠）
  const doDrag = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (Math.hypot(dx, dy) > moveThreshold) hasDragged = true;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // 边界限制
    newLeft = Math.max(10, Math.min(window.innerWidth - 70, newLeft));
    newTop = Math.max(10, Math.min(window.innerHeight - 70, newTop));

    // 碰撞检测：避免与导航球重叠（仅在拖动音乐球时避免重叠）
    const navBall = document.getElementById('sidebar-toggle-btn');
    if (navBall) {
      const navRect = navBall.getBoundingClientRect();
      const navCenter = {
        x: navRect.left + navRect.width / 2,
        y: navRect.top + navRect.height / 2
      };
      const musicCenter = {
        x: newLeft + widget.offsetWidth / 2,
        y: newTop + widget.offsetHeight / 2
      };
      const dist = Math.hypot(musicCenter.x - navCenter.x, musicCenter.y - navCenter.y);
      const minDist = BALL_RADIUS * 2; // 两球半径之和

      if (dist < minDist) {
        // 如果距离小于最小允许距离，计算排斥方向，将音乐球推开
        const angle = Math.atan2(musicCenter.y - navCenter.y, musicCenter.x - navCenter.x);
        const pushX = Math.cos(angle) * (minDist - dist);
        const pushY = Math.sin(angle) * (minDist - dist);
        newLeft += pushX;
        newTop += pushY;

        // 再次边界限制
        newLeft = Math.max(10, Math.min(window.innerWidth - 70, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - 70, newTop));
      }
    }

    widget.style.left = `${newLeft}px`;
    widget.style.top = `${newTop}px`;
    widget.style.right = 'auto';
  };

  // 拖动结束
  const stopDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    widget.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    if (hasDragged) {
      // 拖动过 → 吸附
      const rect = widget.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      const dists = [
        { side: 'left', val: rect.left },
        { side: 'right', val: winW - rect.right },
        { side: 'top', val: rect.top },
        { side: 'bottom', val: winH - rect.bottom }
      ];

      const closest = dists.reduce((prev, curr) => prev.val < curr.val ? prev : curr);

      let targetX = rect.left;
      let targetY = rect.top;

      if (closest.side === 'left') targetX = 16;
      else if (closest.side === 'right') targetX = winW - rect.width - 16;
      else if (closest.side === 'top') targetY = 16;
      else if (closest.side === 'bottom') targetY = winH - rect.height - 16;

      widget.style.left = targetX + 'px';
      widget.style.top = targetY + 'px';

      setTimeout(() => {
        localStorage.setItem('musicPosX', targetX);
        localStorage.setItem('musicPosY', targetY);
        updatePanelDirection();
      }, 500);
    }
    // hasDragged 在下一次拖动开始重置
  };

  // 鼠标事件
  toggleBtn.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); });
  document.addEventListener('mousemove', (e) => { doDrag(e.clientX, e.clientY); });
  document.addEventListener('mouseup', stopDrag);

  // 触摸事件
  toggleBtn.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length) {
      const touch = e.touches[0];
      doDrag(touch.clientX, touch.clientY);
      e.preventDefault();
    }
  }, { passive: false });
  document.addEventListener('touchend', stopDrag);

  // 点击展开/收起（只有真正点击才展开）
  toggleBtn.addEventListener('click', (e) => {
    if (!isDragging && !hasDragged) {
      e.stopPropagation();
      panel.classList.toggle('expanded');
      if (panel.classList.contains('expanded')) {
        updatePanelDirection();
      }
    }
  });

  // 点击外部收起面板
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('expanded') &&
        !panel.contains(e.target) &&
        !toggleBtn.contains(e.target)) {
      panel.classList.remove('expanded');
    }
  });

  // ==================== 播放控制逻辑 + 旋转动画 ====================
  const toggleMusicBtn = document.getElementById('toggle-music');
  const prevBtn = document.getElementById('prev-track');
  const nextBtn = document.getElementById('next-track');
  const modeBtn = document.getElementById('mode-toggle');

  const playIcon = toggleMusicBtn?.querySelector('.play');
  const pauseIcon = toggleMusicBtn?.querySelector('.pause');
  const loopIcon = modeBtn?.querySelector('.icon-loop');
  const randomIcon = modeBtn?.querySelector('.icon-random');

  const playlist = [
    { file: "贝加尔湖畔.mp3" },
    // 添加更多歌曲...
  ];

  let currentIndex = 0;
  let isRandom = localStorage.getItem('musicRandom') === 'true';
  let isPlaying = false;

  // 初始化模式图标
  if (randomIcon && loopIcon) {
    randomIcon.style.display = isRandom ? 'block' : 'none';
    loopIcon.style.display = isRandom ? 'none' : 'block';
  }

  audio.volume = 1.0;

  function loadAndPlay(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    audio.src = `assets/music/${playlist[index].file}`;
    if (isPlaying) {
      audio.play().catch(e => console.log("播放失败:", e));
    }
    localStorage.setItem('lastMusicIndex', currentIndex);
  }

  function playNext() {
    let nextIndex = isRandom
      ? Math.floor(Math.random() * playlist.length)
      : (currentIndex + 1) % playlist.length;
    if (isRandom && playlist.length > 1) {
      while (nextIndex === currentIndex) nextIndex = Math.floor(Math.random() * playlist.length);
    }
    loadAndPlay(nextIndex);
  }

  // 播放/暂停 + 控制旋转动画
  if (toggleMusicBtn) {
    toggleMusicBtn.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
        if (playIcon && pauseIcon) {
          playIcon.style.display = 'block';
          pauseIcon.style.display = 'none';
        }
        toggleBtn.style.animationPlayState = 'paused';  // 暂停旋转
      } else {
        audio.play().catch(e => console.log("播放被阻止:", e));
        if (playIcon && pauseIcon) {
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'block';
        }
        toggleBtn.style.animationPlayState = 'running';  // 恢复旋转
      }
      isPlaying = !isPlaying;
    });
  }

  // 上一首 / 下一首
  if (prevBtn) prevBtn.addEventListener('click', () => {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    loadAndPlay(prevIndex);
  });

  if (nextBtn) nextBtn.addEventListener('click', playNext);

  // 模式切换
  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      isRandom = !isRandom;
      localStorage.setItem('musicRandom', isRandom);
      if (randomIcon && loopIcon) {
        randomIcon.style.display = isRandom ? 'block' : 'none';
        loopIcon.style.display = isRandom ? 'none' : 'block';
      }
    });
  }

  audio.onended = playNext;

  // 恢复上次歌曲 + 旋转状态
  const savedIndex = parseInt(localStorage.getItem('lastMusicIndex'));
  if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < playlist.length) {
    currentIndex = savedIndex;
    loadAndPlay(currentIndex);
  }

  audio.onplay = () => {
    localStorage.setItem('lastMusicIndex', currentIndex);
    toggleBtn.style.animationPlayState = 'running';  // 确保播放时旋转
  };

  audio.onpause = () => {
    toggleBtn.style.animationPlayState = 'paused';  // 暂停时停止旋转
  };

  audio.onerror = (e) => {
    console.error('音频加载错误:', e);
  };

  // ==================== 旋转动画 CSS（直接注入） ====================
  const style = document.createElement('style');
  style.textContent = `
    #music-toggle-btn {
      animation: rotate 20s linear infinite;
      animation-play-state: paused; /* 默认暂停 */
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // 初始化旋转状态（如果页面加载时已经在播放）
  if (isPlaying) {
    toggleBtn.style.animationPlayState = 'running';
  }

  // ───────────────────────────────────────────────
  // 磁吸交互逻辑（增强版：光晕 + 防重叠 + 合并高亮）
  // ───────────────────────────────────────────────

  const navBall = document.getElementById('sidebar-toggle-btn');
  const musicBall = document.getElementById('music-toggle-btn');
  const connectionSVG = document.getElementById('magnet-connection');

  if (!navBall || !musicBall || !connectionSVG) {
    console.warn('磁吸效果无法初始化：缺少必要元素', {
      navBall: !!navBall,
      musicBall: !!musicBall,
      connectionSVG: !!connectionSVG
    });
  } else {
    const TRIGGER_DISTANCE = 220;     // 触发距离（像素）
    const MAX_GLOW_DISTANCE = 140;    // 光晕最强距离
    const MERGE_DISTANCE = 40;        // 视作合并/重叠的距离阈值

    function getCenter(element) {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }

    function updateMagnetEffect() {
      const sidebar = document.querySelector('.sidebar');
      const musicPanel = document.getElementById('music-panel');

      if (sidebar?.classList.contains('show') || musicPanel?.classList.contains('expanded')) {
        clearEffect();
        return;
      }

      const c1 = getCenter(navBall);
      const c2 = getCenter(musicBall);
      const dx = c2.x - c1.x;
      const dy = c2.y - c1.y;
      const distance = Math.hypot(dx, dy);

      if (distance < TRIGGER_DISTANCE) {
        // 规范化强度（靠近时越强）
        let normalized = 1 - (distance / TRIGGER_DISTANCE);
        // 光晕强度（在最大距离范围内控制渐变）
        let glowStrength = Math.max(0, 1 - (distance / MAX_GLOW_DISTANCE));
        if (glowStrength < 0) glowStrength = 0;
        // 当非常接近时（合并），使用最大值
        const isMerged = distance <= MERGE_DISTANCE;
        if (isMerged) {
          normalized = 1;
          glowStrength = 1;
        }

        // === 增强光晕：多层阴影 + 颜色渐变 ===
        const baseGlow = 20 + glowStrength * 80;      // 基础模糊半径（更大范围）
        const extraGlow = glowStrength * 60;          // 额外大模糊层

        // 根据距离改变颜色：近处偏紫红，远处偏蓝
        const hue = 250 + glowStrength * 20; // 250 -> 270
        const glowColor = `hsla(${hue}, 80%, 70%, ${0.35 + glowStrength * 0.55})`;
        const intenseColor = `hsla(${hue}, 90%, 65%, ${0.7 + glowStrength * 0.3})`;

        const boxShadow = `
          0 0 ${baseGlow}px ${glowColor},
          0 0 ${baseGlow + 40}px ${intenseColor},
          0 0 ${baseGlow + 80}px rgba(167,139,250,${0.25 + glowStrength * 0.35}),
          0 12px 30px rgba(0,0,0,0.55)
        `;
        navBall.style.boxShadow = boxShadow;
        musicBall.style.boxShadow = boxShadow;

        // 缩放：靠近时放大一点
        const scale = 1 + normalized * 0.18;
        navBall.style.transform = `scale(${scale}) translateY(-50%)`;
        musicBall.style.transform = `scale(${scale})`;

        // === 连接线 / 合并视觉 ===
        if (!isMerged && distance > 6) {
          // 普通连接线（两点间）
          const lineOpacity = normalized * 0.9;
          const lineWidth = 2 + normalized * 8;

          connectionSVG.innerHTML = `
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(167,139,250,${lineOpacity})" />
                <stop offset="50%" stop-color="rgba(220,180,255,${lineOpacity})" />
                <stop offset="100%" stop-color="rgba(167,139,250,${lineOpacity})" />
              </linearGradient>
              <filter id="glowLine">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <line 
              x1="${c1.x}" y1="${c1.y}"
              x2="${c2.x}" y2="${c2.y}"
              stroke="url(#lineGrad)"
              stroke-width="${lineWidth}"
              stroke-linecap="round"
              filter="url(#glowLine)"
            />
            <circle cx="${c1.x}" cy="${c1.y}" r="${3 + normalized * 6}" fill="rgba(255,200,255,${0.9})" filter="url(#glowLine)" />
            <circle cx="${c2.x}" cy="${c2.y}" r="${3 + normalized * 6}" fill="rgba(255,200,255,${0.9})" filter="url(#glowLine)" />
          `;
        } else {
          // 合并态：展示更大的共同光晕（不画线，画两层重合光圈）
          const glowR = 12 + normalized * 30;
          const innerR = 6 + normalized * 14;
          connectionSVG.innerHTML = `
            <defs>
              <filter id="mergeGlow">
                <feGaussianBlur stdDeviation="8" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle cx="${c2.x}" cy="${c2.y}" r="${glowR}" fill="rgba(167,139,250,${0.22 + normalized * 0.5})" filter="url(#mergeGlow)" />
            <circle cx="${c2.x}" cy="${c2.y}" r="${innerR}" fill="rgba(255,220,255,${0.6 + normalized * 0.3})" filter="url(#mergeGlow)" />
          `;
        }
      } else {
        clearEffect();
      }
    }

    function clearEffect() {
      connectionSVG.innerHTML = '';
      navBall.style.boxShadow = '';
      musicBall.style.boxShadow = '';
      navBall.style.transform = 'translateY(-50%)';
      musicBall.style.transform = '';
    }

    function tick() {
      updateMagnetEffect();
      requestAnimationFrame(tick);
    }

    tick();

    window.addEventListener('resize', clearEffect);

    console.log('磁吸交互效果已初始化（增强版）');
  }
});