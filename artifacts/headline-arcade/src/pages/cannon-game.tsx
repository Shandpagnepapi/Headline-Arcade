import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

const HS_KEY = "headlineArcade_boardroomBalance_highScore";
const NEON = "#00f7c0";
const TABLE_W = 420;
const TABLE_H = 22;
const MAX_ANGLE = 0.72; // radians before game over (~41°)

const GAME_OVER_LINES = [
  "MEETING OVER!",
  "BONUS DENIED!",
  "HR HAS ENTERED THE CHAT.",
  "COMPLIANCE REVIEW INITIATED.",
  "THE CANNONS WERE NOT PRICED IN.",
];

const OBJECT_TYPES = [
  { label: "NDA", color: "#fff", bg: "#cc1a00", w: 42, h: 30, weight: 1.0, emoji: "📄" },
  { label: "COFFEE ☕", color: "#fff", bg: "#5c3317", w: 38, h: 34, weight: 0.7, emoji: "☕" },
  { label: "BONUS 💰", color: "#000", bg: "#22cc55", w: 50, h: 26, weight: 0.5, emoji: "💰" },
  { label: "HR FORM", color: "#fff", bg: "#aa00cc", w: 44, h: 30, weight: 1.2, emoji: "📋" },
  { label: "📱 PHONE", color: "#fff", bg: "#222244", w: 28, h: 44, weight: 0.9, emoji: "📱" },
  { label: "TICKER 📈", color: "#00ff88", bg: "#001a00", w: 56, h: 24, weight: 0.4, emoji: "📈" },
];

interface FallingObj {
  x: number; y: number; vy: number; vx: number;
  angle: number; spin: number;
  landed: boolean; landedX: number; slidingOff: boolean;
  type: typeof OBJECT_TYPES[number];
}

interface Debris {
  x: number; y: number; vx: number; vy: number;
  angle: number; spin: number; life: number;
  color: string; label: string; size: number;
}

