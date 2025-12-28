"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { LoginPage } from "@/components/LoginPage";
import { TopBar, ActivePage } from "@/components/TopBar";
import { LinkInput } from "@/components/LinkInput";
import { LinkCard } from "@/components/LinkCard";
import { ShareModal } from "@/components/ShareModal";
import { ExportModal } from "@/components/ExportModal";
import { SuggestionsModal } from "@/components/SuggestionsModal";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { StatsPage } from "@/components/StatsPage";
import { SettingsPage } from "@/components/SettingsPage";
import { getSession, setSession, clearSession, applyTheme, initializeTheme } from "@/lib/session";
import { getUserLinks, addLink, updateLink, deleteLink, updateUserPreferences } from "@/lib/supabase";
import type { NunqLink, Session, UserPreferences } from "@/types";

export default function Home() {
  // Auth state
  const [session, setSessionState] = useState<Session | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // App state
  const [activePage, setActivePage] = useState<ActivePage>("links");
  const [links, setLinks] = useState<NunqLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState<NunqLink | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Suggestions modal state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [originalInput, setOriginalInput] = useState("");
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // URL from bookmarklet/share
  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  // Check auth and load data on mount
  useEffect(() => {
    const existingSession = getSession();
    if (existingSession) {
      setSessionState(existingSession);
      initializeTheme();
    }
    setIsCheckingAuth(false);

    // Check for URL in query params
    const params = new URLSearchParams(window.location.search);
    let urlParam = params.get("url");
    if (!urlParam) {
      const textParam = params.get("text");
      if (textParam) {
        const urlMatch = textParam.match(/https?:\/\/[^\s]+/);
        if (urlMatch) urlParam = urlMatch[0];
      }
    }
    if (urlParam) {
      setInitialUrl(decodeURIComponent(urlParam));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Load links when session is set
  useEffect(() => {
    if (session) {
      loadLinks();
    }
  }, [session]);

  const loadLinks = async () => {
    if (!session) return;
    const data = await getUserLinks(session.userId, session.preferences.sort_order);
    setLinks(data);
  };

  // Handle login
  const handleLogin = async (userId: string, nickname: string) => {
    const theme = initializeTheme();
    const newSession: Session = {
      userId,
      nickname,
      preferences: {
        theme,
        ai_suggestions: true,
        sort_order: "newest",
      },
    };
    setSession(newSession);
    setSessionState(newSession);
  };

  // Handle logout
  const handleLogout = () => {
    clearSession();
    setSessionState(null);
    setLinks([]);
  };

  // Handle preferences update
  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!session) return;

    const newPreferences = { ...session.preferences, ...updates };
    const newSession = { ...session, preferences: newPreferences };
    
    setSession(newSession);
    setSessionState(newSession);

    // Apply theme immediately
    if (updates.theme) {
      applyTheme(updates.theme);
    }

    // Sync to database
    await updateUserPreferences(session.userId, newPreferences);

    // Reload links if sort order changed
    if (updates.sort_order) {
      const data = await getUserLinks(session.userId, updates.sort_order);
      setLinks(data);
    }
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach((link) => link.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [links]);

  // Filter links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          link.title.toLowerCase().includes(query) ||
          link.description?.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          link.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some((tag) => link.tags.includes(tag));
        if (!hasSelectedTag) return false;
      }
      return true;
    });
  }, [links, searchQuery, selectedTags]);

  // Extract domain from URL
  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url.replace(/^https?:\/\//, "").replace("www.", "").split("/")[0];
    }
  };

  // Fetch domain suggestions
  const fetchSuggestions = useCallback(async (input: string) => {
    setIsFetchingSuggestions(true);
    try {
      const response = await fetch("/api/suggest-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.suggestions?.length > 0) {
          setSuggestions(data.suggestions);
          setOriginalInput(input);
          setShowSuggestions(true);
        } else {
          setError(`Dominio "${input}" non trovato`);
        }
      }
    } catch {
      setError("Errore durante la ricerca");
    } finally {
      setIsFetchingSuggestions(false);
      setIsLoading(false);
    }
  }, []);

  // Submit link
  const handleSubmitLink = async (url: string) => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "DOMAIN_NOT_FOUND") {
          const domain = extractDomain(url);
          await fetchSuggestions(domain);
          return;
        }
        throw new Error(data.error || "Errore durante l'analisi");
      }

      const { data: newLink, error: dbError } = await addLink(session.userId, {
        url,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        tags: data.tags,
      });

      if (dbError) throw new Error("Errore durante il salvataggio");

      setLinks((prev) => [newLink, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (domain: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    handleSubmitLink(`https://${domain}`);
  };

  // Delete link
  const handleDeleteLink = async (id: string) => {
    const success = await deleteLink(id);
    if (success) {
      setLinks((prev) => prev.filter((link) => link.id !== id));
    }
  };

  // Update link
  const handleUpdateLink = async (link: NunqLink) => {
    const success = await updateLink(link.id, {
      title: link.title,
      description: link.description,
      tags: link.tags,
    });
    if (success) {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
    }
  };

  // Toggle tag filter
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] animate-pulse" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <main className="min-h-screen pb-8">
      <TopBar
        nickname={session.nickname}
        activePage={activePage}
        onPageChange={setActivePage}
        onExport={() => setShowExport(true)}
        onLogout={handleLogout}
      />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {activePage === "links" && (
          <div className="space-y-6">
            {/* Link Input */}
            <LinkInput
              onSubmit={handleSubmitLink}
              isLoading={isLoading || isFetchingSuggestions}
              initialUrl={initialUrl || undefined}
              onClearInitialUrl={() => setInitialUrl(null)}
            />

            {/* Loading suggestions indicator */}
            <AnimatePresence>
              {isFetchingSuggestions && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Cerco domini simili...
                </div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </AnimatePresence>

            {/* Filter bar */}
            {links.length > 0 && (
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                allTags={allTags}
              />
            )}

            {/* Links list */}
            {links.length === 0 ? (
              <EmptyState />
            ) : filteredLinks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--foreground-muted)]">Nessun link trovato</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredLinks.map((link, index) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onDelete={handleDeleteLink}
                      onShare={setShareLink}
                      onUpdate={handleUpdateLink}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Stats */}
            {links.length > 0 && (
              <div className="text-center text-sm text-[var(--foreground-muted)] pt-4">
                {filteredLinks.length === links.length
                  ? `${links.length} link salvati`
                  : `${filteredLinks.length} di ${links.length} link`}
              </div>
            )}
          </div>
        )}

        {activePage === "stats" && <StatsPage userId={session.userId} />}

        {activePage === "settings" && (
          <SettingsPage
            preferences={session.preferences}
            onUpdatePreferences={handleUpdatePreferences}
          />
        )}
      </div>

      {/* Modals */}
      <ShareModal
        link={shareLink}
        isOpen={!!shareLink}
        onClose={() => setShareLink(null)}
      />

      <ExportModal
        links={links}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />

      <SuggestionsModal
        isOpen={showSuggestions}
        originalInput={originalInput}
        suggestions={suggestions}
        onSelect={handleSelectSuggestion}
        onClose={() => {
          setShowSuggestions(false);
          setSuggestions([]);
        }}
        onRetry={() => {
          setShowSuggestions(false);
          setSuggestions([]);
        }}
      />
    </main>
  );
}
