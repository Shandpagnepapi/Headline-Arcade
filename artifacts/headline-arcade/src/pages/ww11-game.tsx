import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

const HS_KEY = "hs_ww11";
const NEON = "#00f7c0";

const BAD_LABELS = ["WW 11", "XI!", "11th War", "WW XI", "ELEVEN!", "WW 11 🤦"];
const GOOD_LABELS = ["WW II ✓", "WWII", "The Real One", "WW 2 ✓", "History 📚", "Correct! ✓"];

const DEATH_LINES = [
  "NOT AGAIN!!", "WORLD WAR ELEVEN?!", "I STUDIED FOR THIS!", "THAT'S NOT A REAL WAR!",
  "BREAKING NEWS: SHE TRIPPED", "OFF THE RECORD: OW",
];

interface Obj {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; kind: "bad" | "good"; label: string;
  hit: boolean; angle: number; spin: number; scale: number;
}
interface Pop { x: number; y: number; text: string; life: number; color: string; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

/* ─────────────────────────────────────────────────────────────────
   CHIBI REPORTER CHARACTER
   Based on reference: blue geometric hijab, teal tunic with
   decorative trim, dark pants, white sneakers, microphone, big eyes.
───────────────────────────────────────────────────────────────── */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  state: "run" | "collect" | "scared" | "dead",
  t: number,
  velX: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Lean into movement
  const lean = Math.max(-0.18, Math.min(0.18, velX * 0.015));
  ctx.rotate(lean);

  // ── Shadow ──
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(0, 6, 18, 4, 0, 0, Math.PI * 2); ctx.fill();

  // ── Run cycle ──
  const cycle = t * 0.18;
  const legSwingAmt = state === "dead" ? 0 : Math.min(1, Math.abs(velX) / 4 + 0.3);
  const legL = Math.sin(cycle) * 18 * legSwingAmt;
  const legR = Math.sin(cycle + Math.PI) * 18 * legSwingAmt;

  // ── Pants (dark navy) ──
  ctx.fillStyle = "#1e2d4a";
  // Left leg
  ctx.save(); ctx.translate(-7, 10);
  ctx.rotate((legL * Math.PI) / 180);
  ctx.beginPath(); ctx.roundRect(-5, 0, 10, 22, 3); ctx.fill(); ctx.restore();
  // Right leg
  ctx.save(); ctx.translate(7, 10);
  ctx.rotate((legR * Math.PI) / 180);
  ctx.beginPath(); ctx.roundRect(-5, 0, 10, 22, 3); ctx.fill(); ctx.restore();

