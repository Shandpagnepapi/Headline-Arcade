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
  { kind: "nda", label: "NDA", w: 54, h: 66, weight: 1.0 },
  { kind: "coffee", label: "COFFEE", w: 44, h: 48, weight: 0.7 },
  { kind: "bonus", label: "BONUS", w: 58, h: 38, weight: 0.5 },
  { kind: "hr", label: "HR FORM", w: 52, h: 62, weight: 1.2 },
  { kind: "phone", label: "PHONE", w: 34, h: 60, weight: 0.9 },
  { kind: "ticker", label: "TICKER", w: 66, h: 38, weight: 0.4 },
] as const;

type BoardroomProp = typeof OBJECT_TYPES[number];

interface FallingObj {
  x: number; y: number; vy: number; vx: number;
  angle: number; spin: number;
  landed: boolean; landedX: number; slidingOff: boolean;
  type: BoardroomProp;
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
function drawPropAtOrigin(ctx: CanvasRenderingContext2D, type: BoardroomProp, t: number) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  if (type.kind === "coffee") {
    const steam = Math.sin(t * 0.08) * 2;
    ctx.strokeStyle = "rgba(235,245,255,0.5)";
    ctx.lineWidth = 1.4;
    ctx.shadowBlur = 0;
    for (const x of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(x, -24);
      ctx.bezierCurveTo(x - 7, -33 + steam, x + 7, -39 - steam, x, -47);
      ctx.stroke();
    }
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#dce8ef";
    ctx.strokeStyle = "#8ba4b4";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-17, -15, 30, 34, [5, 5, 8, 8]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#dce8ef";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(16, 1, 8, 11, 0, -1.25, 1.25); ctx.stroke();
    ctx.strokeStyle = "#8ba4b4";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(16, 1, 8, 11, 0, -1.25, 1.25); ctx.stroke();
    ctx.fillStyle = "#3a1e12";
    ctx.beginPath(); ctx.ellipse(-2, -14, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath(); ctx.ellipse(-7, -16, 5, 1.7, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#00f7c0";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(6, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 7); ctx.lineTo(3, 7); ctx.stroke();
  } else if (type.kind === "nda") {
    ctx.fillStyle = "#f4eedc";
    ctx.strokeStyle = "#c9baa2";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-25, -31, 50, 62, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e8dcc4";
    ctx.beginPath(); ctx.moveTo(13, -31); ctx.lineTo(25, -19); ctx.lineTo(13, -19); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#243447";
    ctx.font = "bold 7px 'Orbitron', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("NON-DISCLOSURE", 0, -19);
    ctx.strokeStyle = "rgba(36,52,71,0.35)";
    ctx.lineWidth = 1;
    for (let y = -8; y <= 18; y += 7) {
      ctx.beginPath(); ctx.moveTo(-17, y); ctx.lineTo(17, y); ctx.stroke();
    }
    ctx.save();
    ctx.rotate(-0.12);
    ctx.strokeStyle = "#d62018";
    ctx.fillStyle = "#d62018";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-18, -3, 36, 18, 3); ctx.stroke();
    ctx.font = "900 15px 'Orbitron', monospace";
    ctx.fillText("NDA", 0, 6);
    ctx.restore();
    ctx.strokeStyle = "#243447";
    ctx.beginPath(); ctx.moveTo(-15, 25); ctx.lineTo(13, 25); ctx.stroke();
  } else if (type.kind === "phone") {
    ctx.fillStyle = "#080a11";
    ctx.strokeStyle = "#5b6575";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-16, -29, 32, 58, 8); ctx.fill(); ctx.stroke();
    const screen = ctx.createLinearGradient(0, -23, 0, 24);
    screen.addColorStop(0, "#234bff");
    screen.addColorStop(0.55, "#101a45");
    screen.addColorStop(1, "#02040c");
    ctx.fillStyle = screen;
    ctx.beginPath(); ctx.roundRect(-12, -23, 24, 46, 5); ctx.fill();
    ctx.fillStyle = "#02040c";
    ctx.beginPath(); ctx.roundRect(-6, -25, 12, 4, 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "bold 5px 'Orbitron', monospace";
    ctx.textAlign = "center"; ctx.fillText("URGENT", 0, -11);
    ctx.fillStyle = "#00f7c0";
    for (let i = 0; i < 6; i++) {
      const x = -7 + (i % 3) * 7;
      const y = -2 + Math.floor(i / 3) * 9;
      ctx.beginPath(); ctx.roundRect(x - 2.2, y - 2.2, 4.4, 4.4, 1); ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-5, 19); ctx.lineTo(5, 19); ctx.stroke();
  } else if (type.kind === "hr") {
    ctx.fillStyle = "#eadfff";
    ctx.strokeStyle = "#7b4cc2";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-24, -28, 48, 58, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#5d2f9f";
    ctx.beginPath(); ctx.roundRect(-13, -33, 26, 9, 4); ctx.fill();
    ctx.fillStyle = "#321753";
    ctx.font = "900 13px 'Orbitron', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("HR", 0, -15);
    ctx.strokeStyle = "#321753";
    ctx.lineWidth = 1.1;
    for (let y = -2; y <= 18; y += 10) {
      ctx.strokeRect(-16, y - 4, 6, 6);
      ctx.beginPath(); ctx.moveTo(-5, y); ctx.lineTo(16, y); ctx.stroke();
    }
    ctx.save();
    ctx.rotate(0.16);
    ctx.strokeStyle = "#d62018";
    ctx.fillStyle = "#d62018";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-14, 14, 28, 11, 2); ctx.stroke();
    ctx.font = "900 7px 'Orbitron', monospace";
    ctx.fillText("SIGN", 0, 19);
    ctx.restore();
  } else if (type.kind === "bonus") {
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(-4 + i * 4, -5 + i * 4);
      ctx.rotate(-0.08 + i * 0.04);
      ctx.fillStyle = i === 2 ? "#47db72" : "#2fb85b";
      ctx.strokeStyle = "#0b5f2e";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.roundRect(-24, -13, 48, 26, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#053d1d";
      ctx.font = "900 12px 'Orbitron', monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("$", 0, 1);
      ctx.restore();
    }
    ctx.fillStyle = "#f7df75";
    ctx.beginPath(); ctx.roundRect(-6, -17, 12, 33, 2); ctx.fill();
  } else {
    ctx.fillStyle = "#050b08";
    ctx.strokeStyle = "#00f7c0";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-32, -18, 64, 36, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(0,247,192,0.08)";
    ctx.fillRect(-28, -12, 56, 24);
    ctx.strokeStyle = "rgba(0,247,192,0.22)";
    ctx.lineWidth = 1;
    for (let x = -24; x <= 24; x += 12) {
      ctx.beginPath(); ctx.moveTo(x, -12); ctx.lineTo(x, 12); ctx.stroke();
    }
    ctx.strokeStyle = "#00f7c0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-25, 8);
    ctx.lineTo(-16, 4);
    ctx.lineTo(-8, 7);
    ctx.lineTo(0, -6);
    ctx.lineTo(9, -1);
    ctx.lineTo(18, -10);
    ctx.lineTo(27, -4);
    ctx.stroke();
    ctx.fillStyle = "#f04438";
    ctx.font = "900 7px 'Orbitron', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("TICKER", 0, 14);
  }

