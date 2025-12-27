import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbLink {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  tags: string[];
  created_at: string;
}

