import type { GlucLink } from "@/types";

const STORAGE_KEY = "gluc_links";
const API_KEY_STORAGE = "gluc_api_key";

export function getLocalLinks(): GlucLink[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveLocalLinks(links: GlucLink[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch (error) {
    console.error("Error saving links:", error);
  }
}

export function addLocalLink(link: GlucLink): GlucLink[] {
  const links = getLocalLinks();
  const newLinks = [link, ...links];
  saveLocalLinks(newLinks);
  return newLinks;
}

export function removeLocalLink(id: string): GlucLink[] {
  const links = getLocalLinks();
  const newLinks = links.filter((l) => l.id !== id);
  saveLocalLinks(newLinks);
  return newLinks;
}

export function updateLocalLink(updatedLink: GlucLink): GlucLink[] {
  const links = getLocalLinks();
  const newLinks = links.map((l) => l.id === updatedLink.id ? updatedLink : l);
  saveLocalLinks(newLinks);
  return newLinks;
}

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE);
}

export function saveApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function removeApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_KEY_STORAGE);
}

