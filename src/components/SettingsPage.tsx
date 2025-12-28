"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  Sparkles, 
  Bookmark, 
  ChevronDown, 
  Sun, 
  Moon,
  Check,
  Copy,
  Smartphone
} from "lucide-react";
import type { UserPreferences } from "@/types";

interface SettingsPageProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

export function SettingsPage({ preferences, onUpdatePreferences }: SettingsPageProps) {
  const [openSection, setOpenSection] = useState<string | null>("appearance");
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  const bookmarkletCode = `javascript:(function(){window.open('${typeof window !== 'undefined' ? window.location.origin : 'https://nunq.app'}/?url='+encodeURIComponent(window.location.href),'_blank')})()`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Impostazioni</h2>

      {/* Appearance Section */}
      <AccordionSection
        id="appearance"
        title="Aspetto"
        icon={<Palette size={20} />}
        isOpen={openSection === "appearance"}
        onToggle={() => toggleSection("appearance")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            Scegli il tema dell&apos;interfaccia
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <ThemeButton
              icon={<Sun size={20} />}
              label="Chiaro"
              isActive={preferences.theme === "light"}
              onClick={() => onUpdatePreferences({ theme: "light" })}
            />
            <ThemeButton
              icon={<Moon size={20} />}
              label="Scuro"
              isActive={preferences.theme === "dark"}
              onClick={() => onUpdatePreferences({ theme: "dark" })}
            />
          </div>
        </div>
      </AccordionSection>

      {/* AI Suggestions Section */}
      <AccordionSection
        id="ai"
        title="Suggerimenti AI"
        icon={<Sparkles size={20} />}
        isOpen={openSection === "ai"}
        onToggle={() => toggleSection("ai")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            Configura come l&apos;AI analizza i tuoi link
          </p>
          
          <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--background-secondary)] cursor-pointer hover:bg-[var(--card-border)] transition-colors">
            <span className="text-sm font-medium">Suggerimenti automatici</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={preferences.ai_suggestions}
                onChange={(e) => onUpdatePreferences({ ai_suggestions: e.target.checked })}
                className="sr-only"
              />
              <div className={`
                w-12 h-6 rounded-full transition-colors
                ${preferences.ai_suggestions ? "bg-[var(--accent-purple)]" : "bg-[var(--card-border)]"}
              `}>
                <div className={`
                  w-5 h-5 rounded-full bg-white shadow-sm transition-transform
                  absolute top-0.5
                  ${preferences.ai_suggestions ? "translate-x-6" : "translate-x-0.5"}
                `} />
              </div>
            </div>
          </label>
          
          <p className="text-xs text-[var(--foreground-muted)]">
            Quando attivo, l&apos;AI genera automaticamente titolo, descrizione e tag per ogni link salvato.
          </p>
        </div>
      </AccordionSection>

      {/* Browser Integration Section */}
      <AccordionSection
        id="browser"
        title="Integrazione Browser"
        icon={<Bookmark size={20} />}
        isOpen={openSection === "browser"}
        onToggle={() => toggleSection("browser")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            Salva link rapidamente mentre navighi
          </p>

          {/* Bookmarklet */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase">
              Desktop: Bookmarklet
            </p>
            <a
              href={bookmarkletCode}
              onClick={(e) => e.preventDefault()}
              draggable="true"
              className="
                inline-flex items-center justify-center gap-2 px-6 py-3 
                bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] 
                text-white font-bold rounded-xl cursor-grab active:cursor-grabbing
                shadow-lg hover:shadow-xl transition-shadow
              "
            >
              ✨ Salva in Nunq
            </a>
            
            <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
              <span>👆 Trascina sulla barra preferiti</span>
              <span className="text-[var(--card-border)]">|</span>
              <button 
                onClick={handleCopyBookmarklet}
                className="flex items-center gap-1 hover:text-[var(--accent-purple)] transition-colors"
              >
                {copiedBookmarklet ? (
                  <>
                    <Check size={12} />
                    <span>Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copia codice</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile tip */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--card-border)]">
            <Smartphone size={16} className="text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--foreground-muted)]">
              <strong>Su mobile:</strong> Installa Nunq come app, poi usa &quot;Condividi&quot; → &quot;Nunq&quot;
            </p>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}

interface AccordionSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, icon, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--background-secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent-purple)]">{icon}</span>
          <span className="font-semibold">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-[var(--foreground-muted)]" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 pt-0 border-t border-[var(--card-border)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ThemeButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ThemeButton({ icon, label, isActive, onClick }: ThemeButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2
        ${isActive 
          ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]/10" 
          : "border-[var(--card-border)] hover:border-[var(--accent-purple)]/50"
        }
      `}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {isActive && (
        <Check size={16} className="text-[var(--accent-purple)]" />
      )}
    </motion.button>
  );
}

