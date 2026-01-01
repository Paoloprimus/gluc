"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles, Share2, FolderOpen, Zap } from "lucide-react";

type Lang = 'it' | 'de';

const content = {
  it: {
    hero: "Scegli. Tieni. Distribuisci.",
    subtitle: "Raccogli link, immagini e pensieri e condividili, se vuoi.",
    watchVideo: "Guarda come funziona",
    getStarted: "Inizia ora",
    haveToken: "Ho un token d'invito",
    features: [
      { icon: Zap, title: "Veloce", desc: "Salva da qualsiasi pagina con un click" },
      { icon: Share2, title: "Multi-piattaforma", desc: "Un post, tutti i tuoi social" },
      { icon: FolderOpen, title: "Organizzato", desc: "Raccolte e tag per trovare tutto" },
    ],
    footer: "© 2026 fliqk",
  },
  de: {
    hero: "Wähle. Behalte. Verteile.",
    subtitle: "Sammle Links, Bilder und Gedanken und teile sie, wenn du willst.",
    watchVideo: "Schau wie es funktioniert",
    getStarted: "Jetzt starten",
    haveToken: "Ich habe einen Einladungscode",
    features: [
      { icon: Zap, title: "Schnell", desc: "Speichere von jeder Seite mit einem Klick" },
      { icon: Share2, title: "Multi-Plattform", desc: "Ein Post, alle deine Socials" },
      { icon: FolderOpen, title: "Organisiert", desc: "Sammlungen und Tags um alles zu finden" },
    ],
    footer: "© 2026 fliqk",
  },
};

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [lang, setLang] = useState<Lang>('it');

  useEffect(() => {
    // Use the same locale detection as next-intl (cookie first, then Accept-Language)
    const localeCookie = document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1];
    if (localeCookie === 'de') {
      setLang('de');
    } else if (!localeCookie) {
      // Fallback to Accept-Language header simulation
      const browserLangs = navigator.languages || [navigator.language];
      const isGerman = browserLangs.some(l => l.toLowerCase().startsWith('de'));
      if (isGerman) {
        setLang('de');
      }
    }
  }, []);

  const t = content[lang];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[var(--background)]/80 border-b border-[var(--card-border)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
              <span className="text-black font-black text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>fl</span>
            </div>
            <span className="font-black text-xl text-[var(--accent-primary)]" style={{ fontFamily: 'Outfit, sans-serif' }}>fliqk</span>
          </div>
          
          <button 
            onClick={onGetStarted}
            className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Login →
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center py-16 md:py-24">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black leading-tight whitespace-pre-line mb-6"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t.hero}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-10"
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
              <div className="aspect-video bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] flex items-center justify-center group cursor-pointer hover:border-[var(--accent-primary)]/30 transition-colors">
                <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={32} className="text-black ml-1" fill="black" />
                </div>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-[var(--foreground-muted)]">
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
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-lg hover:opacity-90 transition-opacity"
              >
                <Sparkles size={20} />
                {t.getStarted}
              </button>
              <p className="text-sm text-[var(--foreground-muted)]">{t.haveToken}</p>
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
                className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-primary)]/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-[var(--accent-primary)]" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-[var(--foreground-muted)] text-sm">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--foreground-muted)]">{t.footer}</p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
