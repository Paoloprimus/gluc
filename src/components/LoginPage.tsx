"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { User, Ticket, FileCheck, Loader2, ArrowRight } from "lucide-react";

interface LoginPageProps {
  onLogin: (userId: string, nickname: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  
  const [mode, setMode] = useState<"welcome" | "login" | "register">("welcome");
  const [nickname, setNickname] = useState("");
  const [token, setToken] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!nickname.trim() || !token.trim() || !acceptedTerms) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { registerUser } = await import("@/lib/supabase");
      const result = await registerUser(nickname.trim(), token.trim());
      
      if (result.success && result.userId) {
        onLogin(result.userId, nickname.trim().toLowerCase());
      } else {
        setError(result.error || t('registrationError'));
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!nickname.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { loginUser } = await import("@/lib/supabase");
      const result = await loginUser(nickname.trim());
      
      if (result.success && result.user) {
        onLogin(result.user.id, result.user.nickname);
      } else {
        setError(result.error || t('userNotFound'));
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] flex items-center justify-center mb-4"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <span className="text-4xl font-bold text-white">f</span>
          </motion.div>
          <h1 className="text-2xl font-bold">{tCommon('appName')}</h1>
          <p className="text-sm text-[var(--foreground-muted)]">{tCommon('tagline')}</p>
        </div>

        {mode === "welcome" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("login")}
              className="w-full p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-purple)]/50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t('haveAccount')}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{t('loginWithNickname')}</p>
                </div>
                <ArrowRight size={20} className="text-[var(--foreground-muted)]" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("register")}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t('firstAccess')}</p>
                  <p className="text-sm opacity-80">{t('haveInviteToken')}</p>
                </div>
                <ArrowRight size={20} />
              </div>
            </motion.button>
          </motion.div>
        )}

        {mode === "login" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setMode("welcome")}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← {tCommon('back')}
            </button>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium flex items-center gap-2 mb-2">
                  <User size={16} />
                  {t('nickname')}
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('yourNickname')}
                  className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] focus:border-[var(--accent-purple)] transition-colors"
                  autoFocus
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={!nickname.trim() || isLoading}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {t('login')}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {mode === "register" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setMode("welcome")}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← {tCommon('back')}
            </button>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium flex items-center gap-2 mb-2">
                  <User size={16} />
                  {t('chooseNickname')}
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  placeholder={t('nicknamePlaceholder')}
                  className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] focus:border-[var(--accent-purple)] transition-colors"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Ticket size={16} />
                  {t('inviteToken')}
                </span>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder={t('tokenPlaceholder')}
                  className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] focus:border-[var(--accent-purple)] transition-colors font-mono"
                />
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] cursor-pointer hover:border-[var(--accent-purple)]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded accent-[var(--accent-purple)]"
                />
                <span className="text-sm">
                  <FileCheck size={14} className="inline mr-1" />
                  {t('acceptTerms')}{" "}
                  <a href="#" className="text-[var(--accent-purple)] hover:underline">
                    {t('termsOfService')}
                  </a>{" "}
                  {t('and')}{" "}
                  <a href="#" className="text-[var(--accent-purple)] hover:underline">
                    {t('privacyPolicy')}
                  </a>
                </span>
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRegister}
              disabled={!nickname.trim() || !token.trim() || !acceptedTerms || isLoading}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {t('start')}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
