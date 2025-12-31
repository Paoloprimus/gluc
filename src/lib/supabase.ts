import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { FliqkLink, NewLink, UserPreferences, Collection, NewCollection } from '@/types';

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set');
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

const supabase = { get client() { return getSupabase(); } };

// =============================================
// Auth / User Functions
// =============================================

export async function validateInviteToken(token: string): Promise<boolean> {
  const { data, error } = await supabase.client
    .from('invite_tokens')
    .select('*')
    .eq('token', token.toUpperCase())
    .eq('used', false)
    .single();
  
  return !error && !!data;
}

export async function registerUser(nickname: string, token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  const { data: existingUser } = await supabase.client
    .from('users')
    .select('id')
    .eq('nickname', nickname.toLowerCase())
    .single();
  
  if (existingUser) {
    return { success: false, error: 'Nickname già in uso' };
  }
  
  const { data: tokenData, error: tokenError } = await supabase.client
    .from('invite_tokens')
    .select('*')
    .eq('token', token.toUpperCase())
    .eq('used', false)
    .single();
  
  if (tokenError || !tokenData) {
    return { success: false, error: 'Token non valido o già utilizzato' };
  }
  
  const { data: newUser, error: userError } = await supabase.client
    .from('users')
    .insert({ nickname: nickname.toLowerCase() })
    .select()
    .single();
  
  if (userError || !newUser) {
    return { success: false, error: 'Errore durante la registrazione' };
  }
  
  await supabase.client
    .from('invite_tokens')
    .update({ used: true, used_by: newUser.id, used_at: new Date().toISOString() })
    .eq('id', tokenData.id);
  
  return { success: true, userId: newUser.id };
}

export async function loginUser(nickname: string): Promise<{ success: boolean; user?: { id: string; nickname: string; preferences: UserPreferences }; error?: string }> {
  const { data: user, error } = await supabase.client
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

export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
  const { error } = await supabase.client
    .from('users')
    .update({ preferences })
    .eq('id', userId);
  
  return !error;
}

// =============================================
// Links Functions
// =============================================

export async function getUserLinks(
  userId: string, 
  sortOrder: 'newest' | 'oldest' | 'alpha' = 'newest',
  statusFilter?: 'draft' | 'sent' | 'all'
): Promise<FliqkLink[]> {
  let query = supabase.client
    .from('links')
    .select('*')
    .eq('user_id', userId);
  
  // Filter by status
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }
  
  // Sort order
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
  return error ? [] : (data as FliqkLink[]);
}

export async function addLink(userId: string, link: NewLink): Promise<{ data: FliqkLink | null; error: Error | null }> {
  const { data, error } = await supabase.client
    .from('links')
    .insert({ 
      ...link, 
      user_id: userId,
      click_count: 0,
    })
    .select()
    .single();
  
  return { data: data as FliqkLink | null, error: error as Error | null };
}

export async function updateLink(linkId: string, updates: Partial<FliqkLink>): Promise<boolean> {
  const { error } = await supabase.client
    .from('links')
    .update(updates)
    .eq('id', linkId);
  
  return !error;
}

export async function deleteLink(linkId: string): Promise<boolean> {
  const { error } = await supabase.client
    .from('links')
    .delete()
    .eq('id', linkId);
  
  return !error;
}

// =============================================
// Click Tracking
// =============================================

export async function incrementClickCount(linkId: string): Promise<boolean> {
  const { error } = await supabase.client
    .rpc('increment_click_count', { link_id: linkId });
  
  // Fallback if RPC doesn't exist
  if (error) {
    const { data: link } = await supabase.client
      .from('links')
      .select('click_count')
      .eq('id', linkId)
      .single();
    
    if (link) {
      await supabase.client
        .from('links')
        .update({ click_count: (link.click_count || 0) + 1 })
        .eq('id', linkId);
    }
  }
  
  return true;
}

// =============================================
// Image Upload Functions
// =============================================

export async function uploadThumbnail(file: File, userId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.client
    .storage
    .from('thumbnails')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  
  // Get public URL
  const { data: urlData } = supabase.client
    .storage
    .from('thumbnails')
    .getPublicUrl(data.path);
  
  return urlData.publicUrl;
}

export async function deleteThumbnail(url: string): Promise<boolean> {
  // Extract path from URL
  const match = url.match(/thumbnails\/(.+)$/);
  if (!match) return false;
  
  const { error } = await supabase.client
    .storage
    .from('thumbnails')
    .remove([match[1]]);
  
  return !error;
}

// =============================================
// Collections Functions
// =============================================

export async function getUserCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase.client
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error || !data) return [];
  
  // Get item counts for each collection
  const collectionsWithCounts = await Promise.all(
    data.map(async (collection) => {
      const { count } = await supabase.client
        .from('links')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collection.id);
      
      return { ...collection, item_count: count || 0 };
    })
  );
  
  return collectionsWithCounts as Collection[];
}

export async function createCollection(userId: string, collection: NewCollection): Promise<Collection | null> {
  const { data, error } = await supabase.client
    .from('collections')
    .insert({ ...collection, user_id: userId })
    .select()
    .single();
  
  return error ? null : (data as Collection);
}

export async function updateCollection(collectionId: string, updates: Partial<Collection>): Promise<boolean> {
  const { error } = await supabase.client
    .from('collections')
    .update(updates)
    .eq('id', collectionId);
  
  return !error;
}

export async function deleteCollection(collectionId: string): Promise<boolean> {
  // First, remove collection_id from all links in this collection
  await supabase.client
    .from('links')
    .update({ collection_id: null })
    .eq('collection_id', collectionId);
  
  // Then delete the collection
  const { error } = await supabase.client
    .from('collections')
    .delete()
    .eq('id', collectionId);
  
  return !error;
}

export async function getCollectionItems(
  collectionId: string,
  sortOrder: 'newest' | 'oldest' | 'alpha' | 'random' = 'newest'
): Promise<FliqkLink[]> {
  let query = supabase.client
    .from('links')
    .select('*')
    .eq('collection_id', collectionId);
  
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
    case 'random':
      // Random will be handled client-side
      query = query.order('created_at', { ascending: false });
      break;
  }
  
  const { data, error } = await query;
  
  if (error || !data) return [];
  
  // If random, shuffle the results
  if (sortOrder === 'random') {
    return (data as FliqkLink[]).sort(() => Math.random() - 0.5);
  }
  
  return data as FliqkLink[];
}

export async function addToCollection(linkId: string, collectionId: string | null): Promise<boolean> {
  const { error } = await supabase.client
    .from('links')
    .update({ collection_id: collectionId })
    .eq('id', linkId);
  
  return !error;
}

// =============================================
// Stats Functions
// =============================================

export async function getUserStats(userId: string) {
  const { data: links } = await supabase.client
    .from('links')
    .select('*')
    .eq('user_id', userId);
  
  if (!links || links.length === 0) {
    return {
      totalLinks: 0,
      totalClicks: 0,
      publishedLinks: 0,
      draftLinks: 0,
      topTags: [],
      domainsCount: [],
    };
  }
  
  const totalClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);
  const publishedLinks = links.filter(l => l.status === 'published').length;
  const draftLinks = links.filter(l => l.status === 'draft').length;
  
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
    totalClicks,
    publishedLinks,
    draftLinks,
    topTags,
    domainsCount,
  };
}