  ctx.restore();
}

function drawOfficeBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const wall = ctx.createLinearGradient(0, 0, 0, H * 0.68);
  wall.addColorStop(0, "#09111d");
  wall.addColorStop(0.6, "#0e1724");
  wall.addColorStop(1, "#151923");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 26; x < W; x += 72) {
    ctx.beginPath(); ctx.moveTo(x, 48); ctx.lineTo(x, H * 0.62); ctx.stroke();
  }

  const floorY = H * 0.66;
  const floor = ctx.createLinearGradient(0, floorY, 0, H);
  floor.addColorStop(0, "#101923");
  floor.addColorStop(1, "#06080f");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY, W, H - floorY);
  ctx.strokeStyle = "rgba(0,247,192,0.06)";
  for (let i = 0; i < 8; i++) {
    const y = floorY + i * ((H - floorY) / 8);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + i * 2); ctx.stroke();
  }
  for (let x = -W; x <= W * 2; x += 70) {
    ctx.beginPath(); ctx.moveTo(W / 2, floorY); ctx.lineTo(x, H); ctx.stroke();
  }

  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(0, floorY - 10, W, 12);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.moveTo(0, floorY - 10); ctx.lineTo(W, floorY - 10); ctx.stroke();

  const winY = Math.max(58, H * 0.13);
  const winH = Math.min(126, H * 0.27);
  const panelCount = W < 560 ? 3 : 4;
  const gap = 10;
  const totalW = Math.min(W - 90, 560);
  const panelW = (totalW - gap * (panelCount - 1)) / panelCount;
  const startX = (W - totalW) / 2;
  for (let i = 0; i < panelCount; i++) {
    const x = startX + i * (panelW + gap);
    const sky = ctx.createLinearGradient(0, winY, 0, winY + winH);
    sky.addColorStop(0, "#102b4d");
    sky.addColorStop(1, "#05070d");
    ctx.fillStyle = sky;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x, winY, panelW, winH, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(0,247,192,0.18)";
    ctx.beginPath(); ctx.arc(x + panelW * 0.7, winY + 24 + Math.sin(t * 0.01 + i) * 2, 9, 0, Math.PI * 2); ctx.fill();
    for (let b = 0; b < 6; b++) {
      const bx = x + 8 + b * (panelW / 6);
      const bh = 18 + ((b * 17 + i * 9) % 42);
      ctx.fillStyle = b % 2 ? "#0b1020" : "#11182a";
      ctx.fillRect(bx, winY + winH - bh, panelW / 8, bh);
      ctx.fillStyle = "rgba(255,218,122,0.38)";
      ctx.fillRect(bx + 3, winY + winH - bh + 6, 2, 2);
      ctx.fillRect(bx + 3, winY + winH - bh + 15, 2, 2);
    }
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + 6, winY + 6, panelW * 0.22, winH - 12);
  }

  const signX = Math.max(18, W * 0.04);
  const signY = H * 0.27;
  ctx.fillStyle = "rgba(180,20,0,0.13)";
  ctx.strokeStyle = "rgba(239,68,68,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(signX, signY, 148, 58, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ff7a45";
  ctx.font = "900 8px 'Orbitron', monospace";
  ctx.textAlign = "center";
  ctx.fillText("HR INCIDENT LOG", signX + 74, signY + 19);
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = "7px monospace";
  ctx.fillText("open tabs: too many", signX + 74, signY + 34);
  ctx.fillText("coffee claims: disputed", signX + 74, signY + 47);

  const cabinetX = W - 152;
  const cabinetY = H * 0.35;
  if (cabinetX > 210) {
    ctx.fillStyle = "#202b36";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.roundRect(cabinetX, cabinetY, 86, 116, 4); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const y = cabinetY + 10 + i * 33;
      ctx.fillStyle = "#18222c";
      ctx.beginPath(); ctx.roundRect(cabinetX + 9, y, 68, 25, 3); ctx.fill();
      ctx.strokeStyle = "rgba(0,247,192,0.18)";
      ctx.strokeRect(cabinetX + 28, y + 9, 30, 5);
    }
    ctx.fillStyle = "#9bd36b";
    ctx.beginPath(); ctx.roundRect(cabinetX + 104, cabinetY + 55, 11, 58, 4); ctx.fill();
    ctx.fillStyle = "#4c8b45";
    ctx.beginPath(); ctx.ellipse(cabinetX + 96, cabinetY + 58, 14, 7, -0.65, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cabinetX + 119, cabinetY + 48, 16, 8, 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5b3823";
    ctx.beginPath(); ctx.roundRect(cabinetX + 95, cabinetY + 108, 30, 18, [3, 3, 7, 7]); ctx.fill();
  }

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  for (let i = 0; i < 5; i++) {
    const chairX = W / 2 + (i - 2) * 82;
    const chairY = floorY - 4 + Math.abs(i - 2) * 6;
    ctx.beginPath(); ctx.roundRect(chairX - 23, chairY - 36, 46, 42, 8); ctx.fill();
    ctx.fillRect(chairX - 4, chairY + 4, 8, 22);
  }

  ctx.fillStyle = "rgba(0,247,192,0.035)";
  ctx.fillRect(0, H * 0.14, W, 24);
  ctx.font = "bold 8px monospace";
  ctx.fillStyle = "rgba(0,247,192,0.25)";
  ctx.textBaseline = "middle";
  const ticker = "  NDA RISK UP  COFFEE SPILL DOWN  PHONE CALL MISSED  BONUS UNDER REVIEW  HR WATCHLIST ACTIVE  ";
  const toff = (t * 0.8) % (ticker.length * 5.2);
  ctx.fillText(ticker.repeat(3), -toff, H * 0.14 + 12);
}

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
  ctx.moveTo(-9, -36);
  ctx.bezierCurveTo(-24, -31, -25, -11, -19, 4);
  ctx.bezierCurveTo(-11, 13, 11, 13, 19, 4);
  ctx.bezierCurveTo(25, -11, 24, -31, 9, -36);
  ctx.closePath(); ctx.fill();

  // ── THE CANNONS — exaggerated cartoon bust with jiggle physics ──
  // Left cannon
  const lx = -11 + jiggleL * 0.34;
  const ly = -17 + bounceL * 0.34;
  ctx.save();
  ctx.translate(lx, ly);
  // Main shape
  const gradL = ctx.createRadialGradient(-4, -5, 2, 0, 0, 20);
  gradL.addColorStop(0, "#ffffff");
  gradL.addColorStop(0.66, "#d9dee7");
  gradL.addColorStop(1, "#9aa6b8");
  ctx.fillStyle = gradL;
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 16, -0.15, 0, Math.PI * 2); ctx.fill();
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath(); ctx.ellipse(-5, -5, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Right cannon
  const rx = 11 + jiggleR * 0.34;
  const ry = -17 + bounceR * 0.34;
  ctx.save();
  ctx.translate(rx, ry);
  const gradR = ctx.createRadialGradient(-4, -5, 2, 0, 0, 20);
  gradR.addColorStop(0, "#ffffff");
  gradR.addColorStop(0.66, "#d9dee7");
  gradR.addColorStop(1, "#9aa6b8");
  ctx.fillStyle = gradR;
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 16, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath(); ctx.ellipse(-5, -5, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(110,120,140,0.28)";
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -33); ctx.bezierCurveTo(-2, -18, -2, -5, 0, 9); ctx.stroke();
  ctx.fillStyle = "#f4c090";
  ctx.beginPath();
  ctx.moveTo(-7, -36);
  ctx.quadraticCurveTo(0, -28, 7, -36);
  ctx.lineTo(0, -30);
  ctx.closePath(); ctx.fill();

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
  tableW: number,
  landedObjs: FallingObj[],
  t: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Table surface
  ctx.fillStyle = "#1a3040";
  ctx.beginPath(); ctx.roundRect(-tableW / 2, -TABLE_H / 2, tableW, TABLE_H, 6); ctx.fill();
  ctx.strokeStyle = "rgba(0,247,192,0.4)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-tableW / 2, -TABLE_H / 2, tableW, TABLE_H, 6); ctx.stroke();

  // Wood grain
  ctx.strokeStyle = "rgba(0,247,192,0.06)"; ctx.lineWidth = 1;
  for (let xi = -tableW / 2 + 20; xi < tableW / 2; xi += 28) {
    const w = Math.sin(xi * 0.05 + t * 0.02) * 2;
    ctx.beginPath(); ctx.moveTo(xi, -TABLE_H / 2 + 3 + w); ctx.lineTo(xi + 6, TABLE_H / 2 - 3 + w); ctx.stroke();
  }

  // Table legs
  ctx.fillStyle = "#0d2030"; ctx.strokeStyle = "rgba(0,247,192,0.25)"; ctx.lineWidth = 1.5;
  for (const lx of [-tableW / 2 + 28, tableW / 2 - 28]) {
    ctx.beginPath(); ctx.roundRect(lx - 8, TABLE_H / 2, 16, 36, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(lx - 12, TABLE_H / 2 + 32, 24, 6, 2); ctx.fill(); ctx.stroke();
  }

  // Landed objects
  for (const obj of landedObjs) {
    if (!obj.slidingOff) {
      ctx.save();
      ctx.translate(obj.landedX, -TABLE_H / 2 - obj.type.h / 2);
      ctx.rotate(obj.angle);
      drawPropAtOrigin(ctx, obj.type, t);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawFallingObj(ctx: CanvasRenderingContext2D, obj: FallingObj, t: number) {
  ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(obj.angle);
  drawPropAtOrigin(ctx, obj.type, t);
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
    // Continuous hold input from keyboard, mouse, and touch.
    holdLeft: false, holdRight: false,
    pointerDown: false,
    objs: [] as FallingObj[],
    debris: [] as Debris[],
    spawnTimer: 0,
    score: 0, scoreTimer: 0,
    dangerTimer: 0,
    expression: "normal" as "normal" | "worried" | "panic" | "shrug",
    t: 0, raf: 0, running: false,
    canvasW: 600, canvasH: 500,
    tableW: TABLE_W,
    tableCX: 300, tableCY: 320,
  });

  const endGame = useCallback(() => {
    const g = G.current;
    g.running = false;
    g.pointerDown = false;
    g.holdLeft = false;
    g.holdRight = false;
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
        x: g.tableCX + (Math.random() - 0.5) * g.tableW,
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
    g.tableAngle = 0; g.tableAngularVel = (Math.random() - 0.5) * 0.001;
    g.jiggleL = 0; g.velJiggleL = 0; g.jiggleR = 0; g.velJiggleR = 0;
    g.bounceL = 0; g.velBounceL = (Math.random() - 0.5) * 1.5;
    g.bounceR = 0; g.velBounceR = (Math.random() - 0.5) * 1.5;
    g.holdLeft = false; g.holdRight = false; g.pointerDown = false;
    g.objs = []; g.debris = []; g.spawnTimer = -120;
    g.score = 0; g.scoreTimer = 0; g.dangerTimer = 0; g.t = 0;
    g.expression = "normal"; g.running = true;
    g.canvasW = canvas.clientWidth; g.canvasH = canvas.clientHeight;
    g.tableW = Math.max(280, Math.min(TABLE_W, g.canvasW - 44));
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
      G.current.tableW = Math.max(280, Math.min(TABLE_W, canvas.clientWidth - 44));
      G.current.tableCX = canvas.clientWidth / 2;
      G.current.tableCY = canvas.clientHeight * 0.6;
    };
    resize(); window.addEventListener("resize", resize);

    // ── Keyboard: hold for continuous tilt ──
    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        g.holdLeft = e.type === "keydown";
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        g.holdRight = e.type === "keydown";
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    // Pointer: hold either side for continuous tilt.
    const setPointerHold = (clientX: number) => {
      const g = G.current;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      g.holdLeft = x < rect.width / 2;
      g.holdRight = !g.holdLeft;
    };
    const onPointerDown = (e: PointerEvent) => {
      const g = G.current; if (!g.running) return;
      e.preventDefault();
      g.pointerDown = true;
      setPointerHold(e.clientX);
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const g = G.current; if (!g.pointerDown || !g.running) return;
      e.preventDefault();
      setPointerHold(e.clientX);
    };
    const onPointerUp = (e: PointerEvent) => {
      const g = G.current;
      g.pointerDown = false;
      g.holdLeft = false;
      g.holdRight = false;
      canvas.releasePointerCapture?.(e.pointerId);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

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

        const progress = Math.min(g.score / 100, 1);
        const openingGrace = Math.max(0, 1 - g.t / 260);

        // Hold input: smooth continuous torque with enough authority to recover.
        const holdStrength = 0.0046;
        if (g.holdLeft) {
          g.tableAngularVel -= holdStrength * dt;
          kickCannons(g, -1, 0.04 * dt);
        }
        if (g.holdRight) {
          g.tableAngularVel += holdStrength * dt;
          kickCannons(g, 1, 0.04 * dt);
        }

        // Table physics: early rounds self-correct slightly, then difficulty ramps.
        const centerAssist = (0.0058 + openingGrace * 0.006 - progress * 0.0014) * dt;
        const tipForce = (0.0025 + progress * 0.0039) * (1 - openingGrace * 0.65) * dt;
        const drift = (0.00001 + progress * 0.000045) * dt;
        g.tableAngularVel += Math.sin(g.tableAngle) * tipForce;
        g.tableAngularVel -= g.tableAngle * centerAssist;
        g.tableAngularVel += (Math.random() - 0.5) * drift;
        g.tableAngularVel *= Math.pow(0.988 - progress * 0.004, dt);
        g.tableAngularVel = Math.max(-0.035, Math.min(0.035, g.tableAngularVel));
        g.tableAngle += g.tableAngularVel * dt;
        g.tableAngle = Math.max(-MAX_ANGLE * 1.15, Math.min(MAX_ANGLE * 1.15, g.tableAngle));

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

        // Character wobble adds flavor without hijacking the controls.
        g.tableAngularVel += (g.jiggleL - g.jiggleR) * 0.000045 * dt;

        // Spawn objects
        g.spawnTimer += dt;
        const spawnInt = Math.max(58, 124 - progress * 58);
        if (g.spawnTimer >= spawnInt) {
          g.spawnTimer = 0;
          const type = OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)];
          const spread = Math.min(g.tableW * 1.08, W - 60);
          const sx = Math.max(30, Math.min(W - 30, g.tableCX + (Math.random() - 0.5) * spread));
          g.objs.push({
            x: sx, y: -40, vy: 1.9 + Math.random() * 1.3 + progress * 0.8, vx: (Math.random() - 0.5) * (0.8 + progress * 1.1),
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
          if (obj.landed) {
            g.tableAngularVel += (obj.landedX / (g.tableW / 2)) * obj.type.weight * 0.000025 * dt;
            if (Math.abs(g.tableAngle) > 0.34) obj.slidingOff = true;
            continue;
          }
          obj.x += obj.vx * dt; obj.y += obj.vy * dt; obj.angle += obj.spin * dt;
          // Collision with rotated table
          const rx = obj.x - g.tableCX, ry = obj.y - g.tableCY;
          const lx = rx * Math.cos(-g.tableAngle) - ry * Math.sin(-g.tableAngle);
          const ly = rx * Math.sin(-g.tableAngle) + ry * Math.cos(-g.tableAngle);
          const halfW = obj.type.w / 2;
          const halfH = obj.type.h / 2;
          if (lx > -g.tableW / 2 + halfW && lx < g.tableW / 2 - halfW && ly + halfH > -TABLE_H / 2 && ly - halfH < TABLE_H / 2) {
            obj.landed = true; obj.landedX = lx;
            g.tableAngularVel += (lx / (g.tableW / 2)) * obj.type.weight * 0.0046;
            kickCannons(g, 0, 0.8);
          }
        }
        g.objs = g.objs.filter(o => o.y < H + 80 && !(o.slidingOff && o.y > H + 20));

        const abs = Math.abs(g.tableAngle);
        g.expression = abs > MAX_ANGLE * 0.75 ? "panic" : abs > MAX_ANGLE * 0.44 ? "worried" : "normal";

        if (abs >= MAX_ANGLE && g.t > 180) {
          g.dangerTimer += dt;
          if (g.dangerTimer >= 34) endGame();
        } else {
          g.dangerTimer = Math.max(0, g.dangerTimer - dt * 2.2);
        }
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
      drawOfficeBackdrop(ctx, W, H, g.t);
      ctx.strokeStyle = "rgba(0,247,192,0.025)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Whiteboard
      ctx.fillStyle = "rgba(230,230,230,0.05)"; ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(W * 0.7, H * 0.22, 145, 100, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(0,247,192,0.4)"; ctx.font = "bold 8px 'Orbitron', monospace"; ctx.textAlign = "center";
      ctx.fillText("LEGAL HOLD:", W * 0.7 + 72, H * 0.22 + 18);
      ctx.fillStyle = "rgba(200,26,0,0.65)"; ctx.font = "7px monospace"; ctx.textAlign = "left";
      ["• NDAs everywhere", "• Coffee on carpet", "• Phones on silent", "• HR says nope", "• Bonus delayed"].forEach((l, i) =>
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
      if (g.dangerTimer > 0 && g.running) {
        ctx.fillStyle = "#ff6644";
        ctx.font = "bold 7px 'Orbitron', monospace";
        ctx.fillText("HOLD!", mx, my + mh + 14);
      }

      // Falling items
      for (const o of g.objs) if (!o.landed) drawFallingObj(ctx, o, g.t);

      // Table
      drawTable(ctx, g.tableCX, g.tableCY, g.tableAngle, g.tableW, g.objs.filter(o=>o.landed), g.t);

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
        ctx.fillText("HOLD LEFT  <  >  HOLD RIGHT", W / 2, H - 28);
        ctx.globalAlpha = 1;
      }
    };

    G.current.raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(G.current.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, [endGame]);

  return (
    <div className="fixed inset-0 bg-[#06080f] flex flex-col" style={{ fontFamily: "'Orbitron', monospace" }}>
      <canvas ref={canvasRef} className="flex-1 w-full h-full" style={{ display: "block", touchAction: "none" }} />

      {phase === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-md w-full">
            <div className="text-4xl mb-3">⚖️</div>
            <h1 className="text-[#00f7c0] font-black text-2xl mb-1 leading-tight" style={{ textShadow: "0 0 20px #00f7c0" }}>
              CANNON BOARDROOM
            </h1>
            <h2 className="text-white font-black text-3xl mb-4">BALANCE</h2>
            <div className="bg-white/5 border border-[#00f7c0]/20 rounded-2xl p-4 mb-6 text-sm text-white/70 space-y-2">
              <p>Target: <span className="text-[#00f7c0] font-bold">keep the boardroom table balanced.</span></p>
              <p>Counter-tilt before coffee mugs, NDAs, phones, and bonus money pile up.</p>
              <p>The table now gives you a short danger window instead of ending instantly.</p>
              <p className="text-white/50 text-xs pt-1">Hold arrow keys, A/D, or press either side of the screen.</p>
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
