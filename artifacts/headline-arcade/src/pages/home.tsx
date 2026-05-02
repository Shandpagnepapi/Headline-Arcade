import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { SiKofi, SiPaypal, SiBuymeacoffee } from "react-icons/si";
import { Gamepad2, Zap, Share2, Trophy } from "lucide-react";

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
    title: "Big Cannons: Boardroom Escape",
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
  cannon: "Cannon Baron",
  alien: "Flappy Alien Files",
};

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
type BoardEntry = { playerName: string; score: number };
type BoardData = Record<string, BoardEntry[]>;

function Leaderboard() {
  const [data, setData] = useState<BoardData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGame, setActiveGame] = useState<"ww11" | "cannon" | "alien">("ww11");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchScores = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const r = await fetch("/api/scores/all-leaderboard", { cache: "no-store" });
      const d = await r.json();
      setData(d);
      setLastUpdated(new Date());
    } catch {
      /* silent */
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
    <section className="px-4 pb-16 max-w-3xl mx-auto">
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

  const handleShare = () => {
    navigator.clipboard
      .writeText("Play Headline Arcade — today's wild headlines turned into silly 60-second games! " + window.location.href)
      .then(() => toast("Link copied!", { description: "Share the chaos with someone who needs a break." }));
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
        <div className="max-w-4xl mx-auto px-5 h-12 flex items-center justify-end">
          <button onClick={handleShare} data-testid="button-share" className="flex items-center gap-2 border border-primary/35 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary hover:text-background transition-all">
            <Share2 size={13} /> Share
          </button>
        </div>
      </nav>

      {/* ── GAMES GRID ── */}
      <section id="games" className="px-4 pt-8 pb-8 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {games.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ delay: i * 0.07 }}
              data-testid={`card-game-${game.id}`} className="bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/55 transition-colors group flex flex-col">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={game.img} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
      <section id="donate" className="border-t border-primary/15 bg-black/50 py-5 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white font-bold text-sm">Keep the Arcade Running</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a href="#" data-testid="button-kofi" className="flex items-center gap-1.5 bg-[#29abe0]/10 text-[#29abe0] border border-[#29abe0]/30 px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#29abe0]/20 transition-all"><SiKofi /> ko-fi</a>
            <a href="#" data-testid="button-paypal" className="flex items-center gap-1.5 bg-[#0070ba]/10 text-[#5ba4e0] border border-[#0070ba]/30 px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#0070ba]/20 transition-all"><SiPaypal /> PayPal</a>
            <a href="#" data-testid="button-bmac" className="flex items-center gap-1.5 bg-[#FFDD00]/10 text-[#e8c900] border border-[#FFDD00]/30 px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#FFDD00]/20 transition-all"><SiBuymeacoffee /> Buy Me a Coffee</a>
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
