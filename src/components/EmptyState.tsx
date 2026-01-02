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
        Nessun contenuto
      </h2>
      <p className="text-[var(--foreground-muted)] max-w-sm">
        Tap sul + per creare il tuo primo post
      </p>
    </motion.div>
  );
}