  // ── Sneakers (white with blue trim) ──
  ctx.fillStyle = "#f0f0f0";
  const shoeL = { x: -7 + Math.sin(cycle) * 6 * legSwingAmt, y: 30 };
  const shoeR = { x: 7 + Math.sin(cycle + Math.PI) * 6 * legSwingAmt, y: 30 };
  ctx.beginPath(); ctx.roundRect(shoeL.x - 8, shoeL.y - 3, 16, 7, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(shoeR.x - 8, shoeR.y - 3, 16, 7, 3); ctx.fill();
  // Blue trim stripe
  ctx.fillStyle = "#3a7bd5";
  ctx.beginPath(); ctx.roundRect(shoeL.x - 8, shoeL.y + 1, 16, 2, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(shoeR.x - 8, shoeR.y + 1, 16, 2, 1); ctx.fill();

  // ── Teal tunic body ──
  ctx.fillStyle = "#2a9d8f";
  ctx.beginPath(); ctx.roundRect(-17, -14, 34, 28, 5); ctx.fill();

  // Tunic decorative V-neck trim (orange/gold)
  ctx.strokeStyle = "#e9c46a"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(0, -6); ctx.lineTo(5, -14); ctx.stroke();

  // Tunic bottom decorative border
  ctx.fillStyle = "#e9c46a";
  ctx.beginPath(); ctx.roundRect(-17, 10, 34, 5, [0,0,3,3]); ctx.fill();
  // White dots on border
  ctx.fillStyle = "#fff";
  for (let dx = -12; dx <= 12; dx += 6) {
    ctx.beginPath(); ctx.arc(dx, 12.5, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  // ── Arms ──
  const armSwing = state === "dead" ? 0 : Math.sin(cycle) * 20 * legSwingAmt;
  ctx.fillStyle = "#2a9d8f";
  // Left arm
  ctx.save(); ctx.translate(-18, -8);
  ctx.rotate((-armSwing * Math.PI) / 180);
  ctx.beginPath(); ctx.roundRect(-4, 0, 8, 18, 3); ctx.fill();
  ctx.restore();
  // Right arm (holding mic)
  ctx.save(); ctx.translate(18, -8);
  ctx.rotate((armSwing * Math.PI) / 180);
  ctx.beginPath(); ctx.roundRect(-4, 0, 8, 18, 3); ctx.fill();
  // ── Microphone ──
  ctx.translate(0, 16);
  ctx.fillStyle = "#111"; ctx.strokeStyle = "#333"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-3, -8, 6, 12, 2); ctx.fill(); ctx.stroke();
  // Mic head (round)
  ctx.fillStyle = "#222";
  ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#444"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI * 2); ctx.stroke();
  // Star on mic
  ctx.fillStyle = "#e9c46a"; ctx.font = "bold 6px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("★", 0, -10);
  ctx.restore();

  // ── Skin (hands/face) ──
  const skin = "#d4956a";

  // ── Head ──
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -28, 19, 0, Math.PI * 2); ctx.fill();

  // ── Hijab (blue/teal with white geometric pattern) ──
  // Main hijab shape
  ctx.fillStyle = "#3a6bc4";
  ctx.beginPath();
  ctx.arc(0, -28, 21, Math.PI * 0.85, Math.PI * 2.15); ctx.fill();
  // Hijab top
  ctx.beginPath(); ctx.ellipse(0, -40, 19, 14, 0, Math.PI, 0); ctx.fill();
  // Side drape (left)
  ctx.beginPath();
  ctx.moveTo(-21, -28);
  ctx.bezierCurveTo(-26, -20, -22, -8, -16, 0);
  ctx.lineTo(-10, 0); ctx.bezierCurveTo(-14, -10, -18, -20, -21, -28);
  ctx.closePath(); ctx.fill();
  // Side drape (right)
  ctx.beginPath();
  ctx.moveTo(21, -28);
  ctx.bezierCurveTo(26, -20, 22, -8, 16, 0);
  ctx.lineTo(10, 0); ctx.bezierCurveTo(14, -10, 18, -20, 21, -28);
  ctx.closePath(); ctx.fill();

  // ── Geometric hijab pattern (white triangles) ──
  ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
  // Small triangle pattern along hijab
  for (let px = -14; px <= 14; px += 8) {
    ctx.beginPath();
    ctx.moveTo(px, -46);
    ctx.lineTo(px + 4, -42);
    ctx.lineTo(px - 4, -42);
    ctx.closePath(); ctx.stroke();
  }
  // Orange/gold border on hijab edge
  ctx.strokeStyle = "#f4a261"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -28, 21, Math.PI * 0.88, Math.PI * 2.12); ctx.stroke();

  // ── Face (on top of hijab) ──
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(0, -28, 15, 18, 0, 0, Math.PI * 2); ctx.fill();

  // ── Eyes ──
  const eyeY = state === "dead" ? -30 : -30;
  const eyeBlink = Math.sin(t * 0.04) > 0.97; // occasional blink

  if (state === "dead") {
    // X eyes
    ctx.strokeStyle = "#cc3333"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, eyeY - 4); ctx.lineTo(-5, eyeY + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, eyeY - 4); ctx.lineTo(-10, eyeY + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, eyeY - 4); ctx.lineTo(10, eyeY + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, eyeY - 4); ctx.lineTo(5, eyeY + 1); ctx.stroke();
  } else {
    // Big cartoon eyes (whites)
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(-7, eyeY, 6, eyeBlink ? 1.5 : 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, eyeY, 6, eyeBlink ? 1.5 : 7, 0, 0, Math.PI * 2); ctx.fill();

    if (!eyeBlink) {
      // Pupils
      const pupilShift = state === "scared" ? 2 : 0;
      ctx.fillStyle = "#3d1a00";
      ctx.beginPath(); ctx.arc(-7 + pupilShift, eyeY + 1, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7 + pupilShift, eyeY + 1, 3.5, 0, Math.PI * 2); ctx.fill();
      // Sparkle highlight
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-5.5 + pupilShift, eyeY - 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8.5 + pupilShift, eyeY - 0.5, 1.5, 0, Math.PI * 2); ctx.fill();

      // Star sparkles in collect state
      if (state === "collect") {
        ctx.fillStyle = "#e9c46a"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("★", -7, eyeY - 8);
        ctx.fillText("★", 7, eyeY - 8);
      }
    }

