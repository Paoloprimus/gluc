"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { LoginPage } from "@/components/LoginPage";
import { TopBar, ActivePage } from "@/components/TopBar";
import { LinkCard } from "@/components/LinkCard";
import { LinkEditor } from "@/components/LinkEditor";
import { ShareSheet } from "@/components/ShareSheet";
import { ExportModal } from "@/components/ExportModal";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { StatsPage } from "@/components/StatsPage";
import { SettingsPage } from "@/components/SettingsPage";
import { CollectionsPage } from "@/components/CollectionsPage";
import { getSession, setSession, clearSession, applyTheme, initializeTheme } from "@/lib/session";
import { getUserLinks, addLink, updateLink, deleteLink, updateUserPreferences, incrementClickCount } from "@/lib/supabase";
import type { NunqLink, NewLink, Session, UserPreferences } from "@/types";
import { Plus } from "lucide-react";

type ViewMode = 'list' | 'editor';

export default function Home() {
  // Auth state
  const [session, setSessionState] = useState<Session | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // App state
  const [activePage, setActivePage] = useState<ActivePage>("social");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [links, setLinks] = useState<NunqLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState<NunqLink | null>(null);
  const [editingLink, setEditingLink] = useState<NunqLink | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent'>('all');

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
      setViewMode("editor");
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
    // Always load ALL links, filter client-side
    const data = await getUserLinks(session.userId, session.preferences.sort_order);
    setLinks(data);
  };

  // Reload when sort order changes
  useEffect(() => {
    if (session) {
      loadLinks();
    }
  }, [session?.preferences.sort_order]);

  // Handle login
  const handleLogin = async (userId: string, nickname: string) => {
    const theme = initializeTheme();
    const newSession: Session = {
      userId,
      nickname,
      preferences: {
        theme,
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

    if (updates.theme) {
      applyTheme(updates.theme);
    }

    await updateUserPreferences(session.userId, newPreferences);
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach((link) => link.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [links]);

  // Filter links (including status filter)
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'sent' && link.status !== 'sent') return false;
        if (statusFilter === 'draft' && link.status !== 'draft') return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          link.title.toLowerCase().includes(query) ||
          link.description?.toLowerCase().includes(query) ||
          link.url?.toLowerCase().includes(query) ||
          link.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
      // Tags filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some((tag) => link.tags.includes(tag));
        if (!hasSelectedTag) return false;
      }
      return true;
    });
  }, [links, searchQuery, selectedTags, statusFilter]);

  // Save new link
  const handleSaveLink = async (linkData: NewLink): Promise<NunqLink | null> => {
    if (!session) return null;
    setIsLoading(true);
    
    const { data: newLink } = await addLink(session.userId, linkData);
    if (newLink) {
      setLinks((prev) => [newLink, ...prev]);
    }
    
    setIsLoading(false);
    return newLink;
  };

  // Update existing link
  const handleUpdateLink = async (updatedLink: NunqLink) => {
    setIsLoading(true);
    
    await updateLink(updatedLink.id, updatedLink);
    setLinks((prev) => prev.map((l) => (l.id === updatedLink.id ? updatedLink : l)));
    
    setIsLoading(false);
    setViewMode("list");
    setEditingLink(null);
  };

  // Delete link
  const handleDeleteLink = async (id: string) => {
    const success = await deleteLink(id);
    if (success) {
      setLinks((prev) => prev.filter((link) => link.id !== id));
      setViewMode("list");
      setEditingLink(null);
    }
  };

  // Track click
  const handleClickTrack = async (id: string) => {
    await incrementClickCount(id);
    setLinks((prev) => prev.map((l) => 
      l.id === id ? { ...l, click_count: l.click_count + 1 } : l
    ));
  };

  // Toggle tag filter
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Start editing
  const handleStartEdit = (link: NunqLink) => {
    setEditingLink(link);
    setViewMode("editor");
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
    <main className="min-h-screen pb-24">
      <TopBar
        nickname={session.nickname}
        activePage={activePage}
        onPageChange={(page) => {
          setActivePage(page);
          setViewMode("list");
          setEditingLink(null);
        }}
        onExport={() => setShowExport(true)}
        onLogout={handleLogout}
      />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {activePage === "social" && (
          <>
            {viewMode === "editor" ? (
              <LinkEditor
                link={editingLink || undefined}
                initialUrl={initialUrl || undefined}
                userId={session.userId}
                onSave={handleSaveLink}
                onUpdate={handleUpdateLink}
                onDelete={handleDeleteLink}
                onCancel={() => {
                  setViewMode("list");
                  setEditingLink(null);
                  setInitialUrl(null);
                }}
                isLoading={isLoading}
              />
            ) : (
              <div className="space-y-6">
                {/* Filter bar */}
                {links.length > 0 && (
                  <>
                    <FilterBar
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      selectedTags={selectedTags}
                      onTagToggle={handleTagToggle}
                      allTags={allTags}
                    />
                    
                    {/* Status filter */}
                    <div className="flex gap-2">
                      {(['all', 'sent', 'draft'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            statusFilter === status
                              ? "bg-[var(--accent-purple)] text-white"
                              : "bg-[var(--card-bg)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          {status === 'all' ? 'Tutti' : status === 'sent' ? '📤 Inviati' : '📝 Bozze'}
                        </button>
                      ))}
                    </div>
                  </>
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
                          onEdit={handleStartEdit}
                          onClickTrack={handleClickTrack}
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
          </>
        )}

        {activePage === "collections" && (
          <CollectionsPage 
            userId={session.userId} 
            onSelectItem={(link) => {
              setEditingLink(link);
              setActivePage("social");
              setViewMode("editor");
            }}
          />
        )}

        {activePage === "stats" && <StatsPage userId={session.userId} />}

        {activePage === "settings" && (
          <SettingsPage
            preferences={session.preferences}
            onUpdatePreferences={handleUpdatePreferences}
          />
        )}
        </div>

      {/* FAB to add new link */}
      {activePage === "social" && viewMode === "list" && (
        <button
          onClick={() => {
            setEditingLink(null);
            setInitialUrl(null);
            setViewMode("editor");
          }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Share Sheet */}
      <ShareSheet
        link={shareLink}
        isOpen={!!shareLink}
        onClose={() => setShareLink(null)}
        onClickTracked={() => shareLink && handleClickTrack(shareLink.id)}
      />

      {/* Export Modal */}
      <ExportModal
        links={links}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />
      </main>
  );
}
