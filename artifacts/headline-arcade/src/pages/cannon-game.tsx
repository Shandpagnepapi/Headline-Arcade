import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

const HS_KEY = "headlineArcade_bigCannons_highScore";
const NEON = "#00f7c0";

const GAME_OVER_LINES = [
  "HR has entered the chat.",
  "The boardroom could not contain the cannons.",
  "Compliance is asking questions.",
  "This meeting should have been an email.",
  "The cannons were not priced in.",
];

const BAD_LABELS = [
  "CANNONS",
  "VIRAL\nLAWSUIT",
  "HR\nMEETING",
  "TABLOID\nHEADLINE",
  "COMPLIANCE\nREVIEW",
];

const GOOD_LABELS = [
  "☕ Coffee",
  "⚖️ Lawyer Shield",
  "📋 HR Report",
  "☂️ NDA Umbrella",
  "🧾 Receipts?",
];

interface Cannon {
  x: number; y: number; vx: number; vy: number;
  r: number; wobble: number; wobbleV: number;
  label: string; hit: boolean; kind: "cannon";
}
interface BadPaper {
  x: number; y: number; vy: number; angle: number; spin: number;
  w: number; h: number; label: string; hit: boolean; kind: "bad";
}
interface GoodObj {
  x: number; y: number; vy: number; label: string;
  collected: boolean; kind: "good"; bob: number;
}
interface Paper {
  x: number; y: number; vx: number; vy: number;
  angle: number; spin: number; life: number; w: number; h: number;
}
interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; life: number; maxLife: number; color: string;
}
interface Pop {
  x: number; y: number; text: string; life: number; color: string;
}

/* ─── Draw a bouncing cartoon CANNON ─── */
function drawCannon(ctx: CanvasRenderingContext2D, c: Cannon, t: number) {
  ctx.save(); ctx.translate(c.x, c.y);
  const squish = 1 + Math.sin(c.wobble) * 0.12;
  ctx.scale(squish, 2 - squish);
  ctx.shadowColor = "#ff3a3a"; ctx.shadowBlur = 18;
  const grad = ctx.createRadialGradient(-c.r * 0.3, -c.r * 0.3, 0, 0, 0, c.r);
  grad.addColorStop(0, "#ff6666"); grad.addColorStop(0.6, "#cc1a00"); grad.addColorStop(1, "#7a0000");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ff8888"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath(); ctx.arc(-c.r * 0.28, -c.r * 0.28, c.r * 0.38, 0, Math.PI * 2); ctx.fill();
  const barrelAngle = Math.sin(t * 0.04 + c.wobble) * 0.3;
  ctx.save();
  ctx.rotate(barrelAngle);
  ctx.fillStyle = "#880000"; ctx.strokeStyle = "#cc4444"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-6, -c.r - 22, 12, 22, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#660000";
  ctx.beginPath(); ctx.roundRect(-8, -c.r - 26, 16, 8, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.floor(c.r * 0.42)}px 'Orbitron', monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("CANNON", 0, c.r * 0.25);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + t * 0.06; const br = c.r + 14;
    ctx.fillStyle = i % 2 === 0 ? "#ffcc00" : "#ff6600";
    ctx.beginPath(); ctx.arc(Math.cos(a) * br, Math.sin(a) * br, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ─── Draw a bad falling paper object ─── */
function drawBadPaper(ctx: CanvasRenderingContext2D, o: BadPaper) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.angle);
  ctx.fillStyle = "#cc1a00"; ctx.strokeStyle = "#ff5555"; ctx.lineWidth = 2;
  ctx.shadowColor = "#ff2200"; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.roundRect(-o.w / 2, -o.h / 2, o.w, o.h, 6); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff"; ctx.font = `bold 10px 'Orbitron', monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const lines = o.label.split("\n");
  lines.forEach((line, i) => ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * 13));
  ctx.restore();
}

