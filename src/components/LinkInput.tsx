"use client";

import { useState, useRef, useEffect } from "react";
import { Link2, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LinkInputProps {
  onSubmit: (url: string) => Promise<void>;
  isLoading: boolean;
}

// Common TLDs for autocomplete
const COMMON_TLDS = [".com", ".it", ".org", ".net", ".io", ".co", ".app", ".dev"];

export function LinkInput({ onSubmit, isLoading }: LinkInputProps) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate URL suggestions based on input
  useEffect(() => {
    const input = url.trim().toLowerCase();
    
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }

    // If it's already a valid URL, no suggestions needed
    if (input.startsWith("http://") || input.startsWith("https://")) {
      setSuggestions([]);
      return;
    }

    // If it already has a TLD, just suggest with https://
    const hasTld = COMMON_TLDS.some(tld => input.includes(tld) || input.match(/\.[a-z]{2,}$/));
    if (hasTld) {
      const fullUrl = input.startsWith("www.") ? `https://${input}` : `https://${input}`;
      setSuggestions([fullUrl]);
      return;
    }

    // Generate suggestions with common TLDs
    const baseDomain = input.replace(/^www\./, "");
    const newSuggestions = COMMON_TLDS.map(tld => `https://${baseDomain}${tld}`);
    
    // Also add www variant for .com
    newSuggestions.unshift(`https://www.${baseDomain}.com`);
    
    setSuggestions(newSuggestions.slice(0, 6)); // Limit to 6 suggestions
    setSelectedIndex(-1);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get value from DOM in case React state wasn't updated (browser automation fix)
    const input = inputRef.current;
    let inputValue = input?.value || url;
    
    if (!inputValue.trim() || isLoading) return;

    // Auto-fix URL if needed
    inputValue = normalizeUrl(inputValue.trim());
    
    await onSubmit(inputValue);
    setUrl("");
    setSuggestions([]);
    if (input) input.value = "";
  };

  const normalizeUrl = (input: string): string => {
    let normalized = input.toLowerCase().trim();
    
    // If no protocol, add https://
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = `https://${normalized}`;
    }
    
    return normalized;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUrl(suggestion);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
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
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on suggestions
            setTimeout(() => {
              setIsFocused(false);
              setSuggestions([]);
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Incolla un link o scrivi un dominio..."
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

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {suggestions.length > 0 && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-2 z-50"
          >
            <div className="bg-[var(--background-secondary)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-2xl">
              <div className="px-3 py-2 text-xs text-[var(--foreground-muted)] border-b border-[var(--card-border)]">
                Suggerimenti URL
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    w-full px-4 py-3 text-left text-sm
                    flex items-center gap-3 transition-colors
                    ${index === selectedIndex 
                      ? "bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]" 
                      : "hover:bg-[var(--card-bg)] text-[var(--foreground)]"
                    }
                  `}
                >
                  <Link2 size={14} className="text-[var(--foreground-muted)]" />
                  <span className="font-mono">{suggestion}</span>
                </button>
              ))}
              <div className="px-3 py-2 text-xs text-[var(--foreground-muted)] border-t border-[var(--card-border)]">
                ↑↓ per navigare • Enter per selezionare
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <motion.p 
        className="mt-2 text-xs text-[var(--foreground-muted)] text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isFocused ? 1 : 0.5 }}
      >
        Scrivi un dominio (es. &quot;github&quot;) o incolla un URL completo ✨
      </motion.p>
    </form>
  );
}
