"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link2, Tag, Globe, TrendingUp, Loader2, MousePointer, FileEdit, Send } from "lucide-react";
import { getUserStats } from "@/lib/supabase";

interface StatsPageProps {
  userId: string;
}

interface Stats {
  totalLinks: number;
  totalClicks: number;
  publishedLinks: number;
  draftLinks: number;
  topTags: { tag: string; count: number }[];
  domainsCount: { domain: string; count: number }[];
}

export function StatsPage({ userId }: StatsPageProps) {
  const t = useTranslations('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const data = await getUserStats(userId);
      setStats(data);
      setIsLoading(false);
    }
    loadStats();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  if (!stats || stats.totalLinks === 0) {
    return (
      <div className="text-center py-20">
        <TrendingUp size={48} className="mx-auto text-[var(--foreground-muted)] mb-4" />
        <h2 className="text-xl font-bold mb-2">{t('noData')}</h2>
        <p className="text-[var(--foreground-muted)]">
          {t('noDataDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('title')}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Link2 size={24} />}
          value={stats.totalLinks}
          label={t('totalPosts')}
          color="primary"
        />
        <StatCard
          icon={<MousePointer size={24} />}
          value={stats.totalClicks}
          label={t('totalClicks')}
          color="secondary"
        />
        <StatCard
          icon={<Send size={24} />}
          value={stats.publishedLinks}
          label={t('sentPosts')}
          color="primary"
        />
        <StatCard
          icon={<FileEdit size={24} />}
          value={stats.draftLinks}
          label={t('draftPosts')}
          color="secondary"
        />
      </div>

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]"
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Tag size={18} className="text-[var(--accent-primary)]" />
            {t('topTags')}
          </h3>
          <div className="space-y-2">
            {stats.topTags.map((item, index) => (
              <div key={item.tag} className="flex items-center gap-3">
                <span className="w-6 text-sm text-[var(--foreground-muted)]">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.tag}</span>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {item.count} {t('linksCount')}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--background-secondary)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / stats.topTags[0].count) * 100}%` }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Domains */}
      {stats.domainsCount.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]"
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Globe size={18} className="text-[var(--accent-secondary)]" />
            {t('topDomains')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.domainsCount.map((item) => (
              <span
                key={item.domain}
                className="px-3 py-1.5 rounded-full bg-[var(--background-secondary)] text-sm"
              >
                {item.domain}
                <span className="ml-1 text-[var(--foreground-muted)]">({item.count})</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "primary" | "secondary";
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        p-4 rounded-xl border
        ${color === "primary" 
          ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30" 
          : "bg-[var(--accent-secondary)]/10 border-[var(--accent-secondary)]/30"
        }
      `}
    >
      <div className={`mb-2 ${color === "primary" ? "text-[var(--accent-primary)]" : "text-[var(--accent-secondary)]"}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
    </motion.div>
  );
}
