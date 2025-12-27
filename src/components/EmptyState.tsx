"use client";

import { motion } from "framer-motion";
import { Link2, Sparkles, Zap } from "lucide-react";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Animated icon */}
      <motion.div
        className="relative mb-6"
        animate={{ 
          rotate: [0, 5, -5, 0],
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-pink)]/20 flex items-center justify-center">
          <Link2 size={40} className="text-[var(--accent-purple)]" />
        </div>
        
        {/* Floating sparkles */}
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ 
            y: [-2, 2, -2],
            opacity: [1, 0.5, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles size={20} className="text-[var(--accent-pink)]" />
        </motion.div>
        
        <motion.div
          className="absolute -bottom-1 -left-2"
          animate={{ 
            y: [2, -2, 2],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Zap size={16} className="text-[var(--accent-coral)]" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <h2 className="text-2xl font-bold mb-2">
        Nessun link ancora
      </h2>
      <p className="text-[var(--foreground-muted)] max-w-sm mb-8">
        Incolla il tuo primo link qui sopra e l&apos;AI lo analizzerà automaticamente con tag e descrizione
      </p>

      {/* Feature hints */}
      <div className="flex flex-wrap justify-center gap-3">
        {[
          { icon: "🏷️", text: "Tag automatici" },
          { icon: "📝", text: "Descrizioni AI" },
          { icon: "📤", text: "Condividi ovunque" },
        ].map((feature, i) => (
          <motion.div
            key={feature.text}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)]"
          >
            <span>{feature.icon}</span>
            <span className="text-sm text-[var(--foreground-muted)]">{feature.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

