"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  allTags: string[];
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagToggle,
  allTags,
}: FilterBarProps) {
  const t = useTranslations('list');
  const [showFilters, setShowFilters] = useState(false);

  if (allTags.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
          <Search size={18} className="text-[var(--foreground-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--foreground-muted)]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="p-1 rounded hover:bg-[var(--card-border)] transition-colors"
            >
              <X size={16} className="text-[var(--foreground-muted)]" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`
              p-3 rounded-xl border transition-all duration-200
              ${showFilters || selectedTags.length > 0
                ? "bg-[var(--accent-purple)]/20 border-[var(--accent-purple)]/50 text-[var(--accent-purple)]"
                : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--foreground-muted)]"
              }
            `}
          >
            <SlidersHorizontal size={18} />
          </motion.button>
        )}
      </div>

      {/* Tags filter */}
      <AnimatePresence>
        {showFilters && allTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onTagToggle(tag)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium
                      transition-all duration-200
                      ${isSelected
                        ? "bg-[var(--accent-purple)] text-black"
                        : "bg-[var(--card-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                      }
                    `}
                  >
                    #{tag}
                  </button>
                );
              })}
              
              {selectedTags.length > 0 && (
                <button
                  onClick={() => selectedTags.forEach(onTagToggle)}
                  className="px-3 py-1.5 rounded-full text-sm text-[var(--foreground-muted)] hover:text-red-500 transition-colors"
                >
                  {t('clearFilters')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filters indicator */}
      {(selectedTags.length > 0 || searchQuery) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-[var(--foreground-muted)]"
        >
          {selectedTags.length > 0 && t('tagsSelected', { count: selectedTags.length })}
          {selectedTags.length > 0 && searchQuery && " • "}
          {searchQuery && t('searchFor', { query: searchQuery })}
        </motion.p>
      )}
    </div>
  );
}

