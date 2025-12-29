"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link2, 
  Image, 
  Smile, 
  X, 
  Check, 
  Trash2,
  Save,
  Send,
  Eye,
  ChevronLeft
} from "lucide-react";
import type { NunqLink, NewLink, ThumbnailType } from "@/types";

// Popular emoji for thumbnails
const EMOJI_OPTIONS = ["🔥", "✨", "💡", "🎯", "🚀", "💎", "⭐", "❤️", "🎉", "👀", "💪", "🌟", "📌", "🔗", "💫", "🎨"];

interface LinkEditorProps {
  link?: NunqLink;
  initialUrl?: string;
  onSave: (link: NewLink) => Promise<void>;
  onUpdate?: (link: NunqLink) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LinkEditor({ 
  link, 
  initialUrl, 
  onSave, 
  onUpdate, 
  onDelete, 
  onCancel,
  isLoading 
}: LinkEditorProps) {
  const isEditing = !!link;
  
  // Form state
  const [url, setUrl] = useState(link?.url || initialUrl || "");
  const [title, setTitle] = useState(link?.title || "");
  const [description, setDescription] = useState(link?.description || "");
  const [tags, setTags] = useState<string[]>(link?.tags || []);
  const [newTag, setNewTag] = useState("");
  
  // Thumbnail state
  const [thumbnailType, setThumbnailType] = useState<ThumbnailType>(link?.thumbnail_type || "original");
  const [originalThumbnail, setOriginalThumbnail] = useState(link?.thumbnail || "");
  const [customThumbnail, setCustomThumbnail] = useState(link?.custom_thumbnail || "");
  const [selectedEmoji, setSelectedEmoji] = useState(link?.thumbnail_type === "emoji" ? link?.custom_thumbnail || "🔗" : "🔗");
  
  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);

  // Fetch metadata when URL changes
  useEffect(() => {
    if (url && !isEditing && !title) {
      fetchUrlMetadata();
    }
  }, [url, isEditing]);

