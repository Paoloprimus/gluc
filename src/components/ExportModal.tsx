"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileJson, FileText, FileCode, Check } from "lucide-react";
import type { GlucLink } from "@/types";

interface ExportModalProps {
  links: GlucLink[];
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "json" | "csv" | "html";

export function ExportModal({ links, isOpen, onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");
  const [exported, setExported] = useState(false);

  const formatConfig = {
    json: {
      name: "JSON",
      icon: FileJson,
      description: "Formato strutturato, ideale per backup o import",
    },
    csv: {
      name: "CSV",
      icon: FileText,
      description: "Apribile con Excel, Google Sheets",
    },
    html: {
      name: "HTML",
      icon: FileCode,
      description: "Pagina web condivisibile",
    },
  };

  const generateExport = (format: ExportFormat): string => {
    switch (format) {
      case "json":
        return JSON.stringify(links, null, 2);

      case "csv": {
        const headers = ["URL", "Titolo", "Descrizione", "Tags", "Data"];
        const rows = links.map((link) => [
          link.url,
          `"${link.title.replace(/"/g, '""')}"`,
          `"${(link.description || "").replace(/"/g, '""')}"`,
          `"${link.tags.join(", ")}"`,
          link.createdAt,
        ]);
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }

      case "html":
        return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I miei link - Gluc Link</title>
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
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .card h2 { font-size: 1.1rem; margin-bottom: 0.5rem; }
    .card p { color: #a1a1aa; font-size: 0.9rem; margin-bottom: 0.75rem; }
    .card a { color: #a855f7; text-decoration: none; font-size: 0.85rem; }
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
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 I miei link</h1>
    ${links
      .map(
        (link) => `
    <div class="card">
      <h2>${link.title}</h2>
      ${link.description ? `<p>${link.description}</p>` : ""}
      <a href="${link.url}" target="_blank">${link.url}</a>
      ${
        link.tags.length > 0
          ? `<div class="tags">${link.tags.map((t) => `<span class="tag">#${t}</span>`).join("")}</div>`
          : ""
      }
    </div>`
      )
      .join("")}
    <p class="footer">Esportato da Gluc Link • ${new Date().toLocaleDateString("it-IT")}</p>
  </div>
</body>
</html>`;

      default:
        return "";
    }
  };

  const handleExport = () => {
    const content = generateExport(selectedFormat);
    const mimeTypes = {
      json: "application/json",
      csv: "text/csv",
      html: "text/html",
    };
    
    const blob = new Blob([content], { type: mimeTypes[selectedFormat] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gluc-links-${new Date().toISOString().split("T")[0]}.${selectedFormat}`;
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
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-md md:w-full z-50"
          >
            <div className="bg-[var(--background-secondary)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
                <h2 className="font-bold text-lg">Esporta {links.length} link</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {(Object.keys(formatConfig) as ExportFormat[]).map((format) => {
                  const cfg = formatConfig[format];
                  const Icon = cfg.icon;
                  const isSelected = selectedFormat === format;

                  return (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl
                        text-left transition-all duration-200
                        ${isSelected
                          ? "bg-gradient-to-r from-[var(--accent-purple)]/20 to-[var(--accent-pink)]/20 border border-[var(--accent-purple)]/50"
                          : "bg-[var(--card-bg)] border border-transparent hover:border-[var(--card-border)]"
                        }
                      `}
                    >
                      <div className={`
                        p-2 rounded-lg
                        ${isSelected 
                          ? "bg-[var(--accent-purple)] text-white" 
                          : "bg-[var(--card-border)] text-[var(--foreground-muted)]"
                        }
                      `}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="font-semibold">{cfg.name}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{cfg.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 border-t border-[var(--card-border)]">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  className="
                    w-full flex items-center justify-center gap-2 p-4 rounded-xl
                    font-semibold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)]
                    text-white hover:shadow-lg hover:shadow-[var(--accent-purple)]/20
                    transition-all duration-200
                  "
                >
                  {exported ? (
                    <>
                      <Check size={20} />
                      <span>Scaricato!</span>
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      <span>Scarica {formatConfig[selectedFormat].name}</span>
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

