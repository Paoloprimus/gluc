"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { 
  ExternalLink, 
  Share2, 
  Trash2, 
  Copy,
  Check,
  Globe,
  Pencil,
  MousePointer,
  Clock,
  FileEdit,
  Mic,
  Video,
  Play
} from "lucide-react";
import type { FliqkLink } from "@/types";

interface LinkCardProps {
  link: FliqkLink;
  onDelete: (id: string) => void;
  onShare: (link: FliqkLink) => void;
  onEdit: (link: FliqkLink) => void;
  onClickTrack: (id: string) => void;
  index: number;
}

export function LinkCard({ link, onDelete, onShare, onEdit, onClickTrack, index }: LinkCardProps) {
  const t = useTranslations('card');
  const tCommon = useTranslations('common');
  const tEditor = useTranslations('editor');
  
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopyLink = async () => {
    if (link.url) {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    if (link.url) {
      onClickTrack(link.id);
      window.open(link.url, '_blank');
    }
  };

  const hasUrl = !!link.url;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return tCommon('now');
    if (diffMins < 60) return tCommon('minutesAgo', { count: diffMins });
    if (diffHours < 24) return tCommon('hoursAgo', { count: diffHours });
    if (diffDays < 7) return tCommon('daysAgo', { count: diffDays });
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const getThumbnail = () => {
    if (link.thumbnail_type === "emoji") {
      return null; // Emoji rendered separately
    }
    if (link.thumbnail_type === "custom" && link.custom_thumbnail) {
      return link.custom_thumbnail;
    }
    return link.thumbnail;
  };

  const isDraft = link.status === "draft";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`gradient-border group ${isDraft ? "opacity-70" : ""}`}
    >
      <div className="p-4 space-y-3 relative">
        {/* Status badge */}
        {isDraft ? (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-medium flex items-center gap-1">
            <FileEdit size={12} />
            {t('draft')}
          </div>
        ) : (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
            {t('sentStatus')}
          </div>
        )}

        {/* Header with thumbnail */}
        <div className="flex gap-3">
          {/* Thumbnail */}
          {hasUrl ? (
            <a
              href={link.url!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClickTrack(link.id)}
              className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[var(--card-bg)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              {link.thumbnail_type === "emoji" ? (
                <span className="text-4xl">{link.custom_thumbnail || "🔗"}</span>
              ) : getThumbnail() && !imageError ? (
                <img
                  src={getThumbnail()!}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20">
                  <Globe size={24} className="text-[var(--foreground-muted)]" />
                </div>
              )}
            </a>
          ) : (
            <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[var(--card-bg)] flex items-center justify-center">
              {link.thumbnail_type === "emoji" ? (
                <span className="text-4xl">{link.custom_thumbnail || "🔗"}</span>
              ) : link.post_type === 'audio' ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/30">
                  <Mic size={28} className="text-[var(--accent-primary)]" />
                </div>
              ) : link.post_type === 'video' && link.media_url ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/30 relative">
                  <Play size={28} className="text-[var(--accent-primary)]" />
                </div>
              ) : getThumbnail() && !imageError ? (
                <img
                  src={getThumbnail()!}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20">
                  <Globe size={24} className="text-[var(--foreground-muted)]" />
                </div>
              )}
            </div>
          )}

          {/* Title and meta */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 leading-tight">
              {link.title}
            </h3>
            {hasUrl ? (
              <a 
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClickTrack(link.id)}
                className="text-xs text-[var(--foreground-muted)] mt-1 flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors"
              >
                <Globe size={12} />
                {getDomain(link.url!)}
              </a>
            ) : (
              <p className="text-xs text-[var(--accent-primary)] mt-1 flex items-center gap-1">
                {link.post_type === 'image' && tEditor('imageType')}
                {link.post_type === 'audio' && <><Mic size={12} /> {tEditor('audioType')}</>}
                {link.post_type === 'video' && <><Video size={12} /> {tEditor('videoType')}</>}
                {link.post_type === 'text' && tEditor('textType')}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--foreground-muted)]">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDate(link.created_at)}
              </span>
              {link.click_count > 0 && (
                <span className="flex items-center gap-1">
                  <MousePointer size={12} />
                  {link.click_count} {t('clicks')}
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(link)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors self-start"
            title={t('edit')}
          >
            <Pencil size={16} className="text-[var(--foreground-muted)]" />
          </motion.button>
        </div>

        {/* Description */}
        {link.description && (
          <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">
            {link.description}
          </p>
        )}

        {/* Tags */}
        {link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {link.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
          <div className="flex items-center gap-1">
            {/* Copy/Open only for links */}
            {hasUrl && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyLink}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                  title={t('copyLink')}
                >
                  {copied ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} className="text-[var(--foreground-muted)]" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleOpenLink}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                  title={t('open')}
                >
                  <ExternalLink size={18} className="text-[var(--foreground-muted)]" />
                </motion.button>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onShare(link)}
              className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
              title={t('share')}
            >
              <Share2 size={18} className="text-[var(--foreground-muted)]" />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(link.id)}
            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors group/delete"
            title={t('delete')}
          >
            <Trash2 size={18} className="text-[var(--foreground-muted)] group-hover/delete:text-red-500 transition-colors" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
