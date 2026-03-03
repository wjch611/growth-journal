// assets/js/music.js - 优化版极简音乐播放

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('bgm');
  if (!audio) {
    console.error('未找到 <audio id="bgm"> 元素');
    return;
  }

  const toggleBtn = document.getElementById('toggle-music');
  const prevBtn = document.getElementById('prev-track');
  const nextBtn = document.getElementById('next-track');
  const modeBtn = document.getElementById('mode-toggle');

  if (!toggleBtn || !prevBtn || !nextBtn || !modeBtn) {
    console.warn('音乐控制器按钮未完全找到，请检查 HTML ID');
  }

  const playIcon = toggleBtn?.querySelector('.play');
  const pauseIcon = toggleBtn?.querySelector('.pause');
  const loopIcon = modeBtn?.querySelector('.icon-loop');
  const randomIcon = modeBtn?.querySelector('.icon-random');

  const playlist = [
    { file: "贝加尔湖畔.mp3" },
    // 继续添加你的音乐文件
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

  // 加载并播放
  function loadAndPlay(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[index];
    audio.src = `assets/music/${track.file}`;
    console.log(`加载音乐：${track.file}`);

    if (isPlaying) {
      audio.play().catch(e => {
        console.log("播放失败:", e);
        isPlaying = false;
        if (playIcon && pauseIcon) {
          playIcon.style.display = 'block';
          pauseIcon.style.display = 'none';
        }
      });
    }
  }

  // 下一首
  function playNext() {
    let nextIndex = isRandom
      ? Math.floor(Math.random() * playlist.length)
      : (currentIndex + 1) % playlist.length;

    if (isRandom && playlist.length > 1) {
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * playlist.length);
      }
    }
    loadAndPlay(nextIndex);
  }

  // 事件绑定
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
        if (playIcon && pauseIcon) {
          playIcon.style.display = 'block';
          pauseIcon.style.display = 'none';
        }
      } else {
        audio.play().catch(e => console.log("播放被阻止:", e));
        if (playIcon && pauseIcon) {
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'block';
        }
      }
      isPlaying = !isPlaying;
    });
  }

  if (nextBtn) nextBtn.addEventListener('click', playNext);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = playlist.length - 1;
      loadAndPlay(prevIndex);
    });
  }

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

  // 错误监听
  audio.onerror = (e) => {
    console.error('音频加载错误:', e);
    alert('无法加载音乐文件，请检查路径或文件是否存在');
  };

  // 恢复上次歌曲
  const savedIndex = parseInt(localStorage.getItem('lastMusicIndex'));
  if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < playlist.length) {
    currentIndex = savedIndex;
    loadAndPlay(currentIndex);
  }

  // 记录当前索引
  audio.onplay = () => {
    localStorage.setItem('lastMusicIndex', currentIndex);
  };

});

// 音乐控件展开/收起逻辑
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('music-toggle-btn');
  const panel = document.getElementById('music-panel');

  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.add('expanded');
      toggleBtn.classList.add('hidden');
    });

    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && !toggleBtn.contains(e.target)) {
        panel.classList.remove('expanded');
        toggleBtn.classList.remove('hidden');
      }
    });
  }
});