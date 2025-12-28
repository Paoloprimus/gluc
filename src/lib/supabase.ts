import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// Auth / User Functions
// =============================================

export async function validateInviteToken(token: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('token', token.toUpperCase())
    .eq('used', false)
    .single();
  
  return !error && !!data;
}

export async function registerUser(nickname: string, token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  // Check if nickname already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('nickname', nickname.toLowerCase())
    .single();
  
  if (existingUser) {
    return { success: false, error: 'Nickname già in uso' };
  }
  
  // Validate token
  const { data: tokenData, error: tokenError } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('token', token.toUpperCase())
    .eq('used', false)
    .single();
  
  if (tokenError || !tokenData) {
    return { success: false, error: 'Token non valido o già utilizzato' };
  }
  
  // Create user
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({ nickname: nickname.toLowerCase() })
    .select()
    .single();
  
  if (userError || !newUser) {
    return { success: false, error: 'Errore durante la registrazione' };
  }
  
  // Mark token as used
  await supabase
    .from('invite_tokens')
    .update({ used: true, used_by: newUser.id, used_at: new Date().toISOString() })
    .eq('id', tokenData.id);
  
  return { success: true, userId: newUser.id };
}

export async function loginUser(nickname: string): Promise<{ success: boolean; user?: { id: string; nickname: string; preferences: unknown }; error?: string }> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('nickname', nickname.toLowerCase())
    .single();
  
  if (error || !user) {
    return { success: false, error: 'Utente non trovato' };
  }
  
  return { success: true, user };
}

// =============================================
// User Preferences
// =============================================

export async function updateUserPreferences(userId: string, preferences: Record<string, unknown>) {
  const { error } = await supabase
    .from('users')
    .update({ preferences })
    .eq('id', userId);
  
  return !error;
}

// =============================================
// Links Functions
// =============================================

export async function getUserLinks(userId: string, sortOrder: 'newest' | 'oldest' | 'alpha' = 'newest') {
  let query = supabase
    .from('links')
    .select('*')
    .eq('user_id', userId);
  
  switch (sortOrder) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'alpha':
      query = query.order('title', { ascending: true });
      break;
  }
  
  const { data, error } = await query;
  return error ? [] : data;
}

export async function addLink(userId: string, link: {
  url: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  tags: string[];
}) {
  const { data, error } = await supabase
    .from('links')
    .insert({ ...link, user_id: userId })
    .select()
    .single();
  
  return { data, error };
}

export async function updateLink(linkId: string, updates: {
  title?: string;
  description?: string | null;
  tags?: string[];
}) {
  const { error } = await supabase
    .from('links')
    .update(updates)
    .eq('id', linkId);
  
  return !error;
}

export async function deleteLink(linkId: string) {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId);
  
  return !error;
}

// =============================================
// Stats Functions
// =============================================

export async function getUserStats(userId: string) {
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId);
  
  if (!links || links.length === 0) {
    return {
      totalLinks: 0,
      totalTags: 0,
      topTags: [],
      domainsCount: [],
    };
  }
  
  // Count tags
  const tagCounts: Record<string, number> = {};
  links.forEach(link => {
    (link.tags || []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Count domains
  const domainCounts: Record<string, number> = {};
  links.forEach(link => {
    try {
      const domain = new URL(link.url).hostname.replace('www.', '');
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    } catch {
      // Invalid URL, skip
    }
  });
  
  const domainsCount = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalLinks: links.length,
    totalTags: Object.keys(tagCounts).length,
    topTags,
    domainsCount,
  };
}
