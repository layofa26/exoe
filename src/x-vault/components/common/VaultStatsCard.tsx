import React from 'react';
import { LucideIcon } from 'lucide-react';

interface VaultStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo' | 'cyan';
}

export const VaultStatsCard: React.FC<VaultStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
}) => {
  const schemeStylesMap = {
    blue: {
      border: 'border-blue-500/20',
      bgIcon: 'bg-blue-500/10 text-blue-400',
      glow: 'group-hover:border-blue-500/40',
    },
    emerald: {
      border: 'border-emerald-500/20',
      bgIcon: 'bg-emerald-500/10 text-emerald-400',
      glow: 'group-hover:border-emerald-500/40',
    },
    purple: {
      border: 'border-purple-500/20',
      bgIcon: 'bg-purple-500/10 text-purple-400',
      glow: 'group-hover:border-purple-500/40',
    },
    amber: {
      border: 'border-amber-500/20',
      bgIcon: 'bg-amber-500/10 text-amber-400',
      glow: 'group-hover:border-amber-500/40',
    },
    rose: {
      border: 'border-rose-500/20',
      bgIcon: 'bg-rose-500/10 text-rose-400',
      glow: 'group-hover:border-rose-500/40',
    },
    indigo: {
      border: 'border-indigo-500/20',
      bgIcon: 'bg-indigo-500/10 text-indigo-400',
      glow: 'group-hover:border-indigo-500/40',
    },
    cyan: {
      border: 'border-cyan-500/20',
      bgIcon: 'bg-cyan-500/10 text-cyan-400',
      glow: 'group-hover:border-cyan-500/40',
    },
  };

  const schemeStyles = schemeStylesMap[colorScheme] || schemeStylesMap.blue;

  return (
    <div className={`group bg-slate-900/90 border ${schemeStyles.border} ${schemeStyles.glow} rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="text-2xl font-black text-white mt-1 tracking-tight">{value}</div>
        </div>
        <div className={`p-2.5 rounded-xl ${schemeStyles.bgIcon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span className={`font-semibold ml-auto flex items-center gap-0.5 ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