/* ── Exec character ── */
function drawExec(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  cannonJiggleL: number, cannonJiggleR: number,
  vertBounceL: number, vertBounceR: number,
  expression: "normal" | "worried" | "panic" | "shrug",
  tableTilt: number,
  t: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Body sway opposite to tilt
  const bodySway = -tableTilt * 28;
  ctx.translate(bodySway * 0.4, 0);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(0, 6, 34, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Legs
  const legSwing = expression === "shrug" ? 0 : Math.sin(t * 0.18) * 8 * Math.max(0.2, Math.abs(tableTilt) * 2);
  ctx.fillStyle = "#1a2d5a";
  for (const [sx, sdir] of [[-10, 1], [10, -1]] as [number,number][]) {
    ctx.save();
    ctx.translate(sx, 0);
    ctx.rotate((legSwing * sdir * Math.PI) / 180);
    ctx.beginPath(); ctx.roundRect(-6, 0, 12, 26, 3); ctx.fill();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.roundRect(-7, 24, 14, 7, 2); ctx.fill();
    ctx.restore();
  }

  // The suit jacket base
  ctx.fillStyle = "#1e3a70";
  ctx.beginPath(); ctx.roundRect(-26, -34, 52, 38, 6); ctx.fill();

  // LEFT CANNON (oversized sphere under jacket, left side)
  const cannonLX = -22 + cannonJiggleL * 0.9;
  const cannonLY = -16 + vertBounceL;
  const cannonR = 22;
  ctx.save();
  ctx.translate(cannonLX, cannonLY);
  const gradL = ctx.createRadialGradient(-6, -6, 2, 0, 0, cannonR);
  gradL.addColorStop(0, "#f0c8a0"); gradL.addColorStop(0.6, "#d4a070"); gradL.addColorStop(1, "#a07040");
  ctx.fillStyle = gradL;
  ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(0, 0, cannonR, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // Jiggle highlight
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath(); ctx.arc(-7, -7, 9, 0, Math.PI * 2); ctx.fill();
  // Tiny barrel on top
  ctx.fillStyle = "#666"; ctx.strokeStyle = "#888"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-3, -cannonR - 10, 6, 12, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#444"; ctx.beginPath(); ctx.roundRect(-4, -cannonR - 12, 8, 5, 2); ctx.fill();
  ctx.restore();

  // RIGHT CANNON
  const cannonRX = 22 + cannonJiggleR * 0.9;
  const cannonRY = -16 + vertBounceR;
  ctx.save();
  ctx.translate(cannonRX, cannonRY);
  const gradR = ctx.createRadialGradient(-6, -6, 2, 0, 0, cannonR);
  gradR.addColorStop(0, "#f0c8a0"); gradR.addColorStop(0.6, "#d4a070"); gradR.addColorStop(1, "#a07040");
  ctx.fillStyle = gradR;
  ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(0, 0, cannonR, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath(); ctx.arc(-7, -7, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#666"; ctx.strokeStyle = "#888"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-3, -cannonR - 10, 6, 12, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#444"; ctx.beginPath(); ctx.roundRect(-4, -cannonR - 12, 8, 5, 2); ctx.fill();
  ctx.restore();

  // Jacket overlay (covers lower part of cannons)
  ctx.fillStyle = "#1e3a70";
  ctx.beginPath(); ctx.roundRect(-28, -12, 56, 20, [0,0,6,6]); ctx.fill();
  // Jacket lapels
  ctx.fillStyle = "#f0f0f0";
  ctx.beginPath(); ctx.moveTo(-4, -34); ctx.lineTo(0, -18); ctx.lineTo(4, -34); ctx.closePath(); ctx.fill();
  // Tie wobble
  const tieWiggle = tableTilt * 22 + Math.sin(t * 0.12) * 6;
  ctx.fillStyle = "#cc0000";
  ctx.save(); ctx.translate(0, -22); ctx.rotate((tieWiggle * Math.PI) / 180);
  ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(0, 20); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Shoulders (power suit)
  ctx.fillStyle = "#253d80";
  ctx.beginPath(); ctx.roundRect(-32, -36, 20, 12, [8,8,0,0]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(12, -36, 20, 12, [8,8,0,0]); ctx.fill();

  // Arms in shrug mode
  if (expression === "shrug") {
    ctx.fillStyle = "#1e3a70";
    ctx.save(); ctx.translate(-28, -28); ctx.rotate(-0.9);
    ctx.beginPath(); ctx.roundRect(-5, -5, 10, 24, 4); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(28, -28); ctx.rotate(0.9);
    ctx.beginPath(); ctx.roundRect(-5, -5, 10, 24, 4); ctx.fill();
    ctx.restore();
    // hands
    ctx.fillStyle = "#f4c88a";
    ctx.beginPath(); ctx.arc(-42, -34, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(42, -34, 7, 0, Math.PI * 2); ctx.fill();
  }

  // Head
  ctx.fillStyle = "#f4c88a";
  ctx.beginPath(); ctx.arc(0, -52, 22, 0, Math.PI * 2); ctx.fill();

  // Big hair (power hair)
  const hairShake = expression === "panic" ? Math.sin(t * 0.25) * 6 : tableTilt * 10;
  ctx.fillStyle = "#2c1a0e";
  ctx.beginPath();
  ctx.moveTo(-22, -56);
  ctx.bezierCurveTo(-30 + hairShake * 0.3, -90 + hairShake, -20 + hairShake * 0.5, -98, 0 + hairShake * 0.2, -96);
  ctx.bezierCurveTo(22 + hairShake * 0.5, -96, 32 + hairShake * 0.3, -88, 24, -56);
  ctx.closePath(); ctx.fill();
  // Hair volume highlights
  ctx.fillStyle = "#3d2510";
  ctx.beginPath(); ctx.ellipse(-6 + hairShake * 0.2, -80, 12, 18, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8 + hairShake * 0.3, -82, 14, 20, 0.3, 0, Math.PI * 2); ctx.fill();

  // Eyes
  const eyeY = -54;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(-8, eyeY, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8, eyeY, 7, 8, 0, 0, Math.PI * 2); ctx.fill();

  const pupilShift = tableTilt * 4;
  ctx.fillStyle = "#222";
  ctx.beginPath(); ctx.arc(-8 + pupilShift, eyeY + 1, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8 + pupilShift, eyeY + 1, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-6.5 + pupilShift, eyeY - 0.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9.5 + pupilShift, eyeY - 0.5, 1.8, 0, Math.PI * 2); ctx.fill();

  // Eyebrows
  ctx.strokeStyle = "#2c1a0e"; ctx.lineWidth = 2.5;
  if (expression === "panic" || expression === "worried") {
    ctx.beginPath(); ctx.moveTo(-15, eyeY - 10); ctx.lineTo(-1, eyeY - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, eyeY - 10); ctx.lineTo(1, eyeY - 6); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-14, eyeY - 9); ctx.quadraticCurveTo(-8, eyeY - 12, -2, eyeY - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, eyeY - 9); ctx.quadraticCurveTo(8, eyeY - 12, 2, eyeY - 8); ctx.stroke();
  }

  // Mouth
  ctx.strokeStyle = "#8b5e3c"; ctx.lineWidth = 2;
  if (expression === "panic") {
    ctx.beginPath(); ctx.arc(0, -44, 7, 0.2, Math.PI - 0.2); ctx.stroke();
    // sweat
    ctx.fillStyle = "#aaddff"; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(24, -52, 3, 6, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (expression === "shrug") {
    ctx.beginPath(); ctx.moveTo(-6, -44); ctx.lineTo(6, -44); ctx.stroke();
  } else if (expression === "worried") {
    ctx.beginPath(); ctx.arc(0, -42, 5, 0.3, Math.PI - 0.3, false); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, -46, 4, 0.1, Math.PI - 0.1, true); ctx.stroke();
  }

  // Speech bubble for shrug
  if (expression === "shrug") {
    ctx.fillStyle = "#fffbe6"; ctx.strokeStyle = "#cc1a00"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(20, -110, 100, 40, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, -70); ctx.lineTo(20, -60); ctx.lineTo(42, -70); ctx.fill();
    ctx.fillStyle = "#cc1a00"; ctx.font = "bold 9px 'Orbitron', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("¯\\_(ツ)_/¯", 70, -96);
    ctx.fillText("cannons will be", 70, -83);
    ctx.fillText("cannons!", 70, -70);
  }

  ctx.restore();
}

/* ── Table ── */
function drawTable(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angle: number,
  landedObjs: FallingObj[],
  t: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Table wobble decorative lines (wood grain)
  ctx.fillStyle = "#1a3040";
  ctx.beginPath(); ctx.roundRect(-TABLE_W / 2, -TABLE_H / 2, TABLE_W, TABLE_H, 6); ctx.fill();

  ctx.strokeStyle = "rgba(0,247,192,0.4)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-TABLE_W / 2, -TABLE_H / 2, TABLE_W, TABLE_H, 6); ctx.stroke();

  // Wood grain lines
  ctx.strokeStyle = "rgba(0,247,192,0.08)"; ctx.lineWidth = 1;
  for (let xi = -TABLE_W / 2 + 20; xi < TABLE_W / 2; xi += 30) {
    const wobble = Math.sin(xi * 0.04 + t * 0.03) * 2;
    ctx.beginPath(); ctx.moveTo(xi, -TABLE_H / 2 + 4 + wobble); ctx.lineTo(xi + 8, TABLE_H / 2 - 4 + wobble); ctx.stroke();
  }

  // Table legs (dangling)
  ctx.fillStyle = "#0d2030"; ctx.strokeStyle = "rgba(0,247,192,0.3)"; ctx.lineWidth = 1.5;
  for (const legX of [-TABLE_W / 2 + 30, TABLE_W / 2 - 30]) {
    ctx.beginPath(); ctx.roundRect(legX - 8, TABLE_H / 2, 16, 38, 3); ctx.fill(); ctx.stroke();
    // foot
    ctx.beginPath(); ctx.roundRect(legX - 12, TABLE_H / 2 + 34, 24, 6, 2); ctx.fill(); ctx.stroke();
  }

  // Render landed objects on table surface
  for (const obj of landedObjs) {
    if (obj.landed && !obj.slidingOff) {
      const ox = obj.landedX;
      ctx.save();
      ctx.translate(ox, -TABLE_H / 2 - obj.type.h / 2);
      ctx.rotate(obj.angle);
      ctx.fillStyle = obj.type.bg; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-obj.type.w / 2, -obj.type.h / 2, obj.type.w, obj.type.h, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = obj.type.color; ctx.font = "bold 8px 'Orbitron', monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(obj.label, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

/* ── Falling object draw ── */
function drawFallingObj(ctx: CanvasRenderingContext2D, obj: FallingObj) {
  ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(obj.angle);
  ctx.fillStyle = obj.type.bg; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-obj.type.w / 2, -obj.type.h / 2, obj.type.w, obj.type.h, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = obj.type.color; ctx.font = "bold 8px 'Orbitron', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(obj.type.label, 0, 0);
  ctx.restore();
}

/* ── Submit score ── */
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

  // Physics state
  const G = useRef({
    // Table
    tableAngle: 0,
    tableAngularVel: 0,
    // "Cannon" jiggle physics - each sphere has horizontal + vertical offset from rest
    cannonJiggleL: 0, cannonJiggleVelL: 0,
    cannonJiggleR: 0, cannonJiggleVelR: 0,
    cannonBounceL: 0, cannonBounceVelL: 0,  // vertical bounce
    cannonBounceR: 0, cannonBounceVelR: 0,
    // Player input
    inputTorque: 0,
    tiltLeft: false, tiltRight: false,
    // Falling objects
    objs: [] as FallingObj[],
    spawnTimer: 0,
    // Debris (game over explosion)
    debris: [] as Debris[],
    // Score
    score: 0, scoreTimer: 0,
    // State
    expression: "normal" as "normal" | "worried" | "panic" | "shrug",
    t: 0, raf: 0, running: false,
    touchSX: 0,
    canvasW: 600, canvasH: 500,
    tableCX: 300, tableCY: 320,
  });

  const endGame = useCallback(() => {
    const g = G.current;
    g.running = false;
    g.expression = "shrug";
    const finalScore = Math.floor(g.score);
    const newHs = Math.max(finalScore, parseInt(localStorage.getItem(HS_KEY) || "0"));
    localStorage.setItem(HS_KEY, String(newHs));
    setHs(newHs);
    setScoreDisplay(finalScore);
    setGameOverLine(GAME_OVER_LINES[Math.floor(Math.random() * GAME_OVER_LINES.length)]);
    setSubmitted(false);

    // Spawn debris explosion
    const g2 = g;
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 9;
      g2.debris.push({
        x: g2.tableCX + (Math.random() - 0.5) * TABLE_W,
        y: g2.tableCY,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.25,
        life: 120,
        color: ["#fff", "#22cc55", "#cc1a00", "#ffdd00", "#aaddff"][Math.floor(Math.random() * 5)],
        label: ["NDA", "$$", "FIRED?", "HR!", "☕"][Math.floor(Math.random() * 5)],
        size: 16 + Math.random() * 20,
      });
    }
    setTimeout(() => setPhase("over"), 2200);
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = G.current;
    g.tableAngle = 0; g.tableAngularVel = (Math.random() - 0.5) * 0.005;
    g.cannonJiggleL = 0; g.cannonJiggleVelL = 0;
    g.cannonJiggleR = 0; g.cannonJiggleVelR = 0;
    g.cannonBounceL = 0; g.cannonBounceVelL = (Math.random() - 0.5) * 2;
    g.cannonBounceR = 0; g.cannonBounceVelR = (Math.random() - 0.5) * 2;
    g.inputTorque = 0; g.tiltLeft = false; g.tiltRight = false;
    g.objs = []; g.debris = [];
    g.score = 0; g.scoreTimer = 0; g.t = 0;
    g.expression = "normal"; g.running = true;
    g.canvasW = canvas.clientWidth; g.canvasH = canvas.clientHeight;
    g.tableCX = g.canvasW / 2;
    g.tableCY = g.canvasH * 0.6;
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
      G.current.canvasW = canvas.clientWidth;
      G.current.canvasH = canvas.clientHeight;
      G.current.tableCX = canvas.clientWidth / 2;
      G.current.tableCY = canvas.clientHeight * 0.6;
    };
    resize(); window.addEventListener("resize", resize);

    // Keyboard
    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") g.tiltLeft = e.type === "keydown";
      if (e.code === "ArrowRight" || e.code === "KeyD") g.tiltRight = e.type === "keydown";
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      G.current.touchSX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const g = G.current; if (!g.running) return;
      const tx = e.changedTouches[0].clientX;
      const dx = tx - g.touchSX;
      if (Math.abs(dx) > 12) {
        // swipe
        if (dx < 0) { g.tableAngularVel -= 0.022; }
        else { g.tableAngularVel += 0.022; }
      } else {
        // tap: left or right half
        if (tx < g.canvasW / 2) g.tableAngularVel -= 0.022;
        else g.tableAngularVel += 0.022;
      }
      kickCannons(g, dx < 0 ? -1 : 1);
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });

    // Mouse click fallback
    const onClick = (e: MouseEvent) => {
      const g = G.current; if (!g.running) return;
      if (e.clientX < g.canvasW / 2) { g.tableAngularVel -= 0.022; kickCannons(g, -1); }
      else { g.tableAngularVel += 0.022; kickCannons(g, 1); }
    };
    canvas.addEventListener("click", onClick);

    const kickCannons = (g: typeof G.current, dir: number) => {
      g.cannonJiggleVelL += dir * (3 + Math.random() * 4);
      g.cannonJiggleVelR -= dir * (3 + Math.random() * 4);
      g.cannonBounceVelL -= 2 + Math.random() * 3;
      g.cannonBounceVelR -= 2 + Math.random() * 3;
    };

    let lastTime = 0;
    const loop = (time: number) => {
      G.current.raf = requestAnimationFrame(loop);
      const g = G.current;
      const dt = Math.min((time - lastTime) / 16.67, 3); lastTime = time;
      const W = g.canvasW, H = g.canvasH;

      if (g.running) {
        g.t += dt;
        g.scoreTimer += dt;
        if (g.scoreTimer >= 60) { g.score += 1; g.scoreTimer = 0; }

        // Keyboard tilt
        if (g.tiltLeft) { g.tableAngularVel -= 0.0012 * dt; kickCannons(g, -0.05 * dt); }
        if (g.tiltRight) { g.tableAngularVel += 0.0012 * dt; kickCannons(g, 0.05 * dt); }

        // Table physics: gravity torque + damping + increasing difficulty
        const difficultyDrift = 0.00004 * dt * Math.min(g.score * 0.3, 3);
        g.tableAngularVel += Math.sin(g.tableAngle) * 0.008 * dt; // gravity
        g.tableAngularVel += (Math.random() - 0.5) * difficultyDrift; // random chaos
        g.tableAngularVel *= (1 - 0.018 * dt); // damping
        g.tableAngle += g.tableAngularVel * dt;

        // Cannon jiggle physics (spring + damping)
        const K = 0.04, DAMP = 0.88;
        // Horizontal jiggle: spring toward 0, pushed by tilt
        const tiltForceL = -g.tableAngle * 8;
        const tiltForceR = -g.tableAngle * 8;
        g.cannonJiggleVelL += (-K * g.cannonJiggleL + tiltForceL) * dt * 0.5;
        g.cannonJiggleVelL *= Math.pow(DAMP, dt);
        g.cannonJiggleL += g.cannonJiggleVelL * dt;
        g.cannonJiggleVelR += (-K * g.cannonJiggleR + tiltForceR) * dt * 0.5;
        g.cannonJiggleVelR *= Math.pow(DAMP, dt);
        g.cannonJiggleR += g.cannonJiggleVelR * dt;

        // Vertical bounce physics
        const KB = 0.06, DAMPB = 0.85;
        g.cannonBounceVelL += -KB * g.cannonBounceL * dt;
        g.cannonBounceVelL *= Math.pow(DAMPB, dt);
        g.cannonBounceL += g.cannonBounceVelL * dt;
        g.cannonBounceVelR += -KB * g.cannonBounceR * dt;
        g.cannonBounceVelR *= Math.pow(DAMPB, dt);
        g.cannonBounceR += g.cannonBounceVelR * dt;

        // Extra torque from cannon jiggle (they affect the balance!)
        const cannonTorque = (g.cannonJiggleL - g.cannonJiggleR) * 0.00008;
        g.tableAngularVel += cannonTorque * dt;

        // Spawn falling objects
        g.spawnTimer += dt;
        const spawnInterval = Math.max(55, 110 - g.score * 1.5);
        if (g.spawnTimer >= spawnInterval) {
          g.spawnTimer = 0;
          const type = OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)];
          const spawnX = g.tableCX + (Math.random() - 0.5) * TABLE_W * 1.4;
          g.objs.push({
            x: spawnX, y: -40, vy: 2.5 + Math.random() * 2, vx: (Math.random() - 0.5) * 1.5,
            angle: (Math.random() - 0.5) * 0.5, spin: (Math.random() - 0.5) * 0.06,
            landed: false, landedX: 0, slidingOff: false, type,
          });
        }

        // Update falling objects
        for (const obj of g.objs) {
          if (obj.slidingOff) {
            obj.landedX += Math.sin(g.tableAngle) * 3.5 * dt;
            obj.y += 2 * dt;
            obj.angle += 0.05 * dt;
            continue;
          }
          if (obj.landed) {
            // Slide off if table too tilted
            if (Math.abs(g.tableAngle) > 0.3) obj.slidingOff = true;
            continue;
          }
          obj.x += obj.vx * dt;
          obj.y += obj.vy * dt;
          obj.angle += obj.spin * dt;

          // Check if object hits table surface
          // Table surface is at tableCY ± TABLE_H/2 in world space, rotated by tableAngle
          // Simplified: check if obj.y > tableCY - TABLE_H/2 and obj.x is within table width
          // Transform obj position into table local coordinates
          const relX = obj.x - g.tableCX;
          const relY = obj.y - g.tableCY;
          const localX = relX * Math.cos(-g.tableAngle) - relY * Math.sin(-g.tableAngle);
          const localY = relX * Math.sin(-g.tableAngle) + relY * Math.cos(-g.tableAngle);
          if (localX > -TABLE_W / 2 && localX < TABLE_W / 2 && localY > -TABLE_H / 2 - 4 && localY < TABLE_H / 2) {
            obj.landed = true;
            obj.landedX = localX;
            // Apply torque based on where it landed
            const torque = (localX / (TABLE_W / 2)) * obj.type.weight * 0.005;
            g.tableAngularVel += torque;
            // Kick cannons when something lands
            g.cannonBounceVelL -= 1.5 + Math.random();
            g.cannonBounceVelR -= 1.5 + Math.random();
          }
        }
        g.objs = g.objs.filter(o => o.y < H + 80 && !(o.slidingOff && o.y > H + 20));

        // Expression based on angle
        const absAngle = Math.abs(g.tableAngle);
        if (absAngle > MAX_ANGLE * 0.75) g.expression = "panic";
        else if (absAngle > MAX_ANGLE * 0.45) g.expression = "worried";
        else g.expression = "normal";

        // Game over check
        if (Math.abs(g.tableAngle) >= MAX_ANGLE) {
          g.expression = "shrug";
          endGame();
        }
      } else {
        g.t += dt;
        // Keep cannon jiggling on game over (it's funny)
        const K = 0.025, DAMP = 0.92;
        g.cannonJiggleVelL += (-K * g.cannonJiggleL + (Math.random()-0.5)*0.5) * dt;
        g.cannonJiggleVelL *= Math.pow(DAMP, dt);
        g.cannonJiggleL += g.cannonJiggleVelL * dt;
        g.cannonJiggleVelR += (-K * g.cannonJiggleR + (Math.random()-0.5)*0.5) * dt;
        g.cannonJiggleVelR *= Math.pow(DAMP, dt);
        g.cannonJiggleR += g.cannonJiggleVelR * dt;
        g.cannonBounceVelL += (-0.04 * g.cannonBounceL) * dt;
        g.cannonBounceVelL *= Math.pow(0.88, dt);
        g.cannonBounceL += g.cannonBounceVelL * dt;
        g.cannonBounceVelR += (-0.04 * g.cannonBounceR) * dt;
        g.cannonBounceVelR *= Math.pow(0.88, dt);
        g.cannonBounceR += g.cannonBounceVelR * dt;
      }

      // Update debris
      for (const d of g.debris) {
        d.x += d.vx; d.y += d.vy; d.vy += 0.3; d.vx *= 0.97;
        d.angle += d.spin; d.life--;
      }
      g.debris = g.debris.filter(d => d.life > 0);

      draw(ctx, W, H, g);
    };

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, g: typeof G.current) => {
      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#06080f"); bgGrad.addColorStop(1, "#0a0a0f");
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(0,247,192,0.03)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Boardroom wall decorations
      // Stock ticker tape
      ctx.fillStyle = "rgba(0,247,192,0.07)"; ctx.fillRect(0, H * 0.15, W, 28);
      ctx.font = "bold 9px monospace"; ctx.fillStyle = "rgba(0,247,192,0.3)";
      ctx.textBaseline = "middle";
      const tickerStr = "  JPM ▲2.4%  MS ▼1.1%  GS ▲0.8%  CANNONS ▲∞%  HR ▼99%  COMPLIANCE ▲??%  ";
      const tickerOffset = (g.t * 1.2) % (tickerStr.length * 6.5);
      ctx.fillText(tickerStr.repeat(3), -tickerOffset, H * 0.15 + 14);

      // "HR WARNING" sign on wall
      ctx.fillStyle = "rgba(200,26,0,0.15)"; ctx.strokeStyle = "rgba(200,26,0,0.5)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(W * 0.05, H * 0.25, 140, 52, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ff6622"; ctx.font = "bold 8px 'Orbitron', monospace"; ctx.textAlign = "center";
      ctx.fillText("⚠️ CANNON ACTIVITY", W * 0.05 + 70, H * 0.25 + 18);
      ctx.fillText("REPORT TO HR ASAP", W * 0.05 + 70, H * 0.25 + 32);
      ctx.fillStyle = "#ff4400"; ctx.font = "bold 7px monospace";
      ctx.fillText("(they're always like this)", W * 0.05 + 70, H * 0.25 + 45);

      // Whiteboard
      ctx.fillStyle = "rgba(240,240,240,0.06)"; ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(W * 0.68, H * 0.22, 150, 100, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(0,247,192,0.4)"; ctx.font = "bold 8px 'Orbitron', monospace"; ctx.textAlign = "center";
      ctx.fillText("Q3 TARGETS:", W * 0.68 + 75, H * 0.22 + 18);
      ctx.fillStyle = "rgba(200,26,0,0.7)";
      ctx.font = "7px monospace"; ctx.textAlign = "left";
      const wbLines = ["• More cannons", "• Keep table level", "• Deny everything", "• ??? ", "• Profit"];
      wbLines.forEach((l, i) => ctx.fillText(l, W * 0.68 + 10, H * 0.22 + 34 + i * 14));

      // Angle meter (tilt indicator)
      const meterX = W - 38, meterY = H * 0.35, meterH = 160;
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.strokeStyle = "rgba(0,247,192,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(meterX - 10, meterY, 20, meterH, 4); ctx.fill(); ctx.stroke();
      const fillH = (Math.abs(g.tableAngle) / MAX_ANGLE) * (meterH - 6);
      const dangerColor = g.tableAngle > 0
        ? `rgba(${Math.floor(fillH / (meterH - 6) * 255)},${Math.floor((1 - fillH / (meterH - 6)) * 200)},0,0.8)`
        : `rgba(${Math.floor(fillH / (meterH - 6) * 255)},${Math.floor((1 - fillH / (meterH - 6)) * 200)},0,0.8)`;
      ctx.fillStyle = dangerColor;
      ctx.beginPath(); ctx.roundRect(meterX - 7, meterY + 3 + (meterH - 6 - fillH), 14, fillH, 3); ctx.fill();
      ctx.fillStyle = "rgba(0,247,192,0.5)"; ctx.font = "bold 6px 'Orbitron', monospace";
      ctx.textAlign = "center"; ctx.fillText("TILT", meterX, meterY - 8);

      // Falling objects (not landed)
      for (const obj of g.objs) if (!obj.landed) drawFallingObj(ctx, obj);

      // Table + landed objects
      const landedObjs = g.objs.filter(o => o.landed);
      drawTable(ctx, g.tableCX, g.tableCY, g.tableAngle, landedObjs, g.t);

      // Exec on table
      const execX = g.tableCX - g.tableAngle * 30;
      const execY = g.tableCY - TABLE_H / 2 - 8;
      drawExec(ctx, execX, execY,
        g.cannonJiggleL, g.cannonJiggleR,
        g.cannonBounceL, g.cannonBounceR,
        g.expression, g.tableAngle, g.t);

      // Debris
      for (const d of g.debris) {
        ctx.save(); ctx.globalAlpha = Math.min(1, d.life / 30);
        ctx.translate(d.x, d.y); ctx.rotate(d.angle);
        ctx.fillStyle = d.color; ctx.font = `bold ${d.size}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(d.label, 0, 0);
        ctx.globalAlpha = 1; ctx.restore();
      }

      // Angle warning flash
      if (Math.abs(g.tableAngle) > MAX_ANGLE * 0.75 && g.running) {
        ctx.fillStyle = `rgba(255,0,0,${0.06 + Math.sin(g.t * 0.3) * 0.04})`;
        ctx.fillRect(0, 0, W, H);
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.82)"; ctx.fillRect(0, 0, W, 46);
      ctx.strokeStyle = "rgba(0,247,192,0.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(W, 46); ctx.stroke();
      ctx.font = "bold 12px 'Orbitron', monospace"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
      ctx.fillStyle = NEON; ctx.fillText(`BALANCED: ${Math.floor(g.score)}s`, 12, 23);
      ctx.fillStyle = "#fff"; ctx.textAlign = "right";
      ctx.fillText(`BEST: ${Math.max(Math.floor(g.score), parseInt(localStorage.getItem(HS_KEY)||"0"))}s`, W - 12, 23);

      // Tap hints (fades out after 5s)
      if (g.t < 300 && g.running) {
        ctx.globalAlpha = Math.max(0, 1 - g.t / 200);
        ctx.fillStyle = "rgba(0,247,192,0.7)"; ctx.font = "bold 11px 'Orbitron', monospace";
        ctx.textAlign = "center";
        ctx.fillText("← TAP LEFT    TAP RIGHT →", W / 2, H - 30);
        ctx.globalAlpha = 1;
      }
    };

    G.current.raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(G.current.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("click", onClick);
    };
  }, [endGame]);

  return (
    <div className="fixed inset-0 bg-[#06080f] flex flex-col" style={{ fontFamily: "'Orbitron', monospace" }}>
      <canvas ref={canvasRef} className="flex-1 w-full h-full" style={{ display: "block" }} />

      {phase === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-md w-full">
            <div className="text-4xl mb-3">⚖️</div>
            <h1 className="text-[#00f7c0] font-black text-2xl mb-1 leading-tight" style={{ textShadow: "0 0 20px #00f7c0" }}>
              CANNON BOARDROOM
            </h1>
            <h2 className="text-white font-black text-3xl mb-4">BALANCE</h2>
            <div className="bg-white/5 border border-[#00f7c0]/20 rounded-2xl p-4 mb-6 text-sm text-white/70 space-y-2">
              <p>🎯 <span className="text-[#00f7c0] font-bold">Goal:</span> Keep the wobbly table balanced!</p>
              <p>💥 The cannons jiggle and tip the table — hilarious chaos ensues.</p>
              <p>📄 Falling office items make it even harder to balance.</p>
              <p className="text-white/50 text-xs pt-1">Tap left/right · swipe · or ← → keys</p>
            </div>
            <button onClick={startGame} className="bg-[#00f7c0] text-black font-black text-xl px-12 py-4 rounded-xl w-full hover:bg-white transition-colors mb-3">
              PLAY
            </button>
            <Link href="/" className="block text-[#00f7c0]/60 text-sm hover:text-[#00f7c0] text-center">← Back to Arcade</Link>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85">
          <div className="text-center px-6 max-w-sm w-full">
            <div className="text-5xl mb-2">💥</div>
            <p className="text-red-400 font-black text-2xl mb-1">{gameOverLine}</p>
            <p className="text-white/60 text-sm mb-4 italic">The cannons kept bouncing. Obviously.</p>
            <p className="text-[#00f7c0] text-4xl font-black mb-1">{scoreDisplay}<span className="text-lg">s</span></p>
            <p className="text-white/40 text-xs mb-5">Table Balanced · Best: {hs}s</p>

            {!submitted ? (
              <div className="mb-4">
                <p className="text-white/60 text-xs mb-2">Enter your name for the leaderboard:</p>
                <input
                  type="text" maxLength={24} placeholder="Your name"
                  value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-white/10 border border-[#00f7c0]/40 text-white text-center rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-[#00f7c0]"
                />
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
