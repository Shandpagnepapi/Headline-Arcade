import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

const HS_KEY = "hs_cannon";
const NEON = "#00f7c0";
const BAD_LABELS = ["CANNON", "BOOM", "CANNON!", "BIG ONE"];
const GOOD_LABELS = ["HR 📋", "☕ COFFEE", "REPORT", "MEMO"];

interface Obj {
  x: number; y: number; w: number; h: number;
  vy: number; wobble: number; kind: "bad" | "good"; label: string; hit: boolean;
}
interface Pop { x: number; y: number; text: string; life: number; }

function drawCEO(ctx: CanvasRenderingContext2D, x: number, y: number, shocked: boolean, t: number) {
  ctx.save();
  ctx.translate(x, y);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 46, 22, 6, 0, 0, Math.PI * 2); ctx.fill();

  // legs
  ctx.fillStyle = "#1a2a4a";
  ctx.fillRect(-14, 26, 12, 22); ctx.fillRect(2, 26, 12, 22);
  ctx.fillStyle = "#111"; ctx.fillRect(-16, 44, 15, 6); ctx.fillRect(1, 44, 15, 6);

  // body/suit
  ctx.fillStyle = "#1e3a6e";
  ctx.beginPath(); ctx.roundRect(-20, 2, 40, 28, 4); ctx.fill();
  // shirt
  ctx.fillStyle = "#f0f0f0";
  ctx.beginPath(); ctx.moveTo(-4, 2); ctx.lineTo(0, 16); ctx.lineTo(4, 2); ctx.closePath(); ctx.fill();
  // tie
  ctx.fillStyle = "#cc1a00";
  ctx.beginPath(); ctx.moveTo(-3, 6); ctx.lineTo(0, 28); ctx.lineTo(3, 6); ctx.closePath(); ctx.fill();

  // head
  ctx.fillStyle = "#f4c88a";
  ctx.beginPath(); ctx.arc(0, -16, 18, 0, Math.PI * 2); ctx.fill();

  // big poofy hair
  const hairShake = shocked ? Math.sin(t * 0.5) * 4 : 0;
  ctx.fillStyle = "#e8d080";
  ctx.beginPath(); ctx.ellipse(hairShake * 0.3, -32, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-12 + hairShake, -30, 10, 8, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(12 + hairShake, -30, 10, 8, 0.3, 0, Math.PI * 2); ctx.fill();
  // hair highlight
  ctx.fillStyle = "#f0e090";
  ctx.beginPath(); ctx.ellipse(-4 + hairShake * 0.5, -36, 8, 5, 0, 0, Math.PI * 2); ctx.fill();

  // eyes
  const eyeY = -18;
  ctx.fillStyle = "#222";
  if (shocked) {
    // big shocked eyes
    ctx.beginPath(); ctx.arc(-7, eyeY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, eyeY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-7, eyeY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, eyeY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(-7, eyeY, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, eyeY, 1.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(-7, eyeY, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, eyeY, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-6, eyeY - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, eyeY - 1, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // mouth
  ctx.strokeStyle = "#8b5e3c"; ctx.lineWidth = 2;
  if (shocked) {
    ctx.beginPath(); ctx.arc(0, -9, 6, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, -8, 5, 0.1, Math.PI - 0.1, true); ctx.stroke();
  }

  // briefcase
  if (!shocked) {
    ctx.fillStyle = "#8b6914"; ctx.strokeStyle = "#6b5010"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(18, 10, 20, 16, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#6b5010"; ctx.fillRect(24, 8, 8, 4);
  } else {
    // facepalm
    ctx.fillStyle = "#f4c88a";
    ctx.beginPath(); ctx.roundRect(-8, -28, 22, 14, 4); ctx.fill();
  }

  ctx.restore();
}

function drawCannon(ctx: CanvasRenderingContext2D, o: Obj, t: number) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const wobble = Math.sin(t * 0.15 + o.wobble) * 8;
  ctx.rotate(wobble * 0.03);

  // cannon ball body
  ctx.fillStyle = "#cc1a00"; ctx.strokeStyle = "#ff5555"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, o.w * 0.38, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // shine
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath(); ctx.arc(-o.w * 0.1, -o.h * 0.15, o.w * 0.12, 0, Math.PI * 2); ctx.fill();
  // barrel
  ctx.fillStyle = "#991100"; ctx.strokeStyle = "#cc4444"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-5, -o.h * 0.38, 10, o.h * 0.3, 5); ctx.fill(); ctx.stroke();

  // label
  ctx.fillStyle = "#fff"; ctx.font = `bold 11px 'Orbitron', monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(o.label, 0, o.h * 0.15);

  // wobble stars
  ctx.fillStyle = "#ffcc00";
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + t * 0.08;
    const r = o.w * 0.5;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawGoodObj(ctx: CanvasRenderingContext2D, o: Obj) {
  ctx.save();
  ctx.fillStyle = "#1a6e3a"; ctx.strokeStyle = "#55ff99"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#aaffcc"; ctx.font = `bold 12px 'Orbitron', monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(o.label, o.x, o.y);
  ctx.restore();
}

function drawBoom(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  const scale = 1 + Math.sin(t * 0.2) * 0.15;
  ctx.translate(x, y); ctx.scale(scale, scale);
  // burst rays
  ctx.strokeStyle = "#ffaa00"; ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.04;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28); ctx.lineTo(Math.cos(a) * 55, Math.sin(a) * 55); ctx.stroke();
  }
  ctx.fillStyle = "#ffdd00";
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ff6600";
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Orbitron', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("BOOM!", 0, 0);
  ctx.restore();
}

export default function CannonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [hs, setHs] = useState(() => parseInt(localStorage.getItem(HS_KEY) || "0"));

  const G = useRef({
    px: 160, py: 400,
    objs: [] as Obj[], pops: [] as Pop[],
    score: 0, speed: 2.5, spawnT: 0, scoreT: 0,
    moveL: false, moveR: false,
    shocked: false, boomT: 0, boomX: 0, boomY: 0,
    t: 0, raf: 0, running: false, touchSX: 0,
  });

  const endGame = useCallback(() => {
    const g = G.current; g.running = false;
    const newHs = Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"));
    localStorage.setItem(HS_KEY, String(newHs));
    setHs(newHs); setScoreDisplay(g.score);
    setTimeout(() => setPhase("over"), 1200);
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = G.current;
    g.px = canvas.clientWidth / 2; g.py = canvas.clientHeight - 80;
    g.objs = []; g.pops = []; g.score = 0; g.speed = 2.5;
    g.spawnT = 0; g.scoreT = 0; g.shocked = false; g.boomT = 0; g.t = 0;
    g.moveL = false; g.moveR = false; g.running = true;
    setScoreDisplay(0); setPhase("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "ArrowLeft")  g.moveL = e.type === "keydown";
      if (e.code === "ArrowRight") g.moveR = e.type === "keydown";
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
      if (!g.running && g.boomT <= 0) { draw(ctx, canvas, g); return; }

      g.t += dt;
      if (g.boomT > 0) { g.boomT -= dt; draw(ctx, canvas, g); return; }
      g.scoreT += dt; g.spawnT += dt;
      if (g.scoreT >= 60) { g.score++; g.scoreT = 0; }
      if (g.speed < 7) g.speed += 0.003 * dt;

      if (g.moveL) g.px = Math.max(30, g.px - 4 * dt);
      if (g.moveR) g.px = Math.min(canvas.clientWidth - 30, g.px + 4 * dt);

      if (g.spawnT >= 85) {
        g.spawnT = 0;
        const bad = Math.random() < 0.6;
        const label = bad ? BAD_LABELS[Math.floor(Math.random() * BAD_LABELS.length)] : GOOD_LABELS[Math.floor(Math.random() * GOOD_LABELS.length)];
        g.objs.push({
          x: 50 + Math.random() * (canvas.clientWidth - 100),
          y: -40, w: bad ? 80 : 72, h: bad ? 80 : 38,
          vy: g.speed, wobble: Math.random() * Math.PI * 2,
          kind: bad ? "bad" : "good", label, hit: false,
        });
      }

      for (const o of g.objs) o.y += o.vy * dt;

      if (!g.shocked) {
        for (const o of g.objs) {
          if (o.hit) continue;
          const r = o.kind === "bad" ? o.w * 0.38 : o.w / 2;
          const dx = Math.abs(o.x - g.px), dy = Math.abs(o.y - (g.py - 20));
          if (dx < (r + 24) * 0.72 && dy < (r + 30) * 0.72) {
            o.hit = true;
            if (o.kind === "bad") {
              g.shocked = true; g.boomT = 80; g.boomX = o.x; g.boomY = o.y; g.running = false;
              setTimeout(endGame, 1400);
            } else {
              g.score += 5;
              g.pops.push({ x: o.x, y: o.y, text: "+5 👍", life: 55 });
            }
          }
        }
      }

      g.objs = g.objs.filter(o => !o.hit && o.y < canvas.clientHeight + 60);
      g.pops.forEach(p => p.life--); g.pops = g.pops.filter(p => p.life > 0);
      draw(ctx, canvas, g);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, g: typeof G.current) => {
      const W = canvas.clientWidth, H = canvas.clientHeight;
      ctx.fillStyle = "#080a0e"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(0,247,192,0.03)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      ctx.fillStyle = "rgba(0,247,192,0.08)"; ctx.fillRect(0, H - 20, W, 20);
      ctx.strokeStyle = NEON; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H - 20); ctx.lineTo(W, H - 20); ctx.stroke();

      for (const o of g.objs) {
        if (o.kind === "bad") drawCannon(ctx, o, g.t);
        else drawGoodObj(ctx, o);
      }

      drawCEO(ctx, g.px, g.py - 44, g.shocked, g.t);

      if (g.boomT > 0) drawBoom(ctx, g.boomX, g.boomY, g.t);

      for (const p of g.pops) {
        ctx.globalAlpha = p.life / 55;
        ctx.fillStyle = "#55ff99"; ctx.font = "bold 15px 'Orbitron', monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(p.text, p.x, p.y - (55 - p.life) * 0.5);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, W, 44);
      ctx.strokeStyle = "rgba(0,247,192,0.25)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(W, 44); ctx.stroke();
      ctx.font = "bold 13px 'Orbitron', monospace"; ctx.textBaseline = "middle";
      ctx.fillStyle = NEON; ctx.textAlign = "left"; ctx.fillText(`SCORE: ${g.score}`, 12, 22);
      ctx.fillStyle = "#fff"; ctx.textAlign = "right";
      ctx.fillText(`BEST: ${Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"))}`, W - 12, 22);
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
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col" style={{ fontFamily: "'Orbitron', monospace" }}>
      <canvas ref={canvasRef} className="flex-1 w-full h-full" style={{ display: "block" }} />

      {phase === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-md">
            <h1 className="text-[#00f7c0] font-black text-3xl mb-2" style={{ textShadow: "0 0 20px #00f7c0" }}>CANNON BARON</h1>
            <p className="text-white/70 text-sm mb-6">Dodge the giant cannons! Collect the HR reports and coffee!</p>
            <p className="text-white/50 text-xs mb-8">← → to dodge · swipe on mobile</p>
            <button onClick={startGame} className="bg-[#00f7c0] text-black font-black text-xl px-12 py-4 rounded-xl w-full hover:bg-white transition-colors">PLAY</button>
            <Link href="/" className="block mt-4 text-[#00f7c0]/60 text-sm hover:text-[#00f7c0]">← Back to Arcade</Link>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85">
          <div className="text-center px-6 max-w-md w-full">
            <p className="text-red-400 font-black text-2xl mb-1">GAME OVER</p>
            <p className="text-white/60 text-sm mb-4">Those Cannons Were WAY Too Big!</p>
            <p className="text-[#00f7c0] text-4xl font-black mb-1">{scoreDisplay}</p>
            <p className="text-white/40 text-xs mb-8">Boardroom Survived · Best: {hs}</p>
            <button onClick={startGame} className="bg-[#00f7c0] text-black font-black text-lg px-8 py-4 rounded-xl w-full mb-3 hover:bg-white transition-colors">PLAY AGAIN</button>
            <Link href="/" className="block text-center border border-[#00f7c0]/40 text-[#00f7c0] font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#00f7c0]/10 transition-colors">BACK TO HOME</Link>
          </div>
        </div>
      )}
    </div>
  );
}
