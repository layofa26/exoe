import React from 'react';
import { 
  Building2, 
  Share2, 
  DollarSign, 
  Bell, 
  Search, 
  ShieldCheck, 
  Radio,
  ExternalLink
} from 'lucide-react';
import { useVaultModule } from '../../context/VaultModuleContext';
import { ActiveModule } from '../../types/vault';
import { useVaultWebSocket } from '../../hooks/useVaultWebSocket';

interface VaultNavbarProps {
  onOpenQuickSearch?: () => void;
}

export const VaultNavbar: React.FC<VaultNavbarProps> = ({ onOpenQuickSearch }) => {
  const { activeModule, setActiveModule } = useVaultModule();
  const [onlineCount, setOnlineCount] = React.useState<number>(0);

  const { isConnected } = useVaultWebSocket({
    onEvent: (event) => {
      if (event.type === 'online_count_update' && typeof event.data?.onlineCount === 'number') {
        setOnlineCount(event.data.onlineCount);
      }
    }
  });

  const moduleButtons: { id: ActiveModule; label: string; icon: React.FC<{ className?: string }>; activeColor: string }[] = [
    { 
      id: 'pro', 
      label: 'Professionnel', 
      icon: Building2, 
      activeColor: 'bg-blue-600 text-white shadow-blue-500/20' 
    },
    { 
      id: 'social', 
      label: 'Social', 
      icon: Share2, 
      activeColor: 'bg-purple-600 text-white shadow-purple-500/20' 
    },
    { 
      id: 'monetization', 
      label: 'Monétisation', 
      icon: DollarSign, 
      activeColor: 'bg-emerald-600 text-white shadow-emerald-500/20' 
    }
  ];

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20">
      {/* Dynamic Module Switch */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:inline">
          Module :
        </span>
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {moduleButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = activeModule === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setActiveModule(btn.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                  isActive 
                    ? btn.activeColor 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center/Right controls */}
      <div className="flex items-center gap-3">
        {/* Live system ping status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-xs font-mono">
          <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isConnected ? 'animate-pulse' : 'opacity-40'}`} />
          <span>VAULT LIVE: {onlineCount} en ligne</span>
        </div>

        {/* Return to main app (in new tab) */}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
          title="Ouvrir le site public EXILE dans un nouvel onglet"
        >
          <span>EXILE Client</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline text-[11px]">Vault v2.4 Encrypted</span>
        </div>
      </div>
    </header>
  );
};
