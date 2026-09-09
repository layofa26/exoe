import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  BarChart3, 
  FileText, 
  ShieldAlert, 
  DollarSign, 
  Radio, 
  ArrowUpRight,
  TrendingUp,
  Award,
  Sparkles,
  RefreshCw,
  Video
} from 'lucide-react';
import { VaultStatsCard } from '../components/common/VaultStatsCard';
import { useVaultModule } from '../context/VaultModuleContext';
import { VaultTab } from '../components/layout/VaultSidebar';
import { API_BASE_URL } from '../../config/api';
import { useVaultWebSocket } from '../hooks/useVaultWebSocket';
import { vaultCache } from '../utils/vaultCache';


interface VaultOverviewProps {
  onNavigateTab: (tab: VaultTab) => void;
}

export const VaultOverview: React.FC<VaultOverviewProps> = ({ onNavigateTab }) => {
  const { activeModule } = useVaultModule();
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    onlineCount: 0,
    totalVideos: 0,
    totalViews: 0,
    pendingReports: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverviewStats = useCallback(async () => {
    const cached = vaultCache.get<any>('vault_overview_stats');
    if (cached) {
      setStats(cached);
      setIsLoading(false);
    }

    try {
      const storedToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['x-vault-token'] = storedToken;

      const res = await fetch(`${API_BASE_URL}/vault/overview-stats`, {
        method: 'GET',
        credentials: 'include',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        const nextStats = {
          totalUsers: data.totalUsers ?? 0,
          proUsers: data.proUsers ?? 0,
          onlineCount: data.onlineCount ?? 0,
          totalVideos: data.totalVideos ?? 0,
          totalViews: data.totalViews ?? 0,
          pendingReports: data.pendingReports ?? 0
        };
        setStats(nextStats);
        vaultCache.set('vault_overview_stats', nextStats, 180000);
      }
    } catch (err) {
      console.error('Error fetching overview stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { isConnected } = useVaultWebSocket({
    onEvent: (event) => {
      // Dès qu'un événement système arrive (changement statut, nouvel inscrit, etc.)
      // Recharger instantanément les stats sans attendre
      if (event.type === 'online_count_update' && typeof event.data?.onlineCount === 'number') {
        setStats(prev => ({ ...prev, onlineCount: event.data.onlineCount }));
      } else if (['user_status_changed', 'new_user_registered', 'user_badge_updated', 'vault_update'].includes(event.type)) {
        vaultCache.invalidate('vault_overview_stats');
        fetchOverviewStats();
      }
    }
  });

  useEffect(() => {
    fetchOverviewStats();
    // Polling de sécurité d'arrière-plan très allégé (5 minutes au lieu de 20s) uniquement en fallback si déconnecté
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchOverviewStats();
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchOverviewStats, isConnected]);


  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/20 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                X-VAULT COMMAND CENTER
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Plateforme Opérationnelle
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Tableau de Bord Central — Mode {
                activeModule === 'pro' ? '🏢 Professionnel' : activeModule === 'social' ? '🌐 Social' : '💰 Monétisation'
              }
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Surveillance proactive en temps réel des utilisateurs, contenus et signalements de votre base de données.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('users')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Gérer les Utilisateurs</span>
            </button>
            <button
              onClick={() => onNavigateTab('moderation')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Signalements ({stats.pendingReports})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VaultStatsCard
          title="Total Utilisateurs"
          value={isLoading ? "..." : stats.totalUsers.toLocaleString()}
          subtitle={`dont ${stats.proUsers} Professionnels`}
          icon={Users}
          trend={{ value: "Base SQL Réelle", isPositive: true }}
          colorScheme="blue"
        />

        <VaultStatsCard
          title="En Ligne en Direct"
          value={isLoading ? "..." : String(stats.onlineCount)}
          subtitle="Activité récente vérifiée"
          icon={Radio}
          trend={{ value: "Temps réel", isPositive: true }}
          colorScheme="emerald"
        />

        <VaultStatsCard
          title="Total Vidéos & Vues"
          value={isLoading ? "..." : `${stats.totalVideos} Vidéos`}
          subtitle={`${stats.totalViews.toLocaleString()} Vues cumulées`}
          icon={Video}
          trend={{ value: "Base Réelle", isPositive: true }}
          colorScheme="purple"
        />

        <VaultStatsCard
          title="Signalements en Attente"
          value={isLoading ? "..." : String(stats.pendingReports)}
          subtitle="Bugs & Réclamations ouverts"
          icon={ShieldAlert}
          trend={{ value: stats.pendingReports === 0 ? "Sous contrôle" : "À traiter", isPositive: stats.pendingReports === 0 }}
          colorScheme="rose"
        />
      </div>

      {/* Accès Rapide aux 7 Saisons */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Accès Direct aux 7 Pôles d'Administration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'users' as VaultTab,
              title: '1. Gestion des Utilisateurs',
              desc: 'Validation des profils, bannissements, fusion de comptes, export CSV.',
              icon: Users,
              color: 'text-blue-400'
            },
            {
              id: 'analytics' as VaultTab,
              title: '2. Statistiques & Analytics',
              desc: 'Taux de rétention, pics horaires, géographie, export PDF & Excel.',
              icon: BarChart3,
              color: 'text-indigo-400'
            },
            {
              id: 'content' as VaultTab,
              title: '3. Gestion du Contenu',
              desc: 'Modération des posts/vidéos, épinglage, approbation stricte, mots bannis.',
              icon: FileText,
              color: 'text-cyan-400'
            },
            {
              id: 'moderation' as VaultTab,
              title: '4. Signalements & Modération',
              desc: 'Queue de signalements, sanctions progressives, blacklist et notes.',
              icon: ShieldAlert,
              color: 'text-rose-400'
            },
            {
              id: 'monetization' as VaultTab,
              title: '5. Monétisation & Finance',
              desc: 'Abonnés Premium, MonCash, gestion des codes promo, factures PDF.',
              icon: DollarSign,
              color: 'text-emerald-400'
            },
            {
              id: 'notifications' as VaultTab,
              title: '6. Notifications & Broadcast',
              desc: 'Push notifications ciblées, programmation, bannières in-app.',
              icon: Sparkles,
              color: 'text-purple-400'
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigateTab(card.id)}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60">
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                  <span>Ouvrir les 15 fonctions</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
