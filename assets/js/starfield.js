// starfield.js - 优化版：任意方向速度下星星始终保持高密度与大小多样性
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];
let shootingStars = [];

// ──────────────── 可调节参数 ────────────────
const CONFIG = {
  starDirection: 1,             
  starSpeedAbs: 0.6,            
  horizontalDrift: 0.0,
  verticalDrift: 0.0,
  starCount: 800,
  meteorFrequency: 0.006,
  meteorSpeedMin: 10,
  meteorSpeedMax: 19,
  meteorAngleMin: Math.PI / 4,
  meteorAngleMax: Math.PI * 1.2,
  maxZ: 2200                    
};

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
      z: Math.random() * 960 + 40,
      size: Math.random() * 1.2 + 0.3,
      brightness: Math.random() * 0.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
      freq: 0.65 + Math.random() * 1.1
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
      x: startX, y: startY, vx, vy,
      length: Math.random() * 90 + 60,
      opacity: 1,
      fadeSpeed: 0.012 + Math.random() * 0.008
    });
  }
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
  ctx.fillRect(0, 0, width, height);

  const time = Date.now() / 190;

  stars.forEach(star => {
    // 移动逻辑
    const effectiveSpeed = CONFIG.starDirection * CONFIG.starSpeedAbs;
    star.z -= effectiveSpeed;
    star.x += CONFIG.horizontalDrift;
    star.y += CONFIG.verticalDrift;

    // 【核心优化】无论任何速度、任何方向（向前/向后/左右垂直漂移），只要飞出视野就完整重新随机生成
    // 这保证星星在整个深度空间始终均匀分布，屏幕密度和大小多样性长期保持初始化时的状态
    if (star.z <= 5 || star.z >= CONFIG.maxZ) {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
      star.z = Math.random() * 960 + 40;
    }

    // 屏幕投影坐标
    const sx = (star.x - width / 2) * (1000 / star.z) + width / 2;
    const sy = (star.y - height / 2) * (1000 / star.z) + height / 2;
    const size = star.size * (1000 / star.z);

    let opacity = star.brightness * (1000 / star.z);

    // 速度为0时的呼吸效果
    if (Math.abs(CONFIG.starSpeedAbs) < 0.01) {
      const breathing = (Math.sin(time * star.freq + star.phase) + 1) / 2; 
      opacity *= (0.05 + 0.95 * breathing); 
    }

    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(235, 245, 255, ${opacity})`;
    ctx.fill();

    if (Math.random() < 0.0015) {
      star.brightness = Math.random() * 0.4 + 0.6;
    }
  });

  // 流星逻辑
  shootingStars = shootingStars.filter(meteor => {
    meteor.x += meteor.vx; meteor.y += meteor.vy;
    meteor.opacity -= meteor.fadeSpeed;
    if (meteor.opacity <= 0) return false;
    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    const dist = Math.hypot(meteor.vx, meteor.vy);
    const tailX = meteor.x - meteor.vx * (meteor.length / dist);
    const tailY = meteor.y - meteor.vy * (meteor.length / dist);
    ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = `rgba(255, 245, 220, ${meteor.opacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    return true;
  });

  createShootingStar();
  requestAnimationFrame(animate);
}

// ──────────────── 滑块事件绑定（完全不变） ────────────────
const s_speed = document.getElementById('ctrl-starspeed-abs');
const v_speed = document.getElementById('val-starspeed-abs');
if(s_speed) {
  s_speed.oninput = () => {
    CONFIG.starSpeedAbs = parseFloat(s_speed.value);
    if(v_speed) v_speed.textContent = s_speed.value;
  };
}

const s_dir = document.getElementById('ctrl-stardir');
const v_dir = document.getElementById('val-stardir');
if(s_dir) {
  s_dir.onchange = () => {
    CONFIG.starDirection = parseInt(s_dir.value);
    if(v_dir) v_dir.textContent = CONFIG.starDirection === 1 ? '向前' : '向后';
  };
}

const s_hdrift = document.getElementById('ctrl-hdrift');
const v_hdrift = document.getElementById('val-hdrift');
if(s_hdrift) {
  s_hdrift.oninput = () => {
    CONFIG.horizontalDrift = parseFloat(s_hdrift.value);
    if(v_hdrift) v_hdrift.textContent = s_hdrift.value;
  };
}

const s_vdrift = document.getElementById('ctrl-vdrift');
const v_vdrift = document.getElementById('val-vdrift');
if(s_vdrift) {
  s_vdrift.oninput = () => {
    CONFIG.verticalDrift = parseFloat(s_vdrift.value);
    if(v_vdrift) v_vdrift.textContent = s_vdrift.value;
  };
}

const s_meteor = document.getElementById('ctrl-meteorfreq');
const v_meteor = document.getElementById('val-meteorfreq');
if(s_meteor) {
  s_meteor.oninput = () => {
    CONFIG.meteorFrequency = parseFloat(s_meteor.value);
    if(v_meteor) v_meteor.textContent = s_meteor.value;
  };
}

// 启动
requestAnimationFrame(animate);

// 控制面板开关逻辑（完全不变）
const toggleBtn = document.getElementById('starfield-toggle-btn');
const controls = document.getElementById('starfield-controls');
const closeBtn = document.getElementById('starfield-close-btn');

if (toggleBtn && controls) {
  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    const isHidden = controls.style.opacity === '0' || controls.style.opacity === '';
    controls.style.opacity = isHidden ? '1' : '0';
    controls.style.transform = isHidden ? 'translateY(0)' : 'translateY(-10px)';
    controls.style.pointerEvents = isHidden ? 'auto' : 'none';
  };
  if (closeBtn) closeBtn.onclick = () => {
    controls.style.opacity = '0';
    controls.style.pointerEvents = 'none';
  };
  document.addEventListener('click', e => {
    if (!controls.contains(e.target) && !toggleBtn.contains(e.target)) {
      controls.style.opacity = '0';
      controls.style.pointerEvents = 'none';
    }
  });
}