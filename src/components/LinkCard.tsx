"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, 
  Share2, 
  Trash2, 
  Copy,
  Check,
  Globe,
  Pencil,
  Save,
  X,
  Plus
} from "lucide-react";
import type { NunqLink } from "@/types";

interface LinkCardProps {
  link: NunqLink;
  onDelete: (id: string) => void;
  onShare: (link: NunqLink) => void;
  onUpdate: (link: NunqLink) => void;
  index: number;
}

export function LinkCard({ link, onDelete, onShare, onUpdate, index }: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit state
  const [editTitle, setEditTitle] = useState(link.title);
  const [editDescription, setEditDescription] = useState(link.description);
  const [editTags, setEditTags] = useState<string[]>(link.tags);
  const [newTag, setNewTag] = useState("");

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditTitle(link.title);
    setEditDescription(link.description);
    setEditTags([...link.tags]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewTag("");
  };

  const handleSaveEdit = () => {
    const updatedLink: NunqLink = {
      ...link,
      title: editTitle.trim() || link.title,
      description: editDescription?.trim() || null,
      tags: editTags,
    };
    onUpdate(updatedLink);
    setIsEditing(false);
    setNewTag("");
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/[^a-z0-9àèéìòù-]/g, "");
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "ora";
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="gradient-border group"
    >
      <div className="p-4 space-y-3">
        {/* Header with thumbnail */}
        <div className="flex gap-3">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[var(--card-bg)]">
            {link.thumbnail && !imageError ? (
              <img
                src={link.thumbnail}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-pink)]/20">
                <Globe size={24} className="text-[var(--foreground-muted)]" />
              </div>
            )}
          </div>

          {/* Title and domain */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-2 py-1 text-sm font-semibold focus:border-[var(--accent-purple)] outline-none"
                placeholder="Titolo..."
              />
            ) : (
              <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 leading-tight">
                {link.title}
              </h3>
            )}
            <p className="text-xs text-[var(--foreground-muted)] mt-1 flex items-center gap-1">
              <Globe size={12} />
              {getDomain(link.url)}
              <span className="mx-1">•</span>
              {formatDate(link.created_at)}
            </p>
          </div>

          {/* Edit button */}
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStartEdit}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
              title="Modifica"
            >
              <Pencil size={16} className="text-[var(--foreground-muted)]" />
            </motion.button>
          )}
        </div>

        {/* Description */}
        {isEditing ? (
          <textarea
            value={editDescription || ""}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm resize-none focus:border-[var(--accent-purple)] outline-none"
            rows={2}
            placeholder="Descrizione..."
          />
        ) : (
          link.description && (
            <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">
              {link.description}
            </p>
          )
        )}

        {/* Tags */}
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {editTags.map((tag) => (
                <span 
                  key={tag} 
                  className="tag group/tag cursor-pointer hover:bg-red-500/20 hover:text-red-400"
                  onClick={() => handleRemoveTag(tag)}
                  title="Clicca per rimuovere"
                >
                  #{tag}
                  <X size={12} className="ml-1 opacity-0 group-hover/tag:opacity-100" />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-1.5 text-sm focus:border-[var(--accent-purple)] outline-none"
                placeholder="Aggiungi tag..."
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ) : (
          link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {link.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
          {isEditing ? (
            <>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white text-sm font-medium"
                >
                  <Save size={14} />
                  Salva
                </motion.button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-sm text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] transition-colors"
                >
                  Annulla
                </button>
              </div>
              <div />
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyLink}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                  title="Copia link"
                >
                  {copied ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} className="text-[var(--foreground-muted)]" />
                  )}
                </motion.button>

                <motion.a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                  title="Apri link"
                >
                  <ExternalLink size={18} className="text-[var(--foreground-muted)]" />
                </motion.a>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onShare(link)}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                  title="Condividi"
                >
                  <Share2 size={18} className="text-[var(--foreground-muted)]" />
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(link.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors group/delete"
                title="Elimina"
              >
                <Trash2 size={18} className="text-[var(--foreground-muted)] group-hover/delete:text-red-500 transition-colors" />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
