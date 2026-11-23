// The Clairvoyance spell: a glowing core with swirling gas, light streaks and drifting sparks.
// Level 0 is the calm logo; levels 1-4 charge up through the stages; burst() is the final explosion.
// The animation stops by itself once its canvas is removed from the page.

export type NovaLevel = 0 | 1 | 2 | 3 | 4;

type Settings = {
  count: number;
  swirl: number;
  spread: number;
  glow: number;
  reach: number;
  swell: number;
  glints: number;
  pulse: number;
  speed: number;
};

const LEVELS: Record<NovaLevel, Settings> = {
  0: { count: 35, swirl: 0.4, spread: 0.15, glow: 0.5, reach: 0.34, swell: 14.0, glints: 1, pulse: 0.08, speed: 0.45 },
  1: { count: 60, swirl: 0.6, spread: 0.18, glow: 0.65, reach: 0.42, swell: 5.0, glints: 2, pulse: 1, speed: 1 },
  2: { count: 110, swirl: 0.9, spread: 0.22, glow: 0.85, reach: 0.56, swell: 4.0, glints: 3, pulse: 1, speed: 1 },
  3: { count: 170, swirl: 1.3, spread: 0.26, glow: 1.05, reach: 0.72, swell: 3.0, glints: 5, pulse: 1, speed: 1 },
  4: { count: 240, swirl: 1.8, spread: 0.3, glow: 1.3, reach: 0.9, swell: 2.0, glints: 7, pulse: 1, speed: 1 },
};