/* ─── Draw a good collectible ─── */
function drawGoodObj(ctx: CanvasRenderingContext2D, o: GoodObj, t: number) {
  ctx.save(); ctx.translate(o.x, o.y + Math.sin(t * 0.08 + o.bob) * 5);
  ctx.shadowColor = "#44ff88"; ctx.shadowBlur = 16;
  ctx.fillStyle = "#0d4a22"; ctx.strokeStyle = "#44ff88"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-36, -16, 72, 32, 8); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#aaffcc"; ctx.font = `bold 10.5px 'Orbitron', monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(o.label, 0, 0);
  ctx.restore();
}

/* ─── Draw finance bro character ─── */
function drawFinanceBro(ctx: CanvasRenderingContext2D, x: number, y: number, state: "run" | "panic" | "facepalm", t: number, moveDir: number) {
  ctx.save(); ctx.translate(x, y);
  if (state === "facepalm") ctx.rotate(Math.sin(t * 0.2) * 0.12);

  /* shadow */
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 42, 18, 5, 0, 0, Math.PI * 2); ctx.fill();

  /* legs - running animation */
  const legSwing = state === "run" ? Math.sin(t * 0.22) * 18 : 0;
  ctx.fillStyle = "#1a2d5a";
  ctx.save();
  ctx.translate(-7, 24); ctx.rotate((legSwing * Math.PI) / 180);
  ctx.beginPath(); ctx.roundRect(-5, 0, 10, 22, 3); ctx.fill();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.roundRect(-6, 20, 13, 6, 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(7, 24); ctx.rotate((-legSwing * Math.PI) / 180);
  ctx.beginPath(); ctx.roundRect(-5, 0, 10, 22, 3); ctx.fill();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.roundRect(-6, 20, 13, 6, 2); ctx.fill();
  ctx.restore();

  /* body - suit */
  ctx.fillStyle = "#1e3a70";
  ctx.beginPath(); ctx.roundRect(-18, 0, 36, 28, 4); ctx.fill();
  /* shirt + tie */
  ctx.fillStyle = "#f0f0f0";
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, 12); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill();
  const tieWiggle = state === "run" ? Math.sin(t * 0.22 + 1) * 8 : (state === "panic" ? Math.sin(t * 0.3) * 12 : 0);
  ctx.fillStyle = "#cc0000";
  ctx.save(); ctx.translate(0, 8); ctx.rotate((tieWiggle * Math.PI) / 180);
  ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, 18); ctx.lineTo(3, 0); ctx.closePath(); ctx.fill();
  ctx.restore();

  /* coffee cup arm */
  if (state !== "facepalm") {
    const armSwing = state === "run" ? Math.sin(t * 0.22 + Math.PI) * 20 : 0;
    ctx.save();
    ctx.translate(20, 6); ctx.rotate((armSwing * Math.PI) / 180);
    ctx.fillStyle = "#1e3a70"; ctx.beginPath(); ctx.roundRect(0, 0, 9, 16, 3); ctx.fill();
    ctx.fillStyle = "#c0392b"; ctx.beginPath(); ctx.roundRect(8, 6, 16, 18, 4); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(8, 6, 16, 5, [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = "#6b2c00"; ctx.beginPath(); ctx.arc(16, 9, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1e3a70"; ctx.beginPath(); ctx.arc(20, 15, 5, 0.5, Math.PI - 0.5); ctx.stroke();
    ctx.restore();
  }

  /* head */
  ctx.fillStyle = "#f4c88a";
  ctx.beginPath(); ctx.arc(0, -18, 18, 0, Math.PI * 2); ctx.fill();

  /* hair - tousled */
  ctx.fillStyle = "#3a2010";
  ctx.beginPath(); ctx.ellipse(0, -32, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#4a2c14";
  ctx.beginPath(); ctx.ellipse(-10, -30, 9, 6, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -30, 9, 6, 0.4, 0, Math.PI * 2); ctx.fill();
  if (state === "panic" || state === "facepalm") {
    ctx.strokeStyle = "#4a2c14"; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t * 0.04;
      const r = 22;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.7, -18 + Math.sin(a) * r * 0.7); ctx.lineTo(Math.cos(a) * r, -18 + Math.sin(a) * r); ctx.stroke();
    }
  }

  /* big scared eyes */
  const eyeY = -20;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(-7, eyeY, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, eyeY, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#222";
  const pupilShift = state === "panic" ? 2 : 0;
  ctx.beginPath(); ctx.arc(-7 + pupilShift, eyeY + 1, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7 + pupilShift, eyeY + 1, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-5.5 + pupilShift, eyeY - 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8.5 + pupilShift, eyeY - 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
  if (state === "panic") {
    ctx.strokeStyle = "#555"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-13, eyeY - 8); ctx.lineTo(-1, eyeY - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(13, eyeY - 8); ctx.lineTo(1, eyeY - 4); ctx.stroke();
  }

  /* mouth */
  ctx.strokeStyle = "#8b5e3c"; ctx.lineWidth = 2;
  if (state === "facepalm") {
    ctx.beginPath(); ctx.arc(0, -12, 6, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = "#f4c88a";
    ctx.beginPath(); ctx.roundRect(-10, -28, 22, 14, 5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(12, -25, 7, 20, 3); ctx.fill();
  } else if (state === "panic") {
    ctx.beginPath(); ctx.arc(0, -12, 5, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = "#cc0000"; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-8 + i * 8, -26); ctx.lineTo(-6 + i * 8, -30); ctx.stroke();
    }
  } else {
    ctx.beginPath(); ctx.arc(0, -10, 4, 0.1, Math.PI - 0.1, true); ctx.stroke();
  }

  /* sweat drops when panicking */
  if (state === "panic" || state === "run") {
    ctx.fillStyle = "#aaddff"; ctx.globalAlpha = 0.8;
    const sd = Math.sin(t * 0.15);
    ctx.beginPath(); ctx.ellipse(20 + sd, -22 + Math.abs(sd) * 5, 3, 5, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* ─── Draw boardroom background ─── */
function drawBoardroom(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, shakeX: number, shakeY: number) {
  ctx.save(); ctx.translate(shakeX, shakeY);
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#060812"); bgGrad.addColorStop(0.5, "#0a0e1a"); bgGrad.addColorStop(1, "#060a0e");
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

  /* floor */
  ctx.fillStyle = "#0d1220"; ctx.fillRect(0, H - 60, W, 60);
  ctx.strokeStyle = "rgba(0,100,255,0.15)"; ctx.lineWidth = 1;
  for (let xi = 0; xi < W; xi += 50) {
    ctx.beginPath(); ctx.moveTo(xi, H - 60); ctx.lineTo(xi + 30, H); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,100,255,0.08)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H - 60); ctx.lineTo(W, H - 60); ctx.stroke();

  /* conference table */
  const tableW = W * 0.55, tableX = (W - tableW) / 2, tableY = H - 75;
  ctx.fillStyle = "#0a1830";
  ctx.beginPath(); ctx.roundRect(tableX, tableY, tableW, 18, 6); ctx.fill();
  ctx.strokeStyle = "rgba(0,247,192,0.35)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(tableX, tableY, tableW, 18, 6); ctx.stroke();
  ctx.fillStyle = "rgba(0,247,192,0.06)"; ctx.beginPath(); ctx.roundRect(tableX + 4, tableY + 3, tableW - 8, 6, 3); ctx.fill();

  /* stock chart on wall */
  const chartX = W * 0.62, chartY = H * 0.15, chartW = W * 0.28, chartH = H * 0.3;
  ctx.fillStyle = "rgba(0,20,40,0.85)"; ctx.strokeStyle = "rgba(0,247,192,0.4)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(chartX, chartY, chartW, chartH, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(0,247,192,0.5)"; ctx.font = "bold 9px 'Orbitron', monospace";
  ctx.textAlign = "center"; ctx.fillText("STOCKS: ???", chartX + chartW / 2, chartY + 14);
  ctx.strokeStyle = "#cc1a00"; ctx.lineWidth = 2; ctx.beginPath();
  const pts = [0, 0.6, 0.4, 0.9, 0.3, 1.0];
  pts.forEach((p, i) => {
    const px = chartX + 10 + (i / (pts.length - 1)) * (chartW - 20);
    const py = chartY + 24 + p * (chartH - 34);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }); ctx.stroke();
  ctx.fillStyle = "#cc1a00"; ctx.font = "bold 11px monospace";
  ctx.textAlign = "right"; ctx.fillText("📉 -∞%", chartX + chartW - 6, chartY + chartH - 10);

  /* HR WARNING sign */
  const signX = W * 0.08, signY = H * 0.15;
  ctx.fillStyle = "#1a0800"; ctx.strokeStyle = "#ff6600"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(signX, signY, 110, 55, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ff6600"; ctx.font = "bold 8px 'Orbitron', monospace"; ctx.textAlign = "center";
  ctx.fillText("⚠️ HR WARNING", signX + 55, signY + 16);
  ctx.fillStyle = "#ff9900"; ctx.font = "bold 7px monospace";
  ctx.fillText("CANNON ACTIVITY DETECTED", signX + 55, signY + 30);
  ctx.fillText("REPORT TO COMPLIANCE ASAP", signX + 55, signY + 43);

  /* compliance folder stack */
  const folderColors = ["#1a3a6e", "#1e3d20", "#4a1a00"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = folderColors[i]; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(tableX - 80 + i * 4, tableY - 12 - i * 3, 60, 14, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "5px monospace"; ctx.textAlign = "center";
    ctx.fillText(["NDA", "HR POLICY", "COMPLIANCE"][i], tableX - 80 + i * 4 + 30, tableY - 4 - i * 3);
  }

  /* wall neon strips */
  ctx.strokeStyle = `rgba(0,247,192,${0.06 + Math.sin(t * 0.04) * 0.02})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H - 65); ctx.lineTo(W, H - 65); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H * 0.55); ctx.lineTo(W * 0.12, H * 0.55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.88, H * 0.55); ctx.lineTo(W, H * 0.55); ctx.stroke();
  ctx.restore();
}

/* ─── Submit score ─── */
async function submitScore(playerName: string, score: number) {
  await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName: playerName.trim() || "Anonymous", game: "cannon", score }),
  });
}

export default function CannonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [hs, setHs] = useState(() => parseInt(localStorage.getItem(HS_KEY) || "0"));
  const [gameOverLine, setGameOverLine] = useState("");
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("arcade_name") || "");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const G = useRef({
    px: 200, py: 0, pw: 36, ph: 88,
    cannons: [] as Cannon[],
    badPapers: [] as BadPaper[],
    goodObjs: [] as GoodObj[],
    papers: [] as Paper[],
    particles: [] as Particle[],
    pops: [] as Pop[],
    score: 0, scoreTimer: 0,
    speed: 2.8, panicWaveT: 0,
    cannonSpawnT: 0, badSpawnT: 0, goodSpawnT: 0,
    moveL: false, moveR: false,
    playerState: "run" as "run" | "panic" | "facepalm",
    shakeX: 0, shakeY: 0, shakeMag: 0,
    t: 0, raf: 0, running: false, touchSX: 0,
  });

  const endGame = useCallback(() => {
    const g = G.current; g.running = false;
    const newHs = Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"));
    localStorage.setItem(HS_KEY, String(newHs));
    setHs(newHs); setScoreDisplay(g.score);
    setGameOverLine(GAME_OVER_LINES[Math.floor(Math.random() * GAME_OVER_LINES.length)]);
    setSubmitted(false);
    setTimeout(() => setPhase("over"), 1600);
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = G.current;
    g.px = canvas.clientWidth / 2;
    g.py = canvas.clientHeight - 90;
    g.cannons = []; g.badPapers = []; g.goodObjs = [];
    g.papers = []; g.particles = []; g.pops = [];
    g.score = 0; g.scoreTimer = 0; g.speed = 2.8;
    g.panicWaveT = 0; g.cannonSpawnT = 0; g.badSpawnT = 0; g.goodSpawnT = 0;
    g.moveL = false; g.moveR = false; g.playerState = "run";
    g.shakeX = 0; g.shakeY = 0; g.shakeMag = 0; g.t = 0; g.running = true;
    setScoreDisplay(0); setSubmitted(false); setPhase("playing");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    const name = playerName.trim() || "Anonymous";
    localStorage.setItem("arcade_name", name);
    await submitScore(name, scoreDisplay);
    setSubmitting(false); setSubmitted(true);
  }, [playerName, scoreDisplay, submitted, submitting]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      G.current.py = canvas.clientHeight - 90;
    };
    resize(); window.addEventListener("resize", resize);
    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") g.moveL = e.type === "keydown";
      if (e.code === "ArrowRight" || e.code === "KeyD") g.moveR = e.type === "keydown";
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    const onTouchStart = (e: TouchEvent) => { G.current.touchSX = e.touches[0].clientX; };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dx = e.touches[0].clientX - G.current.touchSX;
      G.current.px = Math.max(30, Math.min(canvas.clientWidth - 30, G.current.px + dx));
      G.current.touchSX = e.touches[0].clientX;
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });

    let lastTime = 0;
    const loop = (time: number) => {
      G.current.raf = requestAnimationFrame(loop);
      const g = G.current;
      const dt = Math.min((time - lastTime) / 16.67, 3); lastTime = time;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (!g.running) { draw(ctx, W, H, g); return; }
      g.t += dt; g.scoreTimer += dt;

      /* score tick every 60 frames */
      if (g.scoreTimer >= 60) { g.score++; g.scoreTimer = 0; }
      if (g.speed < 8) g.speed += 0.0025 * dt;

      /* player movement */
      const moveSpeed = 5;
      if (g.moveL) g.px = Math.max(30, g.px - moveSpeed * dt);
      if (g.moveR) g.px = Math.min(W - 30, g.px + moveSpeed * dt);
      if (g.playerState === "run") g.playerState = (g.moveL || g.moveR) ? "run" : "run";

      /* shake decay */
      if (g.shakeMag > 0) {
        g.shakeMag *= 0.85;
        g.shakeX = (Math.random() - 0.5) * g.shakeMag;
        g.shakeY = (Math.random() - 0.5) * g.shakeMag;
        if (g.shakeMag < 0.5) { g.shakeMag = 0; g.shakeX = 0; g.shakeY = 0; }
      }

      /* panic wave every 15 seconds */
      g.panicWaveT += dt;
      if (g.panicWaveT >= 900) {
        g.panicWaveT = 0;
        g.pops.push({ x: W / 2, y: H * 0.35, text: "⚠️ BOARDROOM PANIC WAVE!", life: 90, color: "#ff6600" });
        for (let i = 0; i < 5; i++) {
          const fromLeft = Math.random() < 0.5;
          const r = 28 + Math.random() * 12;
          const startX = fromLeft ? -r - 10 : W + r + 10;
          const startY = H * 0.15 + Math.random() * H * 0.45;
          const speed = 4 + Math.random() * 3;
          g.cannons.push({
            x: startX, y: startY, vx: fromLeft ? speed : -speed,
            vy: 1.5 + Math.random() * 2, r, wobble: 0, wobbleV: 0.08 + Math.random() * 0.06,
            label: "CANNONS", hit: false, kind: "cannon",
          });
        }
      }

      /* spawn regular cannons */
      g.cannonSpawnT += dt;
      if (g.cannonSpawnT >= Math.max(80, 160 - g.score * 0.5)) {
        g.cannonSpawnT = 0;
        const r = 24 + Math.random() * 14;
        g.cannons.push({
          x: r + Math.random() * (W - r * 2), y: -r - 30,
          vx: (Math.random() - 0.5) * 2.5, vy: g.speed * 0.75 + Math.random() * 1.5,
          r, wobble: 0, wobbleV: 0.06 + Math.random() * 0.06,
          label: "CANNONS", hit: false, kind: "cannon",
        });
      }

      /* spawn bad paper objects */
      g.badSpawnT += dt;
      if (g.badSpawnT >= 120) {
        g.badSpawnT = 0;
        const label = BAD_LABELS[1 + Math.floor(Math.random() * (BAD_LABELS.length - 1))];
        g.badPapers.push({
          x: 60 + Math.random() * (W - 120), y: -30,
          vy: g.speed * 0.6, angle: (Math.random() - 0.5) * 0.4,
          spin: (Math.random() - 0.5) * 0.04,
          w: 80, h: 44, label, hit: false, kind: "bad",
        });
      }

      /* spawn good objects */
      g.goodSpawnT += dt;
      if (g.goodSpawnT >= 150) {
        g.goodSpawnT = 0;
        g.goodObjs.push({
          x: 60 + Math.random() * (W - 120), y: -30,
          vy: g.speed * 0.45, bob: Math.random() * Math.PI * 2,
          label: GOOD_LABELS[Math.floor(Math.random() * GOOD_LABELS.length)],
          collected: false, kind: "good",
        });
      }

      /* update cannons - bounce off walls */
      for (const c of g.cannons) {
        c.x += c.vx * dt; c.y += c.vy * dt;
        c.wobble += c.wobbleV * dt;
        if (c.x - c.r < 0) { c.x = c.r; c.vx = Math.abs(c.vx); spawnBoing(g, c.x, c.y); }
        if (c.x + c.r > W) { c.x = W - c.r; c.vx = -Math.abs(c.vx); spawnBoing(g, c.x, c.y); }
      }
      for (const p of g.badPapers) { p.y += p.vy * dt; p.angle += p.spin * dt; }
      for (const o of g.goodObjs) { o.y += o.vy * dt; }

      /* check collisions */
      if (g.playerState !== "facepalm") {
        const plx = g.px, ply = g.py - 40;
        for (const c of g.cannons) {
          if (c.hit) continue;
          const dx = c.x - plx, dy = c.y - ply;
          if (Math.sqrt(dx * dx + dy * dy) < c.r + 22) {
            c.hit = true;
            triggerHit(g, W, H, endGame);
            return;
          }
        }
        for (const p of g.badPapers) {
          if (p.hit) continue;
          if (Math.abs(p.x - plx) < p.w / 2 + 18 && Math.abs(p.y - ply) < p.h / 2 + 24) {
            p.hit = true;
            triggerHit(g, W, H, endGame);
            return;
          }
        }
        for (const o of g.goodObjs) {
          if (o.collected) continue;
          if (Math.abs(o.x - plx) < 42 && Math.abs(o.y - ply) < 28) {
            o.collected = true; g.score += 8;
            g.pops.push({ x: o.x, y: o.y, text: "+8", life: 55, color: "#44ff88" });
            for (let i = 0; i < 6; i++) {
              const a = Math.random() * Math.PI * 2;
              g.particles.push({ x: o.x, y: o.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, r: 4, life: 30, maxLife: 30, color: "#44ff88" });
            }
          }
        }
      }

      /* papers physics */
      for (const p of g.papers) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.25;
        p.vx *= 0.98; p.angle += p.spin; p.life--;
      }
      for (const p of g.particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
      }
      g.pops.forEach(p => p.life--);

      /* cleanup */
      g.cannons = g.cannons.filter(c => !c.hit && c.y < H + 80);
      g.badPapers = g.badPapers.filter(p => !p.hit && p.y < H + 60);
      g.goodObjs = g.goodObjs.filter(o => !o.collected && o.y < H + 60);
      g.papers = g.papers.filter(p => p.life > 0);
      g.particles = g.particles.filter(p => p.life > 0);
      g.pops = g.pops.filter(p => p.life > 0);
      draw(ctx, W, H, g);
    };

    const spawnBoing = (g: typeof G.current, x: number, y: number) => {
      g.pops.push({ x, y, text: "BOING!", life: 30, color: "#ffcc00" });
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        g.particles.push({ x, y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4 - 2, r: 5, life: 25, maxLife: 25, color: "#ffaa00" });
      }
    };

    const triggerHit = (g: typeof G.current, W: number, H: number, endGame: () => void) => {
      g.playerState = "facepalm";
      g.shakeMag = 28;
      g.pops.push({ x: W / 2, y: H * 0.32, text: "CANNON INCIDENT ESCALATED!", life: 100, color: "#ff3a3a" });
      /* spawn flying papers */
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 3 + Math.random() * 6;
        g.papers.push({
          x: g.px, y: g.py - 40,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 4,
          angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.18,
          life: 90, w: 22 + Math.random() * 20, h: 14 + Math.random() * 10,
        });
      }
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2; const spd = 2 + Math.random() * 5;
        g.particles.push({ x: g.px, y: g.py - 40, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 3, r: 5 + Math.random() * 8, life: 50, maxLife: 50, color: ["#ff3a3a", "#ffaa00", "#ffdd00"][Math.floor(Math.random() * 3)] });
      }
      g.running = false;
      setTimeout(endGame, 1800);
    };

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, g: typeof G.current) => {
      drawBoardroom(ctx, W, H, g.t, g.shakeX, g.shakeY);
      ctx.save(); ctx.translate(g.shakeX, g.shakeY);

      /* flying papers */
      for (const p of g.papers) {
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life / 20);
        ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.fillStyle = "#fffbe6"; ctx.strokeStyle = "#ccc"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#999"; ctx.font = "4px monospace"; ctx.textAlign = "center";
        ["███████", "██████", "█████"].forEach((l, i) => ctx.fillText(l, 0, -3 + i * 5));
        ctx.globalAlpha = 1; ctx.restore();
      }

      /* draw objects */
      for (const o of g.goodObjs) drawGoodObj(ctx, o, g.t);
      for (const p of g.badPapers) if (!p.hit) drawBadPaper(ctx, p);
      for (const c of g.cannons) if (!c.hit) drawCannon(ctx, c, g.t);

      /* particles */
      for (const p of g.particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      /* player */
      drawFinanceBro(ctx, g.px, g.py, g.playerState, g.t, g.moveL ? -1 : g.moveR ? 1 : 0);

      /* pops */
      for (const p of g.pops) {
        const alpha = Math.min(1, p.life / 15);
        ctx.globalAlpha = alpha;
        const isMain = p.text.includes("ESCALATED") || p.text.includes("PANIC");
        const sz = isMain ? 20 : 14;
        ctx.font = `bold ${sz}px 'Orbitron', monospace`;
        ctx.fillStyle = p.color;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (isMain) {
          ctx.shadowColor = p.color; ctx.shadowBlur = 20;
          ctx.fillText(p.text, p.x, p.y);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(p.text, p.x, p.y - (p.life < 55 ? (55 - p.life) * 0.5 : 0));
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      /* HUD */
      ctx.fillStyle = "rgba(0,0,0,0.78)"; ctx.fillRect(0, 0, W, 44);
      ctx.strokeStyle = "rgba(0,247,192,0.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(W, 44); ctx.stroke();
      ctx.font = "bold 13px 'Orbitron', monospace"; ctx.textBaseline = "middle";
      ctx.fillStyle = NEON; ctx.textAlign = "left";
      ctx.fillText(`BOARDROOM: ${g.score}s`, 12, 22);
      ctx.fillStyle = "#fff"; ctx.textAlign = "right";
      ctx.fillText(`BEST: ${Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"))}s`, W - 12, 22);
    };

    G.current.raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(G.current.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, [endGame]);

  return (
    <div className="fixed inset-0 bg-[#060812] flex flex-col" style={{ fontFamily: "'Orbitron', monospace" }}>
      <canvas ref={canvasRef} className="flex-1 w-full h-full" style={{ display: "block" }} />

      {phase === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-md w-full">
            <p className="text-[#ff6600] text-xs font-bold tracking-widest mb-1 uppercase">⚠️ Fictional Parody · Not a Real Story</p>
            <h1 className="text-[#00f7c0] font-black text-3xl mb-1 leading-tight" style={{ textShadow: "0 0 20px #00f7c0" }}>BIG CANNONS:</h1>
            <h2 className="text-white font-black text-xl mb-4">BOARDROOM ESCAPE</h2>
            <p className="text-white/70 text-sm mb-2">Dodge the giant slapstick cannons & chaos!</p>
            <p className="text-[#44ff88]/80 text-sm mb-6">Collect coffee ☕, lawyer shields ⚖️, and NDAs ☂️ for bonus points!</p>
            <div className="bg-white/5 rounded-xl px-5 py-3 mb-6 text-left text-xs text-white/60 space-y-1">
              <p>← → or A/D to dodge &nbsp;·&nbsp; swipe on mobile</p>
              <p>⚠️ Every 15 seconds: <span className="text-[#ff6600] font-bold">BOARDROOM PANIC WAVE</span></p>
            </div>
            <button onClick={startGame} className="bg-[#00f7c0] text-black font-black text-xl px-12 py-4 rounded-xl w-full hover:bg-white transition-colors">
              PLAY
            </button>
            <Link href="/" className="block mt-4 text-[#00f7c0]/60 text-sm hover:text-[#00f7c0]">← Back to Arcade</Link>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85">
          <div className="text-center px-6 max-w-sm w-full">
            <p className="text-red-400 font-black text-2xl mb-1">CANNON INCIDENT ESCALATED!</p>
            <p className="text-[#ff9900]/80 text-sm mb-4 italic">"{gameOverLine}"</p>
            <p className="text-[#00f7c0] text-4xl font-black mb-1">{scoreDisplay}<span className="text-lg">s</span></p>
            <p className="text-white/40 text-xs mb-5">Boardroom Survived · Best: {hs}s</p>

            {!submitted ? (
              <div className="mb-4">
                <p className="text-white/60 text-xs mb-2">Enter your name for the leaderboard:</p>
                <input type="text" maxLength={24} placeholder="Your name" value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-white/10 border border-[#00f7c0]/40 text-white text-center rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-[#00f7c0]" />
                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full border border-[#00f7c0] text-[#00f7c0] font-bold text-sm py-2 rounded-lg hover:bg-[#00f7c0]/10 transition-colors disabled:opacity-50">
                  {submitting ? "Submitting…" : "📊 Submit Score"}
                </button>
              </div>
            ) : (
              <div className="mb-4 py-2">
                <p className="text-[#00f7c0] text-sm font-bold">✓ Score submitted!</p>
              </div>
            )}

            <button onClick={startGame} className="bg-[#00f7c0] text-black font-black text-lg px-8 py-4 rounded-xl w-full mb-3 hover:bg-white transition-colors">
              PLAY AGAIN
            </button>
            <Link href="/" className="block text-center border border-[#00f7c0]/40 text-[#00f7c0] font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#00f7c0]/10 transition-colors">
              BACK TO HOME
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
