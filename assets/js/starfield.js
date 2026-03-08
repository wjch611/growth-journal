// starfield.js - 完整优化版：更真实梦幻星云 + 刷新按钮 + 星星动态频率跳动（每颗幅度不同） + 新增总星星数量调节 + 真实星星颜色分布（最新比例）
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];
let shootingStars = [];
let nebulae = [];

// ──────────────── 可调节参数 ────────────────
const CONFIG = {
  starDirection: 1,              // 星星移动方向（1 = 向前/靠近，-1 = 向后/远离）
  starSpeedAbs: 0.6,             // 星星基础移动速度（绝对值，越高越快）
  horizontalDrift: 0.0,          // 星星整体水平漂移（正数向右，负数向左）
  verticalDrift: 0.0,            // 星星整体垂直漂移（正数向下，负数向上）
  starCount: 2000,               // 总星星数量（影响密度，建议 800~2500）
  meteorFrequency: 0.008,        // 流星出现的概率（每帧概率，越高流星越频繁）
  meteorSpeedMin: 12,            // 流星最小速度（像素/帧）
  meteorSpeedMax: 22,            // 流星最大速度（像素/帧）
  meteorAngleMin: Math.PI / 4,   // 流星出现角度范围 - 最小值（弧度，45°）
  meteorAngleMax: Math.PI * 1.2, // 流星出现角度范围 - 最大值（弧度，约216°）
  maxZ: 2200,                    // 星星 Z 轴最大深度（影响远近感，越大远星越多）

  // 星云相关
  enableNebula: true,            // 是否启用星云效果（true=开启，false=关闭）——已改为默认开启
  nebulaCount: 8,                // 同时存在的星云数量（建议 3~10）
  nebulaSpeed: 0.08              // 星云整体漂移速度（越小越慢，越梦幻）
};

// 真实星星颜色分布（按你指定的最新比例）
const STAR_COLORS = [
  { color: [245, 245, 255],   weight: 0.55 },   // 白色 / 蓝白（最常见，略带冷调）
  { color: [255, 245, 220],   weight: 0.22 },   // 黄白
  { color: [255, 235, 180],   weight: 0.10 },   // 黄色
  { color: [255, 200, 120],   weight: 0.07 },   // 橙色
  { color: [255, 160,  90],   weight: 0.04 },   // 橙红
  { color: [220,  80,  60],   weight: 0.02 }    // 红色（少但醒目）
];

// 累积权重，用于随机选择颜色
const colorWeights = STAR_COLORS.reduce((acc, curr) => {
  acc.push((acc[acc.length - 1] || 0) + curr.weight);
  return acc;
}, []);

// ──────────────── 初始化画布 ────────────────
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// ──────────────── 创建星星 ────────────────
function createStars() {
  stars = [];
  for (let i = 0; i < CONFIG.starCount; i++) {
    const baseFreq = 0.2 + Math.random() * 3.8;

    // 根据权重随机选择星星颜色
    const rand = Math.random();
    let colorIndex = 0;
    for (let j = 0; j < colorWeights.length; j++) {
      if (rand <= colorWeights[j]) {
        colorIndex = j;
        break;
      }
    }
    const baseColor = STAR_COLORS[colorIndex].color;

    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 960 + 40,
      size: Math.random() * 1.4 + 0.35,
      brightness: Math.random() * 0.65 + 0.35,
      phase: Math.random() * Math.PI * 2,
      freq: baseFreq,
      baseFreq: baseFreq,
      freqAmplitude: 0.3 + Math.random() * 0.5,
      twinkle: Math.random() > 0.68,
      baseColor: baseColor  // 保存基础颜色 [r,g,b]
    });
  }
}
createStars();

// ──────────────── 创建星云 ────────────────
function createNebulae() {
  nebulae = [];
  for (let i = 0; i < CONFIG.nebulaCount; i++) {
    const hue = 190 + Math.random() * 110;
    const sat = 55 + Math.random() * 35;
    const light = 35 + Math.random() * 30;
    const alphaBase = 0.018 + Math.random() * 0.028;
    const radius = 320 + Math.random() * 580;
    const pulsePhase = Math.random() * Math.PI * 2;

    nebulae.push({
      x: Math.random() * width * 1.6 - width * 0.3,
      y: Math.random() * height * 1.6 - height * 0.3,
      radius,
      hue, sat, light, alphaBase,
      speedX: (Math.random() - 0.5) * CONFIG.nebulaSpeed,
      speedY: (Math.random() - 0.5) * CONFIG.nebulaSpeed,
      pulsePhase
    });
  }
}

