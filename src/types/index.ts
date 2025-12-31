// =============================================
// fliqk Types v2
// =============================================

export interface User {
  id: string;
  nickname: string;
  created_at: string;
  preferences: UserPreferences;
}

export type Locale = 'it' | 'de';

export interface UserPreferences {
  theme: 'light' | 'dark';
  sort_order: 'newest' | 'oldest' | 'alpha';
  locale: Locale;
}

export interface InviteToken {
  id: string;
  token: string;
  created_at: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
}

export type LinkStatus = 'draft' | 'sent';
export type ThumbnailType = 'original' | 'custom' | 'emoji';

export type PostType = 'link' | 'image' | 'text';

export interface FliqkLink {
  id: string;
  user_id: string;
  collection_id: string | null;
  post_type: PostType;
  url: string | null;
  title: string;
  description: string | null;
  thumbnail: string | null;
  custom_thumbnail: string | null;
  thumbnail_type: ThumbnailType;
  tags: string[];
  status: LinkStatus;
  click_count: number;
  created_at: string;
  updated_at: string;
}

// For creating new links
export interface NewLink {
  collection_id?: string | null;
  post_type: PostType;
  url: string | null;
  title: string;
  description: string | null;
  thumbnail: string | null;
  custom_thumbnail: string | null;
  thumbnail_type: ThumbnailType;
  tags: string[];
  status: LinkStatus;
}

// Session stored in localStorage
export interface Session {
  userId: string;
  nickname: string;
  preferences: UserPreferences;
}

// Share platforms
export type SharePlatform = 'whatsapp' | 'telegram' | 'instagram' | 'tiktok' | 'copy';

// Collections
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface NewCollection {
  name: string;
  emoji: string;
  color: string;
}

export type ViewMode = 'grid' | 'list';
export type SortOrder = 'newest' | 'oldest' | 'alpha' | 'random';
