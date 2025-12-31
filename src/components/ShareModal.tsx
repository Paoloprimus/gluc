"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Twitter, Linkedin, Facebook } from "lucide-react";
import type { FliqkLink } from "@/types";

interface ShareModalProps {
  link: FliqkLink | null;
  isOpen: boolean;
  onClose: () => void;
}

type Platform = "twitter" | "linkedin" | "facebook";

const platformConfig = {
  twitter: {
    name: "Twitter/X",
    icon: Twitter,
    color: "from-[#1DA1F2] to-[#0d8bd9]",
    maxLength: 280,
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "from-[#0077B5] to-[#005885]",
    maxLength: 3000,
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "from-[#1877F2] to-[#0d5bbd]",
    maxLength: 63206,
  },
};

export function ShareModal({ link, isOpen, onClose }: ShareModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("twitter");
  const [copied, setCopied] = useState(false);

  if (!link) return null;

  const generatePost = (platform: Platform): string => {
    const tags = link.tags.slice(0, 3).map(t => `#${t.replace(/\s+/g, "")}`).join(" ");
    
    switch (platform) {
      case "twitter":
        return `${link.title}\n\n${link.description ? link.description.slice(0, 100) + "..." : ""}\n\n${tags}\n\n🔗 ${link.url}`;
      
      case "linkedin":
        return `🔗 ${link.title}\n\n${link.description || "Articolo interessante!"}\n\n${tags}\n\n👉 ${link.url}`;
      
      case "facebook":
        return `${link.title}\n\n${link.description || ""}\n\n${tags}\n\n${link.url}`;
      
      default:
        return "";
    }
  };

  const handleCopy = async () => {
    const post = generatePost(selectedPlatform);
    await navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const post = generatePost(selectedPlatform);
  const config = platformConfig[selectedPlatform];

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
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:w-full z-50"
          >
            <div className="bg-[var(--background-secondary)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
                <h2 className="font-bold text-lg">Condividi su Social</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Platform selector */}
              <div className="flex gap-2 p-4 border-b border-[var(--card-border)]">
                {(Object.keys(platformConfig) as Platform[]).map((platform) => {
                  const cfg = platformConfig[platform];
                  const Icon = cfg.icon;
                  const isSelected = selectedPlatform === platform;
                  
                  return (
                    <button
                      key={platform}
                      onClick={() => setSelectedPlatform(platform)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 p-3 rounded-xl
                        font-medium text-sm transition-all duration-200
                        ${isSelected 
                          ? `bg-gradient-to-r ${cfg.color} text-white shadow-lg` 
                          : "bg-[var(--card-bg)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        }
                      `}
                    >
                      <Icon size={18} />
                      <span className="hidden sm:inline">{cfg.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Anteprima post</span>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {post.length}/{config.maxLength}
                  </span>
                </div>
                
                <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {post}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-[var(--card-border)]">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  className={`
                    w-full flex items-center justify-center gap-2 p-4 rounded-xl
                    font-semibold transition-all duration-200
                    bg-gradient-to-r ${config.color} text-white
                    hover:shadow-lg hover:shadow-[var(--accent-purple)]/20
                  `}
                >
                  {copied ? (
                    <>
                      <Check size={20} />
                      <span>Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      <span>Copia post</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