// ──────────────── 流星生成 ────────────────
function createShootingStar() {
  if (Math.random() < CONFIG.meteorFrequency) {
    const angle = CONFIG.meteorAngleMin + Math.random() * (CONFIG.meteorAngleMax - CONFIG.meteorAngleMin);
    const speed = Math.random() * (CONFIG.meteorSpeedMax - CONFIG.meteorSpeedMin) + CONFIG.meteorSpeedMin;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    let startX = vx > 0 ? -150 : width + 150;
    let startY = vy > 0 ? -150 : height + 150;
    shootingStars.push({
      x: startX, y: startY, vx, vy,
      length: Math.random() * 130 + 70,
      opacity: 1,
      fadeSpeed: 0.009 + Math.random() * 0.007,
      shake: Math.random() * 0.9 + 0.3
    });
  }
}

// ──────────────── 绘制星云 ────────────────
function drawNebula(n) {
  const pulse = Math.sin(Date.now() / 12000 + n.pulsePhase) * 0.12 + 0.88;

  const g1 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 0.6);
  g1.addColorStop(0, `hsla(${n.hue}, ${n.sat}%, ${n.light + 10}%, ${n.alphaBase * 1.2 * pulse})`);
  g1.addColorStop(0.7, `hsla(${n.hue + 20}, ${n.sat - 15}%, ${n.light - 5}%, ${n.alphaBase * 0.7 * pulse})`);
  g1.addColorStop(1, `hsla(${n.hue + 40}, ${n.sat - 30}%, ${n.light - 20}%, 0)`);

  ctx.fillStyle = g1;
  ctx.beginPath();
  ctx.arc(n.x, n.y, n.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  const g2 = ctx.createRadialGradient(n.x, n.y, n.radius * 0.5, n.x, n.y, n.radius);
  g2.addColorStop(0, `hsla(${n.hue + 10}, ${n.sat - 10}%, ${n.light + 5}%, ${n.alphaBase * 0.8 * pulse})`);
  g2.addColorStop(0.5, `hsla(${n.hue + 30}, ${n.sat - 20}%, ${n.light - 5}%, ${n.alphaBase * 0.5 * pulse})`);
  g2.addColorStop(1, 'transparent');

  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
  ctx.fill();

  const g3 = ctx.createRadialGradient(n.x, n.y, n.radius * 0.8, n.x, n.y, n.radius * 1.5);
  g3.addColorStop(0, `hsla(${n.hue + 50}, 50%, 50%, ${n.alphaBase * 0.25 * pulse})`);
  g3.addColorStop(1, 'transparent');

  ctx.fillStyle = g3;
  ctx.beginPath();
  ctx.arc(n.x, n.y, n.radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = n.alphaBase * 0.15 * pulse;
  for (let i = 0; i < 15; i++) {
    const nx = n.x + (Math.random() - 0.5) * n.radius * 1.2;
    const ny = n.y + (Math.random() - 0.5) * n.radius * 1.2;
    ctx.fillStyle = `hsla(${n.hue + 30 + Math.random()*40}, 60%, 70%, 0.4)`;
    ctx.fillRect(nx, ny, 3 + Math.random() * 6, 3 + Math.random() * 6);
  }
  ctx.globalAlpha = 1;
}

// ──────────────── 绘制十字光晕（使用星星自身颜色） ────────────────
function drawCrossFlare(sx, sy, size, brightness, z, baseColor) {
  if (z < 650 || size > 0.9) return;

  const flareLength = size * (3.8 + Math.random() * 3.2);
  const flareOpacity = brightness * (0.32 + Math.random() * 0.38);
  const angleOffset = Math.random() * 0.4 - 0.2;

  ctx.save();
  ctx.globalAlpha = flareOpacity;
  ctx.translate(sx, sy);
  ctx.rotate(angleOffset);

  const [r, g, b] = baseColor;
  const flareColor = `rgba(${r}, ${g}, ${b}, ${flareOpacity * 0.9})`;

  ctx.beginPath();
  ctx.moveTo(-flareLength, 0);
  ctx.lineTo(flareLength, 0);
  ctx.lineWidth = size * 0.45 + Math.random() * 0.25;
  ctx.strokeStyle = flareColor;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -flareLength);
  ctx.lineTo(0, flareLength);
  ctx.lineWidth = size * 0.45 + Math.random() * 0.25;
  ctx.strokeStyle = flareColor;
  ctx.stroke();

  ctx.restore();
}

