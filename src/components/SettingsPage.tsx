"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { 
  Palette, 
  Bookmark, 
  ChevronDown, 
  Sun, 
  Moon,
  Check,
  Copy,
  Smartphone,
  SortAsc,
  Globe,
  Shield
} from "lucide-react";
import type { UserPreferences, Locale } from "@/types";
import { applyLocale, getCurrentLocale } from "@/lib/session";

interface SettingsPageProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  isAdmin?: boolean;
}

export function SettingsPage({ preferences, onUpdatePreferences, isAdmin }: SettingsPageProps) {
  const t = useTranslations('settings');
  const [openSection, setOpenSection] = useState<string | null>("appearance");
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [currentLocale] = useState<Locale>(getCurrentLocale());

  const bookmarkletCode = `javascript:(function(){window.open('${typeof window !== 'undefined' ? window.location.origin : 'https://fliqk.to'}/?url='+encodeURIComponent(window.location.href),'_blank')})()`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const handleLocaleChange = (locale: Locale) => {
    onUpdatePreferences({ locale });
    applyLocale(locale);
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t('title')}</h2>

      {/* Appearance Section */}
      <AccordionSection
        id="appearance"
        title={t('appearance')}
        icon={<Palette size={20} />}
        isOpen={openSection === "appearance"}
        onToggle={() => toggleSection("appearance")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            {t('chooseTheme')}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <ThemeButton
              icon={<Sun size={20} />}
              label={t('light')}
              isActive={preferences.theme === "light"}
              onClick={() => onUpdatePreferences({ theme: "light" })}
            />
            <ThemeButton
              icon={<Moon size={20} />}
              label={t('dark')}
              isActive={preferences.theme === "dark"}
              onClick={() => onUpdatePreferences({ theme: "dark" })}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Language Section */}
      <AccordionSection
        id="language"
        title={t('language')}
        icon={<Globe size={20} />}
        isOpen={openSection === "language"}
        onToggle={() => toggleSection("language")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            {t('chooseLanguage')}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <LanguageButton
              flag="🇮🇹"
              label={t('italian')}
              isActive={currentLocale === "it"}
              onClick={() => handleLocaleChange("it")}
            />
            <LanguageButton
              flag="🇩🇪"
              label={t('german')}
              isActive={currentLocale === "de"}
              onClick={() => handleLocaleChange("de")}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Sort Order Section */}
      <AccordionSection
        id="sort"
        title={t('sorting')}
        icon={<SortAsc size={20} />}
        isOpen={openSection === "sort"}
        onToggle={() => toggleSection("sort")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            {t('defaultOrder')}
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'newest', label: `📅 ${t('newest')}` },
              { value: 'oldest', label: `📅 ${t('oldest')}` },
              { value: 'alpha', label: `🔤 ${t('alphabetical')}` },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdatePreferences({ sort_order: option.value as UserPreferences['sort_order'] })}
                className={`
                  p-3 rounded-xl text-sm font-medium transition-colors text-left
                  ${preferences.sort_order === option.value
                    ? "bg-[var(--accent-purple)] text-black"
                    : "bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-purple)]"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* Browser Integration Section */}
      <AccordionSection
        id="browser"
        title={t('browserIntegration')}
        icon={<Bookmark size={20} />}
        isOpen={openSection === "browser"}
        onToggle={() => toggleSection("browser")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            {t('saveLinksQuickly')}
          </p>

          {/* Bookmarklet */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase">
              Desktop: {t('bookmarklet')}
            </p>
            <div
              draggable="true"
              onDragStart={(e) => {
                e.dataTransfer.setData("text/uri-list", bookmarkletCode);
                e.dataTransfer.setData("text/plain", bookmarkletCode);
              }}
              className="
                inline-flex items-center justify-center gap-2 px-6 py-3 
                bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] 
                text-white font-bold rounded-xl cursor-grab active:cursor-grabbing
                shadow-lg hover:shadow-xl transition-shadow select-none
              "
            >
              ⚡ fliqk it!
            </div>
            
            <p className="text-xs text-[var(--foreground-muted)]">
              👆 {t('dragToBookmarks')}
            </p>
            
            <button 
              onClick={handleCopyBookmarklet}
              className="w-full p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--card-border)] hover:border-[var(--accent-purple)] transition-colors flex items-center justify-center gap-2"
            >
              {copiedBookmarklet ? (
                <>
                  <Check size={16} className="text-green-500" />
                  <span className="text-sm font-medium">{t('codeCopied')}</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span className="text-sm font-medium">{t('copyCodeManually')}</span>
                </>
              )}
            </button>
            
            <p className="text-xs text-[var(--foreground-muted)]">
              💡 <strong>{t('bookmarkletTip')}</strong>
            </p>
          </div>

          {/* Mobile tip */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--card-border)]">
            <Smartphone size={16} className="text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--foreground-muted)]">
              <strong>{t('mobileTip')}</strong>
            </p>
          </div>
        </div>
      </AccordionSection>

      {/* Admin Section - Only visible for admin users */}
      {isAdmin && (
        <motion.a
          href="/admin"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="block w-full p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 hover:border-red-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-red-500" />
            <div>
              <span className="font-semibold text-red-500">Admin Dashboard</span>
              <p className="text-xs text-[var(--foreground-muted)]">{t('adminDescription')}</p>
            </div>
          </div>
        </motion.a>
      )}
    </div>
  );
}

interface AccordionSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, icon, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--background-secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent-purple)]">{icon}</span>
          <span className="font-semibold">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-[var(--foreground-muted)]" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 pt-0 border-t border-[var(--card-border)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ThemeButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ThemeButton({ icon, label, isActive, onClick }: ThemeButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2
        ${isActive 
          ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]/10" 
          : "border-[var(--card-border)] hover:border-[var(--accent-purple)]/50"
        }
      `}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {isActive && (
        <Check size={16} className="text-[var(--accent-purple)]" />
      )}
    </motion.button>
  );
}

interface LanguageButtonProps {
  flag: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function LanguageButton({ flag, label, isActive, onClick }: LanguageButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2
        ${isActive 
          ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]/10" 
          : "border-[var(--card-border)] hover:border-[var(--accent-purple)]/50"
        }
      `}
    >
      <span className="text-2xl">{flag}</span>
      <span className="text-sm font-medium">{label}</span>
      {isActive && (
        <Check size={16} className="text-[var(--accent-purple)]" />
      )}
    </motion.button>
  );
}
