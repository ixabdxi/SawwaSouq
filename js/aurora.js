/* ============================================================
   SaWWA Souq — Aurora Background (Performance Optimized)
   ============================================================ */
(() => {
  const canvas = document.getElementById("aurora");
  if (!canvas) return;

  const isMobile = () =>
    window.matchMedia("(max-width: 900px)").matches ||
    window.matchMedia("(hover: none)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  const isReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (isMobile() || isReducedMotion()) {
    canvas.style.display = "none";
    canvas.width = 0;
    canvas.height = 0;
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 0, h = 0, dpr = 1;
  let t = 0;
  let rafId = null;
  let paused = false;
  let active = true;
  let lastFrame = 0;
  const FRAME_MS = 33; // 30fps

  const COLORS = [
    { r: 18, g: 168, b: 155 },
    { r: 95, g: 208, b: 197 },
    { r: 15, g: 92, b: 86 },
    { r: 232, g: 163, b: 61 },
    { r: 143, g: 169, b: 165 }
  ];

  let blobs = [];
  let particles = [];
  let PARTICLE_COUNT = 25;

  const applySettings = () => {
    const s = window.AURORA_SETTINGS || {};
    if (s.enabled === false) {
      canvas.style.display = "none";
      active = false;
      stopLoop();
      return;
    }
    active = true;
    canvas.style.display = "block";

    const blobsCount = typeof s.blobs === "number" ? s.blobs : 5;
    PARTICLE_COUNT = typeof s.particles === "number" ? Math.min(s.particles, 40) : 25;
    const speed = typeof s.speed === "number" ? s.speed / 100 : 1;

    blobs = [
      { x: 0.18, y: 0.28, r: 0.55, sp: 0.00035 * speed, ph: 0, c: 0, a: 0.55 },
      { x: 0.82, y: 0.22, r: 0.60, sp: 0.00045 * speed, ph: 1.5, c: 1, a: 0.50 },
      { x: 0.30, y: 0.82, r: 0.65, sp: 0.00030 * speed, ph: 3.0, c: 2, a: 0.60 },
      { x: 0.78, y: 0.72, r: 0.50, sp: 0.00055 * speed, ph: 4.5, c: 3, a: 0.30 },
      { x: 0.50, y: 0.50, r: 0.70, sp: 0.00025 * speed, ph: 6.0, c: 4, a: 0.35 }
    ].slice(0, blobsCount);

    initParticles();
    if (!rafId) startLoop();
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  };

  const initParticles = () => {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.5,
        o: Math.random() * 0.5 + 0.15
      });
    }
  };

  const isDark = () => document.documentElement.classList.contains("dark");

  const drawBlobs = () => {
    const dark = isDark();
    const baseAlpha = dark ? 0.65 : 0.40;
    ctx.globalCompositeOperation = "lighter";
    for (const b of blobs) {
      const cx = (b.x + Math.sin(t * b.sp + b.ph) * 0.14) * w;
      const cy = (b.y + Math.cos(t * b.sp * 1.4 + b.ph) * 0.14) * h;
      const radius = b.r * Math.min(w, h) * (1 + Math.sin(t * b.sp * 2 + b.ph) * 0.18);
      const c = COLORS[b.c];
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const alpha = baseAlpha * b.a;
      grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${alpha})`);
      grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},${alpha * 0.35})`);
      grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";
  };

  const drawWaves = () => {
    const dark = isDark();
    ctx.globalCompositeOperation = dark ? "screen" : "multiply";
    const baseAlpha = dark ? 0.10 : 0.045;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      const y0 = (0.35 + i * 0.25) * h;
      ctx.moveTo(0, y0);
      for (let x = 0; x <= w; x += 12) {
        const y = y0 + Math.sin((x * 0.0035) + t * 0.0013 + i * 1.3) * 55;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y0, 0, h);
      g.addColorStop(0, `rgba(95,208,197,${baseAlpha})`);
      g.addColorStop(1, "rgba(95,208,197,0)");
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  };

  const drawParticles = () => {
    const dark = isDark();
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dark
        ? `rgba(143, 209, 197, ${p.o * 0.9})`
        : `rgba(15, 92, 86, ${p.o * 0.6})`;
      ctx.fill();
    }
  };

  const loop = (now) => {
    if (!active || paused) {
      rafId = null;
      return;
    }
    if (now - lastFrame < FRAME_MS) {
      rafId = requestAnimationFrame(loop);
      return;
    }
    lastFrame = now;

    ctx.clearRect(0, 0, w, h);
    drawBlobs();
    drawWaves();
    drawParticles();
    t += 32;
    rafId = requestAnimationFrame(loop);
  };

  const startLoop = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(loop);
  };
  const stopLoop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused && active && !rafId) startLoop();
  });

  let settingsTimeout = null;
  const scheduleSettingsApply = () => {
    clearTimeout(settingsTimeout);
    settingsTimeout = setTimeout(() => { resize(); applySettings(); }, 150);
  };
  window.addEventListener("aurora-change", scheduleSettingsApply);
  window.addEventListener("design-applied", scheduleSettingsApply);

  resize();
  applySettings();
  startLoop();

  window.addEventListener("resize", () => {
    if (isMobile()) {
      canvas.style.display = "none";
      stopLoop();
      return;
    }
    resize();
    initParticles();
    if (!rafId) startLoop();
  });

  window.AURORA = { start: startLoop, stop: stopLoop, resize, applySettings };
})();
