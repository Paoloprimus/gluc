"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Key, Eye, EyeOff, Check, AlertCircle, Bookmark, Smartphone, Copy } from "lucide-react";
import { getApiKey, saveApiKey, removeApiKey } from "@/lib/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyChange: (key: string | null) => void;
}

export function SettingsModal({ isOpen, onClose, onApiKeyChange }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // Bookmarklet code - opens Gluc with current page URL
  const bookmarkletCode = `javascript:(function(){window.open('https://llucy.it/?url='+encodeURIComponent(window.location.href),'_blank')})()`;
  
  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  useEffect(() => {
    const existingKey = getApiKey();
    if (existingKey) {
      setApiKey(existingKey);
      setHasExistingKey(true);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      saveApiKey(apiKey.trim());
      onApiKeyChange(apiKey.trim());
      setSaved(true);
      setHasExistingKey(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleRemove = () => {
    removeApiKey();
    setApiKey("");
    setHasExistingKey(false);
    onApiKeyChange(null);
  };

  const isValidFormat = apiKey.length > 10; // Simplified for testing

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-md md:w-full z-50"
          >
            <div className="bg-[var(--background-secondary)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
                <h2 className="font-bold text-lg">Impostazioni</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* API Key section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-[var(--accent-purple)]" />
                    <label className="font-semibold">API Key Claude</label>
                  </div>
                  
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Inserisci la tua API key di Anthropic per abilitare l&apos;analisi AI dei link.
                    Puoi ottenerla su{" "}
                    <a 
                      href="https://console.anthropic.com/settings/keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[var(--accent-purple)] hover:underline"
                    >
                      console.anthropic.com
                    </a>
                  </p>

                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-ant-api..."
                      className="
                        w-full px-4 py-3 pr-12 rounded-xl
                        bg-[var(--card-bg)] border border-[var(--card-border)]
                        text-sm font-mono
                        placeholder:text-[var(--foreground-muted)]
                        focus:border-[var(--accent-purple)]
                        transition-colors
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--card-border)] transition-colors"
                    >
                      {showKey ? (
                        <EyeOff size={18} className="text-[var(--foreground-muted)]" />
                      ) : (
                        <Eye size={18} className="text-[var(--foreground-muted)]" />
                      )}
                    </button>
                  </div>

                  {/* Validation hint */}
                  {apiKey && !isValidFormat && (
                    <div className="flex items-center gap-2 text-amber-500 text-sm">
                      <AlertCircle size={16} />
                      <span>La key dovrebbe iniziare con &quot;sk-ant-&quot;</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={!apiKey.trim() || !isValidFormat}
                      className={`
                        flex-1 flex items-center justify-center gap-2 p-3 rounded-xl
                        font-semibold text-sm transition-all duration-200
                        ${apiKey.trim() && isValidFormat
                          ? "bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white hover:shadow-lg"
                          : "bg-[var(--card-border)] text-[var(--foreground-muted)] cursor-not-allowed"
                        }
                      `}
                    >
                      {saved ? (
                        <>
                          <Check size={18} />
                          <span>Salvata!</span>
                        </>
                      ) : (
                        <span>Salva API Key</span>
                      )}
                    </motion.button>

                    {hasExistingKey && (
                      <button
                        onClick={handleRemove}
                        className="px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>
                </div>

                {/* Info box */}
                <div className="p-4 rounded-xl bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/20">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    🔒 La tua API key è salvata solo nel browser e non viene mai inviata ai nostri server.
                    I costi delle chiamate AI sono a tuo carico (~$0.003 per link analizzato).
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--card-border)]" />

                {/* Bookmarklet section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bookmark size={18} className="text-[var(--accent-pink)]" />
                    <label className="font-semibold">Aggiungi a Browser</label>
                  </div>
                  
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Trascina questo pulsante nella barra dei preferiti per salvare link con un click mentre navighi:
                  </p>

                  {/* Bookmarklet button to drag */}
                  <div className="flex flex-col gap-3">
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
                      ✨ Gluc It!
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
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]">
                    <Smartphone size={16} className="text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--foreground-muted)]">
                      <strong>Su mobile:</strong> Usa il menu &quot;Condividi&quot; del browser e seleziona &quot;Gluc Link&quot; 
                      (dopo aver installato l&apos;app dalla home page).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