    // Eyelashes
    ctx.strokeStyle = "#1a0a00"; ctx.lineWidth = 1.5;
    if (!eyeBlink) {
      ctx.beginPath(); ctx.moveTo(-13, eyeY - 5); ctx.lineTo(-14, eyeY - 9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, eyeY - 7); ctx.lineTo(-9, eyeY - 11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, eyeY - 7); ctx.lineTo(9, eyeY - 11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, eyeY - 5); ctx.lineTo(14, eyeY - 9); ctx.stroke();
    }
  }

  // ── Eyebrows ──
  ctx.strokeStyle = "#3d1a00"; ctx.lineWidth = 2;
  if (state === "scared" || state === "dead") {
    ctx.beginPath(); ctx.moveTo(-13, eyeY - 13); ctx.lineTo(-4, eyeY - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(13, eyeY - 13); ctx.lineTo(4, eyeY - 10); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-13, eyeY - 11); ctx.quadraticCurveTo(-7, eyeY - 15, -2, eyeY - 11); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(13, eyeY - 11); ctx.quadraticCurveTo(7, eyeY - 15, 2, eyeY - 11); ctx.stroke();
  }

  // ── Nose ──
  ctx.strokeStyle = "#b07050"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, -23, 2, 0.2, Math.PI - 0.2); ctx.stroke();

  // ── Mouth ──
  ctx.strokeStyle = "#b07050"; ctx.lineWidth = 1.8;
  if (state === "dead") {
    ctx.beginPath(); ctx.arc(0, -17, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  } else if (state === "scared") {
    ctx.beginPath(); ctx.arc(0, -16, 5, 0.1, Math.PI - 0.1); ctx.stroke();
  } else if (state === "collect") {
    ctx.beginPath(); ctx.arc(0, -18, 5, 0.1, Math.PI - 0.1, true); ctx.stroke();
    ctx.fillStyle = "#e9c46a"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
  } else {
    // happy open mouth
    ctx.beginPath(); ctx.arc(0, -18, 4, 0.1, Math.PI - 0.1, true); ctx.stroke();
  }

  // ── Rosy cheeks ──
  ctx.fillStyle = "rgba(230,100,80,0.22)";
  ctx.beginPath(); ctx.ellipse(-13, -22, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(13, -22, 5, 4, 0, 0, Math.PI * 2); ctx.fill();

  // ── Sweat drop (scared) ──
  if (state === "scared") {
    ctx.fillStyle = "#aaddff"; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(18, -32, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── Thumbs up (collect) ──
  if (state === "collect") {
    ctx.save(); ctx.translate(-26, -14);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.roundRect(-5, -8, 10, 14, 3); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -10, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/* ── Falling object ── */
function drawObj(ctx: CanvasRenderingContext2D, o: Obj) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle);
  ctx.scale(o.scale, o.scale);
  ctx.fillStyle = o.kind === "bad" ? "#ff2a2a" : "#22cc55";
  ctx.strokeStyle = o.kind === "bad" ? "#ff8888" : "#66ff99";
  ctx.lineWidth = 2;
  ctx.shadowColor = o.kind === "bad" ? "#ff0000" : "#00ff66";
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.roundRect(-o.w / 2, -o.h / 2, o.w, o.h, 8); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.max(8, o.h * 0.38)}px 'Orbitron', monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(o.label, 0, 0);
  ctx.restore();
}

async function submitScore(playerName: string, score: number) {
  await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName: playerName.trim() || "Anonymous", game: "ww11", score }),
  });
}

