import React from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";

export default function GamePage() {
  const { id } = useParams();

  const games = {
    game1: {
      title: "World War 11",
      desc: "Dodge everything numbered above 10. History is weird.",
    },
    game2: {
      title: "Mayor vs. Pigeons",
      desc: "The city's top official vs. 400 angry birds. You decide.",
    },
    game3: {
      title: "Stock Market Whack-A-Mole",
      desc: "Whack the red numbers before your 401k does.",
    },
    game4: {
      title: "Alien Press Conference",
      desc: "They came 40 light-years to talk to reporters. Mistake.",
    },
  };

  const game = games[id as keyof typeof games] || { title: "Unknown Game", desc: "This game does not exist." };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans overflow-x-hidden flex flex-col">
      <nav className="w-full bg-background/80 backdrop-blur-md border-b border-primary/20 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="font-display font-bold text-2xl text-primary drop-shadow-[0_0_5px_rgba(0,247,192,0.8)]">
            ← BACK TO ARCADE
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full border-4 border-primary p-12 rounded-3xl relative overflow-hidden bg-card shadow-[0_0_50px_rgba(0,247,192,0.2)]"
        >
          <div className="absolute inset-0 scanlines opacity-50 pointer-events-none"></div>
          
          <h1 className="font-display text-4xl md:text-6xl font-black text-white mb-6 glitch-text relative z-10" style={{ filter: "drop-shadow(0 0 10px hsl(166, 100%, 48%))" }}>
            {game.title}
          </h1>
          <p className="text-xl text-primary mb-12 relative z-10 font-bold">
            {game.desc}
          </p>

          <div className="w-full aspect-video bg-black border-2 border-primary/50 rounded-xl flex items-center justify-center relative z-10 mb-8 shadow-[inset_0_0_20px_rgba(0,247,192,0.2)]">
            <p className="font-display text-2xl text-muted-foreground animate-pulse">INSERT COIN TO PLAY...</p>
          </div>

          <button className="bg-primary text-background font-display font-black text-2xl py-4 px-12 rounded-xl neon-glow-btn hover:bg-white hover:text-primary transition-colors relative z-10">
            START GAME
          </button>
        </motion.div>
      </main>
    </div>
  );
}
