"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Send, FolderOpen, Download, BarChart3, Settings, LogOut } from "lucide-react";

export type ActivePage = "social" | "collections" | "stats" | "settings";

interface TopBarProps {
  nickname: string;
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  onExport: () => void;
  onLogout: () => void;
}

export function TopBar({ nickname, activePage, onPageChange, onExport, onLogout }: TopBarProps) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--card-border)]">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + User */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg font-bold text-white">f</span>
            </motion.div>
            <div>
              <h1 className="font-bold text-lg leading-none">{tCommon('appName')}</h1>
              <p className="text-xs text-[var(--foreground-muted)]">@{nickname}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <NavButton
              icon={<Send size={18} />}
              label={t('social')}
              isActive={activePage === "social"}
              onClick={() => onPageChange("social")}
            />
            <NavButton
              icon={<FolderOpen size={18} />}
              label={t('collections')}
              isActive={activePage === "collections"}
              onClick={() => onPageChange("collections")}
            />
            <NavButton
              icon={<Download size={18} />}
              label={t('export')}
              onClick={onExport}
            />
            <NavButton
              icon={<BarChart3 size={18} />}
              label={t('stats')}
              isActive={activePage === "stats"}
              onClick={() => onPageChange("stats")}
            />
            <NavButton
              icon={<Settings size={18} />}
              label={t('settings')}
              isActive={activePage === "settings"}
              onClick={() => onPageChange("settings")}
            />
            <div className="w-px h-6 bg-[var(--card-border)] mx-1" />
            <NavButton
              icon={<LogOut size={18} />}
              label={t('logout')}
              onClick={onLogout}
              variant="danger"
            />
          </nav>
        </div>
      </div>
    </header>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  variant?: "default" | "danger";
}

function NavButton({ icon, label, isActive, onClick, variant = "default" }: NavButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        p-2.5 rounded-xl transition-colors relative group
        ${isActive 
          ? "bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]" 
          : variant === "danger"
            ? "text-[var(--foreground-muted)] hover:text-red-500 hover:bg-red-500/10"
            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]"
        }
      `}
      title={label}
    >
      {icon}
      {/* Tooltip */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {label}
      </span>
    </motion.button>
  );
}