// ──────────────── 绘制星星（动态频率 + 真实颜色） ────────────────
function drawStar(sx, sy, size, brightness, twinkle, z, freq, phase, starObj) {
  const [r, g, b] = starObj.baseColor;

  ctx.beginPath();
  ctx.arc(sx, sy, size, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness})`;
  ctx.fill();

  drawCrossFlare(sx, sy, size, brightness, z, starObj.baseColor);

  if (twinkle) {
    const dynamicFreq = starObj.baseFreq * (1 + Math.sin(Date.now() * 0.05 + starObj.phase) * starObj.freqAmplitude);
    const pulse = Math.sin(Date.now() * 0.002 * dynamicFreq + phase) * 0.4 + 0.6;

    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(sx, sy, size * 1.35, 0, Math.PI * 2);
    // 光晕稍偏白，但保留主色调
    ctx.fillStyle = `rgba(${Math.min(255, r+50)}, ${Math.min(255, g+50)}, ${Math.min(255, b+50)}, ${brightness * 0.45})`;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ──────────────── 主循环 ────────────────
function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.085)';
  ctx.fillRect(0, 0, width, height);

  if (CONFIG.enableNebula) {
    nebulae.forEach(drawNebula);
  }

  const time = Date.now() / 190;

  stars.forEach(star => {
    const effectiveSpeed = CONFIG.starDirection * CONFIG.starSpeedAbs;
    star.z -= effectiveSpeed;
    star.x += CONFIG.horizontalDrift * 2;
    star.y += CONFIG.verticalDrift * 2;

    if (star.z <= 5 || star.z >= CONFIG.maxZ || star.x < -100 || star.x > width + 100 || star.y < -100 || star.y > height + 100) {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
      star.z = Math.random() * 960 + 40;
    }

    const sx = (star.x - width / 2) * (1000 / star.z) + width / 2;
    const sy = (star.y - height / 2) * (1000 / star.z) + height / 2;
    const size = star.size * (1000 / star.z);
    let opacity = star.brightness * (1000 / star.z);

    if (Math.abs(CONFIG.starSpeedAbs) < 0.01) {
      const breathing = (Math.sin(time * star.freq + star.phase) + 1) / 2;
      opacity *= (0.1 + 0.9 * breathing);
    }

    drawStar(sx, sy, size, opacity, star.twinkle, star.z, star.freq, star.phase, star);

    if (Math.random() < 0.002) star.brightness = Math.random() * 0.5 + 0.5;
  });

  shootingStars = shootingStars.filter(meteor => {
    meteor.x += meteor.vx;
    meteor.y += meteor.vy;
    meteor.opacity -= meteor.fadeSpeed;
    if (meteor.opacity <= 0) return false;

    const dist = Math.hypot(meteor.vx, meteor.vy);
    const tailX = meteor.x - meteor.vx * (meteor.length / dist);
    const tailY = meteor.y - meteor.vy * (meteor.length / dist);

    const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(255, 255, 240, ${meteor.opacity * 0.95})`);
    gradient.addColorStop(1, `rgba(255, 170, 80, ${meteor.opacity * 0.08})`);

    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3.5 + Math.random() * 1.2;
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = meteor.opacity * 0.45;
    ctx.beginPath();
    ctx.moveTo(meteor.x - 9, meteor.y);
    ctx.lineTo(meteor.x + 9, meteor.y);
    ctx.moveTo(meteor.x, meteor.y - 9);
    ctx.lineTo(meteor.x, meteor.y + 9);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(255, 230, 170, 0.7)';
    ctx.stroke();
    ctx.restore();

    return true;
  });

  createShootingStar();
  requestAnimationFrame(animate);
}

// ──────────────── 控制面板绑定 ────────────────
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

const s_nebula = document.getElementById('ctrl-nebula');
const v_nebula = document.getElementById('val-nebula');
const nebulaRefreshGroup = document.getElementById('nebula-refresh-group');
const btnRefreshNebula = document.getElementById('btn-refresh-nebula');

if (s_nebula) {
  s_nebula.onchange = () => {
    CONFIG.enableNebula = s_nebula.checked;
    if (v_nebula) v_nebula.textContent = CONFIG.enableNebula ? '已启用' : '已关闭';

    if (nebulaRefreshGroup) {
      nebulaRefreshGroup.style.display = CONFIG.enableNebula ? 'block' : 'none';
    }

    if (CONFIG.enableNebula) {
      createNebulae();
    } else {
      nebulae = [];
    }
  };

  // 页面加载时默认开启星云，并初始化
  s_nebula.checked = true;
  CONFIG.enableNebula = true;
  if (v_nebula) v_nebula.textContent = '已启用';
  if (nebulaRefreshGroup) nebulaRefreshGroup.style.display = 'block';
  createNebulae();
}

if (btnRefreshNebula) {
  btnRefreshNebula.onclick = () => {
    createNebulae();
  };
}

// ──────────────── 总星星数量调节 ────────────────
const s_starcount = document.getElementById('ctrl-starcount');
const v_starcount = document.getElementById('val-starcount');
if (s_starcount && v_starcount) {
  s_starcount.value = CONFIG.starCount;
  v_starcount.textContent = CONFIG.starCount;

  s_starcount.oninput = () => {
    CONFIG.starCount = parseInt(s_starcount.value, 10);
    v_starcount.textContent = CONFIG.starCount;
    createStars();  // 实时重新生成星星（颜色也会重新随机分配）
  };
}

// 控制面板开关逻辑
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

// 启动动画
requestAnimationFrame(animate);