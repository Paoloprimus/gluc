import type { Session, UserPreferences, Locale } from "@/types";

const SESSION_KEY = "fliqk_session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function updateSessionPreferences(preferences: Partial<UserPreferences>): void {
  const session = getSession();
  if (!session) return;
  
  session.preferences = { ...session.preferences, ...preferences };
  setSession(session);
}

// Apply theme to document
export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof window === "undefined") return;
  
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  
  // Also set color-scheme for native elements
  document.documentElement.style.colorScheme = theme;
}

// Initialize theme from session or system preference
export function initializeTheme(): 'light' | 'dark' {
  const session = getSession();
  
  if (session?.preferences?.theme) {
    applyTheme(session.preferences.theme);
    return session.preferences.theme;
  }
  
  // Fallback to system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = prefersDark ? 'dark' : 'light';
  applyTheme(theme);
  return theme;
}

// Apply locale by setting cookie (for next-intl)
export function applyLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  
  // Set cookie for next-intl middleware
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
  
  // Reload to apply new locale
  window.location.reload();
}

// Get current locale from cookie
export function getCurrentLocale(): Locale {
  if (typeof window === "undefined") return 'it';
  
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  const locale = match?.[1];
  
  if (locale === 'de' || locale === 'it') {
    return locale;
  }
  
  return 'it';
}

