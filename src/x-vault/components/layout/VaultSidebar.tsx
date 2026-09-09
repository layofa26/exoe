import React from 'react';
import { 
  Users, 
  BarChart3, 
  FileText, 
  ShieldAlert, 
  DollarSign, 
  Bell, 
  Settings, 
  Lock,
  LogOut,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useVaultAuth } from '../../context/VaultAuthContext';
import { useVaultModule } from '../../context/VaultModuleContext';

export type VaultTab = 'overview' | 'users' | 'analytics' | 'content' | 'moderation' | 'monetization' | 'notifications' | 'settings' | 'trash';

interface VaultSidebarProps {
  currentTab: VaultTab;
  onSelectTab: (tab: VaultTab) => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { logout, adminUser } = useVaultAuth();
  const { activeModule } = useVaultModule();

  const navItems: { id: VaultTab; label: string; icon: React.FC<{ className?: string }>; badge?: string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Vue d\'Ensemble', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs & Pros', icon: Users, badge: '15 fn' },
    { id: 'analytics', label: 'Statistiques & Analytics', icon: BarChart3, badge: '15 fn' },
    { id: 'content', label: 'Gestion du Contenu', icon: FileText, badge: '15 fn' },
    { id: 'moderation', label: 'Signalements & Modération', icon: ShieldAlert, badge: '3', badgeColor: 'bg-rose-500' },
    { id: 'monetization', label: 'Monétisation & Finance', icon: DollarSign, badge: '15 fn', badgeColor: 'bg-emerald-500' },
    { id: 'notifications', label: 'Notifications & Broadcast', icon: Bell, badge: '15 fn' },
    { id: 'settings', label: 'Paramètres du Module', icon: Settings, badge: '15 fn' },
  ];

  // Corbeille Pro exclusive au module professionnel
  if (activeModule === 'pro') {
    navItems.push({
      id: 'trash',
      label: 'Corbeille Pro',
      icon: Trash2,
      badge: 'Corbeille',
      badgeColor: 'bg-rose-500'
    });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 border-b border-slate-800 flex items-center px-6 gap-3 bg-slate-950/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-sm">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <span className="font-extrabold text-white text-base tracking-wider">X-VAULT</span>
          <span className="block text-[10px] text-blue-400 font-medium uppercase tracking-widest">Admin Control</span>
        </div>
      </div>

      {/* Module Context Indicator */}
      <div className="p-3 mx-3 my-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scope Actif :</span>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${
            activeModule === 'pro' ? 'bg-blue-400' : activeModule === 'social' ? 'bg-purple-400' : 'bg-emerald-400'
          }`} />
          <span className="font-semibold text-white capitalize">
            {activeModule === 'pro' ? '🏢 Module Professionnel' : activeModule === 'social' ? '🌐 Module Social' : '💰 Monétisation & Finance'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  item.badgeColor 
                    ? `${item.badgeColor} text-white` 
                    : isActive 
                      ? 'bg-blue-700 text-blue-100' 
                      : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin User Footer & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
              AD
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{adminUser?.username || 'Super Admin'}</p>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Root Session
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Verrouiller et Quitter"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
