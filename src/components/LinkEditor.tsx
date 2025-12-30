"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronLeft,
  Upload,
  Loader2,
  MessageCircle,
  Copy
} from "lucide-react";
import type { NunqLink, NewLink, ThumbnailType, PostType } from "@/types";
import { uploadThumbnail } from "@/lib/supabase";

// Popular emoji for thumbnails
const EMOJI_OPTIONS = ["🔥", "✨", "💡", "🎯", "🚀", "💎", "⭐", "❤️", "🎉", "👀", "💪", "🌟", "📌", "🔗", "💫", "🎨"];

interface LinkEditorProps {
  link?: NunqLink;
  initialUrl?: string;
  userId: string;
  onSave: (link: NewLink) => Promise<void>;
  onUpdate?: (link: NunqLink) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LinkEditor({ 
  link, 
  initialUrl,
  userId,
  onSave, 
  onUpdate, 
  onDelete, 
  onCancel,
  isLoading 
}: LinkEditorProps) {
  const isEditing = !!link;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Post type
  const [postType, setPostType] = useState<PostType>(link?.post_type || (initialUrl ? 'link' : 'text'));
  
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Determine if content is valid for preview
  const hasValidContent = () => {
    if (postType === 'link') return url.trim() && title.trim();
    if (postType === 'image') return (customThumbnail || thumbnailType === 'emoji') && title.trim();
    if (postType === 'text') return title.trim() || description.trim();
    return false;
  };

  // Format post for sharing
  const formatShareText = (platform: 'whatsapp' | 'telegram') => {
    const tagsText = tags.slice(0, 5).map(t => `#${t}`).join(" ");
    const emoji = thumbnailType === "emoji" ? selectedEmoji : "✨";
    const finalUrl = postType === 'link' && url.trim() 
      ? (url.startsWith("http") ? url : `https://${url}`)
      : null;
    
    let text = `${emoji} *${title.trim() || "Post"}*`;
    if (description.trim()) text += `\n\n${description.trim()}`;
    if (tagsText) text += `\n\n${tagsText}`;
    if (finalUrl) text += `\n\n👉 ${finalUrl}`;
    
    return text;
  };

  const handleShareWhatsApp = () => {
    const text = formatShareText('whatsapp');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = formatShareText('telegram');
    const finalUrl = postType === 'link' && url.trim() 
      ? (url.startsWith("http") ? url : `https://${url}`)
      : null;
    const telegramUrl = finalUrl 
      ? `https://t.me/share/url?url=${encodeURIComponent(finalUrl)}&text=${encodeURIComponent(text)}`
      : `https://t.me/share/url?text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleCopyText = async () => {
    const text = formatShareText('whatsapp').replace(/\*/g, ''); // Remove markdown
    await navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un\'immagine');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'immagine deve essere inferiore a 5MB');
      return;
    }
    
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadThumbnail(file, userId);
      if (uploadedUrl) {
        setCustomThumbnail(uploadedUrl);
        setThumbnailType("custom");
      } else {
        alert('Errore durante il caricamento');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Errore durante il caricamento');
    } finally {
      setUploadingImage(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    // Build URL only for link type
    let finalUrl: string | null = null;
    if (postType === 'link' && url.trim()) {
      finalUrl = url.startsWith("http") ? url : `https://${url}`;
    }

    const linkData: NewLink = {
      post_type: postType,
      url: finalUrl,
      title: title.trim() || (postType === 'text' ? description.substring(0, 50) : 'Senza titolo'),
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
              
              {postType === 'link' && url && (
                <p className="text-sm text-[var(--accent-purple)]">🔗 {url}</p>
              )}
            </div>

            {/* Quick Share - Direct from preview */}
            <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--card-border)]">
              <p className="text-sm font-medium mb-3 text-center">📤 Condividi subito</p>
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareWhatsApp}
                  className="p-3 rounded-xl bg-[#25D366] text-white font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  <span className="text-sm">WhatsApp</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareTelegram}
                  className="p-3 rounded-xl bg-[#0088cc] text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  <span className="text-sm">Telegram</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyText}
                  className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-semibold flex items-center justify-center gap-2"
                >
                  {copiedText ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                  <span className="text-sm">{copiedText ? "Copiato!" : "Copia"}</span>
                </motion.button>
              </div>
            </div>

            {/* Preview Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-medium hover:border-[var(--accent-purple)] transition-colors text-sm"
              >
                ✏️ Modifica
              </button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSave('draft')}
                disabled={isLoading}
                className="p-3 rounded-xl bg-[var(--card-bg)] border border-amber-500/50 font-medium hover:border-amber-500 transition-colors flex items-center justify-center gap-1 text-sm"
              >
                📝 Bozza
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSave('published')}
                disabled={isLoading || !title.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-medium disabled:opacity-50 flex items-center justify-center gap-1 text-sm"
              >
                ✅ Salva
              </motion.button>
            </div>
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
            <h2 className="text-xl font-bold">{isEditing ? "Modifica Post" : "Nuovo Post"}</h2>

            {/* Post Type Selector */}
            <div className="flex gap-2 p-1 rounded-xl bg-[var(--background-secondary)]">
              <button
                onClick={() => setPostType('link')}
                className={`flex-1 p-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  postType === 'link'
                    ? "bg-[var(--card-bg)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                <Link2 size={16} />
                Link
              </button>
              <button
                onClick={() => {
                  setPostType('image');
                  setThumbnailType('custom');
                }}
                className={`flex-1 p-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  postType === 'image'
                    ? "bg-[var(--card-bg)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                <Image size={16} />
                Immagine
              </button>
              <button
                onClick={() => setPostType('text')}
                className={`flex-1 p-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  postType === 'text'
                    ? "bg-[var(--card-bg)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                ✏️ Testo
              </button>
            </div>

            {/* URL Input - Only for link type */}
            {postType === 'link' && (
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
            )}

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

            {/* Thumbnail Selection - Different for image vs link posts */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {postType === 'image' ? 'Immagine *' : 'Thumbnail'}
              </label>
              
              {/* Only show original option for link type */}
              <div className="flex gap-2 mb-3">
                {postType === 'link' && (
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
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === "custom"
                      ? "bg-[var(--accent-purple)] text-white"
                      : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                  }`}
                >
                  {uploadingImage ? (
                    <Loader2 size={14} className="inline mr-1 animate-spin" />
                  ) : (
                    <Upload size={14} className="inline mr-1" />
                  )}
                  Carica
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

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Thumbnail Preview */}
              <div className="w-full h-32 rounded-xl overflow-hidden bg-[var(--background-secondary)] flex items-center justify-center relative">
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 size={32} className="animate-spin text-white" />
                  </div>
                )}
                {thumbnailType === "emoji" ? (
                  <button 
                    onClick={() => setShowEmojiPicker(true)}
                    className="text-6xl hover:scale-110 transition-transform"
                  >
                    {selectedEmoji}
                  </button>
                ) : thumbnailType === "custom" && customThumbnail ? (
                  <div className="relative w-full h-full">
                    <img src={customThumbnail} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setCustomThumbnail("");
                        setThumbnailType("original");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : originalThumbnail ? (
                  <img src={originalThumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--accent-purple)] transition-colors"
                  >
                    <Upload size={24} />
                    <span className="text-sm">Carica immagine</span>
                  </button>
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
                disabled={!hasValidContent()}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye size={20} />
                Anteprima
              </motion.button>
              
              {/* Helper text */}
              {!hasValidContent() && (
                <p className="text-center text-sm text-[var(--foreground-muted)]">
                  {postType === 'link' && "Inserisci URL e titolo"}
                  {postType === 'image' && "Carica un'immagine e aggiungi un titolo"}
                  {postType === 'text' && "Aggiungi un titolo o una descrizione"}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

