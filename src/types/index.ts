// =============================================
// NUNQ Types
// =============================================

export interface User {
  id: string;
  nickname: string;
  created_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  ai_suggestions: boolean;
  sort_order: 'newest' | 'oldest' | 'alpha';
}

export interface InviteToken {
  id: string;
  token: string;
  created_at: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
}

export interface NunqLink {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// For creating new links (without id, timestamps)
export interface NewLink {
  url: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  tags: string[];
}

// Stats for the statistics page
export interface UserStats {
  totalLinks: number;
  totalTags: number;
  topTags: { tag: string; count: number }[];
  linksPerDay: { date: string; count: number }[];
  domainsCount: { domain: string; count: number }[];
}

// Session stored in localStorage
export interface Session {
  userId: string;
  nickname: string;
  preferences: UserPreferences;
}
