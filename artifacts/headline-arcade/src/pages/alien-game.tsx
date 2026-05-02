import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

const HS_KEY = "hs_alien";
const NEON = "#00f7c0";
const GRAVITY = 0.38;
const FLAP = -7.5;
const PIPE_W = 58;
const PIPE_GAP = 170;
const PIPE_SPEED = 2.6;

interface Pipe { x: number; gapY: number; scored: boolean; }
interface Folder { x: number; y: number; collected: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

function drawUFOPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, vy: number, shrug: boolean, t: number) {
  ctx.save(); ctx.translate(x, y);
  const tilt = Math.max(-0.35, Math.min(0.35, vy * 0.022));
  ctx.rotate(tilt);
  const saucerBob = Math.sin(t * 0.08) * 2;
  ctx.fillStyle = "#5a6a7a"; ctx.strokeStyle = NEON; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 24 + saucerBob, 28, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(0,247,192,0.15)"; ctx.beginPath(); ctx.ellipse(0, 24 + saucerBob, 28, 9, 0, 0, Math.PI * 2); ctx.fill();
  const lightColors = ["#ff4444", NEON, "#ffdd00"];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + t * 0.05;
    ctx.fillStyle = lightColors[i];
    ctx.beginPath(); ctx.arc(Math.cos(a) * 18, 24 + saucerBob + Math.sin(a) * 3, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(0,247,192,0.08)";
  ctx.beginPath(); ctx.moveTo(-10, 32 + saucerBob); ctx.lineTo(10, 32 + saucerBob); ctx.lineTo(18, 55); ctx.lineTo(-18, 55); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#223355"; ctx.beginPath(); ctx.roundRect(-14, 2, 28, 24, 4); ctx.fill();
  ctx.fillStyle = "#cc1a00"; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(0, 24); ctx.lineTo(3, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#f0a060"; ctx.beginPath(); ctx.arc(0, -12, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f0d030";
  ctx.beginPath();
  ctx.moveTo(-16, -18);
  ctx.bezierCurveTo(-18, -36, 8, -42, 18, -28);
  ctx.bezierCurveTo(22, -20, 16, -14, 10, -14);
  ctx.bezierCurveTo(14, -22, 10, -32, 0, -30);
  ctx.bezierCurveTo(-8, -28, -14, -20, -16, -18);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#f8e860"; ctx.beginPath(); ctx.arc(4, -28, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#4466aa";
  ctx.beginPath(); ctx.arc(-6, -14, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -14, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-5, -15, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -15, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(-5, -14, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -14, 1, 0, Math.PI * 2); ctx.fill();
  if (shrug) {
    ctx.fillStyle = "#f0a060";
    ctx.beginPath(); ctx.roundRect(-28, -6, 14, 8, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(14, -6, 14, 8, 4); ctx.fill();
    ctx.save(); ctx.translate(30, -5);
    ctx.fillStyle = "#44dd88"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(-3, -1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#44dd88"; ctx.beginPath(); ctx.arc(10, -8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe, canvasH: number) {
  const topH = pipe.gapY - PIPE_GAP / 2;
  const botY = pipe.gapY + PIPE_GAP / 2;
  const botH = canvasH - botY;
  ctx.fillStyle = "#1a3a1a"; ctx.strokeStyle = "#22aa44"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(pipe.x, 0, PIPE_W, topH - 4, [0, 0, 8, 8]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#254e25"; ctx.strokeStyle = "#22aa44";
  ctx.beginPath(); ctx.roundRect(pipe.x - 5, topH - 18, PIPE_W + 10, 18, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(200,20,20,0.85)";
  ctx.beginPath(); ctx.roundRect(pipe.x + 3, Math.max(5, topH - 60), PIPE_W - 6, 26, 3); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 7px 'Orbitron', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("TOP", pipe.x + PIPE_W / 2, Math.max(5, topH - 60) + 8);
  ctx.fillText("SECRET", pipe.x + PIPE_W / 2, Math.max(5, topH - 60) + 18);
  ctx.fillStyle = "#1a3a1a"; ctx.strokeStyle = "#22aa44";
  ctx.beginPath(); ctx.roundRect(pipe.x, botY + 18, PIPE_W, botH, [8, 8, 0, 0]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#254e25";
  ctx.beginPath(); ctx.roundRect(pipe.x - 5, botY, PIPE_W + 10, 18, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.roundRect(pipe.x + 3, botY + 22, PIPE_W - 6, 24, 3); ctx.fill();
  ctx.fillStyle = "#333"; ctx.font = "bold 8px monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("████████", pipe.x + PIPE_W / 2, botY + 34);
}

function drawFolder(ctx: CanvasRenderingContext2D, f: Folder, t: number) {
  ctx.save(); ctx.translate(f.x, f.y);
  ctx.translate(0, Math.sin(t * 0.1 + f.x) * 4);
  ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffcc00"; ctx.strokeStyle = "#ffee55"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-14, -10, 28, 22, 4); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-14, -14, 16, 8, 3); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#5a3800"; ctx.font = "bold 7px 'Orbitron', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("ALIEN", 0, -2); ctx.fillText("FILES", 0, 7);
  ctx.restore();
}

async function submitScore(playerName: string, score: number) {
  await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName: playerName.trim() || "Anonymous", game: "alien", score }),
  });
}

export default function AlienGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [hs, setHs] = useState(() => parseInt(localStorage.getItem(HS_KEY) || "0"));
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("arcade_name") || "");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const G = useRef({
    py: 200, vy: 0, pipes: [] as Pipe[], folders: [] as Folder[],
    particles: [] as Particle[], score: 0, pipeTimer: 0,
    shrug: false, shrugT: 0, t: 0, raf: 0, running: false, playerX: 80,
  });

  const endGame = useCallback(() => {
    const g = G.current; g.running = false;
    const newHs = Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"));
    localStorage.setItem(HS_KEY, String(newHs));
    setHs(newHs); setScoreDisplay(g.score); setSubmitted(false);
    setTimeout(() => setPhase("over"), 1400);
  }, []);

  const flap = useCallback(() => { if (G.current.running) G.current.vy = FLAP; }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = G.current;
    g.py = canvas.clientHeight * 0.45; g.vy = 0;
    g.pipes = []; g.folders = []; g.particles = [];
    g.score = 0; g.pipeTimer = 0; g.shrug = false; g.shrugT = 0; g.t = 0;
    g.playerX = canvas.clientWidth * 0.22; g.running = true;
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
    };
    resize(); window.addEventListener("resize", resize);
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); } };
    window.addEventListener("keydown", onKey);
    const onTap = (e: TouchEvent) => { e.preventDefault(); flap(); };
    canvas.addEventListener("touchstart", onTap, { passive: false });
    const onClick = () => flap();
    canvas.addEventListener("click", onClick);

    let lastTime = 0;
    const loop = (time: number) => {
      G.current.raf = requestAnimationFrame(loop);
      const g = G.current;
      const dt = Math.min((time - lastTime) / 16.67, 3); lastTime = time;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (!g.running) { draw(ctx, W, H, g); return; }
      g.t += dt; g.vy += GRAVITY * dt; g.py += g.vy * dt; g.pipeTimer += dt;
      if (g.pipeTimer >= 100) {
        g.pipeTimer = 0;
        const gapY = H * 0.25 + Math.random() * H * 0.45;
        g.pipes.push({ x: W + 10, gapY, scored: false });
        g.folders.push({ x: W + 10 + PIPE_W / 2, y: gapY, collected: false });
      }
      const spd = Math.min(PIPE_SPEED + g.score * 0.05, 5.5);
      for (const p of g.pipes) p.x -= spd * dt;
      for (const f of g.folders) f.x -= spd * dt;
      for (const f of g.folders) {
        if (!f.collected && Math.abs(f.x - g.playerX) < 20 && Math.abs(f.y - g.py) < 28) {
          f.collected = true; g.score++;
          for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            g.particles.push({ x: f.x, y: f.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 30, color: "#ffdd00" });
          }
        }
      }
      if (g.py < 20 || g.py > H - 20) {
        g.shrug = true; g.shrugT = 80; g.running = false;
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2, spd2 = 2 + Math.random() * 4;
          g.particles.push({ x: g.playerX, y: g.py, vx: Math.cos(a) * spd2, vy: Math.sin(a) * spd2, life: 40, color: ["#ff4444", "#ffaa00"][Math.floor(Math.random() * 2)] });
        }
        setTimeout(endGame, 1400);
      }
      for (const p of g.pipes) {
        const inX = g.playerX > p.x + 6 && g.playerX < p.x + PIPE_W - 6;
        if (inX && (g.py < p.gapY - PIPE_GAP / 2 + 10 || g.py > p.gapY + PIPE_GAP / 2 - 10)) {
          g.shrug = true; g.shrugT = 80; g.running = false;
          setTimeout(endGame, 1400); break;
        }
      }
      g.pipes = g.pipes.filter(p => p.x > -PIPE_W - 10);
      g.folders = g.folders.filter(f => !f.collected && f.x > -20);
      g.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; });
      g.particles = g.particles.filter(p => p.life > 0);
      if (g.shrugT > 0) g.shrugT -= dt;
      draw(ctx, W, H, g);
    };

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, g: typeof G.current) => {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#050a14"); grad.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137.5 + g.t * 0.2) % W, sy = (i * 79.3) % (H * 0.7);
        ctx.beginPath(); ctx.arc(sx, sy, 0.5 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of g.pipes) drawPipe(ctx, p, H);
      for (const f of g.folders) if (!f.collected) drawFolder(ctx, f, g.t);
      for (const p of g.particles) {
        ctx.globalAlpha = p.life / 40; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawUFOPlayer(ctx, g.playerX, g.py, g.vy, g.shrug, g.t);
      if (g.shrug && g.shrugT > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, g.shrugT / 20);
        ctx.fillStyle = "#fffbe6"; ctx.strokeStyle = "#cc1a00"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(g.playerX - 100, g.py - 80, 200, 44, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#cc1a00"; ctx.font = "bold 13px 'Orbitron', monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("DISCLOSURE DENIED!", g.playerX, g.py - 58);
        ctx.globalAlpha = 1; ctx.restore();
      }
      ctx.fillStyle = "rgba(0,0,0,0.72)"; ctx.fillRect(0, 0, W, 44);
      ctx.strokeStyle = "rgba(0,247,192,0.25)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(W, 44); ctx.stroke();
      ctx.font = "bold 13px 'Orbitron', monospace"; ctx.textBaseline = "middle";
      ctx.fillStyle = NEON; ctx.textAlign = "left"; ctx.fillText(`FILES: ${g.score}`, 12, 22);
      ctx.fillStyle = "#fff"; ctx.textAlign = "right";
      ctx.fillText(`BEST: ${Math.max(g.score, parseInt(localStorage.getItem(HS_KEY) || "0"))}`, W - 12, 22);
    };

    G.current.raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(G.current.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onTap);
      canvas.removeEventListener("click", onClick);
    };
  }, [flap, endGame]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col" style={{ fontFamily: "'Orbitron', monospace" }}>
      <canvas ref={canvasRef} className="flex-1 w-full h-full" style={{ display: "block" }} />

      {phase === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-md">
            <h1 className="text-[#00f7c0] font-black text-3xl mb-2" style={{ textShadow: "0 0 20px #00f7c0" }}>FLAPPY ALIEN FILES</h1>
            <p className="text-white/70 text-sm mb-2">Fly the UFO through the classified documents!</p>
            <p className="text-yellow-300/80 text-sm mb-6">Collect glowing folders to declassify files!</p>
            <p className="text-white/50 text-xs mb-8">Tap / Space / Click to flap</p>
            <button onClick={startGame} className="bg-[#00f7c0] text-black font-black text-xl px-12 py-4 rounded-xl w-full hover:bg-white transition-colors">PLAY</button>
            <Link href="/" className="block mt-4 text-[#00f7c0]/60 text-sm hover:text-[#00f7c0]">← Back to Arcade</Link>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85">
          <div className="text-center px-6 max-w-sm w-full">
            <p className="text-red-400 font-black text-2xl mb-1">DISCLOSURE DENIED!</p>
            <p className="text-white/60 text-sm mb-3">The files remain classified. For now.</p>
            <p className="text-[#00f7c0] text-4xl font-black mb-1">{scoreDisplay}</p>
            <p className="text-white/40 text-xs mb-5">Files Declassified · Best: {hs}</p>

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

            <button onClick={startGame} className="bg-[#00f7c0] text-black font-black text-lg px-8 py-4 rounded-xl w-full mb-3 hover:bg-white transition-colors">PLAY AGAIN</button>
            <Link href="/" className="block text-center border border-[#00f7c0]/40 text-[#00f7c0] font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#00f7c0]/10 transition-colors">BACK TO HOME</Link>
          </div>
        </div>
      )}
    </div>
  );
}
