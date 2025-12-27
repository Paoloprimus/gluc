"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ExternalLink, AlertCircle } from "lucide-react";

interface SuggestionsModalProps {
  isOpen: boolean;
  originalInput: string;
  suggestions: string[];
  onSelect: (domain: string) => void;
  onClose: () => void;
  onRetry: () => void;
}

export function SuggestionsModal({
  isOpen,
  originalInput,
  suggestions,
  onSelect,
  onClose,
  onRetry,
}: SuggestionsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-md md:w-full z-50"
          >
            <div className="bg-[var(--background-secondary)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <AlertCircle size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="font-bold">Dominio non trovato</h2>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      &quot;{originalInput}&quot;
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {suggestions.length > 0 ? (
                  <>
                    <p className="text-sm text-[var(--foreground-muted)] mb-4">
                      🤔 Forse intendevi uno di questi?
                    </p>
                    <div className="space-y-2">
                      {suggestions.map((domain) => (
                        <motion.button
                          key={domain}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelect(domain)}
                          className="
                            w-full flex items-center justify-between p-4 rounded-xl
                            bg-[var(--card-bg)] border border-[var(--card-border)]
                            hover:border-[var(--accent-purple)]/50 hover:bg-[var(--accent-purple)]/5
                            transition-all duration-200 text-left group
                          "
                        >
                          <div className="flex items-center gap-3">
                            <Search size={18} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent-purple)]" />
                            <span className="font-mono font-medium">{domain}</span>
                          </div>
                          <ExternalLink size={16} className="text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[var(--foreground-muted)] mb-4">
                      Non ho trovato suggerimenti per questo dominio.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--card-border)] flex gap-3">
                <button
                  onClick={onRetry}
                  className="
                    flex-1 p-3 rounded-xl text-sm font-medium
                    bg-[var(--card-bg)] border border-[var(--card-border)]
                    hover:bg-[var(--card-border)] transition-colors
                  "
                >
                  Riprova con altro URL
                </button>
                <button
                  onClick={onClose}
                  className="
                    px-4 py-3 rounded-xl text-sm
                    text-[var(--foreground-muted)] hover:text-[var(--foreground)]
                    transition-colors
                  "
                >
                  Annulla
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

