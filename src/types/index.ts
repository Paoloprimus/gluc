export interface GlucLink {
  id: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string | null;
  tags: string[];
  createdAt: string;
  userId?: string;
}

export interface SocialPost {
  platform: 'twitter' | 'linkedin' | 'facebook';
  content: string;
}

export interface AIAnalysis {
  title: string;
  description: string;
  tags: string[];
  thumbnail: string | null;
}

