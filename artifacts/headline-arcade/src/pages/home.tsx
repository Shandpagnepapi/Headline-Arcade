import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { SiKofi, SiBuymeacoffee } from "react-icons/si";
import { Copy, ExternalLink, Gamepad2, Share2, Trophy, Wallet, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const games = [
  {
    id: "game1",
    gameKey: "ww11",
    title: "World War 11",
    img: `${BASE}/thumbs/ww11.png`,
    live: true,
  },
  {
    id: "game2",
    gameKey: "cannon",
    title: "Cannon Boardroom Balance",
    img: `${BASE}/thumbs/bigcannons.png`,
    live: true,
  },
  {
    id: "game3",
    gameKey: "alien",
    title: "Flappy Alien Files",
    img: `${BASE}/thumbs/aliensoon.png`,
    live: true,
  },
  {
    id: "game4",
    gameKey: null,
    title: "More Coming Soon...",
    img: `${BASE}/thumbs/soon1.png`,
    live: false,
  },
];

const GAME_LABELS: Record<string, string> = {
  ww11: "World War 11",
  cannon: "Cannon Boardroom",
  alien: "Flappy Alien Files",
};

type GameMeta = typeof games[number];

const supportOptions = [
  {
    key: "crypto",
    label: "Crypto Tip Jar",
    note: "Use a payment link or public wallet address.",
    href: import.meta.env.VITE_SUPPORT_CRYPTO_URL,
    icon: <Wallet size={17} />,
    accent: "text-[#8cf7ff] border-[#8cf7ff]/30 bg-[#8cf7ff]/10 hover:bg-[#8cf7ff]/15",
  },
  {
    key: "kofi",
    label: "Ko-fi",
    note: "Simple creator tips through Stripe or PayPal.",
    href: import.meta.env.VITE_SUPPORT_KOFI_URL,
    icon: <SiKofi />,
    accent: "text-[#29abe0] border-[#29abe0]/30 bg-[#29abe0]/10 hover:bg-[#29abe0]/20",
  },
  {
    key: "bmac",
    label: "Buy Me a Coffee",
    note: "Familiar one-time support page for players.",
    href: import.meta.env.VITE_SUPPORT_BMAC_URL,
    icon: <SiBuymeacoffee />,
    accent: "text-[#e8c900] border-[#FFDD00]/30 bg-[#FFDD00]/10 hover:bg-[#FFDD00]/20",
  },
];

const cryptoAddress = import.meta.env.VITE_SUPPORT_CRYPTO_ADDRESS;
const cryptoLabel = import.meta.env.VITE_SUPPORT_CRYPTO_LABEL || "Wallet";

async function copyText(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(el);

  if (!copied) {
    throw new Error("Clipboard copy failed");
  }
}

/* ── Newspaper page component ── */
function NewspaperPage({
  style,
  headline,
  flip = false,
}: {
  style: React.CSSProperties;
  headline: string;
  flip?: boolean;
}) {
  return (
    <div
      className="absolute overflow-hidden rounded-sm select-none pointer-events-none"
      style={{
        background: "linear-gradient(160deg, #e8dfc8 0%, #d6cdb0 60%, #c8be9e 100%)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15), 2px 4px 12px rgba(0,0,0,0.5)",
        ...style,
      }}
    >
      <div style={{ background: "#1a1a1a", padding: "3px 6px 2px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #333" }}>
        <span style={{ color: "#e8dfc8", fontSize: 5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", fontFamily: "serif" }}>The Daily Headline</span>
        <span style={{ color: "#888", fontSize: 4, fontFamily: "monospace" }}>Vol. 142 No. 37</span>
      </div>
      <div style={{ padding: "4px 5px 3px", borderBottom: "1px solid #999" }}>
        <div style={{ fontSize: 6, fontWeight: 900, color: "#111", fontFamily: "serif", lineHeight: 1.15, textTransform: "uppercase" }}>{headline}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: flip ? "1fr 1fr 1fr" : "1fr 1fr", gap: 3, padding: "3px 4px" }}>
        {Array.from({ length: flip ? 3 : 2 }).map((_, col) => (
          <div key={col}>
            {Array.from({ length: 14 }).map((_, row) => (
              <div key={row} style={{ height: 2.5, background: "#7a7060", borderRadius: 1, marginBottom: 2, width: `${60 + Math.sin(col * 5 + row * 2.3) * 30}%`, opacity: 0.75 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ margin: "3px 4px", height: 22, background: "#b0a488", borderRadius: 1, border: "1px solid #9a9078" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, padding: "2px 4px" }}>
        {[0, 1].map((col) => (
          <div key={col}>
            {Array.from({ length: 8 }).map((_, row) => (
              <div key={row} style={{ height: 2.5, background: "#7a7060", borderRadius: 1, marginBottom: 2, width: `${55 + Math.cos(col * 4 + row * 1.7) * 40}%`, opacity: 0.65 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Leaderboard section ── */
function WW11Thumbnail() {
  return (
    <div
      role="img"
      aria-label="World War 11 thumbnail showing fake WW11 labels falling toward a correct WWII pickup"
      className="relative w-full h-full overflow-hidden bg-[#101017] group-hover:scale-105 transition-transform duration-500"
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 35%, rgba(0,247,192,0.18), transparent 45%), linear-gradient(180deg, #15131f 0%, #07080d 100%)" }} />
      <div className="absolute inset-x-0 top-0 h-9 bg-black/55 border-b border-primary/25" />
      <div className="absolute left-3 top-3 right-3 flex items-center justify-between">
        <span className="text-[9px] font-display font-black text-primary tracking-widest">HISTORY CHECK</span>
        <span className="text-[9px] font-display font-black text-red-400 tracking-widest">WW11?</span>
      </div>

      <div className="absolute left-[10%] top-[25%] w-[31%] h-[30%] rounded-md border border-red-400/70 bg-red-950/80 rotate-[-13deg] shadow-[0_0_18px_rgba(248,113,113,0.25)] flex items-center justify-center">
        <span className="font-display font-black text-red-200 text-[clamp(16px,4vw,28px)] leading-none">WW 11</span>
      </div>
      <div className="absolute right-[13%] top-[18%] w-[24%] h-[23%] rounded-md border border-red-400/60 bg-black/70 rotate-[15deg] flex items-center justify-center">
        <span className="font-display font-black text-red-300 text-[clamp(12px,3vw,20px)] leading-none">XI!</span>
      </div>
      <div className="absolute right-[6%] bottom-[18%] w-[28%] h-[26%] rounded-md border border-red-500/50 bg-red-950/60 rotate-[8deg] flex items-center justify-center">
        <span className="font-display font-black text-red-200 text-[clamp(10px,2.7vw,18px)] leading-tight text-center">11th<br />WAR</span>
      </div>

      <div className="absolute left-1/2 bottom-[18%] -translate-x-1/2 w-[39%] h-[22%] rounded-lg border border-emerald-300 bg-emerald-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.45)] flex items-center justify-center -rotate-3">
        <span className="font-display font-black text-[clamp(15px,4vw,27px)] leading-none">WWII</span>
      </div>
      <div className="absolute left-[18%] bottom-[11%] w-[64%] h-2 rounded-full bg-primary/25 blur-sm" />
      <div className="absolute left-[22%] bottom-[7%] h-2 w-[18%] rounded-full bg-primary/45" />
      <div className="absolute right-[24%] bottom-[7%] h-2 w-[18%] rounded-full bg-primary/45" />

      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px bg-primary/20"
          style={{ height: `${24 + (i % 3) * 16}px`, left: `${8 + i * 11}%`, top: `${18 + (i % 4) * 10}%` }}
        />
      ))}
    </div>
  );
}

function CannonThumbnail() {
  return (
    <div
      role="img"
      aria-label="Cannon Boardroom Balance thumbnail showing an office table with falling coffee, phone, and NDA"
      className="relative w-full h-full overflow-hidden bg-[#09111d] group-hover:scale-105 transition-transform duration-500"
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0d1724 0%, #07090f 68%, #05070a 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-[34%]" style={{ background: "linear-gradient(180deg, rgba(0,247,192,0.04), rgba(0,247,192,0.01))" }} />
      <div className="absolute left-1/2 bottom-0 h-[34%] w-px bg-primary/25" />
      {[-3, -2, -1, 1, 2, 3].map((line) => (
        <div
          key={line}
          className="absolute bottom-0 left-1/2 h-[37%] w-px origin-bottom bg-primary/12"
          style={{ transform: `rotate(${line * 13}deg)` }}
        />
      ))}

      <div className="absolute left-[10%] top-[16%] w-[23%] h-[31%] rounded border border-sky-300/25 bg-sky-700/15">
        <div className="absolute bottom-0 left-[12%] w-[16%] h-[28%] bg-black/35" />
        <div className="absolute bottom-0 left-[40%] w-[14%] h-[44%] bg-black/35" />
        <div className="absolute bottom-0 right-[13%] w-[16%] h-[35%] bg-black/35" />
      </div>
      <div className="absolute left-[38%] top-[14%] w-[23%] h-[31%] rounded border border-sky-300/25 bg-sky-700/15" />
      <div className="absolute right-[11%] top-[16%] w-[23%] h-[31%] rounded border border-sky-300/25 bg-sky-700/15" />

      <div className="absolute left-[12%] bottom-[26%] w-[76%] h-[10%] rounded-md border border-primary bg-[#173747] shadow-[0_0_18px_rgba(0,247,192,0.28)] rotate-[-2deg]" />
      <div className="absolute left-[17%] bottom-[16%] w-[8%] h-[12%] rounded-b bg-[#0e2b37] border border-primary/40" />
      <div className="absolute right-[17%] bottom-[16%] w-[8%] h-[12%] rounded-b bg-[#0e2b37] border border-primary/40" />

      <div className="absolute left-[43%] bottom-[29%] w-[14%] h-[27%]">
        <div className="absolute left-1/2 top-[10%] -translate-x-1/2 w-[46%] aspect-square rounded-full bg-[#f0bd8b]" />
        <div className="absolute left-[18%] top-0 w-[64%] h-[27%] rounded-full bg-[#5b3216]" />
        <div className="absolute left-[22%] top-[26%] w-[56%] h-[48%] rounded-t-lg bg-white" />
        <div className="absolute left-[13%] top-[30%] w-[27%] h-[45%] bg-[#111318] rounded-l-md" />
        <div className="absolute right-[13%] top-[30%] w-[27%] h-[45%] bg-[#111318] rounded-r-md" />
        <div className="absolute left-[23%] top-[72%] w-[54%] h-[22%] rounded-b-md bg-[#111318]" />
      </div>

      <div className="absolute left-[14%] top-[8%] w-[15%] h-[25%] rounded-md bg-[#dfe7ed] border border-white/70 rotate-[-15deg]">
        <div className="absolute left-[18%] top-[18%] right-[18%] h-[13%] rounded-full bg-[#3a1e12]" />
        <div className="absolute right-[-20%] top-[35%] w-[28%] h-[34%] rounded-full border-2 border-[#dfe7ed]" />
      </div>
      <div className="absolute right-[19%] top-[5%] w-[16%] h-[32%] rounded-md bg-[#070a12] border border-slate-400 rotate-[13deg]">
        <div className="absolute inset-[12%] rounded-sm bg-gradient-to-b from-blue-500 to-[#070a12]" />
        <div className="absolute left-[32%] right-[32%] bottom-[12%] h-px bg-white/70" />
      </div>
      <div className="absolute left-[58%] top-[18%] w-[23%] h-[30%] rounded-sm bg-[#f1ead8] border border-stone-300 rotate-[9deg] shadow-[0_0_16px_rgba(255,255,255,0.16)]">
        <div className="absolute inset-x-[12%] top-[18%] h-px bg-slate-600/60" />
        <div className="absolute inset-x-[12%] top-[32%] h-px bg-slate-600/35" />
        <div className="absolute inset-x-[12%] top-[46%] h-px bg-slate-600/35" />
        <div className="absolute left-[20%] right-[20%] bottom-[18%] border-2 border-red-600 rounded-sm text-red-600 font-display font-black text-[clamp(8px,2vw,15px)] leading-none flex items-center justify-center -rotate-6">NDA</div>
      </div>
    </div>
  );
}

function GameThumbnail({ game }: { game: GameMeta }) {
  if (game.gameKey === "ww11") return <WW11Thumbnail />;
  if (game.gameKey === "cannon") return <CannonThumbnail />;

  return (
    <img
      src={game.img}
      alt={game.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

type BoardEntry = { playerName: string; score: number };
type BoardData = Record<string, BoardEntry[]>;

function Leaderboard() {
  const [data, setData] = useState<BoardData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [activeGame, setActiveGame] = useState<"ww11" | "cannon" | "alien">("ww11");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchScores = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const r = await fetch("/api/scores/all-leaderboard", { cache: "no-store" });
      if (!r.ok) throw new Error(`Leaderboard request failed: ${r.status}`);
      const d = await r.json();
      setData(d);
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(() => fetchScores(), 30_000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  const rows: BoardEntry[] = data[activeGame] ?? [];
  const medals = ["🥇", "🥈", "🥉"];

  const timeAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000) < 5
      ? "just now"
      : `${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago`
    : null;

  return (
    <section id="leaderboard" className="px-4 pb-16 max-w-3xl mx-auto scroll-mt-16">
      <div className="flex items-center gap-3 mb-4">
        <Trophy size={18} className="text-primary" style={{ filter: "drop-shadow(0 0 6px #00f7c0)" }} />
        <h3 className="font-display font-bold text-white text-xl tracking-wide">LEADERBOARD</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent" />
        {timeAgo && (
          <span className="text-muted-foreground text-xs hidden sm:block">Updated {timeAgo}</span>
        )}
        <button
          onClick={() => fetchScores(true)}
          disabled={refreshing}
          className="text-primary/70 hover:text-primary transition-colors disabled:opacity-40"
          title="Refresh leaderboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: refreshing ? "spin 0.7s linear infinite" : "none" }}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
        </button>
      </div>

      {/* Game tabs */}
      <div className="flex gap-2 mb-4">
        {(["ww11", "cannon", "alien"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setActiveGame(g)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg font-display tracking-wide transition-all border ${
              activeGame === g
                ? "bg-primary text-background border-primary"
                : "border-primary/25 text-muted-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            {g === "ww11" ? "WW11" : g === "cannon" ? "CANNON" : "ALIEN"}
          </button>
        ))}
      </div>

      <div className="bg-card border border-primary/20 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_80px] px-4 py-2 border-b border-primary/15 bg-black/30">
          <span className="text-muted-foreground text-xs font-bold">#</span>
          <span className="text-muted-foreground text-xs font-bold">PLAYER</span>
          <span className="text-muted-foreground text-xs font-bold text-right">{activeGame === "alien" ? "FILES" : activeGame === "cannon" ? "SECONDS" : "SCORE"}</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-muted-foreground text-sm animate-pulse">Loading scores…</div>
        ) : error && rows.length === 0 ? (
          <div className="py-10 text-center px-4">
            <p className="text-muted-foreground text-sm">Leaderboard is offline right now.</p>
            <p className="text-primary/60 text-xs mt-1">Local scores still work; connect the API to publish global scores.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground text-sm">No scores yet.</p>
            <p className="text-primary/60 text-xs mt-1">Be the first to play and submit!</p>
          </div>
        ) : (
          rows.map((r, i) => (
            <div
              key={i}
              className={`grid grid-cols-[32px_1fr_80px] px-4 py-2.5 items-center border-b border-primary/08 last:border-0 ${i === 0 ? "bg-primary/5" : ""}`}
            >
              <span className="text-sm">{i < 3 ? medals[i] : <span className="text-muted-foreground font-mono text-xs">{i + 1}</span>}</span>
              <span className="text-white font-bold text-sm truncate">{r.playerName}</span>
              <span className={`text-right font-display font-black text-sm ${i === 0 ? "text-primary" : "text-white/80"}`}
                style={i === 0 ? { textShadow: "0 0 8px #00f7c0" } : {}}>
                {r.score}{activeGame === "cannon" ? "s" : ""}
              </span>
            </div>
          ))
        )}
      </div>
      <p className="text-center text-muted-foreground text-xs mt-3">Submit your score after playing to appear here · auto-refreshes every 30s</p>
    </section>
  );
}

export default function Home() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (navRef.current) navRef.current.classList.toggle("nav-scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${BASE || ""}/`;
    const shareData: ShareData = {
      title: "Headline Arcade",
      text: "Play tiny arcade games built from the weirdest imaginary headlines.",
      url: shareUrl,
    };

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    try {
      await copyText(`${shareData.text} ${shareData.url}`);
      toast({
        title: "Link copied",
        description: "Native sharing was unavailable, so the arcade link is on your clipboard.",
      });
    } catch {
      toast({
        title: "Share failed",
        description: "Your browser blocked sharing. Copy the address bar as a fallback.",
        variant: "destructive",
      });
    }
  };

  const handleCopyWallet = async () => {
    if (!cryptoAddress) return;

    try {
      await copyText(cryptoAddress);
      toast({
        title: "Wallet copied",
        description: `${cryptoLabel} address copied to your clipboard.`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans overflow-x-hidden">

      {/* ── BANNER ── */}
      <header className="relative w-full overflow-hidden bg-[#07090d]" style={{ minHeight: 280 }}>
        <NewspaperPage headline="Markets Reel as Banker Fires Giant Cannons Into Sea" style={{ width: 155, height: 210, left: "-10px", top: "-20px", transform: "rotate(-12deg)", opacity: 0.55 }} />
        <NewspaperPage headline="Pigeons Storm City Hall for Third Week Running" style={{ width: 145, height: 195, left: "60px", top: "30px", transform: "rotate(-4deg)", opacity: 0.45 }} flip />
        <NewspaperPage headline="Historians Baffled by Discovery of World War 11" style={{ width: 150, height: 200, left: "140px", top: "-8px", transform: "rotate(5deg)", opacity: 0.38 }} />
        <NewspaperPage headline="Aliens Demand Press Conference, Refuse All Questions" style={{ width: 155, height: 210, right: "-10px", top: "-18px", transform: "rotate(11deg)", opacity: 0.55 }} />
        <NewspaperPage headline="Stock Market Closes at Negative Infinity, Analysts Unbothered" style={{ width: 145, height: 195, right: "62px", top: "28px", transform: "rotate(3deg)", opacity: 0.45 }} flip />
        <NewspaperPage headline="Mayor Signs Bill Renaming Ocean 'Soup'" style={{ width: 150, height: 200, right: "142px", top: "-6px", transform: "rotate(-6deg)", opacity: 0.38 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(0,247,192,0.06) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none select-none">
          <Gamepad2 className="absolute text-primary/25" style={{ width: 28, height: 28, left: "8%", top: "35%", filter: "drop-shadow(0 0 5px #00f7c0)" }} />
          <Zap className="absolute text-primary/30" style={{ width: 22, height: 22, left: "28%", top: "12%", filter: "drop-shadow(0 0 6px #00f7c0)" }} />
          <Gamepad2 className="absolute text-primary/25" style={{ width: 26, height: 26, right: "8%", top: "32%", filter: "drop-shadow(0 0 5px #00f7c0)" }} />
          <Zap className="absolute text-primary/30" style={{ width: 20, height: 20, right: "28%", top: "14%", filter: "drop-shadow(0 0 6px #00f7c0)" }} />
        </div>
        <div className="relative z-10 flex items-center justify-center py-10 px-4" style={{ paddingTop: 44, paddingBottom: 44 }}>
          <div className="neon-sign-frame relative px-12 py-7 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="absolute top-2 left-0 right-0 flex justify-around px-5 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="w-2 h-2 rounded-full marquee-dot" style={{ animationDelay: `${i * 0.1}s` }} />)}
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex justify-around px-5 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="w-2 h-2 rounded-full marquee-dot" style={{ animationDelay: `${i * 0.1 + 0.5}s` }} />)}
            </div>
            <h1 className="font-display font-black neon-text leading-tight glitch-text" style={{ fontSize: "clamp(2.6rem, 7.5vw, 5.2rem)", letterSpacing: "0.06em" }}>
              HEADLINE<br />ARCADE
            </h1>
          </div>
        </div>
      </header>

      {/* ── STICKY NAV ── */}
      <nav ref={navRef} className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-primary/15 transition-shadow duration-300">
        <div className="max-w-4xl mx-auto px-5 h-12 flex items-center justify-between gap-3">
          <Link href="/" className="font-display text-primary text-sm font-black tracking-widest">
            HEADLINE ARCADE
          </Link>
          <div className="flex items-center gap-2">
            <a href="#donate" className="hidden sm:inline-flex text-muted-foreground hover:text-primary text-xs font-semibold uppercase tracking-widest transition-colors">
              Support
            </a>
            <button onClick={handleShare} data-testid="button-share" aria-label="Share Headline Arcade" className="flex items-center gap-2 border border-primary/35 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary hover:text-background transition-all">
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>
      </nav>

      {/* ── GAMES GRID ── */}
      <section id="games" className="px-4 pt-8 pb-8 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {games.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ delay: i * 0.07 }}
              data-testid={`card-game-${game.id}`} className="bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/55 transition-colors group flex flex-col">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <GameThumbnail game={game} />
                {!game.live && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-primary/70 font-display font-bold text-xs tracking-widest uppercase">Coming Soon</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <h4 className="font-display font-bold text-white text-sm leading-tight">{game.title}</h4>
                {game.live ? (
                  <Link href={`/games/${game.id}`} data-testid={`button-play-${game.id}`} className="shrink-0 bg-primary text-background font-display font-black text-xs px-4 py-1.5 rounded-lg play-btn-glow hover:bg-primary/90 transition-colors">PLAY</Link>
                ) : (
                  <span className="shrink-0 bg-muted text-muted-foreground font-display font-bold text-xs px-4 py-1.5 rounded-lg opacity-50 cursor-not-allowed">SOON</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── LEADERBOARD ── */}
      <Leaderboard />

      {/* ── DONATE ── */}
      <section id="donate" className="border-t border-primary/15 bg-black/50 py-8 px-4 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <div>
              <p className="text-white font-display font-black text-lg tracking-wide">KEEP THE ARCADE RUNNING</p>
              <p className="text-muted-foreground text-xs mt-1">Private-friendly support links. No personal Venmo required.</p>
            </div>
            {cryptoAddress && (
              <button
                onClick={handleCopyWallet}
                className="inline-flex items-center justify-center gap-2 border border-primary/35 text-primary px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-background transition-all"
              >
                <Copy size={13} /> Copy {cryptoLabel}
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {supportOptions.map((option) => (
              <div key={option.key} className="border border-primary/15 bg-card/80 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md border ${option.accent}`}>
                    {option.icon}
                  </span>
                  {option.label}
                </div>
                <p className="text-muted-foreground text-xs mt-2 min-h-8">{option.note}</p>
                {option.href ? (
                  <a
                    href={option.href}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`button-support-${option.key}`}
                    className={`mt-3 inline-flex items-center justify-center gap-1.5 w-full rounded-lg border px-3 py-2 text-xs font-bold transition-all ${option.accent}`}
                  >
                    Open <ExternalLink size={12} />
                  </a>
                ) : (
                  <div className="mt-3 inline-flex items-center justify-center w-full rounded-lg border border-white/10 text-white/35 px-3 py-2 text-xs font-bold">
                    Setup needed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-5 text-center border-t border-white/5 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Headline Arcade &nbsp;·&nbsp; Insert coin to continue.
      </footer>
    </div>
  );
}
