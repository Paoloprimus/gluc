// =============================================
// NUNQ Types v2
// =============================================

export interface User {
  id: string;
  nickname: string;
  created_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  sort_order: 'newest' | 'oldest' | 'clicks' | 'alpha';
}

export interface InviteToken {
  id: string;
  token: string;
  created_at: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
}

export type LinkStatus = 'draft' | 'published';
export type ThumbnailType = 'original' | 'custom' | 'emoji';

export interface NunqLink {
  id: string;
  user_id: string;
  url: string;
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
  url: string;
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
