import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Users, 
  FileText, 
  ShieldAlert, 
  Clock, 
  AlertOctagon,
  Ban,
  Filter
} from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';

interface TrashItem {
  id: number;
  itemId: string;
  itemType: 'banned_pro' | 'deleted_pro_profile' | 'deleted_pro_content';
  title: string;
  subtitle: string;
  reason: string;
  deletedBy: string;
  createdAt: string;
}

export const TrashSection: React.FC = () => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'banned_pro' | 'deleted_pro_profile' | 'deleted_pro_content'>('all');
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [bannedCount, setBannedCount] = useState(0);
  const [profilesCount, setProfilesCount] = useState(0);
  const [contentsCount, setContentsCount] = useState(0);

  // Modals
  const [confirmPurgeItem, setConfirmPurgeItem] = useState<TrashItem | null>(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const triggerNotice = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 4500);
  };

  const getVaultHeaders = (): Record<string, string> => {
    const storedToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
    const authToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (storedToken) headers['x-vault-token'] = storedToken;
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  };

  const fetchTrashItems = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const url = new URL(`${API_BASE_URL}/vault/trash`, baseUrl);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());
      if (typeFilter !== 'all') url.searchParams.set('type', typeFilter);

      const res = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: getVaultHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalCount(data.totalCount || 0);
        setBannedCount(data.bannedCount || 0);
        setProfilesCount(data.profilesCount || 0);
        setContentsCount(data.contentsCount || 0);
      } else {
        triggerNotice('Erreur lors du chargement de la corbeille.', 'error');
      }
    } catch (err) {
      console.error('Fetch trash error:', err);
      triggerNotice('Connexion au serveur backend échouée.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    fetchTrashItems();
  }, [fetchTrashItems]);

  // Action : Restaurer un élément
  const handleRestoreItem = async (item: TrashItem) => {
    setIsActionPending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/trash/${item.id}/restore`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotice(data.message || `${item.title} restauré avec succès !`, 'success');
        fetchTrashItems(true);
      } else {
        triggerNotice(data.error || 'Erreur lors de la restauration.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors de la restauration.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  // Action : Supprimer définitivement un élément (Purge)
  const handleConfirmPurge = async () => {
    if (!confirmPurgeItem) return;
    setIsActionPending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/trash/${confirmPurgeItem.id}/purge`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotice(data.message || 'Élément purgé définitivement.', 'error');
        setConfirmPurgeItem(null);
        fetchTrashItems(true);
      } else {
        triggerNotice(data.error || 'Erreur lors de la suppression définitive.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors de la purge.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  // Action : Vider la corbeille
  const handleConfirmEmptyTrash = async () => {
    setIsActionPending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/trash/empty`, {
        method: 'POST',
        credentials: 'include',
        headers: getVaultHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotice(data.message || 'Corbeille vidée avec succès.', 'info');
        setConfirmEmptyTrash(false);
        fetchTrashItems(true);
      } else {
        triggerNotice(data.error || 'Erreur lors du vidage de la corbeille.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors du vidage.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case 'banned_pro':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Ban className="w-3 h-3" />
            <span>Bannissement Définitif</span>
          </span>
        );
      case 'deleted_pro_profile':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Users className="w-3 h-3" />
            <span>Profil Pro Supprimé</span>
          </span>
        );
      case 'deleted_pro_content':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileText className="w-3 h-3" />
            <span>Contenu Pro Supprimé</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notice */}
      {actionNotice && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold transition-all ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' 
            : actionNotice.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-300'
              : 'bg-blue-950/90 border-blue-500/40 text-blue-300'
        }`}>
          {actionNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {actionNotice.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {actionNotice.type === 'info' && <ShieldAlert className="w-4 h-4 text-blue-400" />}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Corbeille Professionnelle</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Module Pro Exclusif
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestion sécurisée des professionnels bannis définitivement et des suppressions avec restauration immédiate ou purge irréversible.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTrashItems()}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
            title="Rafraîchir la corbeille"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {items.length > 0 && (
            <button
              onClick={() => setConfirmEmptyTrash(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all shadow-lg shadow-rose-900/10"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Vider la Corbeille ({items.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total en Corbeille</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{totalCount}</div>
          <span className="text-[11px] text-slate-500">Éléments en rétention temporaire</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pros Bannis Définitivement</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400">{bannedCount}</div>
          <span className="text-[11px] text-slate-500">Comptes avec sanction permanente</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Profils Pro Supprimés</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-orange-400">{profilesCount}</div>
          <span className="text-[11px] text-slate-500">Soft-delete restaurables</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Contenus Supprimés</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-400">{contentsCount}</div>
          <span className="text-[11px] text-slate-500">Vidéos et publications pro</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, motif..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
          <div className="grid grid-cols-4 sm:flex sm:items-center gap-1.5 w-full">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'banned_pro', label: 'Bannis' },
              { id: 'deleted_pro_profile', label: 'Profils' },
              { id: 'deleted_pro_content', label: 'Contenus' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  typeFilter === tab.id
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Trash Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Élément Mis en Corbeille</th>
                <th className="px-4 py-3.5">Type de Corbeille</th>
                <th className="px-4 py-3.5">Motif Enregistré</th>
                <th className="px-4 py-3.5">Date & Auteur</th>
                <th className="px-5 py-3.5 text-right">Actions Disponibles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-7 h-7 animate-spin text-rose-500" />
                      <span className="text-sm font-medium">Chargement des éléments de la corbeille pro...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-600">
                        <Trash2 className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-slate-400">La corbeille professionnelle est vide.</span>
                      <span className="text-xs text-slate-600 max-w-sm">
                        Les comptes pro bannis définitivement et les suppressions de profils apparaîtront ici avec possibilité de les restaurer.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">#{item.itemId}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {getItemTypeBadge(item.itemType)}
                    </td>

                    <td className="px-4 py-4 text-xs">
                      <span className="text-slate-300 line-clamp-2 max-w-xs">
                        {item.reason}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs">
                      <div className="text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{item.createdAt}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Par : {item.deletedBy}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Restaurer */}
                        <button
                          onClick={() => handleRestoreItem(item)}
                          disabled={isActionPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                          title="Restaurer cet élément et réactiver le compte"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurer</span>
                        </button>

                        {/* Purger Définitivement */}
                        <button
                          onClick={() => setConfirmPurgeItem(item)}
                          disabled={isActionPending}
                          className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-50"
                          title="Supprimer définitivement de la base"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CONFIRMATION PURGE (SUPPRESSION DEFINITIVE) */}
      {confirmPurgeItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Suppression Définitive</h3>
                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Action Irréversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Êtes-vous absolument sûr de vouloir purger définitivement <strong className="text-white">{confirmPurgeItem.title}</strong> de la base de données ? 
              Toutes les données associées seront détruites et ne pourront plus être restaurées.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-6 text-xs text-slate-400 font-mono">
              Type : {confirmPurgeItem.itemType} • ID : {confirmPurgeItem.itemId}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmPurgeItem(null)}
                disabled={isActionPending}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmPurge}
                disabled={isActionPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-900/30 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purger Définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIDER LA CORBEILLE */}
      {confirmEmptyTrash && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Vider toute la corbeille pro</h3>
                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Suppression collective</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Cette opération va purger définitivement les <strong className="text-white">{items.length} éléments</strong> présents dans la corbeille pro. 
              Cette action est irréversible et sera enregistrée dans le journal d'audit de sécurité.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmEmptyTrash(false)}
                disabled={isActionPending}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmEmptyTrash}
                disabled={isActionPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-900/30 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider la corbeille maintenant</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
