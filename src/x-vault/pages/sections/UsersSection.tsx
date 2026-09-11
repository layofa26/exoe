import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Award, 
  AlertTriangle, 
  Ban, 
  KeyRound, 
  Clock, 
  GitMerge, 
  Download, 
  UserPlus, 
  Send, 
  Eye, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Copy,
  Check,
  Film,
  UserCheck,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Shield,
  ShieldAlert,
  Activity,
  Trash2
} from 'lucide-react';
import { AdminUser, UserStatus } from '../../types/vault';
import { useVaultModule } from '../../context/VaultModuleContext';
import { API_BASE_URL } from '../../../config/api';
import { useVaultWebSocket } from '../../hooks/useVaultWebSocket';
import { vaultCache } from '../../utils/vaultCache';


export const UsersSection: React.FC = () => {

  const { activeModule } = useVaultModule();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  // Server-side metrics from database
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [newSignupsToday, setNewSignupsToday] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [proCount, setProCount] = useState(0);

  // Server SQL Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const pageSize = 10;

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState<AdminUser | null>(null);
  const [directMessageTitle, setDirectMessageTitle] = useState('Message Officiel - Direction EXILE');
  const [directMessageText, setDirectMessageText] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeAccountEmail, setMergeAccountEmail] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState<AdminUser | null>(null);
  const [showBanModal, setShowBanModal] = useState<AdminUser | null>(null);
  const [generatedPasswordModal, setGeneratedPasswordModal] = useState<{ user: AdminUser; tempPass: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Form states
  const [suspensionDuration, setSuspensionDuration] = useState<'24h' | '7d' | '30d' | 'permanent'>('7d');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [actionNotice, setActionNotice] = useState<{ text?: string; message?: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerNotice = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionNotice({ text: msg, message: msg, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // 1., 2., 3., 10., 14. Chaje vrè itilizatè yo depi baz done Django ak vrè paginasyon SQL
  const fetchRealUsers = useCallback(async (isSilent = false) => {
    const cacheKey = `vault_users_${activeModule}_${statusFilter}_${badgeFilter}_${searchQuery}_${currentPage}_${pageSize}`;
    const cached = vaultCache.get<any>(cacheKey);
    if (cached && !isSilent) {
      setUsers(cached.users || []);
      setFilteredTotal(cached.totalCount ?? 0);
      setTotalPages(cached.totalPages ?? 1);
      setTotalUsersCount(cached.totalUsersCount ?? 0);
      setOnlineCount(cached.onlineCount ?? 0);
      setNewSignupsToday(cached.newSignupsToday ?? 0);
      setVerifiedCount(cached.verifiedCount ?? 0);
      setProCount(cached.proCount ?? 0);
      setIsLoading(false);
    }

    if (!isSilent && !cached) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const url = new URL(`${API_BASE_URL}/vault/users`, baseUrl);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      if (badgeFilter !== 'all') url.searchParams.set('badge', badgeFilter);
      if (activeModule !== 'monetization') url.searchParams.set('module', activeModule);
      url.searchParams.set('page', String(currentPage));
      url.searchParams.set('page_size', String(pageSize));

      const storedToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
      const authToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (storedToken) headers['x-vault-token'] = storedToken;
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setFilteredTotal(data.totalCount ?? (data.users?.length || 0));
        setTotalPages(data.totalPages ?? 1);
        setTotalUsersCount(data.totalUsersCount ?? (data.users?.length || 0));
        setOnlineCount(data.onlineCount ?? 0);
        setNewSignupsToday(data.newSignupsToday ?? 0);
        setVerifiedCount(data.verifiedCount ?? 0);
        setProCount(data.proCount ?? 0);
        vaultCache.set(cacheKey, data, 180000);
      } else {
        triggerNotice('Erreur lors du chargement des données réelles.', 'error');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      triggerNotice('Connexion au serveur backend échouée.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, statusFilter, badgeFilter, activeModule, currentPage, pageSize]);

  // Initial load & refresh on page / filter changes
  useEffect(() => {
    fetchRealUsers();
  }, [fetchRealUsers]);

  // Reset pagination to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, badgeFilter, activeModule]);

  // 10. Temps réel par WebSocket : mise à jour instantanée dès qu'un statut change ou un utilisateur s'inscrit
  const { isConnected: isWsConnected } = useVaultWebSocket({
    onEvent: (event) => {
      if (event.type === 'online_count_update' && typeof event.data?.onlineCount === 'number') {
        setOnlineCount(event.data.onlineCount);
      } else if (['user_status_changed', 'new_user_registered', 'user_badge_updated', 'vault_update'].includes(event.type)) {
        vaultCache.invalidate('vault_users_');
        vaultCache.invalidate('vault_overview_stats');
        fetchRealUsers(true);
      }
    }
  });

  // Polling de secours très léger (5 minutes) au cas où le WebSocket se déconnecterait
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isWsConnected) {
        fetchRealUsers(true);
      }
    }, 300000);
    return () => clearInterval(timer);
  }, [fetchRealUsers, isWsConnected]);


  const getVaultHeaders = (): Record<string, string> => {
    const token = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Vault-Request': '1',
    };
    if (token) headers['x-vault-token'] = token;
    return headers;
  };

  // 4. Réactiver un compte suspendu ou banni / Lever la sanction
  const handleActivateUser = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${userId}/change-status`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
        body: JSON.stringify({ action: 'activate' }),
      });
      if (res.ok) {
        fetchRealUsers(true);
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, status: 'active', suspensionReason: '', suspendedUntil: null } : null);
        }
        triggerNotice('Compte réactivé et sanction levée avec succès !', 'success');
      } else {
        triggerNotice('Erreur lors de la réactivation du compte.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors de la réactivation.', 'error');
    }
  };

  // Mettre à la corbeille un profil pro
  const handleSoftDeleteProUser = async (user: AdminUser) => {
    const reason = window.prompt(`Motif de mise à la corbeille pour ${user.name} :`, 'Suppression de profil professionnel');
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${user.id}/soft-delete`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotice(data.message || `Le compte de ${user.name} a été déplacé dans la Corbeille Pro.`, 'info');
        fetchRealUsers(true);
        if (selectedUser?.id === user.id) {
          setSelectedUser(null);
        }
      } else {
        triggerNotice(data.error || 'Erreur lors de la mise à la corbeille.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors de la mise à la corbeille.', 'error');
    }
  };

  // 5. Valider profil pro
  const handleValidatePro = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${userId}/change-status`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
        body: JSON.stringify({ action: 'validate_pro' }),
      });
      if (res.ok) {
        fetchRealUsers(true);
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, status: 'active', isVerified: true, module: 'pro' } : null);
        }
        triggerNotice(`Compte pro validé et activé avec badge vérifié !`, 'success');
      }
    } catch {
      triggerNotice('Erreur lors de la validation du profil.', 'error');
    }
  };

  // 5. Rejeter profil pro (maintient le compte actif en mode social sans le suspendre)
  const handleRejectPro = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${userId}/change-status`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
        body: JSON.stringify({ action: 'reject_pro', reason: 'Candidature professionnelle non retenue' }),
      });
      if (res.ok) {
        fetchRealUsers(true);
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, status: 'active', module: 'social', isVerified: false } : null);
        }
        triggerNotice('Candidature pro rejetée. Le compte demeure actif en mode social.', 'info');
      }
    } catch {
      triggerNotice('Erreur lors du rejet.', 'error');
    }
  };

  // 6. Attribuer / révoquer un badge vérifié
  const handleToggleBadge = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${userId}/toggle-badge`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: data.isVerified } : u));
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, isVerified: data.isVerified } : null);
        }
        setVerifiedCount(prev => data.isVerified ? prev + 1 : Math.max(0, prev - 1));
        triggerNotice(`Badge vérifié ${data.isVerified ? 'attribué' : 'retiré'} avec succès.`, 'success');
      }
    } catch {
      triggerNotice('Erreur lors de la modification du badge.', 'error');
    }
  };

  // 7. Suspendre temporairement un compte avec durée et motif
  const handleConfirmSuspend = async () => {
    if (!showSuspendModal) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${showSuspendModal.id}/change-status`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
        body: JSON.stringify({ 
          action: 'suspend',
          duration: suspendDuration,
          reason: suspendReason.trim()
        }),
      });
      if (res.ok) {
        fetchRealUsers(true);
        if (selectedUser?.id === showSuspendModal.id) {
          setSelectedUser(prev => prev ? { ...prev, status: 'suspended', isOnline: false } : null);
        }
        triggerNotice(`Compte de ${showSuspendModal.name} suspendu (${suspendDuration}).`, 'info');
        setShowSuspendModal(null);
        setSuspendReason('');
      }
    } catch {
      triggerNotice('Erreur lors de la suspension.', 'error');
    }
  };

  // 8. Bannir définitivement
  const handleConfirmBan = async () => {
    if (!showBanModal) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${showBanModal.id}/change-status`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
        body: JSON.stringify({ 
          action: 'ban',
          reason: banReason.trim()
        }),
      });
      if (res.ok) {
        fetchRealUsers(true);
        if (selectedUser?.id === showBanModal.id) {
          setSelectedUser(prev => prev ? { ...prev, status: 'banned', isOnline: false } : null);
        }
        triggerNotice(`Utilisateur ${showBanModal.name} banni définitivement.`, 'error');
        setShowBanModal(null);
        setBanReason('');
      }
    } catch {
      triggerNotice('Erreur lors du bannissement.', 'error');
    }
  };

  // 9. Réinitialiser mot de passe (génère un mot de passe sécurisé et l'affiche à l'admin)
  const handleResetPassword = async (user: AdminUser) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${user.id}/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPasswordModal({
          user,
          tempPass: data.tempPassword || 'Exile#Temp2026'
        });
        setCopiedPassword(false);
        triggerNotice(`Mot de passe réinitialisé pour ${user.name}.`, 'success');
      } else {
        triggerNotice('Erreur lors de la réinitialisation.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors de la réinitialisation.', 'error');
    }
  };

  // 12. Fusionner deux comptes dupliqués
  const handleMergeAccounts = async () => {
    if (!mergeAccountEmail || !selectedUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/merge`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
        body: JSON.stringify({ primaryId: selectedUser.id, secondaryEmail: mergeAccountEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotice(data.message || 'Comptes fusionnés avec succès dans la base.', 'success');
        setShowMergeModal(false);
        setMergeAccountEmail('');
        fetchRealUsers();
      } else {
        triggerNotice(data.error || 'Erreur lors de la fusion.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors de la fusion des comptes.', 'error');
    }
  };

  // 13. Exporter CSV avec colonnes complètes
  const handleExportCSV = () => {
    const headers = [
      'ID', 'Nom', 'Username', 'Email', 'Téléphone', 'Profession', 'Ville', 'Pays', 
      'Module', 'Statut', 'Vérifié', 'En Ligne', 'Vidéos', 'Abonnés', 'Score Réputation', 'Date Inscription', 'Dernière IP'
    ];
    const rows = users.map(u => [
      u.id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      u.email,
      `"${u.phone || ''}"`,
      `"${(u.profession || '').replace(/"/g, '""')}"`,
      `"${(u.city || '').replace(/"/g, '""')}"`,
      `"${(u.country || '').replace(/"/g, '""')}"`,
      u.module,
      u.status,
      u.isVerified ? 'Oui' : 'Non',
      u.isOnline ? 'Oui' : 'Non',
      u.videosCount ?? 0,
      u.subscribersCount ?? 0,
      u.reputationScore,
      u.createdAt,
      u.lastLoginIp || ''
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `exile_utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotice(`Export CSV généré avec succès (${users.length} utilisateurs).`, 'success');
  };

  // 15. Envoi message direct / notification système ciblée
  const handleSendDirectMessage = async () => {
    if (!directMessageText.trim() || !showDirectMessageModal) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/users/${showDirectMessageModal.id}/send-message`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
        body: JSON.stringify({ 
          title: directMessageTitle.trim() || "Message Officiel - Direction EXILE",
          message: directMessageText.trim() 
        }),
      });
      if (res.ok) {
        triggerNotice(`Message transmis à ${showDirectMessageModal.name} dans son feed de notifications.`, 'success');
        setShowDirectMessageModal(null);
        setDirectMessageText('');
        setDirectMessageTitle('Message Officiel - Direction EXILE');
      } else {
        triggerNotice('Erreur lors de l\'envoi du message.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors de la communication.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {actionNotice && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-sm shadow-lg animate-fade-in ${
          actionNotice.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          actionNotice.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
          'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {actionNotice.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {actionNotice.type === 'info' && <Shield className="w-5 h-5 text-blue-400" />}
            <span className="font-medium">{actionNotice.text}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)} 
            className="text-xs opacity-60 hover:opacity-100 transition-opacity p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 14. 4 Metric Cards Dashboard Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Utilisateurs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Comptes</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{totalUsersCount}</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-indigo-400 font-semibold">{proCount} Pros</span>
            <span>•</span>
            <span className="text-slate-400">{Math.max(0, totalUsersCount - proCount)} Social</span>
          </div>
        </div>

        {/* 10. En direct / En ligne */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En direct maintenant</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 flex items-center gap-2">
            <span>{onlineCount}</span>
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className={isWsConnected ? 'text-emerald-400/90 font-medium' : 'text-slate-400'}>
              {isWsConnected ? 'Flux WebSocket en direct' : 'Reconnexion au flux...'}
            </span>
          </div>
        </div>

        {/* 14. Nouveaux Inscrits Aujourd'hui */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inscrits aujourd'hui</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-400">+{newSignupsToday}</div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Depuis minuit (PostgreSQL)</span>
          </div>
        </div>

        {/* Comptes Vérifiés */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Badges Vérifiés</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{verifiedCount}</div>
          <div className="mt-2 text-xs text-slate-400">
            <span>{totalUsersCount > 0 ? Math.round((verifiedCount / totalUsersCount) * 100) : 0}% des membres vérifiés</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Multi-Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* 2. Recherche */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, @username, email, téléphone, ville..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* 3. Filtres statut & badge */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statut filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Tous les statuts</option>
              <option value="active" className="bg-slate-900">Actif</option>
              <option value="pending" className="bg-slate-900">En attente (Pending)</option>
              <option value="suspended" className="bg-slate-900">Suspendu</option>
              <option value="banned" className="bg-slate-900">Banni</option>
            </select>
          </div>

          {/* Badge filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={badgeFilter}
              onChange={(e) => setBadgeFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Tous les badges</option>
              <option value="verified" className="bg-slate-900">Vérifiés uniquement</option>
              <option value="unverified" className="bg-slate-900">Non-vérifiés</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchRealUsers()}
            disabled={isLoading || isRefreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
            title="Rafraîchir les données en direct"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* 13. Exporter CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            title="Exporter la liste active en CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Main Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Utilisateur</th>
                <th className="px-4 py-3.5">Profession / Module</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5">Vidéos / Abonnés</th>
                <th className="px-4 py-3.5">Dernière Connexion</th>
                <th className="px-4 py-3.5 text-center">Badge</th>
                <th className="px-5 py-3.5 text-right">Actions Rapides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
                      <span className="text-sm font-medium">Chargement des utilisateurs en direct depuis la base de données...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <span>Aucun utilisateur trouvé correspondant à ces filtres.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* User Identity */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          {u.avatarUrl ? (
                            <img 
                              src={u.avatarUrl} 
                              alt={u.name} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const fb = e.currentTarget.parentElement?.querySelector('.avatar-letter-fb');
                                if (fb) (fb as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`avatar-letter-fb w-10 h-10 rounded-full bg-slate-800 border border-slate-700 items-center justify-center font-bold text-white text-sm ${u.avatarUrl ? 'hidden' : 'flex'}`}
                          >
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          {u.isOnline && (
                            <span 
                              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" 
                              title="En ligne en ce moment" 
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                            <span className="truncate">{u.name}</span>
                            {u.isVerified && (
                              <Award className="w-4 h-4 text-amber-400 flex-shrink-0" title="Badge Vérifié Officiel" />
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 truncate">
                            <span className="font-mono text-slate-500">{u.username || `@user_${u.id}`}</span>
                            <span>•</span>
                            <span className="truncate">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Profession & Module */}
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-slate-200 block truncate max-w-[150px]">
                        {u.profession || 'Membre Communauté'}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        u.module === 'pro' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.module}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        u.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        u.status === 'suspended' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.status === 'active' ? 'Actif' :
                         u.status === 'pending' ? 'En attente' :
                         u.status === 'suspended' ? 'Suspendu' : 'Banni'}
                      </span>
                    </td>

                    {/* Activity Stats */}
                    <td className="px-4 py-4 text-xs">
                      <div className="flex items-center gap-3 text-slate-300">
                        <span className="flex items-center gap-1" title="Vidéos publiées">
                          <Film className="w-3 h-3 text-slate-500" />
                          {u.videosCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1" title="Abonnés">
                          <Users className="w-3 h-3 text-slate-500" />
                          {u.subscribersCount ?? 0}
                        </span>
                        {u.reportsCount > 0 && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30" title="Signalements enregistrés">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>{u.reportsCount}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 11. Last Login & IP & Device */}
                    <td className="px-4 py-4 text-xs">
                      <div className="text-slate-300">{u.lastLogin || 'Jamais'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {u.lastLoginIp || '127.0.0.1'} • {u.device || 'Web Client'}
                      </div>
                    </td>

                    {/* 6. Toggle Badge */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleBadge(u.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all inline-flex items-center gap-1 ${
                          u.isVerified 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Basculer le badge vérifié"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{u.isVerified ? 'Vérifié' : '+ Badge'}</span>
                      </button>
                    </td>

                    {/* Actions Bar */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* 4. Voir Profil 360° */}
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="Fiche Profil 360°"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* 5. Valider / Rejeter si pending */}
                        {u.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleValidatePro(u.id)}
                              title="Valider Profil Professionnel"
                              className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectPro(u.id)}
                              title="Rejeter Profil Professionnel"
                              className="p-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* 4. Réactiver si suspendu ou banni / Lever la sanction */}
                        {(u.status === 'suspended' || u.status === 'banned') && (
                          <button
                            onClick={() => handleActivateUser(u.id)}
                            title="Réactiver le compte / Lever la sanction"
                            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* 15. Message Direct */}
                        <button
                          onClick={() => {
                            setShowDirectMessageModal(u);
                            setDirectMessageTitle(`Message Officiel - Direction EXILE`);
                          }}
                          title="Envoyer une notification directe"
                          className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {/* 9. Reset Password */}
                        <button
                          onClick={() => handleResetPassword(u)}
                          title="Générer un mot de passe temporaire"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-amber-600/20 text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* 7. Suspendre */}
                        <button
                          onClick={() => setShowSuspendModal(u)}
                          title="Suspendre temporairement"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-orange-600/20 text-slate-400 hover:text-orange-400 transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>

                        {/* 8. Bannir */}
                        <button
                          onClick={() => setShowBanModal(u)}
                          title="Bannir définitivement"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        {/* Corbeille Pro (uniquement pour les professionnels) */}
                        {(activeModule === 'pro' || u.module === 'pro') && (
                          <button
                            onClick={() => handleSoftDeleteProUser(u)}
                            title="Placer dans la Corbeille Pro"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 1. Server-side SQL Pagination Footer */}
        {filteredTotal > 0 && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Affichage de <span className="text-white font-medium">{(currentPage - 1) * pageSize + 1}</span> à{' '}
              <span className="text-white font-medium">
                {Math.min(currentPage * pageSize, filteredTotal)}
              </span>{' '}
              sur <span className="text-white font-medium">{filteredTotal}</span> utilisateurs (SQL)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white font-medium">
                Page {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || isLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
              >
                <span>Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL FICHE PROFIL COMPLET 360° */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg p-2"
            >
              ✕
            </button>

            {/* Header Profil */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-800 pb-5">
              <div className="relative flex-shrink-0">
                {selectedUser.avatarUrl ? (
                  <img 
                    src={selectedUser.avatarUrl} 
                    alt={selectedUser.name} 
                    className="w-20 h-20 rounded-2xl object-cover border border-blue-500/30 bg-slate-800"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fb = e.currentTarget.parentElement?.querySelector('.modal-avatar-fb');
                      if (fb) (fb as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`modal-avatar-fb w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 items-center justify-center text-3xl font-extrabold text-blue-400 ${selectedUser.avatarUrl ? 'hidden' : 'flex'}`}
                >
                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {selectedUser.isOnline && (
                  <span 
                    className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" 
                    title="En ligne en ce moment" 
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                  {selectedUser.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Award className="w-3.5 h-3.5" />
                      Vérifié
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedUser.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    selectedUser.status === 'suspended' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{selectedUser.profession || 'Membre Général'}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="font-mono text-slate-400">{selectedUser.username || `@user_${selectedUser.id}`}</span>
                  <span>•</span>
                  <span>Inscrit le {selectedUser.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Warning Banner if suspended with reason */}
            {selectedUser.suspensionReason && (
              <div className="p-3 bg-orange-500/15 border border-orange-500/30 rounded-xl my-4 text-xs text-orange-300">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span>Dossier de sanction administrative :</span>
                </div>
                <div>Motif enregistré : <em>"{selectedUser.suspensionReason}"</em></div>
                {selectedUser.suspendedUntil && (
                  <div className="mt-1 text-slate-400">Levée automatique programmée le : <strong className="text-white">{selectedUser.suspendedUntil}</strong></div>
                )}
              </div>
            )}

            {/* Progress Bars: Reputation & Completion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-800">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Complétion du Profil</span>
                  <span className="text-white font-semibold">{selectedUser.profileCompletion}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${selectedUser.profileCompletion}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Score de Réputation Système</span>
                  <span className="text-emerald-400 font-semibold">{selectedUser.reputationScore}/100</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${selectedUser.reputationScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-5 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Email Officiel</span>
                <span className="text-white font-mono break-all">{selectedUser.email}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Téléphone</span>
                <span className="text-white font-mono">{selectedUser.phone || 'Non renseigné'}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Localisation (Ville / Pays)</span>
                <span className="text-white">{selectedUser.city || 'Inconnue'}, {selectedUser.country || 'Haïti'}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Genre & Naissance</span>
                <span className="text-white capitalize">{selectedUser.gender || 'Non précisé'} • {selectedUser.birthDate || 'N/A'}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">11. Dernière Connexion (IP & Appareil)</span>
                <span className="text-white font-mono">{selectedUser.lastLoginIp || '127.0.0.1'} ({selectedUser.device || 'Web'})</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Vidéos Publiées / Abonnés</span>
                <span className="text-white font-bold">{selectedUser.videosCount ?? 0} vidéos • {selectedUser.subscribersCount ?? 0} abonnés</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Dossier Signalements / Modération</span>
                <span className={`font-semibold flex items-center gap-1.5 ${selectedUser.reportsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{selectedUser.reportsCount > 0 ? `${selectedUser.reportsCount} signalement(s) actif(s)` : '0 signalement (Dossier intègre)'}</span>
                </span>
              </div>
            </div>

            {/* Action Bar in 360 View */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {/* 12. Fusionner ce compte */}
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>12. Fusionner un autre compte ici</span>
                </button>

                {/* 4. Lever la sanction / Réactiver si non actif */}
                {selectedUser.status !== 'active' && (
                  <button
                    onClick={() => handleActivateUser(selectedUser.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Réactiver / Lever Sanction</span>
                  </button>
                )}

                {/* Corbeille Pro si compte pro */}
                {selectedUser.module === 'pro' && (
                  <button
                    onClick={() => handleSoftDeleteProUser(selectedUser)}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Mettre à la Corbeille</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Attribuer / Révoquer Badge */}
                <button
                  onClick={() => handleToggleBadge(selectedUser.id)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{selectedUser.isVerified ? 'Révoquer Badge' : 'Attribuer Badge'}</span>
                </button>

                {/* Envoyer Message */}
                <button
                  onClick={() => {
                    setShowDirectMessageModal(selectedUser);
                    setDirectMessageTitle(`Message Officiel - Direction EXILE`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer Message</span>
                </button>

                {/* Fermer */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL MOT DE PASSE TEMPORAIRE GÉNÉRÉ */}
      {generatedPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Mot de Passe Réinitialisé</h3>
            <p className="text-xs text-slate-400 mb-4">
              Nouveau mot de passe temporaire pour <strong className="text-white">{generatedPasswordModal.user.name}</strong> :
            </p>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 mb-4">
              <code className="text-amber-400 font-mono text-base font-bold select-all tracking-wider">
                {generatedPasswordModal.tempPass}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPasswordModal.tempPass);
                  setCopiedPassword(true);
                  setTimeout(() => setCopiedPassword(false), 2000);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPassword ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-5">
              Transmettez ce mot de passe de manière sécurisée à l'utilisateur. Il pourra le changer lors de sa prochaine connexion.
            </p>

            <button
              onClick={() => setGeneratedPasswordModal(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Terminer
            </button>
          </div>
        </div>
      )}

      {/* 7. MODAL SUSPENSION TEMPORAIRE */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Suspendre le compte</h3>
                <p className="text-xs text-slate-400">{showSuspendModal.name} ({showSuspendModal.email})</p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Durée de la suspension :</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: '24h', label: '24 Heures' },
                    { key: '7d', label: '7 Jours' },
                    { key: '30d', label: '30 Jours' },
                  ].map((dur) => (
                    <button
                      key={dur.key}
                      onClick={() => setSuspendDuration(dur.key as any)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        suspendDuration === dur.key
                          ? 'bg-orange-600/30 border-orange-500 text-orange-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Motif de suspension (persistant) :</label>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Ex: Non-respect des règles de publication, signalements répétés..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowSuspendModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSuspend}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Confirmer Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL BANNISSEMENT DÉFINITIF */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Bannissement Définitif</h3>
                <p className="text-xs text-slate-400">{showBanModal.name} ({showBanModal.email})</p>
              </div>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs my-3">
              ⚠️ <strong>Action irréversible :</strong> L'accès de l'utilisateur sera définitivement bloqué, sa session révoquée et ses contenus masqués.
            </div>

            <div className="my-4">
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Motif légal ou administratif :</label>
              <textarea
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ex: Fraude avérée, usurpation d'identité..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowBanModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmBan}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Exécuter le Bannissement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. MODAL ENVOI MESSAGE DIRECT ADMIN */}
      {showDirectMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">15. Message Direct Administratif</h3>
                <p className="text-xs text-slate-400">Destinataire : <strong className="text-blue-400">{showDirectMessageModal.name}</strong></p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Type de communication :</label>
                <div className="flex gap-2 mb-2">
                  {[
                    { label: 'Information', title: 'Information Officielle - Direction EXILE' },
                    { label: 'Avertissement', title: '⚠️ Avertissement Administratif - Modération EXILE' },
                    { label: 'Convocation', title: 'Convocation & Demande de Justificatifs - EXILE' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setDirectMessageTitle(preset.title)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        directMessageTitle === preset.title
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={directMessageTitle}
                  onChange={(e) => setDirectMessageTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contenu du message :</label>
                <textarea
                  rows={4}
                  value={directMessageText}
                  onChange={(e) => setDirectMessageText(e.target.value)}
                  placeholder="Écrivez le message confidentiel, la convocation ou la mise en demeure..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDirectMessageModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSendDirectMessage}
                disabled={!directMessageText.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Délivrer Notification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MODAL FUSION DE DEUX COMPTES DUPLIQUÉS */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <GitMerge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">12. Fusionner deux comptes dupliqués</h3>
                <p className="text-xs text-slate-400">Compte Principal récepteur : <strong className="text-indigo-400">{selectedUser?.name || 'Sélectionné'}</strong></p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Transfère l'ensemble des vidéos, contacts, abonnements, likes, demandes et abonnés du compte secondaire vers le compte principal, puis désactive le secondaire.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Email ou Username exact du compte secondaire :</label>
                <input
                  type="text"
                  value={mergeAccountEmail}
                  onChange={(e) => setMergeAccountEmail(e.target.value)}
                  placeholder="ex: duplicate@gmail.com ou @duplicate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleMergeAccounts}
                disabled={!mergeAccountEmail.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Exécuter la Fusion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL AFFICHAGE MOT DE PASSE TEMPORAIRE RÉINITIALISÉ */}
      {generatedPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nouveau Mot de Passe Généré</h3>
                <p className="text-xs text-slate-400">Pour : <strong className="text-emerald-400">{generatedPasswordModal.user.name}</strong></p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Le mot de passe a été mis à jour avec succès et envoyé par email sécurisé si le compte possède une adresse valide.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-5">
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Mot de passe temporaire à usage unique :</label>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-bold text-emerald-400 select-all tracking-wider">
                  {generatedPasswordModal.tempPass}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPasswordModal.tempPass);
                    setCopiedPassword(true);
                    setTimeout(() => setCopiedPassword(false), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {copiedPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setGeneratedPasswordModal(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};
