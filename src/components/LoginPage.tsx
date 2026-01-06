"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { User, Ticket, FileCheck, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

interface LoginPageProps {
  onLogin: (userId: string, nickname: string, role?: 'admin' | 'tester' | 'user', isNewUser?: boolean) => void;
  onBack?: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  
  const [mode, setMode] = useState<"welcome" | "login" | "register">("welcome");
  const [nickname, setNickname] = useState("");
  const [token, setToken] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!nickname.trim() || !token.trim() || !acceptedTerms) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { registerUser } = await import("@/lib/supabase");
      const result = await registerUser(nickname.trim(), token.trim());
      
      if (result.success && result.userId) {
        onLogin(result.userId, nickname.trim().toLowerCase(), undefined, true); // true = new user
      } else {
        // Translate error codes
        const errorKey = result.error || 'registrationError';
        const translatedError = t(errorKey as 'nicknameInUse' | 'invalidToken' | 'registrationError');
        setError(translatedError);
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!nickname.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { loginUser } = await import("@/lib/supabase");
      const result = await loginUser(nickname.trim());
      
      if (result.success && result.user) {
        onLogin(result.user.id, result.user.nickname, result.user.role, false); // false = not new user
      } else {
        // Translate error codes
        const errorKey = result.error || 'userNotFound';
        const translatedError = t(errorKey as 'userNotFound' | 'connectionError' | 'differentDevice');
        setError(translatedError);
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      {/* Back to landing button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-4 left-4 flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">{tCommon('back')}</span>
        </button>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo - minimal wordmark */}
        <div className="text-center mb-10">
          <motion.h1
            className="text-5xl font-black tracking-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-[var(--accent-primary)]">fliqk</span>
          </motion.h1>
        </div>

        {mode === "welcome" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("login")}
              className="w-full p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-primary)]/50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold lowercase">{t('haveAccount')}</p>
                  <p className="text-sm text-[var(--foreground-muted)] lowercase">{t('loginWithNickname')}</p>
                </div>
                <ArrowRight size={20} className="text-[var(--foreground-muted)]" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("register")}
              className="w-full p-4 rounded-xl bg-[var(--accent-primary)] text-black text-left font-bold"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold lowercase">{t('firstAccess')}</p>
                  <p className="text-sm opacity-70 lowercase">{t('haveInviteToken')}</p>
                </div>
                <ArrowRight size={20} />
              </div>
            </motion.button>
          </motion.div>
        )}

        {mode === "login" && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
            onSubmit={handleLogin}
          >
            <button
              type="button"
              onClick={() => setMode("welcome")}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← {tCommon('back')}
            </button>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium flex items-center gap-2 mb-2 lowercase">
                  <User size={16} />
                  {t('nickname')}
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('yourNickname')}
                  className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] focus:border-[var(--accent-primary)] transition-colors lowercase"
                  autoFocus
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!nickname.trim() || isLoading}
              className="w-full p-4 rounded-xl bg-[var(--accent-primary)] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
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
          </motion.form>
        )}

        {mode === "register" && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
            onSubmit={handleRegister}
          >
            <button
              type="button"
              onClick={() => setMode("welcome")}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← {tCommon('back')}
            </button>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium flex items-center gap-2 mb-2 lowercase">
                  <User size={16} />
                  {t('chooseNickname')}
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  placeholder={t('nicknamePlaceholder')}
                  className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] focus:border-[var(--accent-primary)] transition-colors lowercase"
                  autoFocus
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-2">
                  🔒 {t('nicknameWarning')}
                </p>
              </label>

              <label className="block">
                <span className="text-sm font-medium flex items-center gap-2 mb-2 lowercase">
                  <Ticket size={16} />
                  {t('inviteToken')}
                </span>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Ab3!xZ"
                  maxLength={6}
                  className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] focus:border-[var(--accent-primary)] transition-colors font-mono text-center text-xl tracking-widest"
                />
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] cursor-pointer hover:border-[var(--accent-primary)]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded accent-[var(--accent-primary)]"
                />
                <span className="text-sm">
                  <FileCheck size={14} className="inline mr-1" />
                  {t('acceptTerms')}{" "}
                  <a href="#" className="text-[var(--accent-primary)] hover:underline">
                    {t('termsOfService')}
                  </a>{" "}
                  {t('and')}{" "}
                  <a href="#" className="text-[var(--accent-primary)] hover:underline">
                    {t('privacyPolicy')}
                  </a>
                </span>
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!nickname.trim() || !token.trim() || !acceptedTerms || isLoading}
              className="w-full p-4 rounded-xl bg-[var(--accent-primary)] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
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
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
