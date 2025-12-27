"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Download, Sparkles } from "lucide-react";
import { LinkInput } from "@/components/LinkInput";
import { LinkCard } from "@/components/LinkCard";
import { ShareModal } from "@/components/ShareModal";
import { ExportModal } from "@/components/ExportModal";
import { SettingsModal } from "@/components/SettingsModal";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { getLocalLinks, addLocalLink, removeLocalLink, updateLocalLink, getApiKey } from "@/lib/storage";
import type { GlucLink } from "@/types";

export default function Home() {
  const [links, setLinks] = useState<GlucLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<GlucLink | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    setLinks(getLocalLinks());
    setApiKey(getApiKey());
  }, []);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach((link) => link.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [links]);

  // Filter links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          link.title.toLowerCase().includes(query) ||
          link.description?.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          link.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some((tag) => link.tags.includes(tag));
        if (!hasSelectedTag) return false;
      }

      return true;
    });
  }, [links, searchQuery, selectedTags]);

  const handleSubmitLink = async (url: string) => {
    if (!apiKey) {
      setShowSettings(true);
      setError("Configura prima la tua API key nelle impostazioni");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, apiKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Errore durante l'analisi");
      }

      const analysis = await response.json();

      const newLink: GlucLink = {
        id: crypto.randomUUID(),
        url,
        title: analysis.title,
        description: analysis.description,
        thumbnail: analysis.thumbnail,
        tags: analysis.tags,
        createdAt: new Date().toISOString(),
      };

      const updatedLinks = addLocalLink(newLink);
      setLinks(updatedLinks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLink = (id: string) => {
    const updatedLinks = removeLocalLink(id);
    setLinks(updatedLinks);
  };

  const handleUpdateLink = (updatedLink: GlucLink) => {
    const updatedLinks = updateLocalLink(updatedLink);
    setLinks(updatedLinks);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <main className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--card-border)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles size={20} className="text-white" />
              </motion.div>
              <div>
                <h1 className="font-bold text-lg leading-none">Gluc Link</h1>
                <p className="text-xs text-[var(--foreground-muted)]">links that stick</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {links.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExport(true)}
                  className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-purple)]/50 transition-colors"
                  title="Esporta"
                >
                  <Download size={18} className="text-[var(--foreground-muted)]" />
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(true)}
                className={`
                  p-2.5 rounded-xl border transition-colors
                  ${apiKey 
                    ? "bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[var(--accent-purple)]/50" 
                    : "bg-[var(--accent-purple)]/20 border-[var(--accent-purple)]/50"
                  }
                `}
                title="Impostazioni"
              >
                <Settings size={18} className={apiKey ? "text-[var(--foreground-muted)]" : "text-[var(--accent-purple)]"} />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Input */}
        <LinkInput onSubmit={handleSubmitLink} isLoading={isLoading} />

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* API Key reminder */}
        {!apiKey && links.length === 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowSettings(true)}
            className="w-full p-4 rounded-xl bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 text-left hover:bg-[var(--accent-purple)]/20 transition-colors"
          >
            <p className="font-semibold text-[var(--accent-purple)]">👋 Benvenuto su Gluc!</p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Per iniziare, configura la tua API key di Claude nelle impostazioni.
            </p>
          </motion.button>
        )}

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
            <p className="text-[var(--foreground-muted)]">Nessun link trovato con questi filtri</p>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-[var(--foreground-muted)] pt-4"
          >
            {filteredLinks.length === links.length
              ? `${links.length} link salvati`
              : `${filteredLinks.length} di ${links.length} link`}
          </motion.div>
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
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setError(null);
        }}
        onApiKeyChange={setApiKey}
      />
    </main>
  );
}
