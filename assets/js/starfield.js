// starfield.js - Grok 风格动态星空（带实时滑块调节 + 远离重置）

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];
let shootingStars = [];

// ──────────────── 可调节参数 ────────────────
const CONFIG = {
  starDirection: 1,             // 1 = 向前（靠近），-1 = 向后（远离）
  starSpeedAbs: 0.6,            // 速度绝对值（与滑块联动）
  horizontalDrift: 0.0,
  verticalDrift: 0.0,
  starCount: 800,
  meteorFrequency: 0.006,
  meteorSpeedMin: 10,
  meteorSpeedMax: 19,
  meteorAngleMin: Math.PI / 4,
  meteorAngleMax: Math.PI * 1.2,
  maxZ: 2200                    // 远离时的重置上限（越大消失越慢）
};
// ──────────────────────────────────────────────

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function createStars() {
  stars = [];
  for (let i = 0; i < CONFIG.starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 1000 + 1,
      size: Math.random() * 1.2 + 0.3,
      brightness: Math.random() * 0.5 + 0.5
    });
  }
}

createStars();

function createShootingStar() {
  if (Math.random() < CONFIG.meteorFrequency) {
    const angle = CONFIG.meteorAngleMin + Math.random() * (CONFIG.meteorAngleMax - CONFIG.meteorAngleMin);
    const speed = Math.random() * (CONFIG.meteorSpeedMax - CONFIG.meteorSpeedMin) + CONFIG.meteorSpeedMin;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    let startX = vx > 0 ? -80 : width + 80;
    let startY = vy > 0 ? -80 : height + 80;

    shootingStars.push({
      x: startX,
      y: startY,
      vx, vy,
      length: Math.random() * 90 + 60,
      opacity: 1,
      fadeSpeed: 0.012 + Math.random() * 0.008
    });
  }
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
  ctx.fillRect(0, 0, width, height);

  // 绘制星星
  stars.forEach(star => {
    // 统一计算移动速度（方向 × 绝对速度）
    const effectiveSpeed = CONFIG.starDirection * CONFIG.starSpeedAbs;
    star.z -= effectiveSpeed;

    star.x += CONFIG.horizontalDrift;
    star.y += CONFIG.verticalDrift;

    // 向前时 z <= 0 重置（靠近消失）
    if (star.z <= 0) {
      star.z = 1000;
      star.x = Math.random() * width;
      star.y = Math.random() * height;
    }

    // 向后时 z > maxZ 重置（远离消失，从近处重新出现）
    if (star.z > CONFIG.maxZ) {
      star.z = Math.random() * 400 + 1;  // 从近处（大星星）重新生成
      star.x = Math.random() * width;
      star.y = Math.random() * height;
      star.brightness = Math.random() * 0.4 + 0.6; // 重新亮一点
    }

    const sx = (star.x - width / 2) * (1000 / star.z) + width / 2;
    const sy = (star.y - height / 2) * (1000 / star.z) + height / 2;

    const size = star.size * (1000 / star.z);
    const opacity = star.brightness * (1000 / star.z);

    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(235, 245, 255, ${opacity})`;
    ctx.fill();

    if (Math.random() < 0.0015) {
      star.brightness = Math.random() * 0.4 + 0.6;
    }
  });

  // 流星部分
  shootingStars = shootingStars.filter(meteor => {
    meteor.x += meteor.vx;
    meteor.y += meteor.vy;
    meteor.opacity -= meteor.fadeSpeed;

    if (meteor.opacity <= 0 ||
        meteor.x < -150 || meteor.x > width + 150 ||
        meteor.y < -150 || meteor.y > height + 150) {
      return false;
    }

    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    const tailX = meteor.x - meteor.vx * (meteor.length / Math.hypot(meteor.vx, meteor.vy));
    const tailY = meteor.y - meteor.vy * (meteor.length / Math.hypot(meteor.vx, meteor.vy));
    ctx.lineTo(tailX, tailY);

    const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(255, 245, 220, ${meteor.opacity * 0.95})`);
    gradient.addColorStop(1, `rgba(180, 210, 255, 0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.2 + Math.random() * 1.2;
    ctx.lineCap = 'round';
    ctx.stroke();

    return true;
  });

  createShootingStar();

  requestAnimationFrame(animate);
}

// ─── 滑块控制逻辑 ───
const ctrlStarSpeedAbs = document.getElementById('ctrl-starspeed-abs');
const ctrlStarDir     = document.getElementById('ctrl-stardir');
const ctrlHorizontal  = document.getElementById('ctrl-hdrift');
const ctrlVertical    = document.getElementById('ctrl-vdrift');
const ctrlMeteorFreq  = document.getElementById('ctrl-meteorfreq');

const valStarSpeedAbs = document.getElementById('val-starspeed-abs');
const valStarDir      = document.getElementById('val-stardir');
const valHorizontal   = document.getElementById('val-hdrift');
const valVertical     = document.getElementById('val-vdrift');
const valMeteorFreq   = document.getElementById('val-meteorfreq');

if (ctrlStarSpeedAbs && ctrlStarDir && ctrlHorizontal && ctrlVertical && ctrlMeteorFreq) {
  // 初始同步
  valStarSpeedAbs.textContent = ctrlStarSpeedAbs.value;
  valStarDir.textContent      = ctrlStarDir.value === '1' ? '向前' : '向后';
  valHorizontal.textContent   = ctrlHorizontal.value;
  valVertical.textContent     = ctrlVertical.value;
  valMeteorFreq.textContent   = ctrlMeteorFreq.value;

  // 实时更新
  ctrlStarSpeedAbs.oninput = () => {
    CONFIG.starSpeedAbs = parseFloat(ctrlStarSpeedAbs.value);
    valStarSpeedAbs.textContent = ctrlStarSpeedAbs.value;
  };

  ctrlStarDir.onchange = () => {
    CONFIG.starDirection = parseInt(ctrlStarDir.value);
    valStarDir.textContent = CONFIG.starDirection === 1 ? '向前' : '向后';
  };

  ctrlHorizontal.oninput = () => {
    CONFIG.horizontalDrift = parseFloat(ctrlHorizontal.value);
    valHorizontal.textContent = ctrlHorizontal.value;
  };

  ctrlVertical.oninput = () => {
    CONFIG.verticalDrift = parseFloat(ctrlVertical.value);
    valVertical.textContent = ctrlVertical.value;
  };

  ctrlMeteorFreq.oninput = () => {
    CONFIG.meteorFrequency = parseFloat(ctrlMeteorFreq.value);
    valMeteorFreq.textContent = ctrlMeteorFreq.value;
  };
}

// 启动动画
animate();

// 鼠标视差（可选）
let mouseX = width / 2;
let mouseY = height / 2;

window.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// ─── 展开/收起星空控制面板 ───
const toggleBtn = document.getElementById('starfield-toggle-btn');
const controls = document.getElementById('starfield-controls');
const closeBtn = document.getElementById('starfield-close-btn');

if (toggleBtn && controls) {
  toggleBtn.onclick = () => {
    const isHidden = controls.style.opacity === '0' || controls.style.opacity === '';
    controls.style.opacity = isHidden ? '1' : '0';
    controls.style.transform = isHidden ? 'translateY(0)' : 'translateY(-10px)';
    controls.style.pointerEvents = isHidden ? 'auto' : 'none';
  };

  // 点击关闭按钮收起
  if (closeBtn) {
    closeBtn.onclick = () => {
      controls.style.opacity = '0';
      controls.style.transform = 'translateY(-10px)';
      controls.style.pointerEvents = 'none';
    };
  }

  // 可选：点击页面其他地方收起（防止误触）
  document.addEventListener('click', e => {
    if (!controls.contains(e.target) && !toggleBtn.contains(e.target)) {
      controls.style.opacity = '0';
      controls.style.transform = 'translateY(-10px)';
      controls.style.pointerEvents = 'none';
    }
  });
}