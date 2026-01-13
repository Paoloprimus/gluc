"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Link2, MousePointerClick, FileText, 
  Plus, Copy, Check, Trash2, Shield, TestTube, User,
  RefreshCw, LogOut, Smartphone
} from "lucide-react";

interface UserData {
  id: string;
  nickname: string;
  role: 'admin' | 'tester' | 'user';
  created_at: string;
  links_count?: number;
  device_id?: string | null;
}

interface TokenData {
  id: string;
  token: string;
  grants_role: 'tester' | 'user';
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  user_nickname?: string;
}

interface Stats {
  totalUsers: number;
  totalTesters: number;
  totalLinks: number;
  totalClicks: number;
}

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tokens'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTokenRole, setNewTokenRole] = useState<'tester' | 'user'>('tester');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Check admin authorization
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const sessionData = localStorage.getItem('fliqk_session');
      if (!sessionData) {
        setIsAuthorized(false);
        return;
      }

      const session = JSON.parse(sessionData);
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.userId)
        .single();

      setIsAuthorized(user?.role === 'admin');
      
      if (user?.role === 'admin') {
        loadData();
      }
    } catch {
      setIsAuthorized(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      // Load stats
      const { data: usersData } = await supabase.from('users').select('*');
      const { data: linksData } = await supabase.from('links').select('click_count');
      
      const totalClicks = linksData?.reduce((sum, l) => sum + (l.click_count || 0), 0) || 0;
      
      setStats({
        totalUsers: usersData?.length || 0,
        totalTesters: usersData?.filter(u => u.role === 'tester').length || 0,
        totalLinks: linksData?.length || 0,
        totalClicks,
      });

      // Load users with link counts
      const usersWithCounts = await Promise.all(
        (usersData || []).map(async (user) => {
          const { count } = await supabase
            .from('links')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          return { ...user, links_count: count || 0 };
        })
      );
      setUsers(usersWithCounts);

      // Load tokens
      const { data: tokensData } = await supabase
        .from('invite_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      // Add user nicknames to used tokens
      const tokensWithNames = await Promise.all(
        (tokensData || []).map(async (token) => {
          if (token.used_by) {
            const user = usersWithCounts.find(u => u.id === token.used_by);
            return { ...token, user_nickname: user?.nickname };
          }
          return token;
        })
      );
      setTokens(tokensWithNames);

    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setIsLoading(false);
  };

  const createToken = async () => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      // Generate token: 6 random characters (letters, numbers, special chars)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
      const token = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

      const { error } = await supabase
        .from('invite_tokens')
        .insert({ token, grants_role: newTokenRole, used: false });

      if (!error) {
        loadData();
      }
    } catch (error) {
      console.error('Error creating token:', error);
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      await supabase.from('invite_tokens').delete().eq('id', tokenId);
      loadData();
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const resetDeviceId = async (userId: string, nickname: string) => {
    if (!confirm(`Resettare il device_id di "${nickname}"? L'utente potrà accedere da un nuovo dispositivo.`)) {
      return;
    }
    try {
      const { resetUserDeviceId } = await import("@/lib/supabase");
      const success = await resetUserDeviceId(userId);
      if (success) {
        loadData();
        alert(`Device_id di "${nickname}" resettato con successo!`);
      }
    } catch (error) {
      console.error('Error resetting device_id:', error);
    }
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  // Not authorized
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Shield size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Accesso negato</h1>
          <p className="text-[var(--foreground-muted)]">Non hai i permessi per accedere a questa pagina.</p>
          <a href="/" className="mt-4 inline-block text-[var(--accent-primary)] hover:underline">
            Torna alla home
          </a>
        </div>
      </div>
    );
  }

  // Loading
  if (isAuthorized === null || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <RefreshCw size={32} className="animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--card-border)] bg-[var(--background-secondary)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center">
              <Shield size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg">fliqk admin</h1>
              <p className="text-xs text-[var(--foreground-muted)]">Dashboard di controllo</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors text-[var(--foreground-muted)]"
          >
            <LogOut size={18} />
            <span className="text-sm">Esci</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[var(--card-border)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Panoramica', icon: FileText },
              { id: 'users', label: 'Utenti', icon: Users },
              { id: 'tokens', label: 'Token', icon: Plus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Utenti totali', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
                { label: 'Tester attivi', value: stats.totalTesters, icon: TestTube, color: 'text-purple-500' },
                { label: 'Post totali', value: stats.totalLinks, icon: Link2, color: 'text-green-500' },
                { label: 'Click totali', value: stats.totalClicks, icon: MousePointerClick, color: 'text-orange-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-[var(--background)] ${color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <h3 className="font-semibold mb-3">Azioni rapide</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('tokens')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-black font-medium"
                >
                  <Plus size={16} />
                  Crea nuovo token
                </button>
                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)]"
                >
                  <RefreshCw size={16} />
                  Aggiorna dati
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Utenti registrati ({users.length})</h2>
              <button
                onClick={loadData}
                className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--background-secondary)]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">Nickname</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Ruolo</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Post</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Dispositivo</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Registrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[var(--background-secondary)]/50">
                      <td className="px-4 py-3 font-medium">{user.nickname}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-red-500/20 text-red-400'
                            : user.role === 'tester'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {user.role === 'admin' && <Shield size={12} />}
                          {user.role === 'tester' && <TestTube size={12} />}
                          {user.role === 'user' && <User size={12} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground-muted)]">
                        {user.links_count}
                      </td>
                      <td className="px-4 py-3">
                        {user.device_id ? (
                          <button
                            onClick={() => resetDeviceId(user.id, user.nickname)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                            title="Reset dispositivo"
                          >
                            <Smartphone size={12} />
                            Reset
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--foreground-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            {/* Create Token */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <h3 className="font-semibold mb-3">Crea nuovo token</h3>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--foreground-muted)]">Ruolo:</span>
                  <select
                    value={newTokenRole}
                    onChange={(e) => setNewTokenRole(e.target.value as 'tester' | 'user')}
                    className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-sm"
                  >
                    <option value="tester">🧪 Tester</option>
                    <option value="user">👤 User</option>
                  </select>
                </div>
                <button
                  onClick={createToken}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-black font-medium"
                >
                  <Plus size={16} />
                  Genera token
                </button>
              </div>
            </div>

            {/* Token List */}
            <div className="space-y-4">
              <h3 className="font-semibold">Token esistenti ({tokens.length})</h3>
              
              {/* Unused tokens */}
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-2">
                  ✨ Non utilizzati ({tokens.filter(t => !t.used).length})
                </p>
                <div className="space-y-2">
                  {tokens.filter(t => !t.used).map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-[var(--accent-primary)] bg-[var(--background)] px-3 py-1 rounded-lg">
                          {token.token}
                        </code>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          token.grants_role === 'tester' 
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {token.grants_role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToken(token.token)}
                          className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors"
                          title="Copia"
                        >
                          {copiedToken === token.token ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteToken(token.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {tokens.filter(t => !t.used).length === 0 && (
                    <p className="text-center py-4 text-[var(--foreground-muted)]">
                      Nessun token disponibile
                    </p>
                  )}
                </div>
              </div>

              {/* Used tokens */}
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-2">
                  ✅ Utilizzati ({tokens.filter(t => t.used).length})
                </p>
                <div className="space-y-2">
                  {tokens.filter(t => t.used).map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-[var(--foreground-muted)] bg-[var(--background)] px-3 py-1 rounded-lg">
                          {token.token}
                        </code>
                        <span className="text-xs text-[var(--foreground-muted)]">
                          → {token.user_nickname || 'utente'}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--foreground-muted)]">
                        {token.used_at && new Date(token.used_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

