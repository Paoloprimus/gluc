"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { 
  Link2, 
  X, 
  Trash2,
  Eye,
  ChevronLeft,
  Loader2,
  MessageCircle,
  Copy,
  Send,
  Check,
  Image,
  Mic
} from "lucide-react";
import type { FliqkLink, NewLink } from "@/types";
import { uploadMedia } from "@/lib/supabase";

interface PostEditorProps {
  link?: FliqkLink;
  initialUrl?: string;
  userId: string;
  onSave: (link: NewLink) => Promise<FliqkLink | null>;
  onUpdate?: (link: FliqkLink) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PostEditor({ 
  link, 
  initialUrl,
  userId,
  onSave, 
  onUpdate, 
  onDelete, 
  onCancel,
  isLoading 
}: PostEditorProps) {
  const t = useTranslations('editor');
  const tCommon = useTranslations('common');
  
  const isEditing = !!link;
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  // Form state - simplified
  const [url, setUrl] = useState(link?.url || initialUrl || "");
  const [description, setDescription] = useState(link?.description || "");
  const [tags, setTags] = useState<string[]>(link?.tags || []);
  const [newTag, setNewTag] = useState("");
  
  // Optional media (only in preview)
  const [mediaUrl, setMediaUrl] = useState<string | null>(link?.media_url || null);
  const [mediaType, setMediaType] = useState<string | null>(link?.media_type || null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [includeUrlPreview, setIncludeUrlPreview] = useState(false);
  
  // Saved post reference for sharing flow
  const [savedPost, setSavedPost] = useState<FliqkLink | null>(null);

  // Auto-detect post type from URL
  const isLinkPost = url.trim().length > 0;
  
  // Validation: description required, first tag required
  const hasValidContent = () => {
    return description.trim().length > 0 && tags.length > 0;
  };

  // Extract domain from URL for clean display
  const getDomainFromUrl = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  // Format post for sharing - minimal format
  const formatShareText = () => {
    const parts: string[] = [];
    
    // Description (main content)
    if (description.trim()) {
      parts.push(description.trim());
    }
    
    // For link posts: add [domain.com]
    if (isLinkPost) {
      const domain = getDomainFromUrl(url);
      parts.push(`[${domain}]`);
    }
    
    // Fliqk branding
    parts.push('shared via [[fliqk.to]]');
    
    return parts.join('\n');
  };
  
  // Get full URL for sharing (when user wants preview)
  const getShareUrl = () => {
    if (isLinkPost) {
      return url.startsWith("http") ? url : `https://${url}`;
    }
    return null;
  };

  // Build link data for saving
  const buildLinkData = (status: 'draft' | 'sent'): NewLink => {
    return {
      url: url.trim() || null,
      title: description.trim().slice(0, 100), // Use first 100 chars of description as title
      description: description.trim(),
      thumbnail: null,
      custom_thumbnail: null,
      thumbnail_type: 'original',
      post_type: isLinkPost ? 'link' : 'text',
      media_url: mediaUrl,
      media_type: mediaType,
      tags,
      status,
    };
  };

  // Auto-save as draft before sharing
  const ensureSaved = async (): Promise<FliqkLink | null> => {
    if (isEditing && link) {
      return link;
    }
    if (savedPost) {
      return savedPost;
    }
    const linkData = buildLinkData('draft');
    const newPost = await onSave(linkData);
    if (newPost) {
      setSavedPost(newPost);
      return newPost;
    }
    return null;
  };

  // Mark as sent after sharing
  const markAsSent = async (postToMark?: FliqkLink | null) => {
    const postToUpdate = postToMark || savedPost || link;
    if (postToUpdate && onUpdate && postToUpdate.status !== 'sent') {
      const updatedPost = { ...postToUpdate, status: 'sent' as const };
      await onUpdate(updatedPost);
      setSavedPost(updatedPost);
    }
  };

  const handleShareWhatsApp = async () => {
    const savedLink = await ensureSaved();
    if (!savedLink) return;
    
    const text = formatShareText();
    const shareUrl = getShareUrl();
    
    if (includeUrlPreview && shareUrl) {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    
    await markAsSent(savedLink);
  };

  const handleShareTelegram = async () => {
    const savedLink = await ensureSaved();
    if (!savedLink) return;
    
    const text = formatShareText();
    const shareUrl = getShareUrl();
    
    if (includeUrlPreview && shareUrl) {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, '_blank');
    }
    
    await markAsSent(savedLink);
  };

  const handleCopyText = async () => {
    const savedLink = await ensureSaved();
    if (!savedLink) return;
    
    const text = formatShareText();
    const shareUrl = getShareUrl();
    const fullText = (includeUrlPreview && shareUrl) ? `${text}\n\n${shareUrl}` : text;
    
    await navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    
    if (!isImage && !isAudio) {
      alert(t('selectImageOrAudioError'));
      return;
    }
    
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(t('fileTooLarge'));
      return;
    }
    
    setUploadingMedia(true);
    try {
      const result = await uploadMedia(file, userId);
      if (result) {
        setMediaUrl(result.url);
        setMediaType(result.type);
      } else {
        alert(t('uploadError'));
      }
    } catch (error) {
      console.error('Media upload error:', error);
      alert(t('uploadError'));
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) {
        mediaInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    const linkData = buildLinkData(status);

    if (isEditing && link && onUpdate) {
      await onUpdate({ ...link, ...linkData });
    } else if (savedPost && onUpdate) {
      await onUpdate({ ...savedPost, ...linkData });
    } else {
      const newPost = await onSave(linkData);
      if (newPost) setSavedPost(newPost);
    }
  };

  const handleDelete = async () => {
    if (link && onDelete && confirm(t('confirmDelete'))) {
      await onDelete(link.id);
    }
  };

  // Validation message
  const getValidationMessage = () => {
    if (!description.trim()) return t('needDescription');
    if (tags.length === 0) return t('needFirstTag');
    return null;
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
          <span>{tCommon('back')}</span>
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
            <h2 className="text-xl font-bold">{t('previewPost')}</h2>
            
            {/* Preview Card - shows exactly what will be shared */}
            <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
              {/* Optional media preview */}
              {mediaUrl && mediaType?.startsWith('image/') && (
                <div className="w-full h-48 rounded-xl overflow-hidden bg-[var(--background-secondary)] mb-4">
                  <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              
              {mediaUrl && mediaType?.startsWith('audio/') && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--background-secondary)]">
                  <audio src={mediaUrl} controls className="w-full" />
                </div>
              )}
              
              {/* Link preview if enabled */}
              {isLinkPost && includeUrlPreview && (
                <div className="w-full h-32 rounded-xl overflow-hidden bg-[var(--background-secondary)] mb-4 flex items-center justify-center">
                  <Link2 size={32} className="text-[var(--foreground-muted)]" />
                </div>
              )}
              
              {/* Description - main content */}
              <p className="text-[var(--foreground)] mb-3">{description}</p>
              
              {/* Link notation for link posts */}
              {isLinkPost && (
                <p className="text-[var(--foreground-muted)] mb-3">[{getDomainFromUrl(url)}]</p>
              )}
              
              {/* Branding */}
              <p className="text-[var(--foreground-muted)] text-sm">shared via [[fliqk.to]]</p>
            </div>

            {/* Quick Share */}
            <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--card-border)]">
              <p className="text-sm font-medium mb-3 text-center">{t('shareNow')}</p>
              