const PALETTE = [
  [224, 242, 254],
  [186, 230, 253],
  [125, 211, 252],
  [167, 139, 250],
  [94, 234, 212],
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export const createNova = (canvas: HTMLCanvasElement, startLevel: NovaLevel) => {
  const ctx = canvas.getContext("2d");
  const controls = {
    setLevel: (_level: NovaLevel) => {},
    burst: () => {},
  };
  if (!ctx) return controls;

  let size = 0;
  let cx = 0;
  let cy = 0;
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    size = canvas.clientWidth;
    canvas.width = canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = cy = size / 2;
  };
  resize();
  window.addEventListener("resize", resize);

  let target: Settings = LEVELS[startLevel];
  const cur: Settings = { ...LEVELS[startLevel] };
  let bursting = 0;
  let clock = 0;
  let lastNow: number | null = null;
  let swellStart = -10;

  const makeParticle = () => ({
    angle: rand(0, Math.PI * 2),
    radius: rand(0.02, 0.12),
    speed: rand(0.4, 1.4) * (Math.random() < 0.5 ? 1 : 0.6),
    drift: rand(0.004, 0.02),
    wobble: rand(0, Math.PI * 2),
    size: rand(0.6, 2.2),
    life: rand(0.4, 1),
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  });
  const particles = Array.from({ length: 320 }, makeParticle);

  // Light streaks: thin rays, each with its own length, brightness and flicker
  const streaks = Array.from({ length: 48 }, () => ({
    angle: rand(0, Math.PI * 2),
    len: rand(0.35, 1),
    width: rand(0.6, 2.4),
    phase: rand(0, 20),
    rate: rand(0.4, 1.6),
    alpha: rand(0.25, 0.8),
  }));

  // Sparks that drift outward from the core along gently curving paths
  const makeSpark = (born: number) => ({
    angle: rand(0, Math.PI * 2),
    dist: rand(0.05, 0.12),
    born,
    life: rand(1.6, 3),
    size: rand(1.2, 2.6),
    curve: rand(-0.6, 0.6),
    reach: rand(0.35, 0.6) * cur.reach,
  });
  const sparks = Array.from({ length: 21 }, () => makeSpark(rand(-3, 0)));

  const frame = (now: number) => {
    // Stop once this canvas has left the page (the screen changed)
    if (!canvas.isConnected) {
      window.removeEventListener("resize", resize);
      return;
    }

    clock += ((now - (lastNow ?? now)) / 1000) * cur.speed;
    lastNow = now;
    const t = clock;
    const sp = cur.speed;
    for (const key of Object.keys(cur) as (keyof Settings)[]) {
      cur[key] += (target[key] - cur[key]) * 0.03;
    }
    const R = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.globalCompositeOperation = "lighter";

    // Breathing halo
    const breathe = 1 + (0.06 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 3.7)) * cur.pulse;
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9 * breathe);
    halo.addColorStop(0, `rgba(186, 230, 253, ${0.32 * cur.glow})`);
    halo.addColorStop(0.4, `rgba(99, 102, 241, ${0.12 * cur.glow})`);
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, size, size);

    // A swell of power every few seconds: everything brightens and stretches, then relaxes
    if (t - swellStart > cur.swell) swellStart = t;
    const sk = (t - swellStart) / 1.6;
    const swell = sk < 1 ? Math.sin(sk * Math.PI) : 0;
    const pulse = cur.pulse;
    const power = 1 + swell * 0.35 * pulse + bursting * 2.5;

    // Radiant light streaks
    for (const st of streaks) {
      const flick = 0.65 + 0.25 * Math.sin(t * st.rate + st.phase) + 0.1 * Math.sin(t * st.rate * 3.3 + st.phase * 2);
      const len = R * cur.reach * st.len * flick * power;
      const a = st.angle + t * 0.04;
      const ex = cx + Math.cos(a) * len;
      const ey = cy + Math.sin(a) * len;
      const g = ctx.createLinearGradient(cx, cy, ex, ey);
      g.addColorStop(0, `rgba(255, 255, 255, ${st.alpha * cur.glow * 0.9})`);
      g.addColorStop(0.35, `rgba(186, 230, 253, ${st.alpha * cur.glow * 0.45})`);
      g.addColorStop(1, "rgba(125, 211, 252, 0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = st.width * (0.7 + swell * 0.5 * pulse);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    // Swirling gas: each particle orbits unevenly and drifts outward, then is reborn near the core
    const active = Math.round(cur.count);
    for (let i = 0; i < active; i++) {
      const p = particles[i];
      p.angle += (p.speed * cur.swirl * 0.012 * sp) / (0.3 + p.radius * 3);
      p.radius += p.drift * (0.4 + cur.swirl * 0.3) * 0.08 * sp + bursting * 0.03;
      p.wobble += 0.03 * sp;
      const maxR = cur.spread + bursting * 0.8;
      if (p.radius > maxR || p.radius > 0.98) Object.assign(p, makeParticle());
      const fade = Math.max(0, 1 - p.radius / maxR);
      const r = R * p.radius * (1 + 0.08 * Math.sin(p.wobble));
      const x = cx + Math.cos(p.angle) * r;
      const y = cy + Math.sin(p.angle) * r * 0.92;
      const alpha = p.life * fade * Math.min(1, cur.glow);
      ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * (0.7 + cur.glow * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    // Drifting sparks
    const shown = Math.round(cur.glints * 3);
    for (let i = 0; i < shown; i++) {
      const s = sparks[i];
      const k = (t - s.born) / s.life;
      if (k > 1) {
        Object.assign(s, makeSpark(t + rand(0, 0.8)));
        continue;
      }
      if (k < 0) continue;
      const ease = 1 - Math.pow(1 - k, 2);
      const dist = s.dist + s.reach * ease;
      const ang = s.angle + s.curve * ease;
      const sx = cx + Math.cos(ang) * R * dist;
      const sy = cy + Math.sin(ang) * R * dist;
      const alpha = Math.sin(Math.min(1, k * 1.4) * Math.PI) * 0.95;
      ctx.fillStyle = `rgba(240, 249, 255, ${Math.max(0, alpha)})`;
      ctx.shadowColor = "rgba(186, 230, 253, 1)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Flickering white-hot core
    const flick = (1 + (0.08 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 13.1)) * pulse) * (1 + swell * 0.25 * pulse) + bursting * 2;
    const coreR = R * 0.1 * flick * (0.85 + cur.glow * 0.25);
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.6);
    core.addColorStop(0, "rgba(255, 255, 255, 1)");
    core.addColorStop(0.35, `rgba(240, 249, 255, ${0.9 * Math.min(1, cur.glow)})`);
    core.addColorStop(0.7, `rgba(125, 211, 252, ${0.35 * cur.glow})`);
    core.addColorStop(1, "rgba(125, 211, 252, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    if (bursting) bursting = Math.min(1, bursting + 0.02);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  controls.setLevel = (level: NovaLevel) => {
    target = LEVELS[level];
    bursting = 0;
    canvas.style.opacity = "1";
  };
  controls.burst = () => {
    bursting = 0.01;
    window.setTimeout(() => {
      canvas.style.opacity = "0";
    }, 700);
  };
  return controls;
};
