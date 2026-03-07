// assets/js/music.js - 完整音乐控件（优化光环 + 牵引线 + 吸附最大光圈）

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

  const BALL_RADIUS = 30;

  const doDrag = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (Math.hypot(dx, dy) > moveThreshold) hasDragged = true;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;
    newLeft = Math.max(10, Math.min(window.innerWidth - 70, newLeft));
    newTop = Math.max(10, Math.min(window.innerHeight - 70, newTop));

    const navBall = document.getElementById('sidebar-toggle-btn');
    if (navBall) {
      const navRect = navBall.getBoundingClientRect();
      const navCenter = { x: navRect.left + navRect.width / 2, y: navRect.top + navRect.height / 2 };
      const musicCenter = { x: newLeft + widget.offsetWidth / 2, y: newTop + widget.offsetHeight / 2 };
      const dist = Math.hypot(musicCenter.x - navCenter.x, musicCenter.y - navCenter.y);
      const minDist = BALL_RADIUS * 2;
      if (dist < minDist) {
        const angle = Math.atan2(musicCenter.y - navCenter.y, musicCenter.x - navCenter.x);
        const pushX = Math.cos(angle) * (minDist - dist);
        const pushY = Math.sin(angle) * (minDist - dist);
        newLeft += pushX;
        newTop += pushY;
        newLeft = Math.max(10, Math.min(window.innerWidth - 70, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - 70, newTop));
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
  };

  toggleBtn.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); });
  document.addEventListener('mousemove', (e) => { doDrag(e.clientX, e.clientY); });
  document.addEventListener('mouseup', stopDrag);
  toggleBtn.addEventListener('touchstart', (e) => { startDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive:false });
  document.addEventListener('touchmove', (e) => { if(isDragging){ doDrag(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } }, { passive:false });
  document.addEventListener('touchend', stopDrag);

  toggleBtn.addEventListener('click', (e) => {
    if (!isDragging && !hasDragged) {
      e.stopPropagation();
      panel.classList.toggle('expanded');
      if(panel.classList.contains('expanded')) updatePanelDirection();
    }
  });

  document.addEventListener('click', (e) => {
    if(panel.classList.contains('expanded') && !panel.contains(e.target) && !toggleBtn.contains(e.target)){
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
  let isRandom = localStorage.getItem('musicRandom')==='true';
  let isPlaying = false;

  if(randomIcon&&loopIcon){ randomIcon.style.display=isRandom?'block':'none'; loopIcon.style.display=isRandom?'none':'block'; }
  audio.volume = 1.0;

  function loadAndPlay(index){
    if(index<0||index>=playlist.length) return;
    currentIndex=index;
    audio.src=`assets/music/${playlist[index].file}`;
    if(isPlaying) audio.play().catch(()=>{});
    localStorage.setItem('lastMusicIndex', currentIndex);
  }

  function playNext(){
    let nextIndex=isRandom?Math.floor(Math.random()*playlist.length):(currentIndex+1)%playlist.length;
    if(isRandom&&playlist.length>1){while(nextIndex===currentIndex) nextIndex=Math.floor(Math.random()*playlist.length);}
    loadAndPlay(nextIndex);
  }

  if(toggleMusicBtn){
    toggleMusicBtn.addEventListener('click', ()=>{
      if(isPlaying){
        audio.pause(); if(playIcon&&pauseIcon){playIcon.style.display='block'; pauseIcon.style.display='none';}
        toggleBtn.style.animationPlayState='paused';
      }else{
        audio.play().catch(()=>{}); if(playIcon&&pauseIcon){playIcon.style.display='none'; pauseIcon.style.display='block';}
        toggleBtn.style.animationPlayState='running';
      }
      isPlaying=!isPlaying;
    });
  }

  if(prevBtn) prevBtn.addEventListener('click',()=>{ let p=currentIndex-1; if(p<0)p=playlist.length-1; loadAndPlay(p); });
  if(nextBtn) nextBtn.addEventListener('click',playNext);
  if(modeBtn){
    modeBtn.addEventListener('click', ()=>{
      isRandom=!isRandom;
      localStorage.setItem('musicRandom',isRandom);
      if(randomIcon&&loopIcon){ randomIcon.style.display=isRandom?'block':'none'; loopIcon.style.display=isRandom?'none':'block'; }
    });
  }
  audio.onended=playNext;
  const savedIndex=parseInt(localStorage.getItem('lastMusicIndex'));
  if(!isNaN(savedIndex)&&savedIndex>=0&&savedIndex<playlist.length){ currentIndex=savedIndex; loadAndPlay(currentIndex); }

  audio.onplay=()=>{ toggleBtn.style.animationPlayState='running'; haloAnimating=true; }
  audio.onpause=()=>{ toggleBtn.style.animationPlayState='paused'; haloAnimating=true; }

  // ==================== 旋转动画 ====================
  const style=document.createElement('style');
  style.textContent=`
    #music-toggle-btn{animation:rotate 20s linear infinite; animation-play-state:paused;}
    @keyframes rotate{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  `;
  document.head.appendChild(style);

  if(isPlaying) toggleBtn.style.animationPlayState='running';

  // ==================== 磁吸 + 光环跳动 + 牵引线 ====================
  const navBall=document.getElementById('sidebar-toggle-btn');
  const musicBall=document.getElementById('music-toggle-btn');
  const connectionSVG=document.getElementById('magnet-connection');
  const TRIGGER_DISTANCE=220, MAX_GLOW_DISTANCE=140, MERGE_DISTANCE=40;
  let haloAnimating=false, audioCtx, analyser, dataArray;

  function getCenter(e){const r=e.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2};}

  function animateHalo(){
    if(!connectionSVG) return;
    const c1=getCenter(navBall), c2=getCenter(musicBall);
    const dx=c2.x-c1.x, dy=c2.y-c1.y;
    const distance=Math.hypot(dx,dy);
    const isMerged=distance<=MERGE_DISTANCE;
    let outerR, innerR;
    if(!isPlaying && isMerged){ outerR=50; innerR=25; } // 吸附未播放最大光圈
    else{
      if(!audioCtx && isPlaying){
        audioCtx=new (window.AudioContext||window.webkitAudioContext)();
        const src=audioCtx.createMediaElementSource(audio);
        analyser=audioCtx.createAnalyser();
        src.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize=64;
        dataArray=new Uint8Array(analyser.frequencyBinCount);
      }
      if(isPlaying && analyser){ analyser.getByteFrequencyData(dataArray); const avg=dataArray.reduce((a,b)=>a+b,0)/dataArray.length; outerR=15+avg*0.5; innerR=7+avg*0.3; }
      else{ outerR=25; innerR=12; }
    }

    // 绘制光圈+牵引线
    if(distance<TRIGGER_DISTANCE){
      let normalized=1-Math.min(distance/TRIGGER_DISTANCE,1);
      if(isMerged) normalized=1;
      const hue=250+normalized*20;
      const baseGlow=20+normalized*80;
      const glowColor=`hsla(${hue},80%,70%,${0.35+normalized*0.55})`;
      const intenseColor=`hsla(${hue},90%,65%,${0.7+normalized*0.3})`;
      const boxShadow=`0 0 ${baseGlow}px ${glowColor},0 0 ${baseGlow+40}px ${intenseColor},0 0 ${baseGlow+80}px rgba(167,139,250,${0.25+normalized*0.35}),0 12px 30px rgba(0,0,0,0.55)`;
      navBall.style.boxShadow=boxShadow; musicBall.style.boxShadow=boxShadow;
      const scale=1+normalized*0.18; navBall.style.transform=`scale(${scale}) translateY(-50%)`; musicBall.style.transform=`scale(${scale})`;

      if(isMerged){
        connectionSVG.innerHTML=`
          <defs><filter id="mergeGlow"><feGaussianBlur stdDeviation="8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <circle cx="${c2.x}" cy="${c2.y}" r="${outerR}" fill="rgba(167,139,250,0.5)" filter="url(#mergeGlow)"/>
          <circle cx="${c2.x}" cy="${c2.y}" r="${innerR}" fill="rgba(255,220,255,0.6)" filter="url(#mergeGlow)"/>
        `;
      } else{
        const lineOpacity=normalized*0.9;
        const lineWidth=2+normalized*8;
        connectionSVG.innerHTML=`
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(167,139,250,${lineOpacity})" />
              <stop offset="50%" stop-color="rgba(220,180,255,${lineOpacity})" />
              <stop offset="100%" stop-color="rgba(167,139,250,${lineOpacity})" />
            </linearGradient>
            <filter id="glowLine"><feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></feMerge>
            </filter>
          </defs>
          <line x1="${c1.x}" y1="${c1.y}" x2="${c2.x}" y2="${c2.y}" stroke="url(#lineGrad)" stroke-width="${lineWidth}" stroke-linecap="round" filter="url(#glowLine)" />
          <circle cx="${c1.x}" cy="${c1.y}" r="${3+normalized*6}" fill="rgba(255,200,255,0.9)" filter="url(#glowLine)" />
          <circle cx="${c2.x}" cy="${c2.y}" r="${3+normalized*6}" fill="rgba(255,200,255,0.9)" filter="url(#glowLine)" />
        `;
      }
    } else { connectionSVG.innerHTML=''; navBall.style.boxShadow=''; musicBall.style.boxShadow=''; navBall.style.transform='translateY(-50%)'; musicBall.style.transform=''; }

    requestAnimationFrame(animateHalo);
  }
  animateHalo();
});