"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, Copy, Check, Send, MessageCircle, ExternalLink } from "lucide-react";
import type { FliqkLink } from "@/types";

interface ShareSheetProps {
  link: FliqkLink | null;
  isOpen: boolean;
  onClose: () => void;
  onClickTracked?: () => void;
}

export function ShareSheet({ link, isOpen, onClose, onClickTracked }: ShareSheetProps) {
  const t = useTranslations('share');
  const tCommon = useTranslations('common');
  const tEditor = useTranslations('editor');
  const tCard = useTranslations('card');
  
  const [copied, setCopied] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  if (!link) return null;

  const hasUrl = !!link.url;

  // Extract domain from URL for clean display
  const getDomainFromUrl = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  const formatPost = (platform: 'whatsapp' | 'telegram' | 'instagram' | 'tiktok') => {
    // Personal text (description is the main content)
    const personalText = link.description || link.title || '';
    
    // Clean, minimal format with square bracket notation for links
    const linkNotation = hasUrl ? `\n\n[${getDomainFromUrl(link.url!)}]` : '';
    const branding = '\n\n[[fliqk.to]]';
    
    switch (platform) {
      case 'whatsapp':
      case 'telegram':
        // Minimal format: personal text + [domain] + [[fliqk.to]]
        return `${personalText}${linkNotation}${branding}`;
      
      case 'instagram':
      case 'tiktok':
        // For copy-paste platforms, slightly different format
        return `${personalText}${hasUrl ? "\n\n🔗 Link in bio" : ""}${branding}`;
      
      default:
        return `${personalText}${linkNotation}${branding}`;
    }
  };

  const handleWhatsApp = () => {
    const text = formatPost('whatsapp');
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onClickTracked?.();
  };

  const handleTelegram = () => {
    const text = formatPost('telegram');
    const url = hasUrl 
      ? `https://t.me/share/url?url=${encodeURIComponent(link.url!)}&text=${encodeURIComponent(text)}`
      : `https://t.me/share/url?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onClickTracked?.();
  };

  const handleCopyForPlatform = async (platform: 'instagram' | 'tiktok') => {
    const text = formatPost(platform);
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const handleCopyLink = async () => {
    if (link.url) {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-auto"
          >
            <div className="bg-[var(--background-secondary)] rounded-t-3xl border-t border-[var(--card-border)]">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-[var(--card-border)]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-4">
                <h2 className="font-bold text-lg">{t('title')}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Preview */}
              <div className="px-4 pb-4">
                <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--background-secondary)] flex items-center justify-center flex-shrink-0">
                      {link.thumbnail_type === "emoji" ? (
                        <span className="text-2xl">{link.custom_thumbnail}</span>
                      ) : link.thumbnail || link.custom_thumbnail ? (
                        <img 
                          src={link.thumbnail_type === "custom" ? link.custom_thumbnail! : link.thumbnail!} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-2xl">🔗</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">{link.title}</h3>
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-1">
                        {hasUrl ? link.url : (link.post_type === 'image' ? tEditor('imageType') : tEditor('textType'))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Options */}
              <div className="px-4 pb-6 space-y-3">
                {/* Direct Share */}
                <div className="grid grid-cols-2 gap-3">
                  <ShareButton
                    icon={<MessageCircle size={24} />}
                    label={tEditor('whatsapp')}
                    color="bg-[#25D366]"
                    onClick={handleWhatsApp}
                  />
                  <ShareButton
                    icon={<Send size={24} />}
                    label={tEditor('telegram')}
                    color="bg-[#0088cc]"
                    onClick={handleTelegram}
                  />
                </div>

                {/* Copy for platforms */}
                <div className="grid grid-cols-2 gap-3">
                  <CopyButton
                    label={tEditor('copyForInstagram')}
                    copied={copiedPlatform === 'instagram'}
                    copiedText={tCommon('copied')}
                    onClick={() => handleCopyForPlatform('instagram')}
                  />
                  <CopyButton
                    label={tEditor('copyForTiktok')}
                    copied={copiedPlatform === 'tiktok'}
                    copiedText={tCommon('copied')}
                    onClick={() => handleCopyForPlatform('tiktok')}
                  />
                </div>

                {/* Copy link - only for posts with URL */}
                {hasUrl && (
                  <>
                    <button
                      onClick={handleCopyLink}
                      className="w-full p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center gap-2 hover:border-[var(--accent-primary)] transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={20} className="text-green-500" />
                          <span className="font-medium">{tCommon('copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={20} />
                          <span className="font-medium">{tCard('copyLink')}</span>
                        </>
                      )}
                    </button>

                    {/* Open original */}
                    <a
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClickTracked}
                      className="w-full p-3 rounded-xl text-center text-sm text-[var(--foreground-muted)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={16} />
                      {tCard('open')}
                    </a>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ShareButton({ 
  icon, 
  label, 
  color, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  color: string; 
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${color} text-white p-4 rounded-xl flex items-center justify-center gap-3 font-semibold`}
    >
      {icon}
      {label}
    </motion.button>
  );
}

function CopyButton({ 
  label, 
  copied,
  copiedText,
  onClick 
}: { 
  label: string; 
  copied: boolean;
  copiedText: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-primary)] transition-colors"
    >
      {copied ? (
        <span className="flex items-center justify-center gap-2 text-green-500">
          <Check size={18} />
          {copiedText}
        </span>
      ) : (
        <span className="text-sm font-medium">{label}</span>
      )}
    </motion.button>
  );
}
