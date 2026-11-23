// The night sky behind every screen: a soft aurora, drifting stars and constellation paths.
// It lives outside #app, so changing screens never clears it.

type Star = { x: number; y: number; r: number; a: number; depth: number; phase: number; speed: number };
type Path = { nodes: Star[]; start: number };
type SkyMode = "full" | "quiet";

const MODES: Record<SkyMode, { interval: number; maxPaths: number; perTick: number }> = {
  full: { interval: 5000, maxPaths: 2, perTick: 1 },
  quiet: { interval: 15000, maxPaths: 1, perTick: 1 },
};

let mode: SkyMode = "full";
let timer: number | undefined;
let schedulePaths: () => void = () => {};

export const setSkyMode = (next: SkyMode) => {
  if (next === mode) return;
  mode = next;
  schedulePaths();
};

export const startSky = () => {
  const aurora = document.createElement("div");
  aurora.className = "aurora";
  aurora.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  canvas.className = "sky";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(aurora, canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let paths: Path[] = [];
  let drift = 0;

  // Three depth layers: far stars are small and slow, near ones are brighter and drift faster
  const layers = [
    { count: 140, depth: 6, size: [0.4, 0.9], alpha: [0.25, 0.55] },
    { count: 70, depth: 14, size: [0.7, 1.3], alpha: [0.35, 0.75] },
    { count: 26, depth: 26, size: [1.1, 1.8], alpha: [0.5, 0.9] },
  ];
  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = [];
    paths = [];
    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: rand(layer.size[0], layer.size[1]),
          a: rand(layer.alpha[0], layer.alpha[1]),
          depth: layer.depth,
          phase: Math.random() * Math.PI * 2,
          speed: rand(0.4, 1.2),
        });
      }
    }
  };

  // Every star drifts slowly; nearer stars drift faster, then wrap around the edges
  const wrap = (value: number, size: number) => ((value % size) + size) % size;
  const position = (star: Star) => ({
    x: wrap(star.x + drift * star.depth, width),
    y: wrap(star.y - drift * star.depth * 0.15, height),
  });

  // A path: 4-6 stars, each a short hop forward from the last
  const newPath = () => {
    const candidates = stars.filter((s) => s.depth >= 14);
    if (candidates.length === 0) return;
    let current = candidates[Math.floor(Math.random() * candidates.length)];
    const nodes = [current];
    const direction = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < 5; i++) {
      const options = candidates
        .filter((s) => !nodes.includes(s))
        .map((s) => ({ s, dx: (s.x - current.x) * direction, d: Math.hypot(s.x - current.x, s.y - current.y) }))
        .filter((c) => c.dx > 30 && c.d > 70 && c.d < 230)
        .sort((p, q) => p.d - q.d);
      const next = options[Math.floor(Math.random() * Math.min(3, options.length))];
      if (!next) break;
      nodes.push(next.s);
      current = next.s;
    }
    if (nodes.length >= 4) paths.push({ nodes, start: performance.now() });
  };

  const DRAW = 3200;
  const HOLD = 1800;
  const FADE = 2200;

  // Draws one path; returns false once it has faded (or a star wrapped), so it can be removed
  const drawPath = (path: Path, now: number) => {
    const t = now - path.start;
    const fade = t < DRAW + HOLD ? 1 : Math.max(0, 1 - (t - DRAW - HOLD) / FADE);
    const progress = Math.min(1, t / DRAW) * (path.nodes.length - 1);
    const points = path.nodes.map(position);
    for (let i = 1; i < points.length; i++) {
      if (Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y) > 400) return false;
    }

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.55 * fade})`;
    ctx.shadowColor = "rgba(125, 211, 252, 0.9)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      if (progress >= i) {
        ctx.lineTo(points[i].x, points[i].y);
      } else if (progress > i - 1) {
        const part = progress - (i - 1);
        ctx.lineTo(
          points[i - 1].x + (points[i].x - points[i - 1].x) * part,
          points[i - 1].y + (points[i].y - points[i - 1].y) * part,
        );
        break;
      }
    }
    ctx.stroke();

    // Each star along the path lights up as the line reaches it
    points.forEach((p, i) => {
      if (progress < i) return;
      const glow = fade * Math.min(1, (progress - i) * 2 + 0.3);
      ctx.fillStyle = `rgba(240, 249, 255, ${glow})`;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    return fade > 0;
  };

  const frame = (now: number) => {
    drift = (now / 1000) * 0.15;
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const p = position(star);
      const twinkle = 0.75 + 0.25 * Math.sin((now / 1000) * star.speed + star.phase);
      ctx.fillStyle = `rgba(224, 242, 254, ${star.a * twinkle})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    paths = paths.filter((path) => drawPath(path, now));
    requestAnimationFrame(frame);
  };

  schedulePaths = () => {
    window.clearInterval(timer);
    const settings = MODES[mode];
    timer = window.setInterval(() => {
      for (let i = 0; i < settings.perTick; i++) {
        if (paths.length < settings.maxPaths) newPath();
      }
    }, settings.interval);
  };

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
  window.setTimeout(newPath, 1200);
  schedulePaths();
};
