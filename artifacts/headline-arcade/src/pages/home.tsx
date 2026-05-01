import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { SiKofi, SiPaypal, SiBuymeacoffee } from "react-icons/si";

export default function Home() {
  const handleShare = () => {
    navigator.clipboard.writeText(
      "Play Headline Arcade! Today's wild headlines turned into silly games 🎮 " + window.location.href
    );
    toast("Copied to clipboard!", {
      description: "Ready to share the chaos.",
    });
  };

  const games = [
    {
      id: "game1",
      title: "World War 11",
      desc: "Dodge everything numbered above 10. History is weird.",
      img: "https://picsum.photos/id/1015/600/400",
    },
    {
      id: "game2",
      title: "Mayor vs. Pigeons",
      desc: "The city's top official vs. 400 angry birds. You decide.",
      img: "https://picsum.photos/id/237/600/400",
    },
    {
      id: "game3",
      title: "Stock Market Whack-A-Mole",
      desc: "Whack the red numbers before your 401k does.",
      img: "https://picsum.photos/id/1060/600/400",
    },
    {
      id: "game4",
      title: "Alien Press Conference",
      desc: "They came 40 light-years to talk to reporters. Mistake.",
      img: "https://picsum.photos/id/1062/600/400",
    },
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans overflow-x-hidden relative">
      
      {/* Top Banner (Marquee) */}
      <div className="w-full bg-[#050505] scanlines border-b-4 border-primary shadow-[0_0_15px_rgba(0,247,192,0.4)] relative overflow-hidden py-12 md:py-20 flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-4 text-2xl md:text-4xl mb-4 text-primary opacity-80">
            <span>📰</span>
            <span>⚡</span>
            <span>🎮</span>
          </div>
          <h1 className="font-display font-black text-5xl md:text-8xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-primary glitch-text" style={{ filter: "drop-shadow(0 0 10px hsl(166, 100%, 48%))" }}>
            HEADLINE ARCADE
          </h1>
          <div className="mt-6 flex items-center gap-4 text-xl md:text-2xl text-primary opacity-80">
            <span>🎮</span>
            <span>⚡</span>
            <span>📰</span>
          </div>
        </div>
      </div>

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-primary/20 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-primary drop-shadow-[0_0_5px_rgba(0,247,192,0.8)]">
            HA
          </Link>
          <div className="flex gap-6 text-sm font-semibold tracking-wider uppercase text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="#games" className="hover:text-primary transition-colors">Games</Link>
            <Link href="#donate" className="hover:text-primary transition-colors">Donate</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-6xl font-bold mb-6 text-white"
        >
          HEADLINE ARCADE
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl text-primary font-bold mb-4 drop-shadow-[0_0_8px_rgba(0,247,192,0.6)]"
        >
          Today's wild headlines → silly 60-second games
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground mb-10 max-w-2xl"
        >
          Instant fun. Zero stress. Updated for whatever's happening.
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleShare}
          className="bg-secondary border border-primary/50 text-primary px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-primary hover:text-background transition-all hover:shadow-[0_0_20px_rgba(0,247,192,0.5)]"
        >
          Share the Chaos 🔗
        </motion.button>
      </section>

      {/* Games Grid */}
      <section id="games" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <h3 className="font-display text-3xl font-bold text-white">TODAY'S GAMES</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/60 transition-colors group flex flex-col"
            >
              <div className="aspect-[3/2] w-full overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity"></div>
                <img src={game.img} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h4 className="font-display font-bold text-xl text-white mb-2">{game.title}</h4>
                <p className="text-muted-foreground text-sm mb-6 flex-1">{game.desc}</p>
                <Link 
                  href={`/games/${game.id}`}
                  className="block w-full py-4 text-center bg-primary text-background font-display font-black text-xl rounded-xl neon-glow-btn hover:bg-primary/90 transition-colors"
                >
                  PLAY NOW
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Donate Section */}
      <section id="donate" className="py-24 px-6 border-t border-primary/20 bg-black/50 relative mt-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Keep the Arcade Running</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Every coffee = one more headline turned into a silly game ❤️
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a href="#" className="flex items-center justify-center gap-3 bg-[#13C3FF]/10 text-[#13C3FF] border border-[#13C3FF]/30 px-8 py-4 rounded-xl font-bold hover:bg-[#13C3FF]/20 hover:shadow-[0_0_15px_rgba(19,195,255,0.4)] transition-all">
              <SiKofi className="text-2xl" /> Ko-fi
            </a>
            <a href="#" className="flex items-center justify-center gap-3 bg-[#00457C]/20 text-[#0079C1] border border-[#0079C1]/30 px-8 py-4 rounded-xl font-bold hover:bg-[#00457C]/40 hover:shadow-[0_0_15px_rgba(0,121,193,0.4)] transition-all">
              <SiPaypal className="text-2xl" /> PayPal
            </a>
            <a href="#" className="flex items-center justify-center gap-3 bg-[#FFDD00]/10 text-[#FFDD00] border border-[#FFDD00]/30 px-8 py-4 rounded-xl font-bold hover:bg-[#FFDD00]/20 hover:shadow-[0_0_15px_rgba(255,221,0,0.4)] transition-all">
              <SiBuymeacoffee className="text-2xl" /> Buy Me a Coffee
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-white/5 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Headline Arcade. Insert coin to continue.</p>
      </footer>

    </div>
  );
}
