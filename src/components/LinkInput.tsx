"use client";

import { useState } from "react";
import { Link2, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface LinkInputProps {
  onSubmit: (url: string) => Promise<void>;
  isLoading: boolean;
}

export function LinkInput({ onSubmit, isLoading }: LinkInputProps) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Get value from DOM in case React state wasn't updated (browser automation fix)
    const input = (e.target as HTMLFormElement).querySelector('input');
    const inputValue = input?.value || url;
    
    if (!inputValue.trim() || isLoading) return;
    
    await onSubmit(inputValue.trim());
    setUrl("");
    if (input) input.value = "";
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <motion.div
        className={`
          relative flex items-center gap-3 p-4 rounded-2xl
          bg-[var(--card-bg)] border transition-all duration-300
          ${isFocused 
            ? "border-[var(--accent-purple)] shadow-[0_0_30px_rgba(168,85,247,0.2)]" 
            : "border-[var(--card-border)]"
          }
        `}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex-shrink-0">
          <Link2 
            size={20} 
            className={`transition-colors duration-300 ${
              isFocused ? "text-[var(--accent-purple)]" : "text-[var(--foreground-muted)]"
            }`} 
          />
        </div>
        
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Incolla un link..."
          className="
            flex-1 bg-transparent text-[var(--foreground)] 
            placeholder:text-[var(--foreground-muted)]
            text-base outline-none
          "
          disabled={isLoading}
        />

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl
            font-semibold text-sm transition-all duration-300
            ${isLoading
              ? "bg-[var(--card-border)] text-[var(--foreground-muted)] cursor-not-allowed"
              : "bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analizzo...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Gluc!</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Hint */}
      <motion.p 
        className="mt-2 text-xs text-[var(--foreground-muted)] text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isFocused ? 1 : 0.5 }}
      >
        L&apos;AI analizzerà il link e genererà tag automatici ✨
      </motion.p>
    </form>
  );
}