              {/* Preview toggle - only for link posts */}
              {isLinkPost && (
                <div className="mb-3">
                  <button
                    onClick={() => setIncludeUrlPreview(!includeUrlPreview)}
                    className={`w-full p-2 rounded-lg text-xs font-medium transition-colors ${
                      includeUrlPreview 
                        ? 'bg-[var(--accent-primary)] text-black' 
                        : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {includeUrlPreview ? '✓ ' : '+ '}{t('preview')}
                  </button>
                </div>
              )}
              
              {/* Share buttons */}
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareWhatsApp}
                  className="p-3 rounded-xl bg-[#25D366] text-white font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  <span className="text-sm">WA</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareTelegram}
                  className="p-3 rounded-xl bg-[#0088cc] text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  <span className="text-sm">TG</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyText}
                  className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-semibold flex items-center justify-center gap-2"
                >
                  {copiedText ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  <span className="text-sm">{copiedText ? '✓' : t('copy')}</span>
                </motion.button>
              </div>
            </div>

            {/* Back to edit */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 p-3 rounded-xl border border-[var(--card-border)] font-medium"
              >
                {t('editBtn')}
              </button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSave('draft')}
                disabled={isLoading}
                className="flex-1 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-medium"
              >
                {t('saveLater')}
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
            className="space-y-5"
          >
            <h2 className="text-xl font-bold">{isEditing ? t('editPost') : t('createPost')}</h2>

            {/* URL Input (optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('url')} <span className="text-[var(--foreground-muted)]">({t('optional')})</span></label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                <Link2 size={18} className="text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('urlPlaceholder')}
                  className="flex-1 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Description (mandatory) */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('description')} *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] resize-none h-32 outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Tags (first one mandatory) */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('tags')} * <span className="text-[var(--foreground-muted)]">({t('firstTagRequired')})</span></label>
              
              {/* Current tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, index) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        index === 0 
                          ? 'bg-[var(--accent-primary)] text-black font-medium' 
                          : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                      }`}
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Add tag input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder={t('tagsPlaceholder')}
                  className="flex-1 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="px-4 rounded-xl bg-[var(--accent-primary)] text-black font-medium disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Optional Media (image or audio) */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('addMedia')} <span className="text-[var(--foreground-muted)]">({t('optional')})</span></label>
              
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,audio/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
              
              {mediaUrl ? (
                <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  {mediaType?.startsWith('image/') ? (
                    <div className="relative">
                      <img src={mediaUrl} alt="" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => { setMediaUrl(null); setMediaType(null); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
                        <Mic size={20} className="text-[var(--accent-primary)]" />
                      </div>
                      <audio src={mediaUrl} controls className="flex-1 h-8" />
                      <button
                        onClick={() => { setMediaUrl(null); setMediaType(null); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--accent-primary)] transition-colors flex items-center justify-center gap-2 text-[var(--foreground-muted)]"
                >
                  {uploadingMedia ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Image size={18} />
                      <span>/</span>
                      <Mic size={18} />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPreview(true)}
                disabled={!hasValidContent()}
                className="w-full p-4 rounded-xl bg-[var(--accent-primary)] text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye size={20} />
                {t('preview')}
              </motion.button>
              
              {/* Validation message */}
              {!hasValidContent() && (
                <p className="text-center text-sm text-[var(--foreground-muted)]">
                  {getValidationMessage()}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

