"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles, Share2, FolderOpen, Zap } from "lucide-react";

type Lang = 'it' | 'de';

const content = {
  it: {
    tagline: "il tuo metasocial",
    hero: "Condividi ovunque,\nda un unico posto",
    subtitle: "Raccogli link, immagini e pensieri. Condividili su WhatsApp, Telegram, Instagram e TikTok con un tap.",
    watchVideo: "Guarda come funziona",
    getStarted: "Inizia ora",
    haveToken: "Ho un token d'invito",
    features: [
      { icon: Zap, title: "Veloce", desc: "Salva da qualsiasi pagina con un click" },
      { icon: Share2, title: "Multi-piattaforma", desc: "Un post, tutti i tuoi social" },
      { icon: FolderOpen, title: "Organizzato", desc: "Raccolte e tag per trovare tutto" },
    ],
    footer: "© 2025 fliqk",
  },
  de: {
    tagline: "dein metasocial",
    hero: "Teile überall,\nvon einem Ort aus",
    subtitle: "Sammle Links, Bilder und Gedanken. Teile sie auf WhatsApp, Telegram, Instagram und TikTok mit einem Tap.",
    watchVideo: "Schau wie es funktioniert",
    getStarted: "Jetzt starten",
    haveToken: "Ich habe einen Einladungscode",
    features: [
      { icon: Zap, title: "Schnell", desc: "Speichere von jeder Seite mit einem Klick" },
      { icon: Share2, title: "Multi-Plattform", desc: "Ein Post, alle deine Socials" },
      { icon: FolderOpen, title: "Organisiert", desc: "Sammlungen und Tags um alles zu finden" },
    ],
    footer: "© 2025 fliqk",
  },
};

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [lang, setLang] = useState<Lang>('it');

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('de')) {
      setLang('de');
    }
  }, []);

  const t = content[lang];

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[#121212]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#BEFF00] flex items-center justify-center">
              <span className="text-black font-black text-sm">fl</span>
            </div>
            <span className="font-black text-xl text-[#BEFF00]">fliqk</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setLang('it')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  lang === 'it' ? 'bg-[#BEFF00] text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                IT
              </button>
              <button
                onClick={() => setLang('de')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  lang === 'de' ? 'bg-[#BEFF00] text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                DE
              </button>
            </div>
            
            <button 
              onClick={onGetStarted}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Login →
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center py-16 md:py-24">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#BEFF00] text-sm font-medium uppercase tracking-wider mb-4"
            >
              {t.tagline}
            </motion.p>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black leading-tight whitespace-pre-line mb-6"
            >
              {t.hero}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10"
            >
              {t.subtitle}
            </motion.p>

            {/* Video placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative max-w-3xl mx-auto mb-12"
            >
              <div className="aspect-video bg-gradient-to-br from-[#BEFF00]/10 to-[#00FF94]/10 rounded-2xl border border-white/10 flex items-center justify-center group cursor-pointer hover:border-[#BEFF00]/30 transition-colors">
                <div className="w-20 h-20 rounded-full bg-[#BEFF00] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={32} className="text-black ml-1" fill="black" />
                </div>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/40">
                  {t.watchVideo}
                </p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={onGetStarted}
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[#BEFF00] text-black font-bold text-lg hover:bg-[#BEFF00]/90 transition-colors"
              >
                <Sparkles size={20} />
                {t.getStarted}
              </button>
              <p className="text-sm text-white/40">{t.haveToken}</p>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-3 gap-6 py-16"
          >
            {t.features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#BEFF00]/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#BEFF00]/10 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-[#BEFF00]" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">{t.footer}</p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

