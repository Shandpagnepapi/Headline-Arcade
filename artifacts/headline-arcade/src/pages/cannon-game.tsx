import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

const HS_KEY = "headlineArcade_boardroomBalance_highScore";
const NEON = "#00f7c0";
const TABLE_W = 420;
const TABLE_H = 22;
const MAX_ANGLE = 0.72;

const GAME_OVER_LINES = [
  "MEETING OVER!",
  "BONUS DENIED!",
  "HR HAS ENTERED THE CHAT.",
  "COMPLIANCE REVIEW INITIATED.",
  "THE CANNONS WERE NOT PRICED IN.",
  "BALANCE SHEET UNBALANCED.",
];

const OBJECT_TYPES = [
  { label: "NDA", color: "#fff", bg: "#cc1a00", w: 42, h: 30, weight: 1.0 },
  { label: "COFFEE ☕", color: "#fff", bg: "#5c3317", w: 38, h: 34, weight: 0.7 },
  { label: "BONUS 💰", color: "#000", bg: "#22cc55", w: 50, h: 26, weight: 0.5 },
  { label: "HR FORM", color: "#fff", bg: "#aa00cc", w: 44, h: 30, weight: 1.2 },
  { label: "📱 PHONE", color: "#fff", bg: "#222244", w: 28, h: 44, weight: 0.9 },
  { label: "TICKER 📈", color: "#00ff88", bg: "#001a00", w: 56, h: 24, weight: 0.4 },
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

/* ──────────────────────────────────────────────
   EXEC CHARACTER – based on the reference image:
   curvy cartoon exec, voluminous brown hair,
   thick-rimmed glasses, black blazer, white shirt,
   exaggerated bust with spring jiggle physics.
────────────────────────────────────────────── */
function drawExec(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  jiggleL: number, jiggleR: number,
  bounceL: number, bounceR: number,
  expression: "normal" | "worried" | "panic" | "shrug",
  tilt: number,
  t: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.translate(-tilt * 12, 0);

  // ── Shadow ──
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 8, 30, 7, 0, 0, Math.PI * 2); ctx.fill();

  // ── Legs + heels (pencil skirt covers upper legs) ──
  // Stockings
  ctx.fillStyle = "#1a0a0a";
  ctx.beginPath(); ctx.roundRect(-11, 14, 9, 30, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(2, 14, 9, 30, 3); ctx.fill();
  // Heels
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.roundRect(-14, 41, 12, 6, [2,2,0,0]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-12, 47, 4, 7, 2); ctx.fill(); // heel
  ctx.beginPath(); ctx.roundRect(2, 41, 12, 6, [2,2,0,0]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(8, 47, 4, 7, 2); ctx.fill();

  // ── Pencil skirt ──
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath(); ctx.roundRect(-18, 8, 36, 22, [0,0,6,6]); ctx.fill();
  ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-18, 14); ctx.lineTo(18, 14); ctx.stroke(); // waist seam

  // ── Jacket base ──
  ctx.fillStyle = "#1c1c1c";
  ctx.beginPath(); ctx.roundRect(-24, -36, 48, 48, 5); ctx.fill();

  // ── White shirt visible in jacket opening ──
  ctx.fillStyle = "#f0f0f0";
  ctx.beginPath();
  ctx.moveTo(-6, -36);
  ctx.lineTo(-8, 8);
  ctx.lineTo(8, 8);
  ctx.lineTo(6, -36);
  ctx.closePath(); ctx.fill();

  // ── THE CANNONS — exaggerated cartoon bust with jiggle physics ──
  // Left cannon
  const lx = -12 + jiggleL * 0.85;
  const ly = -18 + bounceL;
  ctx.save();
  ctx.translate(lx, ly);
  // Main shape
  const gradL = ctx.createRadialGradient(-4, -5, 2, 0, 0, 20);
  gradL.addColorStop(0, "#fce0c0");
  gradL.addColorStop(0.6, "#f4c090");
  gradL.addColorStop(1, "#d49060");
  ctx.fillStyle = gradL;
  ctx.beginPath(); ctx.ellipse(0, 0, 19, 17, -0.15, 0, Math.PI * 2); ctx.fill();
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath(); ctx.ellipse(-5, -5, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Right cannon
  const rx = 12 + jiggleR * 0.85;
  const ry = -18 + bounceR;
  ctx.save();
  ctx.translate(rx, ry);
  const gradR = ctx.createRadialGradient(-4, -5, 2, 0, 0, 20);
  gradR.addColorStop(0, "#fce0c0");
  gradR.addColorStop(0.6, "#f4c090");
  gradR.addColorStop(1, "#d49060");
  ctx.fillStyle = gradR;
  ctx.beginPath(); ctx.ellipse(0, 0, 19, 17, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath(); ctx.ellipse(-5, -5, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── Jacket lapels (overlay over cannons' lower portion) ──
  ctx.fillStyle = "#1c1c1c";
  // Left lapel
  ctx.beginPath();
  ctx.moveTo(-24, -36);
  ctx.lineTo(-6, -10);
  ctx.lineTo(-6, 12);
  ctx.lineTo(-24, 12);
  ctx.closePath(); ctx.fill();
  // Right lapel
  ctx.beginPath();
  ctx.moveTo(24, -36);
  ctx.lineTo(6, -10);
  ctx.lineTo(6, 12);
  ctx.lineTo(24, 12);
  ctx.closePath(); ctx.fill();
  // Jacket outline stitching
  ctx.strokeStyle = "#2a2a2a"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-24, -36); ctx.lineTo(-6, -10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(24, -36); ctx.lineTo(6, -10); ctx.stroke();

  // ── Jacket shoulders (power suit) ──
  ctx.fillStyle = "#222";
  ctx.beginPath(); ctx.roundRect(-28, -38, 16, 10, [6,6,0,0]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(12, -38, 16, 10, [6,6,0,0]); ctx.fill();

  // ── Arms ──
  if (expression === "shrug") {
    // Both arms up shrug
    ctx.fillStyle = "#1c1c1c";
    ctx.save(); ctx.translate(-28, -28); ctx.rotate(-0.85);
    ctx.beginPath(); ctx.roundRect(-5, -5, 11, 22, 4); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(28, -28); ctx.rotate(0.85);
    ctx.beginPath(); ctx.roundRect(-6, -5, 11, 22, 4); ctx.fill(); ctx.restore();
    // hands
    const skin = "#f4c090";
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(-40, -36, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(40, -36, 7, 0, Math.PI * 2); ctx.fill();
  } else {
    // Right arm out holding coffee cup
    ctx.fillStyle = "#1c1c1c";
    ctx.save(); ctx.translate(28, -22); ctx.rotate(0.4);
    ctx.beginPath(); ctx.roundRect(-5, -5, 10, 24, 4); ctx.fill();
    // Hand + coffee
    ctx.translate(2, 22);
    ctx.fillStyle = "#f4c090"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    // Coffee cup
    ctx.fillStyle = "#8B5E3C"; ctx.strokeStyle = "#5c3317"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(-7, 2, 14, 18, [0,0,3,3]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.roundRect(-7, 2, 14, 5, [0,0,0,0]); ctx.fill(); // lid
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "bold 7px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("JP", 0, 11);
    ctx.restore();

    // Left arm at waist
    ctx.fillStyle = "#1c1c1c";
    ctx.save(); ctx.translate(-28, -10); ctx.rotate(-0.15);
    ctx.beginPath(); ctx.roundRect(-5, -5, 10, 20, 4); ctx.fill();
    ctx.fillStyle = "#f4c090"; ctx.beginPath(); ctx.arc(0, 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ── Necklace ──
  ctx.strokeStyle = "#d4a000"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -38, 10, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = "#d4a000"; ctx.beginPath(); ctx.arc(0, -28, 3, 0, Math.PI * 2); ctx.fill();

  // ── Head ──
  ctx.fillStyle = "#f4c090";
  ctx.beginPath(); ctx.arc(0, -56, 24, 0, Math.PI * 2); ctx.fill();
  // Chin/jaw shape
  ctx.beginPath(); ctx.ellipse(0, -40, 16, 10, 0, 0, Math.PI); ctx.fill();

  // ── Voluminous Brown Hair ──
  const hairShake = expression === "panic" ? Math.sin(t * 0.22) * 7 : tilt * 10;
  ctx.fillStyle = "#4a2810";
  // Back hair mass
  ctx.beginPath();
  ctx.ellipse(0, -58, 30, 28, 0, 0, Math.PI * 2); ctx.fill();
  // Left wave
  ctx.beginPath();
  ctx.moveTo(-24, -52);
  ctx.bezierCurveTo(-42 + hairShake * 0.3, -72, -36 + hairShake * 0.4, -84, -14 + hairShake * 0.3, -82);
  ctx.bezierCurveTo(-10, -80, -16, -68, -24, -52); ctx.fill();
  // Right wave
  ctx.fillStyle = "#5a3318";
  ctx.beginPath();
  ctx.moveTo(24, -52);
  ctx.bezierCurveTo(40 + hairShake * 0.3, -68, 38 + hairShake * 0.35, -82, 16 + hairShake * 0.25, -82);
  ctx.bezierCurveTo(12, -80, 18, -66, 24, -52); ctx.fill();
  // Top volume
  ctx.fillStyle = "#3d2008";
  ctx.beginPath();
  ctx.ellipse(hairShake * 0.2, -76, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
  // Hair highlights
  ctx.fillStyle = "rgba(180,120,60,0.3)";
  ctx.beginPath(); ctx.ellipse(-8 + hairShake*0.1, -72, 8, 14, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10 + hairShake*0.1, -74, 10, 16, 0.2, 0, Math.PI * 2); ctx.fill();

  // ── Face skin (redraw over hair) ──
  ctx.fillStyle = "#f4c090";
  ctx.beginPath(); ctx.arc(0, -56, 21, 0, Math.PI * 2); ctx.fill();

  // ── Pearl earrings ──
  ctx.fillStyle = "#f5f0ee";
  ctx.strokeStyle = "#ccc"; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.arc(-21, -52, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(21, -52, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // ── Glasses (thick black rims) ──
  const gly = -60; // glasses Y
  ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  // Left lens
  ctx.strokeRect(-20, gly - 6, 15, 11);
  // Right lens
  ctx.strokeRect(5, gly - 6, 15, 11);
  // Bridge
  ctx.beginPath(); ctx.moveTo(-5, gly - 1); ctx.lineTo(5, gly - 1); ctx.stroke();
  // Temples
  ctx.beginPath(); ctx.moveTo(-20, gly - 1); ctx.lineTo(-28, gly - 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(20, gly - 1); ctx.lineTo(28, gly - 4); ctx.stroke();
  // Lens tint
  ctx.fillStyle = "rgba(150,200,255,0.08)";
  ctx.fillRect(-20, gly - 6, 15, 11); ctx.fillRect(5, gly - 6, 15, 11);
  // Pupils behind glasses
  ctx.fillStyle = "#4a2010";
  ctx.beginPath(); ctx.arc(-12, gly - 1, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12, gly - 1, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-10.5, gly - 2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(13.5, gly - 2, 1.5, 0, Math.PI * 2); ctx.fill();

  // ── Eyebrows ──
  ctx.strokeStyle = "#2c1a0a"; ctx.lineWidth = 2;
  if (expression === "panic" || expression === "worried") {
    ctx.beginPath(); ctx.moveTo(-20, gly - 10); ctx.lineTo(-6, gly - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, gly - 10); ctx.lineTo(6, gly - 8); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-20, gly - 9); ctx.quadraticCurveTo(-13, gly - 13, -6, gly - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, gly - 9); ctx.quadraticCurveTo(13, gly - 13, 6, gly - 9); ctx.stroke();
  }

  // ── Mouth ──
  ctx.strokeStyle = "#b06040"; ctx.lineWidth = 1.8;
  const mouthY = -47;
  if (expression === "panic") {
    // Open mouth (o shape)
    ctx.fillStyle = "#cc4040"; ctx.beginPath(); ctx.ellipse(0, mouthY, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Sweat
    ctx.fillStyle = "#aaddff";
    ctx.beginPath(); ctx.ellipse(26, -54, 3, 5, 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (expression === "shrug") {
    ctx.beginPath(); ctx.moveTo(-5, mouthY); ctx.lineTo(5, mouthY); ctx.stroke();
  } else if (expression === "worried") {
    ctx.beginPath(); ctx.arc(0, mouthY + 3, 6, Math.PI + 0.3, -0.3, false); ctx.stroke();
  } else {
    // Confident smile
    ctx.beginPath(); ctx.arc(0, mouthY - 1, 7, 0.1, Math.PI - 0.1, false); ctx.stroke();
    ctx.fillStyle = "#cc6666"; ctx.beginPath(); ctx.arc(0, mouthY + 2, 4, 0.1, Math.PI - 0.1); ctx.fill();
  }

  // ── Rosy cheeks ──
  ctx.fillStyle = "rgba(255,150,130,0.25)";
  ctx.beginPath(); ctx.ellipse(-16, -50, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(16, -50, 7, 5, 0, 0, Math.PI * 2); ctx.fill();

  // ── Speech bubble on shrug ──
  if (expression === "shrug") {
    ctx.fillStyle = "#fffbe6"; ctx.strokeStyle = "#cc1a00"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(18, -115, 110, 44, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, -71); ctx.lineTo(18, -60); ctx.lineTo(40, -71); ctx.fill();
    ctx.fillStyle = "#cc1a00"; ctx.font = "bold 8px 'Orbitron', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("already priced in!", 73, -100);
    ctx.fillText("¯\\_(ツ)_/¯", 73, -86);
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

  // Table surface
  ctx.fillStyle = "#1a3040";
  ctx.beginPath(); ctx.roundRect(-TABLE_W / 2, -TABLE_H / 2, TABLE_W, TABLE_H, 6); ctx.fill();
  ctx.strokeStyle = "rgba(0,247,192,0.4)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-TABLE_W / 2, -TABLE_H / 2, TABLE_W, TABLE_H, 6); ctx.stroke();

  // Wood grain
  ctx.strokeStyle = "rgba(0,247,192,0.06)"; ctx.lineWidth = 1;
  for (let xi = -TABLE_W / 2 + 20; xi < TABLE_W / 2; xi += 28) {
    const w = Math.sin(xi * 0.05 + t * 0.02) * 2;
    ctx.beginPath(); ctx.moveTo(xi, -TABLE_H / 2 + 3 + w); ctx.lineTo(xi + 6, TABLE_H / 2 - 3 + w); ctx.stroke();
  }

  // Table legs
  ctx.fillStyle = "#0d2030"; ctx.strokeStyle = "rgba(0,247,192,0.25)"; ctx.lineWidth = 1.5;
  for (const lx of [-TABLE_W / 2 + 28, TABLE_W / 2 - 28]) {
    ctx.beginPath(); ctx.roundRect(lx - 8, TABLE_H / 2, 16, 36, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(lx - 12, TABLE_H / 2 + 32, 24, 6, 2); ctx.fill(); ctx.stroke();
  }

  // Landed objects
  for (const obj of landedObjs) {
    if (!obj.slidingOff) {
      ctx.save();
      ctx.translate(obj.landedX, -TABLE_H / 2 - obj.type.h / 2);
      ctx.rotate(obj.angle);
      ctx.fillStyle = obj.type.bg; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-obj.type.w / 2, -obj.type.h / 2, obj.type.w, obj.type.h, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = obj.type.color; ctx.font = "bold 8px 'Orbitron', monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(obj.type.label, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawFallingObj(ctx: CanvasRenderingContext2D, obj: FallingObj) {
  ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(obj.angle);
  ctx.fillStyle = obj.type.bg; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-obj.type.w / 2, -obj.type.h / 2, obj.type.w, obj.type.h, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = obj.type.color; ctx.font = "bold 8px 'Orbitron', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(obj.type.label, 0, 0);
  ctx.restore();
}

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
    tableAngle: 0, tableAngularVel: 0,
    jiggleL: 0, velJiggleL: 0,
    jiggleR: 0, velJiggleR: 0,
    bounceL: 0, velBounceL: 0,
    bounceR: 0, velBounceR: 0,
    // All hold-input flags (keyboard + mouse)
    holdLeft: false, holdRight: false,
    // Touch
    touchSX: 0,
    objs: [] as FallingObj[],
    debris: [] as Debris[],
    spawnTimer: 0,
    score: 0, scoreTimer: 0,
    expression: "normal" as "normal" | "worried" | "panic" | "shrug",
    t: 0, raf: 0, running: false,
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
    setHs(newHs); setScoreDisplay(finalScore);
    setGameOverLine(GAME_OVER_LINES[Math.floor(Math.random() * GAME_OVER_LINES.length)]);
    setSubmitted(false);
    // Debris explosion
    for (let i = 0; i < 32; i++) {
      const a = Math.random() * Math.PI * 2, spd = 3 + Math.random() * 10;
      g.debris.push({
        x: g.tableCX + (Math.random() - 0.5) * TABLE_W,
        y: g.tableCY,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 5,
        angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.3,
        life: 130,
        color: ["#fff", "#22cc55", "#cc1a00", "#ffdd00", "#aaddff", "#ff88ff"][Math.floor(Math.random() * 6)],
        label: ["NDA", "$$", "FIRED?", "HR!", "☕", "WTF"][Math.floor(Math.random() * 6)],
        size: 14 + Math.random() * 22,
      });
    }
    setTimeout(() => setPhase("over"), 2400);
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = G.current;
    g.tableAngle = 0; g.tableAngularVel = (Math.random() - 0.5) * 0.005;
    g.jiggleL = 0; g.velJiggleL = 0; g.jiggleR = 0; g.velJiggleR = 0;
    g.bounceL = 0; g.velBounceL = (Math.random() - 0.5) * 1.5;
    g.bounceR = 0; g.velBounceR = (Math.random() - 0.5) * 1.5;
    g.holdLeft = false; g.holdRight = false;
    g.objs = []; g.debris = [];
    g.score = 0; g.scoreTimer = 0; g.t = 0;
    g.expression = "normal"; g.running = true;
    g.canvasW = canvas.clientWidth; g.canvasH = canvas.clientHeight;
    g.tableCX = g.canvasW / 2; g.tableCY = g.canvasH * 0.6;
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

    // ── Keyboard: hold for continuous tilt ──
    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") g.holdLeft = e.type === "keydown";
      if (e.code === "ArrowRight" || e.code === "KeyD") g.holdRight = e.type === "keydown";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    // ── Mouse: hold LMB on left/right half for continuous tilt ──
    const onMouseDown = (e: MouseEvent) => {
      const g = G.current; if (!g.running) return;
      if (e.clientX < g.canvasW / 2) g.holdLeft = true;
      else g.holdRight = true;
    };
    const onMouseUp = () => {
      G.current.holdLeft = false; G.current.holdRight = false;
    };
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // ── Touch: swipe or tap ──
    const onTouchStart = (e: TouchEvent) => { G.current.touchSX = e.touches[0].clientX; };
    const onTouchEnd = (e: TouchEvent) => {
      const g = G.current; if (!g.running) return;
      const tx = e.changedTouches[0].clientX;
      const dx = tx - g.touchSX;
      const dir = Math.abs(dx) > 14 ? (dx < 0 ? -1 : 1) : (tx < g.canvasW / 2 ? -1 : 1);
      g.tableAngularVel += dir * 0.026;
      kickCannons(g, dir);
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });

    const kickCannons = (g: typeof G.current, dir: number, strength = 1) => {
      g.velJiggleL += dir * (2.5 + Math.random() * 3.5) * strength;
      g.velJiggleR -= dir * (2.5 + Math.random() * 3.5) * strength;
      g.velBounceL -= (1.5 + Math.random() * 2) * strength;
      g.velBounceR -= (1.5 + Math.random() * 2) * strength;
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
        if (g.scoreTimer >= 60) { g.score++; g.scoreTimer = 0; }

        // Hold input: smooth continuous torque (much better than click impulse)
        const holdStrength = 0.0022;
        if (g.holdLeft) {
          g.tableAngularVel -= holdStrength * dt;
          kickCannons(g, -1, 0.04 * dt);
        }
        if (g.holdRight) {
          g.tableAngularVel += holdStrength * dt;
          kickCannons(g, 1, 0.04 * dt);
        }

        // Table physics
        const diff = 0.00005 * dt * Math.min(g.score * 0.4, 4);
        g.tableAngularVel += Math.sin(g.tableAngle) * 0.009 * dt;
        g.tableAngularVel += (Math.random() - 0.5) * diff;
        g.tableAngularVel *= Math.pow(0.982, dt);
        g.tableAngle += g.tableAngularVel * dt;

        // Cannon jiggle (horizontal spring)
        const K = 0.038, D = 0.87;
        const tF = -g.tableAngle * 7;
        g.velJiggleL += (-K * g.jiggleL + tF) * dt * 0.45;
        g.velJiggleL *= Math.pow(D, dt);
        g.jiggleL += g.velJiggleL * dt;
        g.velJiggleR += (-K * g.jiggleR + tF) * dt * 0.45;
        g.velJiggleR *= Math.pow(D, dt);
        g.jiggleR += g.velJiggleR * dt;

        // Cannon bounce (vertical spring)
        const KB = 0.055, DB = 0.84;
        g.velBounceL += -KB * g.bounceL * dt;
        g.velBounceL *= Math.pow(DB, dt);
        g.bounceL += g.velBounceL * dt;
        g.velBounceR += -KB * g.bounceR * dt;
        g.velBounceR *= Math.pow(DB, dt);
        g.bounceR += g.velBounceR * dt;

        // Cannon jiggle affects balance
        g.tableAngularVel += (g.jiggleL - g.jiggleR) * 0.00009 * dt;

        // Spawn objects
        g.spawnTimer += dt;
        const spawnInt = Math.max(52, 108 - g.score * 1.4);
        if (g.spawnTimer >= spawnInt) {
          g.spawnTimer = 0;
          const type = OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)];
          const sx = g.tableCX + (Math.random() - 0.5) * TABLE_W * 1.3;
          g.objs.push({
            x: sx, y: -40, vy: 2.2 + Math.random() * 2, vx: (Math.random() - 0.5) * 1.5,
            angle: (Math.random() - 0.5) * 0.5, spin: (Math.random() - 0.5) * 0.06,
            landed: false, landedX: 0, slidingOff: false, type,
          });
        }

        // Update objects
        for (const obj of g.objs) {
          if (obj.slidingOff) {
            obj.landedX += Math.sin(g.tableAngle) * 3.5 * dt;
            obj.y += 2 * dt; obj.angle += 0.06 * dt;
            continue;
          }
          if (obj.landed) { if (Math.abs(g.tableAngle) > 0.28) obj.slidingOff = true; continue; }
          obj.x += obj.vx * dt; obj.y += obj.vy * dt; obj.angle += obj.spin * dt;
          // Collision with rotated table
          const rx = obj.x - g.tableCX, ry = obj.y - g.tableCY;
          const lx = rx * Math.cos(-g.tableAngle) - ry * Math.sin(-g.tableAngle);
          const ly = rx * Math.sin(-g.tableAngle) + ry * Math.cos(-g.tableAngle);
          if (lx > -TABLE_W / 2 && lx < TABLE_W / 2 && ly > -TABLE_H / 2 - 6 && ly < TABLE_H / 2) {
            obj.landed = true; obj.landedX = lx;
            g.tableAngularVel += (lx / (TABLE_W / 2)) * obj.type.weight * 0.006;
            kickCannons(g, 0, 0.8);
          }
        }
        g.objs = g.objs.filter(o => o.y < H + 80 && !(o.slidingOff && o.y > H + 20));

        const abs = Math.abs(g.tableAngle);
        g.expression = abs > MAX_ANGLE * 0.75 ? "panic" : abs > MAX_ANGLE * 0.44 ? "worried" : "normal";

        if (Math.abs(g.tableAngle) >= MAX_ANGLE) endGame();
      } else {
        // Idle jiggle (funny on game over)
        g.t += dt;
        const idle = (v: number, x: number) => { v += (-0.022 * x + (Math.random()-0.5)*0.4) * dt; return v * Math.pow(0.92, dt); };
        g.velJiggleL = idle(g.velJiggleL, g.jiggleL); g.jiggleL += g.velJiggleL * dt;
        g.velJiggleR = idle(g.velJiggleR, g.jiggleR); g.jiggleR += g.velJiggleR * dt;
        g.velBounceL += -0.035 * g.bounceL * dt; g.velBounceL *= Math.pow(0.89, dt); g.bounceL += g.velBounceL * dt;
        g.velBounceR += -0.035 * g.bounceR * dt; g.velBounceR *= Math.pow(0.89, dt); g.bounceR += g.velBounceR * dt;
      }

      // Debris
      for (const d of g.debris) {
        d.x += d.vx; d.y += d.vy; d.vy += 0.28; d.vx *= 0.97; d.angle += d.spin; d.life--;
      }
      g.debris = g.debris.filter(d => d.life > 0);

      draw(ctx, W, H, g);
    };

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, g: typeof G.current) => {
      // BG
      ctx.fillStyle = "#06080f"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(0,247,192,0.025)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Stock ticker
      ctx.fillStyle = "rgba(0,247,192,0.06)"; ctx.fillRect(0, H * 0.14, W, 28);
      ctx.font = "bold 9px monospace"; ctx.fillStyle = "rgba(0,247,192,0.28)"; ctx.textBaseline = "middle";
      const tk = "  JPM ▲2.4%  GS ▲0.8%  CANNONS ▲∞%  HR ▼99%  COMPLIANCE ▲??%  BONUS ▼¿?%  ";
      const toff = (g.t * 1.1) % (tk.length * 6.5);
      ctx.fillText(tk.repeat(3), -toff, H * 0.14 + 14);

      // HR warning sign
      ctx.fillStyle = "rgba(180,20,0,0.12)"; ctx.strokeStyle = "rgba(200,26,0,0.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(W * 0.04, H * 0.24, 148, 56, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ff6622"; ctx.font = "bold 8px 'Orbitron', monospace"; ctx.textAlign = "center";
      ctx.fillText("⚠ CANNON ACTIVITY", W * 0.04 + 74, H * 0.24 + 18);
      ctx.fillText("REPORT TO HR ASAP", W * 0.04 + 74, H * 0.24 + 32);
      ctx.fillStyle = "#ff4400"; ctx.font = "bold 7px monospace";
      ctx.fillText("(they're always like this)", W * 0.04 + 74, H * 0.24 + 46);

      // Whiteboard
      ctx.fillStyle = "rgba(230,230,230,0.05)"; ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(W * 0.7, H * 0.22, 145, 100, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(0,247,192,0.4)"; ctx.font = "bold 8px 'Orbitron', monospace"; ctx.textAlign = "center";
      ctx.fillText("Q3 TARGETS:", W * 0.7 + 72, H * 0.22 + 18);
      ctx.fillStyle = "rgba(200,26,0,0.65)"; ctx.font = "7px monospace"; ctx.textAlign = "left";
      ["• More cannons", "• Keep table level", "• Deny everything", "• ???", "• Profit"].forEach((l, i) =>
        ctx.fillText(l, W * 0.7 + 10, H * 0.22 + 34 + i * 13));

      // Tilt meter
      const mx = W - 36, my = H * 0.34, mh = 160;
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.strokeStyle = "rgba(0,247,192,0.25)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(mx - 10, my, 20, mh, 4); ctx.fill(); ctx.stroke();
      const fh = (Math.abs(g.tableAngle) / MAX_ANGLE) * (mh - 6);
      const pct = fh / (mh - 6);
      ctx.fillStyle = `rgba(${Math.floor(pct * 255)},${Math.floor((1-pct) * 200)},0,0.85)`;
      ctx.beginPath(); ctx.roundRect(mx - 7, my + 3 + (mh - 6 - fh), 14, fh, 3); ctx.fill();
      ctx.fillStyle = "rgba(0,247,192,0.45)"; ctx.font = "bold 6px 'Orbitron', monospace";
      ctx.textAlign = "center"; ctx.fillText("TILT", mx, my - 8);

      // Falling items
      for (const o of g.objs) if (!o.landed) drawFallingObj(ctx, o);

      // Table
      drawTable(ctx, g.tableCX, g.tableCY, g.tableAngle, g.objs.filter(o=>o.landed), g.t);

      // Exec character
      const ex = g.tableCX - g.tableAngle * 28;
      const ey = g.tableCY - TABLE_H / 2 - 10;
      drawExec(ctx, ex, ey, g.jiggleL, g.jiggleR, g.bounceL, g.bounceR, g.expression, g.tableAngle, g.t);

      // Debris
      for (const d of g.debris) {
        ctx.save(); ctx.globalAlpha = Math.min(1, d.life / 35);
        ctx.translate(d.x, d.y); ctx.rotate(d.angle);
        ctx.fillStyle = d.color; ctx.font = `bold ${d.size}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(d.label, 0, 0);
        ctx.globalAlpha = 1; ctx.restore();
      }

      // Danger flash
      if (Math.abs(g.tableAngle) > MAX_ANGLE * 0.75 && g.running) {
        ctx.fillStyle = `rgba(255,0,0,${0.05 + Math.sin(g.t * 0.28) * 0.04})`;
        ctx.fillRect(0, 0, W, H);
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, W, 46);
      ctx.strokeStyle = "rgba(0,247,192,0.28)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,46); ctx.lineTo(W,46); ctx.stroke();
      ctx.font = "bold 12px 'Orbitron', monospace"; ctx.textBaseline = "middle";
      ctx.fillStyle = NEON; ctx.textAlign = "left"; ctx.fillText(`BALANCED: ${Math.floor(g.score)}s`, 12, 23);
      ctx.fillStyle = "#fff"; ctx.textAlign = "right";
      ctx.fillText(`BEST: ${Math.max(Math.floor(g.score), parseInt(localStorage.getItem(HS_KEY)||"0"))}s`, W-12, 23);

      // Hold hints
      if (g.t < 280 && g.running) {
        ctx.globalAlpha = Math.max(0, 1 - g.t / 180);
        ctx.fillStyle = "rgba(0,247,192,0.65)"; ctx.font = "bold 11px 'Orbitron', monospace"; ctx.textAlign = "center";
        ctx.fillText("HOLD LEFT  ◄  ►  HOLD RIGHT", W / 2, H - 28);
        ctx.globalAlpha = 1;
      }
    };

    G.current.raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(G.current.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
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
              <p>💥 Her cannons jiggle and tip the table — physics are not optional.</p>
              <p>📄 Falling office items make balance increasingly impossible.</p>
              <p className="text-white/50 text-xs pt-1">Hold ◄ ► keys · Hold mouse button left/right · or swipe</p>
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
              <div className="mb-4 py-2"><p className="text-[#00f7c0] text-sm font-bold">✓ Score submitted!</p></div>
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
