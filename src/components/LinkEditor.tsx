"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { 
  Link2, 
  Image, 
  Smile, 
  X, 
  Check, 
  Trash2,
  Send,
  Eye,
  ChevronLeft,
  Upload,
  Loader2,
  MessageCircle,
  Copy,
  Mic,
  Video,
  Share2
} from "lucide-react";
import type { FliqkLink, NewLink, ThumbnailType, PostType } from "@/types";
import { uploadThumbnail, uploadMedia, autoAssignCollection } from "@/lib/supabase";

// Popular emoji for thumbnails
const EMOJI_OPTIONS = ["🔥", "✨", "💡", "🎯", "🚀", "💎", "⭐", "❤️", "🎉", "👀", "💪", "🌟", "📌", "🔗", "💫", "🎨"];

interface LinkEditorProps {
  link?: FliqkLink;
  initialUrl?: string;
  userId: string;
  onSave: (link: NewLink) => Promise<FliqkLink | null>;
  onUpdate?: (link: FliqkLink) => Promise<void>;
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
  const t = useTranslations('editor');
  const tCommon = useTranslations('common');
  
  const isEditing = !!link;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  // Post type
  const [postType, setPostType] = useState<PostType>(link?.post_type || (initialUrl ? 'link' : 'text'));
  
