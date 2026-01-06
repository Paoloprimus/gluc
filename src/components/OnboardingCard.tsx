"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { BookOpen, X } from "lucide-react";

interface OnboardingCardProps {
  onGoToGuide: () => void;
  onDismiss: () => void;
}

export function OnboardingCard({ onGoToGuide, onDismiss }: OnboardingCardProps) {
  const t = useTranslations('onboarding');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[var(--background)] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[var(--card-border)]"
        >
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={20} />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center">
              <span className="text-black font-black text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>fl</span>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {t('welcome')}
            </h2>
            <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
              {t('message')}
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToGuide}
              className="w-full p-4 rounded-xl bg-[var(--accent-primary)] text-black font-bold flex items-center justify-center gap-2"
            >
              <BookOpen size={18} />
              {t('goToGuide')}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDismiss}
              className="w-full p-3 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors text-sm"
            >
              {t('later')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

