"use client";

import { useTranslations } from "next-intl";
import { FileText, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface NotesPageProps {
  userId: string;
}

export function NotesPage({ userId }: NotesPageProps) {
  const t = useTranslations('notes');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {/* Empty state - Notes coming soon */}
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center">
          <FileText size={40} className="text-[var(--foreground-muted)]" />
        </div>
        
        <h2 className="text-xl font-bold mb-2">{t('comingSoon')}</h2>
        <p className="text-[var(--foreground-muted)] max-w-sm mx-auto mb-6">
          {t('comingSoonDescription')}
        </p>
        
        {/* Preview of the 3 fields */}
        <div className="max-w-md mx-auto space-y-3 text-left">
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <p className="text-sm font-medium text-[var(--accent-primary)] mb-1">Se (imparo)</p>
            <p className="text-sm text-[var(--foreground-muted)]">{t('seDescription')}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <p className="text-sm font-medium text-[var(--accent-primary)] mb-1">Cosa (costruisco)</p>
            <p className="text-sm text-[var(--foreground-muted)]">{t('cosaDescription')}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <p className="text-sm font-medium text-[var(--accent-primary)] mb-1">Chi (divento)</p>
            <p className="text-sm text-[var(--foreground-muted)]">{t('chiDescription')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