  // Media state (for audio/video)
  const [mediaUrl, setMediaUrl] = useState<string | null>(link?.media_url || null);
  const [mediaType, setMediaType] = useState<string | null>(link?.media_type || null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
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
  const [includeUrlPreview, setIncludeUrlPreview] = useState(false); // Default: no preview card
  const [includeTitle, setIncludeTitle] = useState(false); // Default: no title in share

  // Determine if content is valid for preview
  const hasValidContent = () => {
    if (postType === 'link') return url.trim() && title.trim();
    if (postType === 'image') return (customThumbnail || thumbnailType === 'emoji') && title.trim();
    if (postType === 'text') return title.trim() || description.trim();
    if (postType === 'audio') return mediaUrl && title.trim();
    if (postType === 'video') return mediaUrl && title.trim();
    return false;
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

  // Format post for sharing - minimal, personal format
  const formatShareText = () => {
    const parts: string[] = [];
    
    // Title (optional, default off)
    if (includeTitle && title.trim()) {
      parts.push(title.trim());
    }
    
    // Description (main content)
    if (description.trim()) {
      parts.push(description.trim());
    }
    
    // For link posts: add [domain.com]
    if (postType === 'link' && url.trim()) {
      const domain = getDomainFromUrl(url);
      parts.push(`[${domain}]`);
    }
    
    // Fliqk branding - "shared via" not linkable, [[fliqk.to]] is the link
    parts.push('shared via [[fliqk.to]]');
    
    // Join with single line breaks for compact format
    return parts.join('\n');
  };
  
  // Get full URL for sharing (when user wants preview)
  const getShareUrl = () => {
    if (postType === 'link' && url.trim()) {
      return url.startsWith("http") ? url : `https://${url}`;
    }
    return null;
  };

  const handleShareWhatsApp = async () => {
    const savedLink = await ensureSaved();
    if (!savedLink) return;
    
    const text = formatShareText();
    const shareUrl = getShareUrl();
    
    // If user wants preview AND it's a link post, include full URL for preview card
    if (includeUrlPreview && shareUrl) {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`, '_blank');
    } else {
      // Default: just the clean text with [domain] notation
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    
    await markAsSent(savedLink);
  };

  const handleShareTelegram = async () => {
    const savedLink = await ensureSaved();
    if (!savedLink) return;
    
    const text = formatShareText();
    const shareUrl = getShareUrl();
    
    // If user wants preview AND it's a link post
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
    
    // Include full URL only if preview is enabled
    const fullText = (includeUrlPreview && shareUrl) ? `${text}\n\n${shareUrl}` : text;
    
    await navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    // Copy doesn't mark as sent - user might just be copying
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
      alert(t('selectImageError'));
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('imageTooLarge'));
      return;
    }
    
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadThumbnail(file, userId);
      if (uploadedUrl) {
        setCustomThumbnail(uploadedUrl);
        setThumbnailType("custom");
      } else {
        alert(t('uploadError'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(t('uploadError'));
    } finally {
      setUploadingImage(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type based on post type
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (postType === 'audio' && !isAudio) {
      alert(t('selectAudioError'));
      return;
    }
    if (postType === 'video' && !isVideo) {
      alert(t('selectVideoError'));
      return;
    }
    if (postType === 'image' && !isImage) {
      alert(t('selectImageError'));
      return;
    }
    
    // Validate file size (max 50MB for video, 10MB for audio, 5MB for image)
    const maxSize = isVideo ? 50 * 1024 * 1024 : isAudio ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
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
        // For images, also set as custom thumbnail
        if (isImage) {
          setCustomThumbnail(result.url);
          setThumbnailType("custom");
        }
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

  // Web Share API - share with file
  const handleNativeShare = async () => {
    const savedLink = await ensureSaved();
    if (!savedLink) return;
    
    const text = formatShareText().replace(/\*/g, '');
    
    // Check if Web Share API is supported
    if (!navigator.share) {
      // Fallback to copy
      await handleCopyText();
      return;
    }
    
    try {
      // Prepare share data
      const shareData: ShareData = {
        title: title.trim() || tCommon('post'),
        text: text,
      };
      
      // If we have a media file, try to share it
      if ((postType === 'image' || postType === 'audio' || postType === 'video') && mediaUrl) {
        try {
          const response = await fetch(mediaUrl);
          const blob = await response.blob();
          const fileName = `fliqk-${Date.now()}.${mediaType?.split('/')[1] || 'file'}`;
          const file = new File([blob], fileName, { type: mediaType || 'application/octet-stream' });
          
          // Check if sharing files is supported
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (err) {
          console.warn('Could not attach file to share:', err);
        }
      }
      
      // Add URL if it's a link post
      if (postType === 'link' && url.trim()) {
        shareData.url = url.startsWith("http") ? url : `https://${url}`;
      }
      
      await navigator.share(shareData);
      await markAsSent(savedLink);
    } catch (err) {
      // User cancelled or error
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
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

  // State for saved post (to update status after sharing)
  const [savedPost, setSavedPost] = useState<FliqkLink | null>(link || null);

  const buildLinkData = (status: 'draft' | 'sent'): NewLink => {
    let finalUrl: string | null = null;
    if (postType === 'link' && url.trim()) {
      finalUrl = url.startsWith("http") ? url : `https://${url}`;
    }

    return {
      post_type: postType,
      url: finalUrl,
      title: title.trim() || (postType === 'text' ? description.substring(0, 50) : tCommon('noTitle')),
      description: description.trim() || null,
      thumbnail: originalThumbnail || null,
      custom_thumbnail: thumbnailType === "emoji" ? selectedEmoji : (thumbnailType === "custom" ? customThumbnail : null),
      thumbnail_type: thumbnailType,
      media_url: mediaUrl,
      media_type: mediaType,
      tags,
      status,
    };
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    const linkData = buildLinkData(status);

    if (isEditing && link && onUpdate) {
      await onUpdate({ ...link, ...linkData });
    } else if (savedPost && onUpdate) {
      // Already saved, just update
      await onUpdate({ ...savedPost, ...linkData });
    } else {
      const newPost = await onSave(linkData);
      if (newPost) setSavedPost(newPost);
    }
  };

  // Auto-save as draft before sharing - returns the saved post
  const ensureSaved = async (): Promise<FliqkLink | null> => {
    // If editing existing link, return it
    if (isEditing && link) {
      return link;
    }
    // If already saved in this session, return that
    if (savedPost) {
      return savedPost;
    }
    // Otherwise save as draft first
    const linkData = buildLinkData('draft');
    const newPost = await onSave(linkData);
    if (newPost) {
      setSavedPost(newPost);
      return newPost;
    }
    return null;
  };

  // Mark as sent after sharing - takes the post directly to avoid state timing issues
  const markAsSent = async (postToMark?: FliqkLink | null) => {
    const postToUpdate = postToMark || savedPost || link;
    if (postToUpdate && onUpdate && postToUpdate.status !== 'sent') {
      const updatedPost = { ...postToUpdate, status: 'sent' as const };
      await onUpdate(updatedPost);
      setSavedPost(updatedPost);
      
      // Auto-assign to collection based on first tag
      if (tags.length > 0) {
        await autoAssignCollection(userId, postToUpdate.id, tags);
      }
    }
  };

  const handleDelete = async () => {
    if (link && onDelete && confirm(t('confirmDelete'))) {
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
              {/* Media Preview - only for media posts OR link posts with preview enabled */}
              {postType === 'audio' && mediaUrl ? (
                <div className="mb-4 p-4 rounded-xl bg-[var(--background-secondary)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-16 h-16 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
                      <Mic size={32} className="text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <p className="font-medium">{t('audio')}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">{mediaType}</p>
                    </div>
                  </div>
                  <audio src={mediaUrl} controls className="w-full" />
                </div>
              ) : postType === 'video' && mediaUrl ? (
                <div className="mb-4 rounded-xl overflow-hidden bg-[var(--background-secondary)]">
                  <video src={mediaUrl} controls className="w-full" />
                </div>
              ) : postType === 'image' ? (
                <div className="w-full h-48 rounded-xl overflow-hidden bg-[var(--background-secondary)] mb-4 flex items-center justify-center">
                  {thumbnailType === "emoji" ? (
                    <span className="text-8xl">{selectedEmoji}</span>
                  ) : getCurrentThumbnail() ? (
                    <img src={getCurrentThumbnail()!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image size={48} className="text-[var(--foreground-muted)]" />
                  )}
                </div>
              ) : postType === 'link' && includeUrlPreview && getCurrentThumbnail() ? (
                <div className="w-full h-48 rounded-xl overflow-hidden bg-[var(--background-secondary)] mb-4 flex items-center justify-center">
                  <img src={getCurrentThumbnail()!} alt="" className="w-full h-full object-cover" />
                </div>
              ) : null}
              
              {/* Title - only if toggle is ON */}
              {includeTitle && title && (
                <h3 className="font-bold text-lg mb-2">{title}</h3>
              )}
              
              {/* Description - main content */}
              {description && <p className="text-[var(--foreground)] mb-3">{description}</p>}
              
              {/* Link notation for link posts */}
              {postType === 'link' && url && (
                <p className="text-[var(--foreground-muted)] mb-3">[{getDomainFromUrl(url)}]</p>
              )}
              
              {/* Branding */}
              <p className="text-[var(--foreground-muted)] text-sm">shared via [[fliqk.to]]</p>
            </div>

            {/* Quick Share - Direct from preview */}
            <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--card-border)]">
              <p className="text-sm font-medium mb-3 text-center">{t('shareNow')}</p>
              
              {/* Share options toggles */}
              <div className="flex gap-2 mb-3">
                {/* Title toggle */}
                {title.trim() && (
                  <button
                    onClick={() => setIncludeTitle(!includeTitle)}
                    className={`flex-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                      includeTitle 
                        ? 'bg-[var(--accent-primary)] text-black' 
                        : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {includeTitle ? '✓ ' : '+ '}{t('title')}
                  </button>
                )}
                
                {/* Preview toggle - only for link posts */}
                {postType === 'link' && url && (
                  <button
                    onClick={() => setIncludeUrlPreview(!includeUrlPreview)}
                    className={`flex-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                      includeUrlPreview 
                        ? 'bg-[var(--accent-primary)] text-black' 
                        : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {includeUrlPreview ? '✓ ' : '+ '}{t('preview')}
                  </button>
                )}
              </div>
              
              {/* Native Share (with file support) - Show prominently for media posts */}
              {(postType === 'image' || postType === 'audio' || postType === 'video') && typeof navigator !== 'undefined' && 'share' in navigator && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNativeShare}
                  className="w-full p-4 rounded-xl bg-[var(--accent-primary)] text-black font-bold flex items-center justify-center gap-2 mb-3"
                >
                  <Share2 size={20} />
                  <span>{t('shareWithFile')}</span>
                </motion.button>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareWhatsApp}
                  className="p-3 rounded-xl bg-[#25D366] text-white font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  <span className="text-sm">{t('whatsapp')}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareTelegram}
                  className="p-3 rounded-xl bg-[#0088cc] text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  <span className="text-sm">{t('telegram')}</span>
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
                  <span className="text-sm">{copiedText ? tCommon('copied') : tCommon('copy')}</span>
                </motion.button>
              </div>
              
              {/* Helper text for media posts */}
              {(postType === 'image' || postType === 'audio' || postType === 'video') && (
                <p className="text-xs text-center text-[var(--foreground-muted)] mt-2">
                  {t('shareWithFileHint')}
                </p>
              )}
            </div>

            {/* Preview Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-medium hover:border-[var(--accent-primary)] transition-colors text-sm"
              >
                {t('editBtn')}
              </button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  await handleSave('draft');
                  onCancel();
                }}
                disabled={isLoading}
                className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] font-medium hover:border-[var(--accent-primary)] transition-colors flex items-center justify-center gap-1 text-sm"
              >
                {t('saveLater')}
              </motion.button>
            </div>
            
            <p className="text-center text-xs text-[var(--foreground-muted)]">
              {t('shareToSave')}
            </p>
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
            <h2 className="text-xl font-bold">{isEditing ? t('editPost') : t('createPost')}</h2>

            {/* Post Type Selector */}
            <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-[var(--background-secondary)]">
              <button
                onClick={() => setPostType('link')}
                className={`p-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  postType === 'link'
                    ? "bg-[var(--card-bg)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                <Link2 size={16} />
                {t('link')}
              </button>
              <button
                onClick={() => {
                  setPostType('image');
                  setThumbnailType('custom');
                }}
                className={`p-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  postType === 'image'
                    ? "bg-[var(--card-bg)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                <Image size={16} />
                {t('image')}
              </button>
              <button
                onClick={() => setPostType('audio')}
                className={`p-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  postType === 'audio'
                    ? "bg-[var(--card-bg)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                <Mic size={16} />
                {t('audio')}
              </button>
              <button
                onClick={() => setPostType('video')}
                className={`p-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  postType === 'video'
                    ? "bg-[var(--card-bg)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                <Video size={16} />
                {t('video')}
              </button>
              <button
                onClick={() => setPostType('text')}
                className={`p-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  postType === 'text'
                    ? "bg-[var(--card-bg)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                ✏️
                {t('text')}
              </button>
            </div>

            {/* URL Input - Only for link type */}
            {postType === 'link' && (
              <div>
                <label className="block text-sm font-medium mb-2">{t('url')}</label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <Link2 size={18} className="text-[var(--foreground-muted)]" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('urlPlaceholder')}
                    className="flex-1 bg-transparent outline-none"
                  />
                  {fetchingMeta && (
                    <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            )}

            {/* Media Upload - For audio/video types */}
            {(postType === 'audio' || postType === 'video') && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {postType === 'audio' ? t('audioFile') : t('videoFile')}
                </label>
                
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={postType === 'audio' ? 'audio/*' : 'video/*'}
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                
                {mediaUrl ? (
                  <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                    {postType === 'audio' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
                            <Mic size={24} className="text-[var(--accent-primary)]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{t('audioReady')}</p>
                            <p className="text-sm text-[var(--foreground-muted)]">{mediaType}</p>
                          </div>
                          <button
                            onClick={() => {
                              setMediaUrl(null);
                              setMediaType(null);
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <audio src={mediaUrl} controls className="w-full" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{t('videoReady')}</p>
                          <button
                            onClick={() => {
                              setMediaUrl(null);
                              setMediaType(null);
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <video src={mediaUrl} controls className="w-full rounded-lg" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="w-full p-8 rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--accent-primary)] transition-colors flex flex-col items-center gap-3"
                  >
                    {uploadingMedia ? (
                      <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
                    ) : (
                      <>
                        {postType === 'audio' ? (
                          <Mic size={32} className="text-[var(--foreground-muted)]" />
                        ) : (
                          <Video size={32} className="text-[var(--foreground-muted)]" />
                        )}
                        <span className="text-[var(--foreground-muted)]">
                          {postType === 'audio' ? t('uploadAudio') : t('uploadVideo')}
                        </span>
                        <span className="text-xs text-[var(--foreground-muted)]">
                          {postType === 'audio' ? t('maxAudioSize') : t('maxVideoSize')}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('title')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('titlePlaceholder')}
                className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Description with emoji */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
                className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-primary)] resize-none"
              />
            </div>

            {/* Thumbnail Selection - Different for image vs link posts */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {postType === 'image' ? t('thumbnailRequired') : t('thumbnail')}
              </label>
              
              {/* Only show original option for link type */}
              <div className="flex gap-2 mb-3">
                {postType === 'link' && (
                  <button
                    onClick={() => setThumbnailType("original")}
                    className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                      thumbnailType === "original"
                        ? "bg-[var(--accent-primary)] text-black"
                        : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                    }`}
                  >
                    {t('originalThumbnail')}
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === "custom"
                      ? "bg-[var(--accent-primary)] text-black"
                      : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                  }`}
                >
                  {uploadingImage ? (
                    <Loader2 size={14} className="inline mr-1 animate-spin" />
                  ) : (
                    <Upload size={14} className="inline mr-1" />
                  )}
                  {t('customThumbnail')}
                </button>
                <button
                  onClick={() => {
                    setThumbnailType("emoji");
                    setShowEmojiPicker(true);
                  }}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === "emoji"
                      ? "bg-[var(--accent-primary)] text-black"
                      : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                  }`}
                >
                  <Smile size={14} className="inline mr-1" />
                  {t('emojiThumbnail')}
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
                    className="flex flex-col items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    <Upload size={24} />
                    <span className="text-sm">{t('uploadImage')}</span>
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
                      <span className="text-sm font-medium">{t('selectEmoji')}</span>
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
                            selectedEmoji === emoji ? "bg-[var(--accent-primary)]/20" : ""
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
              <label className="block text-sm font-medium mb-2">{t('tags')}</label>
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
                  placeholder={t('tagsPlaceholder')}
                  className="flex-1 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="px-4 rounded-xl bg-[var(--accent-primary)] text-black disabled:opacity-50"
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
                className="w-full p-4 rounded-xl bg-[var(--accent-primary)] text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye size={20} />
                {t('preview')}
              </motion.button>
              
              {/* Helper text */}
              {!hasValidContent() && (
                <p className="text-center text-sm text-[var(--foreground-muted)]">
                  {postType === 'link' && t('needUrlAndTitle')}
                  {postType === 'image' && t('needImageAndTitle')}
                  {postType === 'text' && t('needTitleOrDescription')}
                  {postType === 'audio' && t('needAudioAndTitle')}
                  {postType === 'video' && t('needVideoAndTitle')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
