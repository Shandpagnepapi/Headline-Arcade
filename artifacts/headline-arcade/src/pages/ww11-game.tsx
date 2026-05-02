import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

const HS_KEY = "hs_ww11";
const NEON = "#00f7c0";
const BAD_LABELS = ["11", "WW 11", "XI", "WW 11!"];
const GOOD_LABELS = ["II", "WW II", "WWII", "The Real One"];

interface Obj {
  x: number; y: number; w: number; h: number;
  vy: number; kind: "bad" | "good"; label: string; hit: boolean;
}
interface Pop { x: number; y: number; text: string; life: number; }

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, facepalm: boolean, t: number) {
  ctx.save();
  ctx.translate(x, y);
  if (facepalm) ctx.rotate(Math.sin(t * 0.3) * 0.15);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 44, 20, 6, 0, 0, Math.PI * 2); ctx.fill();

  // legs
  ctx.fillStyle = "#1a3a6e";
  ctx.fillRect(-14, 26, 11, 20);
  ctx.fillRect(3, 26, 11, 20);
  // shoes
  ctx.fillStyle = "#111";
  ctx.fillRect(-16, 42, 14, 6);
  ctx.fillRect(2, 42, 14, 6);

  // body / blazer
  ctx.fillStyle = "#2a6eb5";
  ctx.beginPath(); ctx.roundRect(-18, 4, 36, 26, 4); ctx.fill();
  // lapels
  ctx.fillStyle = "#1a5a9a";
  ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(0, 16); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill();

  // hijab base (larger circle behind head)
  ctx.fillStyle = "#2d9cdb";
  ctx.beginPath(); ctx.arc(0, -14, 22, 0, Math.PI * 2); ctx.fill();
  // hijab drape
  ctx.fillStyle = "#2d9cdb";
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI); ctx.fill();
  // hijab highlight
  ctx.fillStyle = "#5bc0f5";
  ctx.beginPath(); ctx.arc(-6, -20, 8, Math.PI * 1.1, Math.PI * 1.8); ctx.stroke();

  // head
  ctx.fillStyle = "#e8b88a";
  ctx.beginPath(); ctx.arc(0, -16, 16, 0, Math.PI * 2); ctx.fill();

  // eyes / glasses
  ctx.fillStyle = "#222";
  const eyeY = facepalm ? -18 : -16;
  // glasses frames
  ctx.strokeStyle = "#555"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-13, eyeY - 4, 10, 8, 2); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(3, eyeY - 4, 10, 8, 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3, eyeY); ctx.lineTo(3, eyeY); ctx.stroke();
  // pupils
  ctx.fillStyle = "#222";
  ctx.beginPath(); ctx.arc(-8, eyeY, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, eyeY, 2.5, 0, Math.PI * 2); ctx.fill();

  // mouth
  ctx.strokeStyle = "#8b5e3c"; ctx.lineWidth = 1.5;
  if (facepalm) {
    ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, -10, 4, 0.1, Math.PI - 0.1, true); ctx.stroke();
  }

  // microphone
  if (!facepalm) {
    ctx.fillStyle = "#aaa"; ctx.fillRect(18, -20, 5, 12);
    ctx.fillStyle = "#888"; ctx.beginPath(); ctx.arc(20.5, -22, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    // facepalm hand
    ctx.fillStyle = "#e8b88a";
    ctx.beginPath(); ctx.roundRect(-6, -24, 20, 14, 4); ctx.fill();
  }

  // tiny star twinkle on hijab
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-14 + Math.sin(t * 0.05) * 2, -28, 1.5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawObj(ctx: CanvasRenderingContext2D, o: Obj) {
  ctx.save();
  if (o.kind === "bad") {
    ctx.fillStyle = "#ff3a3a";
    ctx.strokeStyle = "#ff7777";
  } else {
    ctx.fillStyle = "#22cc66";
    ctx.strokeStyle = "#55ff99";
  }
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, 8); ctx.fill();
  ctx.beginPath(); ctx.roundRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, 8); ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = `bold ${o.h * 0.42}px 'Orbitron', monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(o.label, o.x, o.y);
  ctx.restore();
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.save();
  const W = 220, H = 60, R = 14;
  const bx = x - W / 2, by = y - H - 20;
  ctx.fillStyle = "#fffbe6";
  ctx.strokeStyle = "#ff3a3a"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(bx, by, W, H, R); ctx.fill(); ctx.stroke();
  // tail
  ctx.beginPath(); ctx.moveTo(x - 10, by + H); ctx.lineTo(x, by + H + 18); ctx.lineTo(x + 10, by + H); ctx.fill();
  ctx.fillStyle = "#cc1a00";
  ctx.font = "bold 15px 'Orbitron', sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, x, by + H / 2);
  ctx.restore();
}

export default function WW11Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [hs, setHs] = useState(() => parseInt(localStorage.getItem(HS_KEY) || "0"));

  const G = useRef({
    px: 160, py: 400, pw: 40, ph: 88,
    objs: [] as Obj[], pops: [] as Pop[],
    score: 0, speed: 2.5, spawnT: 0, scoreT: 0,
    moveL: false, moveR: false,
    facepalm: false, speechT: 0, t: 0,
    raf: 0, running: false,
    touchSX: 0,
  });

  const endGame = useCallback(() => {
    const g = G.current;
    g.running = false;
    const newHs = Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"));
    localStorage.setItem(HS_KEY, String(newHs));
    setHs(newHs);
    setScoreDisplay(g.score);
    setTimeout(() => setPhase("over"), 900);
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = G.current;
    g.px = canvas.clientWidth / 2; g.py = canvas.clientHeight - 80;
    g.objs = []; g.pops = []; g.score = 0; g.speed = 2.5;
    g.spawnT = 0; g.scoreT = 0; g.facepalm = false; g.speechT = 0; g.t = 0;
    g.moveL = false; g.moveR = false; g.running = true;
    setScoreDisplay(0); setPhase("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "ArrowLeft")  g.moveL = e.type === "keydown";
      if (e.code === "ArrowRight") g.moveR = e.type === "keydown";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

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
      const dt = Math.min((time - lastTime) / 16.67, 3);
      lastTime = time;
      if (!g.running) { draw(ctx, canvas, g); return; }

      g.t += dt;
      g.scoreT += dt;
      g.spawnT += dt;

      if (g.scoreT >= 60) { g.score++; g.scoreT = 0; }
      if (g.speed < 6) g.speed += 0.003 * dt;

      if (g.moveL) g.px = Math.max(30, g.px - 4 * dt);
      if (g.moveR) g.px = Math.min(canvas.clientWidth - 30, g.px + 4 * dt);

      // spawn
      if (g.spawnT >= 90) {
        g.spawnT = 0;
        const bad = Math.random() < 0.65;
        const label = bad ? BAD_LABELS[Math.floor(Math.random() * BAD_LABELS.length)] : GOOD_LABELS[Math.floor(Math.random() * GOOD_LABELS.length)];
        g.objs.push({
          x: 40 + Math.random() * (canvas.clientWidth - 80),
          y: -30, w: 70, h: 40,
          vy: g.speed, kind: bad ? "bad" : "good", label, hit: false,
        });
      }

      for (const o of g.objs) { o.y += o.vy * dt; }

      // collisions
      if (!g.facepalm) {
        for (const o of g.objs) {
          if (o.hit) continue;
          const dx = Math.abs(o.x - g.px), dy = Math.abs(o.y - (g.py - 20));
          if (dx < (o.w / 2 + 22) * 0.75 && dy < (o.h / 2 + 30) * 0.75) {
            o.hit = true;
            if (o.kind === "bad") {
              g.facepalm = true; g.speechT = 120; g.running = false;
              setTimeout(endGame, 1400);
            } else {
              g.score += 10;
              g.pops.push({ x: o.x, y: o.y, text: "+10 ✓", life: 60 });
            }
          }
        }
      }

      g.objs = g.objs.filter(o => !o.hit && o.y < canvas.clientHeight + 50);
      g.pops.forEach(p => p.life--);
      g.pops = g.pops.filter(p => p.life > 0);
      if (g.speechT > 0) g.speechT--;

      draw(ctx, canvas, g);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, g: typeof G.current) => {
      const W = canvas.clientWidth, H = canvas.clientHeight;
      // bg
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = "rgba(0,247,192,0.04)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // floor
      ctx.fillStyle = "rgba(0,247,192,0.1)";
      ctx.fillRect(0, H - 20, W, 20);
      ctx.strokeStyle = NEON; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H - 20); ctx.lineTo(W, H - 20); ctx.stroke();

      for (const o of g.objs) drawObj(ctx, o);

      drawPlayer(ctx, g.px, g.py - 44, g.facepalm, g.t);

      if (g.facepalm && g.speechT > 0) {
        const alpha = Math.min(1, g.speechT / 20);
        ctx.globalAlpha = alpha;
        drawSpeechBubble(ctx, g.px, g.py - 100, "WORLD WAR ELEVEN?!");
        ctx.globalAlpha = 1;
      }

      for (const p of g.pops) {
        ctx.globalAlpha = p.life / 60;
        ctx.fillStyle = "#55ff99"; ctx.font = "bold 16px 'Orbitron', monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(p.text, p.x, p.y - (60 - p.life) * 0.6);
        ctx.globalAlpha = 1;
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, 44);
      ctx.strokeStyle = "rgba(0,247,192,0.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(W, 44); ctx.stroke();

      ctx.font = "bold 13px 'Orbitron', monospace"; ctx.textBaseline = "middle";
      ctx.fillStyle = NEON; ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${g.score}`, 12, 22);
      ctx.fillStyle = "#fff"; ctx.textAlign = "right";
      ctx.fillText(`BEST: ${Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"))}`, W - 12, 22);
    };

    G.current.raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(G.current.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, [endGame]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col" style={{ fontFamily: "'Orbitron', monospace" }}>
      <canvas ref={canvasRef} className="flex-1 w-full h-full" style={{ display: "block" }} />

      {phase === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-md">
            <h1 className="text-[#00f7c0] font-black text-3xl mb-2" style={{ textShadow: "0 0 20px #00f7c0" }}>
              WORLD WAR 11
            </h1>
            <p className="text-white/70 text-sm mb-6">Dodge the 11s! Collect the real Roman numeral IIs!</p>
            <p className="text-white/50 text-xs mb-8">← → to dodge · swipe on mobile</p>
            <button onClick={startGame} className="bg-[#00f7c0] text-black font-black text-xl px-12 py-4 rounded-xl w-full hover:bg-white transition-colors">
              PLAY
            </button>
            <Link href="/" className="block mt-4 text-[#00f7c0]/60 text-sm hover:text-[#00f7c0]">← Back to Arcade</Link>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85">
          <div className="text-center px-6 max-w-md w-full">
            <p className="text-red-400 font-black text-2xl mb-1">GAME OVER</p>
            <p className="text-white/60 text-sm mb-4">World War Eleven strikes again!</p>
            <p className="text-[#00f7c0] text-4xl font-black mb-1">{scoreDisplay}</p>
            <p className="text-white/40 text-xs mb-8">Correct Wars Survived · Best: {hs}</p>
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
