"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Send, FileText, Download, BarChart3, Settings, LogOut } from "lucide-react";

export type ActivePage = "social" | "notes" | "stats" | "settings";

interface TopBarProps {
  nickname: string;
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  onExport: () => void;
  onLogout: () => void;
}

export function TopBar({ nickname, activePage, onPageChange, onExport, onLogout }: TopBarProps) {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--card-border)]">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + User */}
          <div className="flex items-center gap-3">
            <motion.button
              className="text-xl font-black tracking-tight"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              title="Refresh"
            >
              <span className="text-[var(--accent-primary)]">fliqk</span>
            </motion.button>
            <span className="text-sm text-[var(--foreground-muted)] lowercase">@{nickname}</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <NavButton
              icon={<FileText size={18} />}
              label={t('notes')}
              isActive={activePage === "notes"}
              onClick={() => onPageChange("notes")}
            />
            <NavButton
              icon={<Send size={18} />}
              label={t('social')}
              isActive={activePage === "social"}
              onClick={() => onPageChange("social")}
            />
            {/* Hidden for now - keeping it simple
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
            */}
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
          ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]" 
          : variant === "danger"
            ? "text-[var(--foreground-muted)] hover:text-red-500 hover:bg-red-500/10"
            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]"
        }
      `}
      title={label}
    >
      {icon}
      {/* Tooltip */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap lowercase">
        {label}
      </span>
    </motion.button>
  );
}