export default function WW11Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [hs, setHs] = useState(() => parseInt(localStorage.getItem(HS_KEY) || "0"));
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("arcade_name") || "");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deathLine, setDeathLine] = useState("");

  const G = useRef({
    px: 160, py: 400,
    pvx: 0, // velocity for smooth movement
    ptx: -1, // target x from mouse (-1 = not used)
    objs: [] as Obj[],
    pops: [] as Pop[],
    particles: [] as Particle[],
    score: 0, combo: 0,
    spawnT: 0, scoreT: 0,
    totalT: 0, // total game time (frames)
    moveL: false, moveR: false,
    state: "run" as "run" | "collect" | "scared" | "dead",
    stateTimer: 0,
    shakeX: 0, shakeY: 0,
    t: 0, raf: 0, running: false,
    touchSX: 0,
    bgStars: [] as {x:number;y:number;s:number}[],
    bgBuildings: [] as {x:number;y:number;w:number;h:number;c:string}[],
  });

  const endGame = useCallback(() => {
    const g = G.current; g.running = false;
    g.state = "dead"; g.shakeX = 8; g.shakeY = 6;
    const newHs = Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"));
    localStorage.setItem(HS_KEY, String(newHs));
    setHs(newHs); setScoreDisplay(g.score);
    setDeathLine(DEATH_LINES[Math.floor(Math.random() * DEATH_LINES.length)]);
    setSubmitted(false);
    // Particle burst
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 5;
      g.particles.push({
        x: g.px, y: g.py - 20,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 2,
        life: 60, color: ["#ff3a3a","#ffdd00","#fff","#ff88aa"][Math.floor(Math.random()*4)],
        size: 4 + Math.random() * 8,
      });
    }
    setTimeout(() => setPhase("over"), 1800);
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = G.current;
    g.px = canvas.clientWidth / 2; g.py = canvas.clientHeight - 70;
    g.pvx = 0; g.ptx = -1;
    g.objs = []; g.pops = []; g.particles = [];
    g.score = 0; g.combo = 0;
    g.spawnT = 0; g.scoreT = 0; g.totalT = 0;
    g.state = "run"; g.stateTimer = 0;
    g.shakeX = 0; g.shakeY = 0;
    g.moveL = false; g.moveR = false;
    g.t = 0; g.running = true;

    // Generate BG buildings once
    g.bgBuildings = [];
    for (let i = 0; i < 12; i++) {
      const bw = 40 + Math.random() * 60;
      g.bgBuildings.push({
        x: i * (canvas.clientWidth / 10) + Math.random() * 20,
        y: 0, w: bw,
        h: 80 + Math.random() * 180,
        c: ["#0a1a2e","#0d2040","#081828","#091530"][Math.floor(Math.random()*4)],
      });
    }
    // Stars
    g.bgStars = Array.from({length:40}, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight * 0.5,
      s: 0.5 + Math.random() * 2,
    }));

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
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener("resize", resize);

    // ── Keyboard ──
    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") g.moveL = e.type === "keydown";
      if (e.code === "ArrowRight" || e.code === "KeyD") g.moveR = e.type === "keydown";
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);

    // ── Mouse: move to position (great PC feel) ──
    const onMouseMove = (e: MouseEvent) => {
      const g = G.current; if (!g.running) return;
      g.ptx = e.clientX;
    };
    canvas.addEventListener("mousemove", onMouseMove);

    // ── Touch ──
    const onTouchStart = (e: TouchEvent) => { G.current.touchSX = e.touches[0].clientX; };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const g = G.current; if (!g.running) return;
      const dx = e.touches[0].clientX - g.touchSX;
      g.pvx += dx * 0.6;
      g.touchSX = e.touches[0].clientX;
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

      g.t += dt; g.totalT += dt; g.scoreT += dt;
      if (g.scoreT >= 60) { g.score++; g.scoreT = 0; }
      if (g.stateTimer > 0) g.stateTimer -= dt;
      if (g.stateTimer <= 0 && g.state !== "dead") g.state = "run";

      // ── Difficulty curve (smooth, over ~5 minutes) ──
      // progress goes 0→1 over 18000 frames (~5 min), eased
      const rawProg = Math.min(g.totalT / 18000, 1);
      const prog = rawProg * rawProg * (3 - 2 * rawProg); // smoothstep
      const speed = 2.4 + prog * 6.6;         // 2.4 → 9.0
      const spawnInt = 88 - prog * 56;         // 88 → 32 frames
      const badRatio = 0.58 + prog * 0.26;     // 0.58 → 0.84
      const objW = 68 + prog * 20;             // 68 → 88 (wider = harder to dodge)
      const multiSpawn = prog > 0.6 && Math.random() < (prog - 0.6) * 0.5; // double spawns late game

      // ── Player movement ──
      const PSPEED = 6.5;
      const ACCEL = 0.45, FRICTION = 0.78;

      if (g.ptx >= 0) {
        // Mouse tracking: smoothly chase cursor
        const diff = g.ptx - g.px;
        g.pvx += diff * 0.18;
      }
      if (g.moveL) g.pvx -= ACCEL * dt * PSPEED;
      if (g.moveR) g.pvx += ACCEL * dt * PSPEED;
      if (!g.moveL && !g.moveR && g.ptx < 0) g.pvx *= Math.pow(FRICTION, dt);

      g.pvx = Math.max(-PSPEED * 1.8, Math.min(PSPEED * 1.8, g.pvx));
      g.px += g.pvx * dt;
      g.px = Math.max(22, Math.min(W - 22, g.px));

      // Screen shake decay
      g.shakeX *= 0.8; g.shakeY *= 0.8;

      // ── Spawn objects ──
      g.spawnT += dt;
      if (g.spawnT >= spawnInt) {
        g.spawnT = 0;
        const spawnOne = () => {
          const bad = Math.random() < badRatio;
          const lbl = bad ? BAD_LABELS[Math.floor(Math.random() * BAD_LABELS.length)]
                          : GOOD_LABELS[Math.floor(Math.random() * GOOD_LABELS.length)];
          const h = 36 + Math.random() * 14;
          g.objs.push({
            x: 36 + Math.random() * (W - 72), y: -40,
            vx: (Math.random() - 0.5) * (1 + prog * 2),
            vy: speed + Math.random() * 1.5,
            w: objW, h,
            kind: bad ? "bad" : "good", label: lbl,
            hit: false, angle: (Math.random()-0.5)*0.3, spin: (Math.random()-0.5)*0.015,
            scale: 1,
          });
        };
        spawnOne();
        if (multiSpawn) spawnOne();
      }

      // ── Update objects ──
      for (const o of g.objs) {
        o.x += o.vx * dt; o.y += o.vy * dt; o.angle += o.spin * dt;
        // Bounce off walls
        if (o.x < 30 || o.x > W - 30) o.vx *= -1;
      }

      // ── Collision ──
      const HIT_R = 22;
      for (const o of g.objs) {
        if (o.hit) continue;
        const dx = Math.abs(o.x - g.px), dy = Math.abs(o.y - (g.py - 22));
        if (dx < (o.w / 2 + HIT_R) * 0.72 && dy < (o.h / 2 + HIT_R) * 0.72) {
          o.hit = true;
          if (o.kind === "bad") {
            g.state = "dead"; g.stateTimer = 999; g.shakeX = 10; g.shakeY = 8;
            g.running = false;
            // Particles
            for (let i = 0; i < 18; i++) {
              const a = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 4;
              g.particles.push({ x: g.px, y: g.py-20, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd-2, life:55, color:"#ff3a3a", size:5+Math.random()*7 });
            }
            setTimeout(endGame, 1600);
          } else {
            g.combo++;
            const bonus = g.combo >= 3 ? 25 : 10;
            g.score += bonus;
            g.state = "collect"; g.stateTimer = 20;
            const comboText = g.combo >= 5 ? `COMBO x${g.combo}! +${bonus}` : `+${bonus}`;
            g.pops.push({ x: o.x, y: o.y - 10, text: comboText, life: 70, color: g.combo >= 3 ? "#ffdd00" : "#55ff99" });
            // Mini particles
            for (let i = 0; i < 8; i++) {
              const a = Math.random() * Math.PI * 2;
              g.particles.push({ x: o.x, y: o.y, vx: Math.cos(a)*3, vy: Math.sin(a)*3-1, life:30, color:"#55ff99", size:3+Math.random()*4 });
            }
          }
        }
      }

      // Reset combo if no good hit recently
      if (g.state === "run" && g.stateTimer <= 0) {
        // combo resets after 2 seconds of no collect
      }

      // Warn state: check if bad obj is close
      if (g.state === "run") {
        for (const o of g.objs) {
          if (o.kind === "bad" && !o.hit && Math.abs(o.x - g.px) < 80 && o.y > H * 0.4 && o.y < g.py) {
            g.state = "scared"; g.stateTimer = 8;
          }
        }
      }

      g.objs = g.objs.filter(o => !o.hit && o.y < H + 60);
      g.pops.forEach(p => p.life--); g.pops = g.pops.filter(p => p.life > 0);
      g.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; });
      g.particles = g.particles.filter(p => p.life > 0);

      draw(ctx, W, H, g);
    };

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, g: typeof G.current) => {
      ctx.save();
      // Screen shake
      if (Math.abs(g.shakeX) > 0.1) ctx.translate(g.shakeX * (Math.random()-0.5)*2, g.shakeY * (Math.random()-0.5)*2);

      // ── Background: dark city skyline ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#03050f"); bgGrad.addColorStop(0.6, "#060a18"); bgGrad.addColorStop(1, "#0a0f20");
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

      // Stars
      for (const s of g.bgStars) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(g.t * 0.04 + s.x) * 0.2})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill();
      }

      // Buildings silhouette
      for (const b of g.bgBuildings) {
        ctx.fillStyle = b.c;
        ctx.fillRect(b.x, H - b.h, b.w, b.h);
        // Building windows
        ctx.fillStyle = "rgba(255,255,150,0.15)";
        for (let wy = H - b.h + 10; wy < H - 10; wy += 14) {
          for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 10) {
            if (Math.random() > 0.4) ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }

      // News ticker at bottom of background
      ctx.fillStyle = "rgba(0,247,192,0.08)"; ctx.fillRect(0, H - 22, W, 22);
      ctx.font = "bold 8px monospace"; ctx.fillStyle = "rgba(0,247,192,0.3)"; ctx.textBaseline = "middle";
      const tk = "  BREAKING: WORLD WAR 11 ANNOUNCED  •  HISTORIAN SAYS 'THAT'S NOT A THING'  •  REPORTER DODGING HISTORY  •  ";
      ctx.fillText(tk.repeat(3), -(g.t * 0.9) % (tk.length * 5.5), H - 11);

      // Ground line
      ctx.strokeStyle = "rgba(0,247,192,0.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H-22); ctx.lineTo(W, H-22); ctx.stroke();
      ctx.fillStyle = "rgba(0,247,192,0.06)"; ctx.fillRect(0, H-22, W, 22);

      // Scan lines effect (subtle)
      for (let sl = 0; sl < H; sl += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.04)"; ctx.fillRect(0, sl, W, 2);
      }

      // Objects
      for (const o of g.objs) drawObj(ctx, o);

      // Player
      drawPlayer(ctx, g.px, g.py - 30, g.state, g.t, g.pvx);

      // Particles
      for (const p of g.particles) {
        ctx.save(); ctx.globalAlpha = p.life / 60;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.restore();
      }

      // Popups
      for (const p of g.pops) {
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.color; ctx.font = "bold 16px 'Orbitron', monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.fillText(p.text, p.x, p.y - (70 - p.life) * 0.7);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0, 0, W, 46);
      ctx.strokeStyle = "rgba(0,247,192,0.25)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,46); ctx.lineTo(W,46); ctx.stroke();
      ctx.font = "bold 13px 'Orbitron', monospace"; ctx.textBaseline = "middle";
      ctx.fillStyle = NEON; ctx.textAlign = "left"; ctx.fillText(`SCORE: ${g.score}`, 12, 23);
      ctx.fillStyle = "#fff"; ctx.textAlign = "right";
      ctx.fillText(`BEST: ${Math.max(g.score, parseInt(localStorage.getItem(HS_KEY)||"0"))}`, W-12, 23);

      // Difficulty indicator
      const rawProg2 = Math.min(g.totalT / 18000, 1);
      const prog2 = rawProg2 * rawProg2 * (3 - 2 * rawProg2);
      ctx.fillStyle = "rgba(0,247,192,0.15)"; ctx.fillRect(W*0.35, 16, W*0.3, 8);
      ctx.fillStyle = `rgba(${Math.floor(prog2*255)},${Math.floor((1-prog2)*200)},0,0.7)`;
      ctx.fillRect(W*0.35, 16, W*0.3*prog2, 8);
      ctx.strokeStyle = "rgba(0,247,192,0.2)"; ctx.lineWidth = 1;
      ctx.strokeRect(W*0.35, 16, W*0.3, 8);
      ctx.fillStyle = "rgba(0,247,192,0.4)"; ctx.font = "bold 7px 'Orbitron', monospace";
      ctx.textAlign = "center"; ctx.fillText("CHAOS", W*0.5, 30);

      ctx.restore();
    };

    G.current.raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(G.current.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, [endGame]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col" style={{ fontFamily: "'Orbitron', monospace" }}>
      <canvas ref={canvasRef} className="flex-1 w-full h-full" style={{ display: "block", cursor: "none" }} />

      {phase === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-md">
            <div className="text-5xl mb-3">📰</div>
            <h1 className="text-[#00f7c0] font-black text-3xl mb-2" style={{ textShadow: "0 0 20px #00f7c0" }}>
              WORLD WAR 11
            </h1>
            <div className="bg-white/5 border border-[#00f7c0]/20 rounded-2xl p-4 mb-6 text-sm text-white/70 space-y-2">
              <p>🎙️ <span className="text-[#00f7c0] font-bold">You're a reporter</span> covering actual history.</p>
              <p>❌ <span className="text-red-400">Dodge</span> the "WW 11" nonsense — that's not a real war!</p>
              <p>✅ <span className="text-green-400">Collect</span> real WWII references for bonus points.</p>
              <p>🔥 Chain collects for COMBO multipliers!</p>
              <p className="text-white/50 text-xs pt-1">Move mouse · ← → keys · swipe on mobile</p>
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
            <div className="text-5xl mb-2">😱</div>
            <p className="text-red-400 font-black text-2xl mb-1">{deathLine}</p>
            <p className="text-white/60 text-sm mb-3">World War Eleven strikes again!</p>
            <p className="text-[#00f7c0] text-4xl font-black mb-1">{scoreDisplay}</p>
            <p className="text-white/40 text-xs mb-5">Points · Best: {hs}</p>

            {!submitted ? (
              <div className="mb-4">
                <p className="text-white/60 text-xs mb-2">Enter your name for the leaderboard:</p>
                <input type="text" maxLength={24} placeholder="Your name"
                  value={playerName} onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
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