  const fetchUrlMetadata = async () => {
    if (!url || !url.startsWith("http")) return;
    
    setFetchingMeta(true);
    try {
      // Simple fetch to get og:image
      const response = await fetch(`/api/meta?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.title && !title) setTitle(data.title);
        if (data.thumbnail) setOriginalThumbnail(data.thumbnail);
      }
    } catch {
      // Silent fail
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/[^a-z0-9àèéìòù-]/g, "");
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const getCurrentThumbnail = () => {
    switch (thumbnailType) {
      case "original":
        return originalThumbnail;
      case "custom":
        return customThumbnail;
      case "emoji":
        return null; // Emoji rendered separately
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    const linkData: NewLink = {
      url: url.startsWith("http") ? url : `https://${url}`,
      title: title.trim() || url,
      description: description.trim() || null,
      thumbnail: originalThumbnail || null,
      custom_thumbnail: thumbnailType === "emoji" ? selectedEmoji : (thumbnailType === "custom" ? customThumbnail : null),
      thumbnail_type: thumbnailType,
      tags,
      status,
    };

    if (isEditing && link && onUpdate) {
      await onUpdate({ ...link, ...linkData });
    } else {
      await onSave(linkData);
    }
  };

  const handleDelete = async () => {
    if (link && onDelete && confirm("Sei sicuro di voler eliminare questo link?")) {
      await onDelete(link.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Indietro</span>
        </button>
        
        {isEditing && onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showPreview ? (
          /* Preview Mode */
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold">Anteprima Post</h2>
            
            {/* Preview Card */}
            <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
              {/* Thumbnail */}
              <div className="w-full h-48 rounded-xl overflow-hidden bg-[var(--background-secondary)] mb-4 flex items-center justify-center">
                {thumbnailType === "emoji" ? (
                  <span className="text-8xl">{selectedEmoji}</span>
                ) : getCurrentThumbnail() ? (
                  <img src={getCurrentThumbnail()!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Link2 size={48} className="text-[var(--foreground-muted)]" />
                )}
              </div>
              
              <h3 className="font-bold text-lg mb-2">{title || "Titolo del post"}</h3>
              {description && <p className="text-[var(--foreground-muted)] mb-3">{description}</p>}
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-[var(--accent-purple)]">🔗 {url}</p>
            </div>

            {/* Preview Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-medium hover:border-[var(--accent-purple)] transition-colors"
              >
                ✏️ Modifica
              </button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSave('draft')}
                disabled={isLoading}
                className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-medium hover:border-[var(--accent-purple)] transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salva Bozza
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSave('published')}
              disabled={isLoading || !title.trim()}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Pubblica
            </motion.button>
          </motion.div>
        ) : (
          /* Edit Mode */
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold">{isEditing ? "Modifica Link" : "Nuovo Link"}</h2>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium mb-2">URL</label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                <Link2 size={18} className="text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://esempio.com"
                  className="flex-1 bg-transparent outline-none"
                />
                {fetchingMeta && (
                  <div className="w-4 h-4 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Titolo</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Il titolo del tuo post..."
                className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-purple)]"
              />
            </div>

            {/* Description with emoji */}
            <div>
              <label className="block text-sm font-medium mb-2">Descrizione + Emoji</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scrivi una descrizione accattivante... 🔥✨"
                rows={3}
                className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-purple)] resize-none"
              />
            </div>

            {/* Thumbnail Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setThumbnailType("original")}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === "original"
                      ? "bg-[var(--accent-purple)] text-white"
                      : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                  }`}
                >
                  🌐 Originale
                </button>
                <button
                  onClick={() => setThumbnailType("custom")}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === "custom"
                      ? "bg-[var(--accent-purple)] text-white"
                      : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                  }`}
                >
                  <Image size={14} className="inline mr-1" />
                  Immagine
                </button>
                <button
                  onClick={() => {
                    setThumbnailType("emoji");
                    setShowEmojiPicker(true);
                  }}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === "emoji"
                      ? "bg-[var(--accent-purple)] text-white"
                      : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                  }`}
                >
                  <Smile size={14} className="inline mr-1" />
                  Emoji
                </button>
              </div>

              {/* Thumbnail Preview */}
              <div className="w-full h-32 rounded-xl overflow-hidden bg-[var(--background-secondary)] flex items-center justify-center">
                {thumbnailType === "emoji" ? (
                  <button 
                    onClick={() => setShowEmojiPicker(true)}
                    className="text-6xl hover:scale-110 transition-transform"
                  >
                    {selectedEmoji}
                  </button>
                ) : thumbnailType === "custom" ? (
                  <div className="text-center p-4">
                    <input
                      type="text"
                      value={customThumbnail}
                      onChange={(e) => setCustomThumbnail(e.target.value)}
                      placeholder="URL immagine..."
                      className="w-full p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-sm mb-2"
                    />
                    {customThumbnail && (
                      <img src={customThumbnail} alt="" className="max-h-16 mx-auto rounded" />
                    )}
                  </div>
                ) : originalThumbnail ? (
                  <img src={originalThumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[var(--foreground-muted)]">Nessuna immagine</span>
                )}
              </div>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && thumbnailType === "emoji" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Scegli emoji</span>
                      <button onClick={() => setShowEmojiPicker(false)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-8 gap-2">
                      {EMOJI_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setSelectedEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className={`text-2xl p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors ${
                            selectedEmoji === emoji ? "bg-[var(--accent-purple)]/20" : ""
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span 
                    key={tag} 
                    className="tag cursor-pointer hover:bg-red-500/20 hover:text-red-400"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    #{tag} <X size={12} className="inline ml-1" />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Aggiungi tag..."
                  className="flex-1 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-purple)]"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="px-4 rounded-xl bg-[var(--accent-purple)] text-white disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPreview(true)}
                disabled={!url.trim() || !title.trim()}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye size={20} />
                Anteprima
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

