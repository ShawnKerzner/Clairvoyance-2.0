// The Review celebration: a flash and sparks where the spell bursts,
// a great constellation under the card, and a few shooting stars.
// Two temporary canvases are added to the page and removed when it's over.

type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; r: number };
type Shooter = { x: number; y: number; vx: number; vy: number; life: number };
type Point = { x: number; y: number };

const makeCanvas = (className: string) => {
  const canvas = document.createElement("canvas");
  canvas.className = className;
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx };
};

// One node per lane, left to right, spread across the whole screen
const constellationPoints = (): Point[] => {
  const lanes = 9;
  const points: Point[] = [];
  for (let i = 0; i < lanes; i++) {
    const laneWidth = innerWidth / lanes;
    points.push({
      x: laneWidth * i + laneWidth * (0.2 + Math.random() * 0.6),
      y: innerHeight * (0.12 + Math.random() * 0.76),
    });
  }
  return points;
};

export const celebrate = (burstX: number, burstY: number) => {
  const top = makeCanvas("fx");
  const under = makeCanvas("fx under");
  const fx = top.ctx;
  const uc = under.ctx;

  const flashStart = performance.now();
  let flashing = true;
  const sparks: Spark[] = [];
  for (let i = 0; i < 260; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 10;
    sparks.push({
      x: burstX, y: burstY,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5,
      life: 1, decay: 0.006 + Math.random() * 0.01, r: 0.8 + Math.random() * 1.8,
    });
  }

  const shooters: Shooter[] = [];
  const shootingStar = () => {
    const fromLeft = Math.random() < 0.5;
    shooters.push({
      x: fromLeft ? Math.random() * innerWidth * 0.4 : innerWidth * (0.6 + Math.random() * 0.4),
      y: Math.random() * innerHeight * 0.35,
      vx: (fromLeft ? 1 : -1) * (14 + Math.random() * 6),
      vy: 5 + Math.random() * 3,
      life: 1,
    });
  };
  [1300, 1900, 2700].forEach((ms) => window.setTimeout(shootingStar, ms));

  let finale: { points: Point[]; start: number } | null = null;
  window.setTimeout(() => {
    finale = { points: constellationPoints(), start: performance.now() };
  }, 500);
  let finaleDone = false;

  const frame = (now: number) => {
    fx.clearRect(0, 0, innerWidth, innerHeight);
    uc.clearRect(0, 0, innerWidth, innerHeight);

    // A wave of light from the spell
    if (flashing) {
      const t = (now - flashStart) / 900;
      if (t >= 1) flashing = false;
      else {
        const r = 40 + t * Math.max(innerWidth, innerHeight) * 0.6;
        const g = fx.createRadialGradient(burstX, burstY, 0, burstX, burstY, r);
        g.addColorStop(0, `rgba(255, 255, 255, ${0.55 * (1 - t)})`);
        g.addColorStop(0.35, `rgba(186, 230, 253, ${0.35 * (1 - t)})`);
        g.addColorStop(1, "rgba(125, 211, 252, 0)");
        fx.fillStyle = g;
        fx.fillRect(0, 0, innerWidth, innerHeight);
      }
    }

    // Sparks
    fx.shadowColor = "rgba(125, 211, 252, 0.9)";
    fx.shadowBlur = 8;
    for (const p of sparks) {
      p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.05; p.life -= p.decay;
      if (p.life <= 0) continue;
      fx.fillStyle = `rgba(224, 242, 254, ${p.life})`;
      fx.beginPath(); fx.arc(p.x, p.y, p.r, 0, Math.PI * 2); fx.fill();
    }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
    fx.shadowBlur = 0;

    // The great constellation, drawn left to right under the card
    if (finale) {
      const t = now - finale.start, DRAW = 1400, HOLD = 1600, FADE = 1800;
      const fade = t < DRAW + HOLD ? 1 : Math.max(0, 1 - (t - DRAW - HOLD) / FADE);
      const pts = finale.points;
      const progress = Math.min(1, t / DRAW) * (pts.length - 1);
      uc.lineWidth = 1.6;
      uc.strokeStyle = `rgba(224, 242, 254, ${0.85 * fade})`;
      uc.shadowColor = "rgba(125, 211, 252, 1)";
      uc.shadowBlur = 14;
      uc.beginPath();
      uc.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        if (progress >= i) uc.lineTo(pts[i].x, pts[i].y);
        else if (progress > i - 1) {
          const k = progress - (i - 1);
          uc.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k);
          break;
        }
      }
      uc.stroke();
      pts.forEach((pt, i) => {
        if (progress < i) return;
        const flare = Math.max(0, 1 - (progress - i) * 0.6);
        uc.fillStyle = `rgba(255, 255, 255, ${fade})`;
        uc.shadowBlur = 16 + flare * 30;
        uc.beginPath(); uc.arc(pt.x, pt.y, 2.4 + flare * 3, 0, Math.PI * 2); uc.fill();
      });
      if (fade === 0) { finale = null; finaleDone = true; }
    }

    // Shooting stars
    for (const s of shooters) {
      s.x += s.vx; s.y += s.vy; s.life -= 0.018;
      if (s.life <= 0) continue;
      const grad = uc.createLinearGradient(s.x, s.y, s.x - s.vx * 8, s.y - s.vy * 8);
      grad.addColorStop(0, `rgba(255, 255, 255, ${s.life})`);
      grad.addColorStop(1, "rgba(125, 211, 252, 0)");
      uc.strokeStyle = grad; uc.lineWidth = 2; uc.shadowBlur = 10;
      uc.beginPath(); uc.moveTo(s.x, s.y); uc.lineTo(s.x - s.vx * 8, s.y - s.vy * 8); uc.stroke();
    }
    for (let i = shooters.length - 1; i >= 0; i--) if (shooters[i].life <= 0) shooters.splice(i, 1);
    uc.shadowBlur = 0;

    const elapsed = now - flashStart;
    if (elapsed < 3200 || sparks.length || finale || shooters.length || !finaleDone) {
      requestAnimationFrame(frame);
    } else {
      top.canvas.remove();
      under.canvas.remove();
    }
  };
  requestAnimationFrame(frame);
};
