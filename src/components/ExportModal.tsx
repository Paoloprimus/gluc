"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Check, FolderOpen, Tag } from "lucide-react";
import type { FliqkLink, Collection } from "@/types";

interface ExportModalProps {
  links: FliqkLink[];
  collections: Collection[];
  isOpen: boolean;
  onClose: () => void;
}

type FilterMode = "all" | "collections" | "tags";

export function ExportModal({ links, collections, isOpen, onClose }: ExportModalProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [exported, setExported] = useState(false);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach(link => link.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [links]);

  // Filter links based on selection
  const filteredLinks = useMemo(() => {
    if (filterMode === "all") return links;
    
    if (filterMode === "collections") {
      if (selectedCollections.length === 0) return [];
      return links.filter(link => 
        link.collection_id && selectedCollections.includes(link.collection_id)
      );
    }
    
    if (filterMode === "tags") {
      if (selectedTags.length === 0) return [];
      return links.filter(link => 
        link.tags.some(tag => selectedTags.includes(tag))
      );
    }
    
    return links;
  }, [links, filterMode, selectedCollections, selectedTags]);

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
    const groupByCollection = filterMode === "collections";
    
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
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I miei contenuti - fliqk</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #fafafa;
      min-height: 100vh;
      padding: 2rem;
    }
    h1 {
      text-align: center;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
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
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
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
      background: rgba(168, 85, 247, 0.2);
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
    .card p { color: #a1a1aa; font-size: 0.9rem; margin-bottom: 0.75rem; }
    .card a { color: #a855f7; text-decoration: none; font-size: 0.85rem; word-break: break-all; }
    .card a:hover { text-decoration: underline; }
    .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
    .tag {
      background: rgba(168, 85, 247, 0.2);
      color: #a855f7;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      color: #a1a1aa;
      font-size: 0.85rem;
    }
    .no-link { color: #10b981; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✨ I miei contenuti</h1>
    ${content}
    <p class="footer">Esportato da fliqk • ${new Date().toLocaleDateString("it-IT")}</p>
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
          : `<span class="no-link">${link.post_type === 'image' ? '🖼️ Immagine' : '✏️ Testo'}</span>`
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
                <h2 className="font-bold text-lg">📥 Scarica</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filter Mode */}
              <div className="p-4 border-b border-[var(--card-border)] flex-shrink-0">
                <p className="text-sm font-medium mb-3">Cosa vuoi scaricare?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`flex-1 p-2.5 rounded-lg text-sm font-medium transition-colors ${
                      filterMode === "all"
                        ? "bg-[var(--accent-purple)] text-white"
                        : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                    }`}
                  >
                    Tutti
                  </button>
                  {collections.length > 0 && (
                    <button
                      onClick={() => setFilterMode("collections")}
                      className={`flex-1 p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                        filterMode === "collections"
                          ? "bg-[var(--accent-purple)] text-white"
                          : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                      }`}
                    >
                      <FolderOpen size={14} />
                      Raccolte
                    </button>
                  )}
                  {allTags.length > 0 && (
                    <button
                      onClick={() => setFilterMode("tags")}
                      className={`flex-1 p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                        filterMode === "tags"
                          ? "bg-[var(--accent-purple)] text-white"
                          : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                      }`}
                    >
                      <Tag size={14} />
                      Tag
                    </button>
                  )}
                </div>
              </div>

              {/* Selection area */}
              <div className="flex-1 overflow-auto p-4">
                {filterMode === "all" && (
                  <div className="text-center py-8 text-[var(--foreground-muted)]">
                    <p className="text-4xl mb-2">📦</p>
                    <p>Scaricherai tutti i {links.length} contenuti</p>
                  </div>
                )}

                {filterMode === "collections" && (
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--foreground-muted)] mb-3">
                      Seleziona le raccolte da scaricare:
                    </p>
                    {collections.map(col => (
                      <button
                        key={col.id}
                        onClick={() => toggleCollection(col.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          selectedCollections.includes(col.id)
                            ? "bg-[var(--accent-purple)]/20 border border-[var(--accent-purple)]"
                            : "bg-[var(--card-bg)] border border-transparent"
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${col.color}20` }}
                        >
                          {col.emoji}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{col.name}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            {col.item_count || 0} elementi
                          </p>
                        </div>
                        {selectedCollections.includes(col.id) && (
                          <Check size={18} className="text-[var(--accent-purple)]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {filterMode === "tags" && (
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)] mb-3">
                      Seleziona i tag da scaricare:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            selectedTags.includes(tag)
                              ? "bg-[var(--accent-purple)] text-white"
                              : "bg-[var(--card-bg)] text-[var(--foreground-muted)]"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
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
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white disabled:opacity-50 transition-all"
                >
                  {exported ? (
                    <>
                      <Check size={20} />
                      <span>Scaricato!</span>
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      <span>
                        Scarica {filteredLinks.length} {filteredLinks.length === 1 ? 'elemento' : 'elementi'}
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
