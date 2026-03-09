// assets/js/music.js - 音乐球自由 + 被黑洞吸附播放（完整优化版 - 蓝色线更细微 + 靠近时恢复原牵引线）

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('music-toggle-btn');
  const panel = document.getElementById('music-panel');
  const audio = document.getElementById('bgm');

  if (!toggleBtn || !panel || !audio) {
    console.error('音乐控件元素缺失');
    return;
  }

  const widget = document.createElement('div');
  widget.id = 'music-widget';
  toggleBtn.parentNode.insertBefore(widget, toggleBtn);
  widget.appendChild(toggleBtn);
  widget.appendChild(panel);

  let isDragging = false;
  let hasDragged = false;
  let startX, startY, initialLeft, initialTop;
  const moveThreshold = 8;

  // 初始位置
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

  const startDrag = (clientX, clientY) => {
    isDragging = true;
    hasDragged = false;
    startX = clientX;
    startY = clientY;
    const rect = widget.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    widget.style.transition = 'none';
    panel.classList.remove('expanded');
  };

  const doDrag = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (Math.hypot(dx, dy) > moveThreshold) hasDragged = true;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    newLeft = Math.max(10, Math.min(window.innerWidth - 72, newLeft));

    const navBall = document.getElementById('sidebar-toggle-btn');
    if (navBall) {
      const navRect = navBall.getBoundingClientRect();
      const navCenter = { x: navRect.left + navRect.width / 2, y: navRect.top + navRect.height / 2 };
      const musicCenter = { x: newLeft + widget.offsetWidth / 2, y: newTop + widget.offsetHeight / 2 };
      const dist = Math.hypot(musicCenter.x - navCenter.x, musicCenter.y - navCenter.y);

      const ADSORB_TRIGGER = 265;
      if (dist < ADSORB_TRIGGER && dist > 45) {
        const pullStrength = (ADSORB_TRIGGER - dist) / ADSORB_TRIGGER * 0.78;
        const ax = (navCenter.x - musicCenter.x) * pullStrength;
        const ay = (navCenter.y - musicCenter.y) * pullStrength;
        newLeft += ax;
        newTop += ay;
        newLeft = Math.max(10, Math.min(window.innerWidth - 72, newLeft));
      }
    }

    widget.style.left = `${newLeft}px`;
    widget.style.top = `${newTop}px`;
    widget.style.right = 'auto';
  };

  const stopDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    widget.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    if (hasDragged) {
      const navBall = document.getElementById('sidebar-toggle-btn');
      let snapped = false;

      if (navBall) {
        const navRect = navBall.getBoundingClientRect();
        const navCenter = { x: navRect.left + navRect.width / 2, y: navRect.top + navRect.height / 2 };
        const musicRect = widget.getBoundingClientRect();
        const musicCenter = { x: musicRect.left + musicRect.width / 2, y: musicRect.top + musicRect.height / 2 };
        const dist = Math.hypot(musicCenter.x - navCenter.x, musicCenter.y - navCenter.y);

        const ADSORB_SNAP = 265;

        if (dist < ADSORB_SNAP) {
          const targetLeft = Math.round(navCenter.x - widget.offsetWidth / 2);
          const targetTop = Math.round(navCenter.y - widget.offsetHeight / 2);

          widget.style.transition = 'all 0.48s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          widget.style.left = `${targetLeft}px`;
          widget.style.top = `${targetTop}px`;
          widget.style.transform = 'scale(1.12)';
          setTimeout(() => {
            widget.style.transform = 'scale(1)';
          }, 480);

          if (audio.paused) {
            const playBtn = document.getElementById('toggle-music');
            if (playBtn) playBtn.click();
            else audio.play().catch(() => {});
          }

          window.navBallMergedWithMusic = true;
          if (navBall) navBall.classList.add('star-mode');

          setTimeout(() => {
            localStorage.setItem('musicPosX', targetLeft);
            localStorage.setItem('musicPosY', targetTop);
          }, 500);

          snapped = true;
          return;
        }
      }

      if (!snapped) {
        const rect = widget.getBoundingClientRect();
        const winW = window.innerWidth;
        const leftDist = rect.left;
        const rightDist = winW - rect.right;

        let targetX;
        const targetY = rect.top;

        const EDGE_GAP = 16;

        if (leftDist < rightDist) {
          targetX = EDGE_GAP;
        } else {
          targetX = winW - rect.width - EDGE_GAP;
        }

        setTimeout(() => {
          widget.style.left = `${Math.round(targetX)}px`;
        }, 10);

        localStorage.setItem('musicPosX', Math.round(targetX));
        localStorage.setItem('musicPosY', Math.round(targetY));
        updatePanelDirection();
      }
    }
  };

  // 事件绑定（不变）
  toggleBtn.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); });
  document.addEventListener('mousemove', (e) => { doDrag(e.clientX, e.clientY); });
  document.addEventListener('mouseup', stopDrag);

  toggleBtn.addEventListener('touchstart', (e) => {
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (isDragging) {
      doDrag(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchend', stopDrag);

  toggleBtn.addEventListener('click', (e) => {
    if (!isDragging && !hasDragged) {
      e.stopPropagation();
      panel.classList.toggle('expanded');
      if (panel.classList.contains('expanded')) updatePanelDirection();
    }
  });

  document.addEventListener('click', (e) => {
    if (panel.classList.contains('expanded') && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
      panel.classList.remove('expanded');
    }
  });

  // ==================== 播放控制 ====================
  const toggleMusicBtn = document.getElementById('toggle-music');
  const prevBtn = document.getElementById('prev-track');
  const nextBtn = document.getElementById('next-track');
  const modeBtn = document.getElementById('mode-toggle');
  const playIcon = toggleMusicBtn?.querySelector('.play');
  const pauseIcon = toggleMusicBtn?.querySelector('.pause');
  const loopIcon = modeBtn?.querySelector('.icon-loop');
  const randomIcon = modeBtn?.querySelector('.icon-random');

  const playlist = [{ file: "贝加尔湖畔.mp3" }];
  let currentIndex = 0;
  let isRandom = localStorage.getItem('musicRandom') === 'true';
  let isPlaying = false;

  if (randomIcon && loopIcon) {
    randomIcon.style.display = isRandom ? 'block' : 'none';
    loopIcon.style.display = isRandom ? 'none' : 'block';
  }
  audio.volume = 1.0;

  function loadAndPlay(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    audio.src = `assets/music/${playlist[index].file}`;
    if (isPlaying) audio.play().catch(() => {});
    localStorage.setItem('lastMusicIndex', currentIndex);
  }

  function playNext() {
    let nextIndex = isRandom ? Math.floor(Math.random() * playlist.length) : (currentIndex + 1) % playlist.length;
    if (isRandom && playlist.length > 1) {
      while (nextIndex === currentIndex) nextIndex = Math.floor(Math.random() * playlist.length);
    }
    loadAndPlay(nextIndex);
  }

  if (toggleMusicBtn) {
    toggleMusicBtn.addEventListener('click', () => {
      const navBall = document.getElementById('sidebar-toggle-btn');

      if (isPlaying) {
        audio.pause();
        if (playIcon && pauseIcon) {
          playIcon.style.display = 'block';
          pauseIcon.style.display = 'none';
        }
        toggleBtn.style.animationPlayState = 'paused';
        if (navBall) navBall.classList.remove('star-mode');
      } else {
        audio.play().catch(err => console.log('播放失败:', err));
        if (playIcon && pauseIcon) {
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'block';
        }
        toggleBtn.style.animationPlayState = 'running';
        if (navBall) navBall.classList.add('star-mode');
      }
      isPlaying = !isPlaying;
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    let p = currentIndex - 1;
    if (p < 0) p = playlist.length - 1;
    loadAndPlay(p);
  });

  if (nextBtn) nextBtn.addEventListener('click', playNext);

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

  const savedIndex = parseInt(localStorage.getItem('lastMusicIndex'));
  if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < playlist.length) {
    currentIndex = savedIndex;
    loadAndPlay(currentIndex);
  }

  audio.onplay = () => {
    toggleBtn.style.animationPlayState = 'running';
    haloAnimating = true;
    animateHalo();
  };
  audio.onpause = () => {
    toggleBtn.style.animationPlayState = 'paused';
    haloAnimating = true;
    animateHalo();
  };

  // ==================== 旋转动画 ====================
  const style = document.createElement('style');
  style.textContent = `
    #music-toggle-btn{animation:rotate 20s linear infinite; animation-play-state:paused;}
    @keyframes rotate{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  `;
  document.head.appendChild(style);

  if (isPlaying) toggleBtn.style.animationPlayState = 'running';

  // ==================== 磁吸 + 光环跳动 + 牵引线 ====================
  const navBall = document.getElementById('sidebar-toggle-btn');
  const musicBall = document.getElementById('music-toggle-btn');
  const connectionSVG = document.getElementById('magnet-connection');
  const TRIGGER_DISTANCE = 300, MAX_GLOW_DISTANCE = 140, MERGE_DISTANCE = 40;
  let haloAnimating = false, audioCtx, analyser, dataArray;

  function getCenter(e) {
    const r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function animateHalo() {
    if (!connectionSVG) return;
    const c1 = getCenter(navBall), c2 = getCenter(musicBall);
    const dx = c2.x - c1.x, dy = c2.y - c1.y;
    const distance = Math.hypot(dx, dy);
    const isMerged = distance <= MERGE_DISTANCE;
    let outerR, innerR;

    if (!isPlaying && isMerged) {
      outerR = 50; innerR = 25;
    } else {
      if (!audioCtx && isPlaying) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const src = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        src.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }
      if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const ampFactor = isMerged ? 1.45 : 0.95;
        outerR = 16 + avg * 0.55 * ampFactor;
        innerR = 8 + avg * 0.32 * ampFactor;
      } else {
        outerR = 25; innerR = 12;
      }
    }

    let boxShadow = '';
    let showLongBlueLine = false;

    if (isPlaying) {
      // 蓝色光环（仅未吸附 + 播放中）
      if (!isMerged) {
        const blueIntensity = 12 + (dataArray ? dataArray.reduce((a,b)=>a+b,0)/dataArray.length * 0.6 : 0);
        boxShadow = `
          0 0 25px rgba(103,232,249,0.65),
          0 0 55px rgba(165,243,252,0.45),
          0 0 95px rgba(103,232,249,0.3),
          0 0 150px rgba(165,243,252,0.18)
        `;
      }

      // 播放中 + 距离远 → 显示细蓝线
      if (distance >= TRIGGER_DISTANCE) {
        showLongBlueLine = true;
      }
    }

    // 原有紫红光环（合并或非播放）
    if (isMerged || !isPlaying) {
      let normalized = isMerged ? 1 : 1 - Math.min(distance / TRIGGER_DISTANCE, 1);
      if (isPlaying) {
        if (isMerged) {
          boxShadow = `
            0 0 28px rgba(236,72,153,0.55),
            0 0 60px rgba(217,70,239,0.45),
            0 0 100px rgba(168,85,247,0.38),
            0 0 160px rgba(139,92,246,0.28),
            0 0 240px rgba(236,72,153,0.18),
            inset 0 0 22px rgba(255,255,255,0.18)
          `;
        } else {
          boxShadow = `
            0 0 22px rgba(192,132,252,0.6),
            0 0 50px rgba(232,121,249,0.5),
            0 0 85px rgba(244,114,182,0.38),
            0 0 130px rgba(168,85,247,0.25),
            inset 0 0 18px rgba(192,132,252,0.2)
          `;
        }
      } else {
        boxShadow = isMerged
          ? '0 0 35px rgba(236,72,153,0.35), 0 0 70px rgba(168,85,247,0.25)'
          : '0 0 28px rgba(192,132,252,0.35), 0 0 55px rgba(232,121,249,0.25)';
      }
    }

    navBall.style.boxShadow = boxShadow || '';
    musicBall.style.boxShadow = boxShadow || '';

    const scale = 1 + (isMerged ? 0.24 : 0.18) * (isMerged ? 1 : 1 - Math.min(distance / TRIGGER_DISTANCE, 1));
    navBall.style.transform = `scale(${scale}) translateY(-50%)`;
    musicBall.style.transform = `scale(${scale})`;

    // 连接线逻辑：优先原牵引线，其次蓝细线
    if (isMerged) {
      // 合并状态：显示原合并圆
      connectionSVG.innerHTML = `
        <defs><filter id="mergeGlow"><feGaussianBlur stdDeviation="9" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <circle cx="${c2.x}" cy="${c2.y}" r="${outerR}" fill="rgba(236,72,153,0.65)" filter="url(#mergeGlow)"/>
        <circle cx="${c2.x}" cy="${c2.y}" r="${innerR}" fill="rgba(168,85,247,0.8)" filter="url(#mergeGlow)"/>
      `;
    } else if (distance < TRIGGER_DISTANCE) {
      // 靠近但未合并：显示原彩色牵引线
      let normalized = 1 - Math.min(distance / TRIGGER_DISTANCE, 1);
      const lineOpacity = normalized * 0.9;
      const lineWidth = 2 + normalized * 16;
      connectionSVG.innerHTML = `
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(167,139,250,${lineOpacity})" />
            <stop offset="50%" stop-color="rgba(220,180,255,${lineOpacity})" />
            <stop offset="100%" stop-color="rgba(167,139,250,${lineOpacity})" />
          </linearGradient>
          <filter id="glowLine"><feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <line x1="${c1.x}" y1="${c1.y}" x2="${c2.x}" y2="${c2.y}" stroke="url(#lineGrad)" stroke-width="${lineWidth}" stroke-linecap="round" filter="url(#glowLine)" />
        <circle cx="${c1.x}" cy="${c1.y}" r="${3 + normalized * 6}" fill="rgba(255,182,193,0.9)" filter="url(#glowLine)" />
        <circle cx="${c2.x}" cy="${c2.y}" r="${3 + normalized * 6}" fill="rgba(255,182,193,0.9)" filter="url(#glowLine)" />
      `;
    } else if (showLongBlueLine) {
      // 播放中 + 距离远：显示细蓝线
      const lineOpacity = 0.45;
      connectionSVG.innerHTML = `
        <defs>
          <filter id="longLineGlow"><feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <line x1="${c1.x}" y1="${c1.y}" x2="${c2.x}" y2="${c2.y}" 
              stroke="rgba(103,232,249,${lineOpacity})" 
              stroke-width="1.0" 
              stroke-linecap="round" 
              filter="url(#longLineGlow)" />
      `;
    } else {
      connectionSVG.innerHTML = '';
    }

    requestAnimationFrame(animateHalo);
  }
  animateHalo();
});