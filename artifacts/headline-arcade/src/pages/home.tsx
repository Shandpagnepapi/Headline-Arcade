import React, { useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { SiKofi, SiPaypal, SiBuymeacoffee } from "react-icons/si";
import { Gamepad2, Newspaper, Zap, Hash, Dice5 } from "lucide-react";

const games = [
  {
    id: "game1",
    title: "World War 11",
    desc: "History skipped a few sequels. Dodge everything numbered above 10 before it's too late.",
    img: "https://picsum.photos/id/1015/400/400",
  },
  {
    id: "game2",
    title: "Mayor vs. Pigeons",
    desc: "Four hundred angry birds. One very tired mayor. You decide who wins City Hall.",
    img: "https://picsum.photos/id/237/400/400",
  },
  {
    id: "game3",
    title: "Stock Market Whack-A-Mole",
    desc: "Whack the red numbers before your retirement account does it for you.",
    img: "https://picsum.photos/id/1060/400/400",
  },
  {
    id: "game4",
    title: "Alien Press Conference",
    desc: "They traveled 40 light-years to take questions. Nobody was ready for the follow-ups.",
    img: "https://picsum.photos/id/1062/400/400",
  },
];

export default function Home() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle("nav-scrolled", window.scrollY > 10);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleShare = () => {
    navigator.clipboard
      .writeText("Play Headline Arcade — today's wild headlines turned into silly 60-second games! " + window.location.href)
      .then(() =>
        toast("Link copied!", {
          description: "Share the chaos with someone who needs a break.",
        })
      );
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans overflow-x-hidden">

      {/* ── BANNER ── */}
      <header className="relative w-full overflow-hidden bg-[#07090d]" style={{ minHeight: 260 }}>

        {/* Newspaper pages in background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {[
            { rotate: -8,  left: "2%",  top: "-10px", w: 180, h: 240 },
            { rotate: 5,   left: "12%", top: "20px",  w: 160, h: 210 },
            { rotate: -3,  left: "24%", top: "-5px",  w: 170, h: 230 },
            { rotate: 7,   right: "2%", top: "-10px", w: 180, h: 240 },
            { rotate: -5,  right: "12%",top: "15px",  w: 165, h: 220 },
            { rotate: 3,   right: "24%",top: "-5px",  w: 175, h: 235 },
          ].map((s, i) => (
            <div
              key={i}
              className="absolute bg-[#d4cdb8] rounded-sm overflow-hidden"
              style={{
                width: s.w,
                height: s.h,
                left: s.left,
                right: (s as any).right,
                top: s.top,
                transform: `rotate(${s.rotate}deg)`,
                opacity: 0.18,
              }}
            >
              <div className="w-full h-6 bg-[#b0a890] flex items-center px-2 gap-1 border-b border-[#9a9280]">
                <span className="text-[8px] font-black tracking-widest text-[#333] uppercase">Breaking News</span>
              </div>
              {Array.from({ length: 12 }).map((_, j) => (
                <div
                  key={j}
                  className="mx-2 my-1 rounded-full bg-[#9a9280]"
                  style={{ height: 4, width: `${55 + Math.sin(i * 3 + j) * 30}%`, opacity: 0.7 }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Floating decorative icons */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <Gamepad2 className="absolute text-primary/30" style={{ width: 32, height: 32, left: "8%", top: "30%", filter: "drop-shadow(0 0 6px #00f7c0)" }} />
          <Newspaper className="absolute text-primary/25" style={{ width: 28, height: 28, left: "18%", top: "60%", filter: "drop-shadow(0 0 5px #00f7c0)" }} />
          <Zap className="absolute text-primary/35" style={{ width: 24, height: 24, left: "32%", top: "15%", filter: "drop-shadow(0 0 6px #00f7c0)" }} />
          <Hash className="absolute text-primary/25" style={{ width: 26, height: 26, left: "6%", top: "65%", filter: "drop-shadow(0 0 5px #00f7c0)" }} />
          <Gamepad2 className="absolute text-primary/30" style={{ width: 30, height: 30, right: "8%", top: "28%", filter: "drop-shadow(0 0 6px #00f7c0)" }} />
          <Newspaper className="absolute text-primary/25" style={{ width: 28, height: 28, right: "18%", top: "62%", filter: "drop-shadow(0 0 5px #00f7c0)" }} />
          <Zap className="absolute text-primary/35" style={{ width: 22, height: 22, right: "32%", top: "18%", filter: "drop-shadow(0 0 6px #00f7c0)" }} />
          <Dice5 className="absolute text-primary/25" style={{ width: 26, height: 26, right: "6%", top: "68%", filter: "drop-shadow(0 0 5px #00f7c0)" }} />
        </div>

        {/* Central neon sign */}
        <div className="relative z-10 flex items-center justify-center py-10 px-4">
          <div className="neon-sign-frame relative px-10 py-6 rounded-2xl flex flex-col items-center justify-center text-center">
            {/* Marquee dots along top */}
            <div className="absolute top-2 left-0 right-0 flex justify-around px-4 pointer-events-none">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#ff8c00] marquee-dot" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            {/* Marquee dots along bottom */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-around px-4 pointer-events-none">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#ff8c00] marquee-dot" style={{ animationDelay: `${i * 0.12 + 0.5}s` }} />
              ))}
            </div>

            <h1 className="font-display font-black text-primary neon-text leading-tight" style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)", letterSpacing: "0.06em" }}>
              HEADLINE<br />ARCADE
            </h1>
          </div>
        </div>
      </header>

      {/* ── STICKY NAV ── */}
      <nav ref={navRef} className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-primary/20 transition-shadow duration-300">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-primary leading-none" style={{ fontSize: "0.8rem", letterSpacing: "0.08em", textShadow: "0 0 8px #00f7c0" }}>
            HEADLINE<br />ARCADE
          </Link>
          <div className="flex items-center gap-1 text-sm font-semibold tracking-wider text-muted-foreground">
            <Link href="/" className="px-3 py-1 hover:text-primary transition-colors">Home</Link>
            <span className="text-primary/30">|</span>
            <Link href="#games" className="px-3 py-1 hover:text-primary transition-colors">Games</Link>
            <span className="text-primary/30">|</span>
            <Link href="#donate" className="px-3 py-1 hover:text-primary transition-colors">Donate</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="py-14 px-5 text-center max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-bold text-white mb-4"
          style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)" }}
        >
          Headline Arcade
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-primary font-bold mb-3"
          style={{ fontSize: "clamp(1rem, 3vw, 1.4rem)", textShadow: "0 0 10px rgba(0,247,192,0.5)" }}
        >
          Play Retro Games with a Modern Twist
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="text-muted-foreground text-base mb-8 max-w-xl mx-auto"
        >
          Instant fun. Zero stress. Updated daily for whatever's happening in the world.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.26 }}
          onClick={handleShare}
          data-testid="button-share"
          className="border border-primary/40 text-primary px-7 py-2.5 rounded-full text-sm font-semibold uppercase tracking-widest hover:bg-primary hover:text-background transition-all"
        >
          Share the Arcade
        </motion.button>
      </section>

      {/* ── GAMES ── */}
      <section id="games" className="px-5 pb-16 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-7">
          <h3 className="font-display font-bold text-white text-xl tracking-wide">TODAY'S GAMES</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent" />
        </div>

        <div className="flex flex-col gap-4">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08 }}
              data-testid={`card-game-${game.id}`}
              className="bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/50 transition-colors group flex flex-row items-stretch"
            >
              {/* Thumbnail */}
              <div className="relative shrink-0 overflow-hidden" style={{ width: 110 }}>
                <img
                  src={game.img}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ minHeight: 100 }}
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay group-hover:opacity-0 transition-opacity" />
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4 gap-2 min-w-0">
                <h4 className="font-display font-bold text-white text-base leading-tight">{game.title}</h4>
                <p className="text-muted-foreground text-xs leading-relaxed flex-1">{game.desc}</p>
                <div className="flex justify-end mt-1">
                  <Link
                    href={`/games/${game.id}`}
                    data-testid={`button-play-${game.id}`}
                    className="bg-primary text-background font-display font-black text-sm px-7 py-2 rounded-lg play-btn-glow hover:bg-primary/90 transition-colors"
                  >
                    PLAY
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DONATE ── */}
      <section id="donate" className="border-t border-primary/20 bg-black/60 py-6 px-5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg">Support Headline Arcade</p>
            <p className="text-muted-foreground text-sm">Every coffee funds one more ridiculous game.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a href="#" data-testid="button-kofi" className="flex items-center gap-2 bg-[#29abe0]/10 text-[#29abe0] border border-[#29abe0]/30 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#29abe0]/20 transition-all">
              <SiKofi /> ko-fi
            </a>
            <a href="#" data-testid="button-paypal" className="flex items-center gap-2 bg-[#0070ba]/10 text-[#0070ba] border border-[#0070ba]/30 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0070ba]/20 transition-all">
              <SiPaypal /> PayPal
            </a>
            <a href="#" data-testid="button-bmac" className="flex items-center gap-2 bg-[#FFDD00]/10 text-[#e8c900] border border-[#FFDD00]/30 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#FFDD00]/20 transition-all">
              <SiBuymeacoffee /> Buy Me a Coffee
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-6 text-center border-t border-white/5 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Headline Arcade &nbsp;·&nbsp; Insert coin to continue.
      </footer>

    </div>
  );
}
