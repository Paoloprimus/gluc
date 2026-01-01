"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, Download, Check, FolderOpen, Tag, Calendar, Filter } from "lucide-react";
import type { FliqkLink, Collection } from "@/types";

interface ExportModalProps {
  links: FliqkLink[];
  collections: Collection[];
  isOpen: boolean;
  onClose: () => void;
}

type FilterMode = "all" | "criteria";
type PeriodFilter = "all" | "7days" | "30days" | "90days";

export function ExportModal({ links, collections, isOpen, onClose }: ExportModalProps) {
  const t = useTranslations('export');
  const tCollections = useTranslations('collections');
  
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [exported, setExported] = useState(false);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach(link => link.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [links]);

  // Filter links based on selection
  const filteredLinks = useMemo(() => {
    let result = links;
    
    // Filter by period
    if (periodFilter !== "all") {
      const now = new Date();
      const daysMap = { "7days": 7, "30days": 30, "90days": 90 };
      const days = daysMap[periodFilter];
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      result = result.filter(link => new Date(link.created_at) >= cutoff);
    }
    
    // Filter by collections
    if (selectedCollections.length > 0) {
      result = result.filter(link => 
        link.collection_id && selectedCollections.includes(link.collection_id)
      );
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      result = result.filter(link => 
        link.tags.some(tag => selectedTags.includes(tag))
      );
    }
    
    return result;
  }, [links, periodFilter, selectedCollections, selectedTags]);

  const toggleCollection = (id: string) => {
    setSelectedCollections(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const generateHTML = (linksToExport: FliqkLink[]): string => {
    // Group by collection if filtering by collections
    const groupByCollection = selectedCollections.length > 0;
    
    let content = "";
    
    if (groupByCollection && selectedCollections.length > 0) {
      selectedCollections.forEach(colId => {
        const collection = collections.find(c => c.id === colId);
        if (!collection) return;
        
        const colLinks = linksToExport.filter(l => l.collection_id === colId);
        if (colLinks.length === 0) return;
        
        content += `
    <div class="section">
      <h2>${collection.emoji} ${collection.name}</h2>
      ${colLinks.map(link => generateLinkCard(link)).join("")}
    </div>`;
      });
    } else {
      content = linksToExport.map(link => generateLinkCard(link)).join("");
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>fliqk export</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
      color: #e0e0e0;
      min-height: 100vh;
      padding: 2rem;
    }
    h1 {
      text-align: center;
      margin-bottom: 2rem;
      color: #BEFF00;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .section { margin-bottom: 2rem; }
    .section h2 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .card {
      background: #2d2d2d;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      display: flex;
      gap: 1rem;
    }
    .card-thumb {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      background: rgba(190, 255, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      flex-shrink: 0;
    }
    .card-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    .card-content { flex: 1; min-width: 0; }
    .card h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
    .card p { color: #858585; font-size: 0.9rem; margin-bottom: 0.75rem; }
    .card a { color: #BEFF00; text-decoration: none; font-size: 0.85rem; word-break: break-all; }
    .card a:hover { text-decoration: underline; }
    .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
    .tag {
      background: rgba(190, 255, 0, 0.12);
      color: #BEFF00;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      color: #858585;
      font-size: 0.85rem;
    }
    .no-link { color: #10b981; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✨ fliqk</h1>
    ${content}
    <p class="footer">fliqk • ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>`;
  };

  const generateLinkCard = (link: FliqkLink): string => {
    const thumbnail = link.thumbnail_type === "emoji" 
      ? `<span>${link.custom_thumbnail || "📎"}</span>`
      : (link.custom_thumbnail || link.thumbnail)
        ? `<img src="${link.custom_thumbnail || link.thumbnail}" alt="">`
        : `<span>🔗</span>`;

    return `
    <div class="card">
      <div class="card-thumb">${thumbnail}</div>
      <div class="card-content">
        <h3>${link.title}</h3>
        ${link.description ? `<p>${link.description}</p>` : ""}
        ${link.url 
          ? `<a href="${link.url}" target="_blank">${link.url}</a>`
          : `<span class="no-link">${link.post_type === 'image' ? '🖼️' : '✏️'}</span>`
        }
        ${link.tags.length > 0
          ? `<div class="tags">${link.tags.map(t => `<span class="tag">#${t}</span>`).join("")}</div>`
          : ""
        }
      </div>
    </div>`;
  };

  const handleExport = () => {
    if (filteredLinks.length === 0) return;
    
    const content = generateHTML(filteredLinks);
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fliqk-export-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const resetFilters = () => {
    setSelectedCollections([]);
    setSelectedTags([]);
    setPeriodFilter("all");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-md md:w-full z-50 flex flex-col"
          >
            <div className="bg-[var(--background-secondary)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-2xl flex flex-col max-h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)] flex-shrink-0">
                <h2 className="font-bold text-lg">📥 {t('title')}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filter Mode */}
              <div className="p-4 border-b border-[var(--card-border)] flex-shrink-0">
                <p className="text-sm font-medium mb-3">{t('whatToDownload')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFilterMode("all");
                      resetFilters();
                    }}
                    className={`flex-1 p-2.5 rounded-lg text-sm font-medium transition-colors ${
                      filterMode === "all"
                        ? "bg-[var(--accent-primary)] text-black"
                        : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                    }`}
                  >
                    {t('all')}
                  </button>
                  <button
                    onClick={() => setFilterMode("criteria")}
                    className={`flex-1 p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterMode === "criteria"
                        ? "bg-[var(--accent-primary)] text-black"
                        : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                    }`}
                  >
                    <Filter size={14} />
                    {t('criteria')}
                  </button>
                </div>
              </div>

              {/* Selection area */}
              <div className="flex-1 overflow-auto p-4">
                {filterMode === "all" && (
                  <div className="text-center py-8 text-[var(--foreground-muted)]">
                    <p className="text-4xl mb-2">📦</p>
                    <p>{links.length} {tCollections('items')}</p>
                  </div>
                )}

                {filterMode === "criteria" && (
                  <div className="space-y-6">
                    {/* Period filter */}
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Calendar size={14} />
                        {t('period')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(['all', '7days', '30days', '90days'] as const).map(period => (
                          <button
                            key={period}
                            onClick={() => setPeriodFilter(period)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              periodFilter === period
                                ? "bg-[var(--accent-primary)] text-black"
                                : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                            }`}
                          >
                            {period === 'all' ? t('allTime') : 
                             period === '7days' ? t('last7days') :
                             period === '30days' ? t('last30days') : t('last90days')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Collections filter */}
                    {collections.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2 mb-3">
                          <FolderOpen size={14} />
                          {t('selectCollections')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {collections.map(col => (
                            <button
                              key={col.id}
                              onClick={() => toggleCollection(col.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                                selectedCollections.includes(col.id)
                                  ? "bg-[var(--accent-primary)] text-black"
                                  : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                              }`}
                            >
                              {col.emoji} {col.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags filter */}
                    {allTags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2 mb-3">
                          <Tag size={14} />
                          {t('selectTags')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {allTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                selectedTags.includes(tag)
                                  ? "bg-[var(--accent-primary)] text-black"
                                  : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview count */}
                    <div className="text-center py-4 text-[var(--foreground-muted)] border-t border-[var(--card-border)]">
                      <p className="text-2xl mb-1">{filteredLinks.length}</p>
                      <p className="text-sm">{tCollections('items')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--card-border)] flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  disabled={filteredLinks.length === 0}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold bg-[var(--accent-primary)] text-black disabled:opacity-50 transition-all"
                >
                  {exported ? (
                    <>
                      <Check size={20} />
                      <span>{t('downloaded')}</span>
                    </>
                  ) : filteredLinks.length === 0 ? (
                    <span>{t('noItems')}</span>
                  ) : (
                    <>
                      <Download size={20} />
                      <span>
                        {t('downloadItems', { count: filteredLinks.length })}
                      </span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
