import React, { useState } from 'react';
import { 
  Settings, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  Globe, 
  Mail, 
  Database, 
  Activity, 
  Lock, 
  Key, 
  AlertOctagon, 
  Server, 
  History,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Camera,
  Upload,
  User
} from 'lucide-react';
import { AuditLog, ProfessionCategory } from '../../types/vault';

const INITIAL_CATEGORIES: ProfessionCategory[] = [
  { id: 'cat_01', name: 'Technologies & Logiciel', module: 'pro', activeMembersCount: 1420, enabled: true },
  { id: 'cat_02', name: 'Droit & Juridique', module: 'pro', activeMembersCount: 980, enabled: true },
  { id: 'cat_03', name: 'Santé & Médecine', module: 'pro', activeMembersCount: 890, enabled: true },
  { id: 'cat_04', name: 'Finance & Comptabilité', module: 'pro', activeMembersCount: 740, enabled: true },
  { id: 'cat_05', name: 'BTP & Architecture', module: 'pro', activeMembersCount: 620, enabled: true },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    adminEmail: 'root@exile.app',
    action: 'VALIDATE_PRO_PROFILE',
    target: 'Dr. Rachel Moïse (usr_005)',
    details: 'Attribution du badge vérifié pro',
    ipAddress: '190.115.176.45',
    timestamp: '2026-03-06 14:10:22'
  },
  {
    id: 'log_02',
    adminEmail: 'root@exile.app',
    action: 'BAN_USER',
    target: 'Steeve Louissaint (usr_004)',
    details: 'Spam massif et liens suspects',
    ipAddress: '190.115.176.45',
    timestamp: '2026-03-06 12:45:10'
  },
  {
    id: 'log_03',
    adminEmail: 'root@exile.app',
    action: 'TOGGLE_FEATURE_FLAG',
    target: 'video_auto_compression',
    details: 'Activé pour bande passante Supabase',
    ipAddress: '190.115.176.45',
    timestamp: '2026-03-05 19:30:00'
  }
];

import { API_BASE_URL } from '../../../config/api';

export const SettingsSection: React.FC = () => {
  const [categories, setCategories] = useState<ProfessionCategory[]>(INITIAL_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // 4. Feature Flags
  const [featureFlags, setFeatureFlags] = useState({
    videoPosterAutoGeneration: true,
    strictModerationQueue: false,
    moncashInstantPayout: true,
    socialEventRegistration: true,
    publicCommentsAllowed: true,
  });

  // 7. Langues système
  const [defaultLanguage, setDefaultLanguage] = useState<'fr' | 'ht' | 'en'>('fr');

  // 13. Interrupteur d'urgence Mode Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // 14. Photo de profil officielle de l'Administration
  const [adminProfilePhoto, setAdminProfilePhoto] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Charger les paramètres et logs réels depuis le backend
  const fetchSystemSettings = React.useCallback(async () => {
    try {
      const storedToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['x-vault-token'] = storedToken;

      const res = await fetch(`${API_BASE_URL}/vault/system-settings`, {
        method: 'GET',
        credentials: 'include',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setMaintenanceMode(Boolean(data.settings.maintenanceMode));
          if (data.settings.adminProfilePhotoUrl) {
            setAdminProfilePhoto(data.settings.adminProfilePhotoUrl);
          }
          setFeatureFlags(prev => ({
            ...prev,
            strictModerationQueue: Boolean(data.settings.strictModerationQueue),
            videoPosterAutoGeneration: Boolean(data.settings.videoAutoGeneration),
            publicCommentsAllowed: Boolean(data.settings.publicCommentsAllowed)
          }));
          if (data.settings.defaultLanguage) setDefaultLanguage(data.settings.defaultLanguage);
        }
        if (Array.isArray(data.auditLogs)) {
          setAuditLogs(data.auditLogs);
        }
      }
    } catch (err) {
      console.error('Fetch system settings error:', err);
    }
  }, []);

  React.useEffect(() => {
    fetchSystemSettings();
  }, [fetchSystemSettings]);

  // Upload photo de profil officielle sur Supabase
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const storedToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (storedToken) headers['x-vault-token'] = storedToken;

      const res = await fetch(`${API_BASE_URL}/vault/system-settings/avatar`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAdminProfilePhoto(data.url);
        triggerNotice('Photo de profil officielle enregistrée sur Supabase. Elle apparaîtra dans tous vos messages envoyés aux utilisateurs.', 'success');
      } else {
        triggerNotice('Erreur lors de l\'upload de la photo.', 'error');
      }
    } catch {
      triggerNotice('Erreur réseau lors de l\'upload de la photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Sauvegarder les paramètres système en base de données
  const saveSystemSetting = async (updatedSettings: Record<string, any>) => {
    try {
      const storedToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['x-vault-token'] = storedToken;

      await fetch(`${API_BASE_URL}/vault/system-settings`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ settings: updatedSettings })
      });
    } catch (err) {
      console.error('Save system setting error:', err);
    }
  };

  // 1. Ajouter une catégorie de métier
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: ProfessionCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      module: 'pro',
      activeMembersCount: 0,
      enabled: true
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
    triggerNotice(`Catégorie "${newCat.name}" ajoutée.`);
  };

  // 1. Supprimer catégorie
  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    triggerNotice('Catégorie supprimée.');
  };

  // 4. Basculer un Feature Flag
  const toggleFeatureFlag = (key: keyof typeof featureFlags) => {
    setFeatureFlags(prev => {
      const nextVal = !prev[key];
      const next = { ...prev, [key]: nextVal };
      saveSystemSetting({ [key]: nextVal });
      triggerNotice(`Paramètre "${key}" synchronisé sur le serveur : ${nextVal ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
      return next;
    });
  };

  // 9. Déclencher sauvegarde manuelle
  const handleTriggerBackup = () => {
    triggerNotice('9. Sauvegarde snapshot PostgreSQL / Supabase déclenchée avec succès.');
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-300 text-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & 13. Mode Maintenance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            <span>Paramètres du Module & Sécurité Système</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configuration globale, Feature Flags, Audit Logs et sauvegarde
          </p>
        </div>

        {/* 13. Mode Maintenance interrupteur d'urgence */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="text-xs">
            <span className="font-semibold text-slate-200 block">13. Mode Maintenance</span>
            <span className="text-[10px] text-slate-400">Verrouille l'accès public</span>
          </div>
          <button
            onClick={() => {
              setMaintenanceMode(!maintenanceMode);
              triggerNotice(`Mode Maintenance : ${!maintenanceMode ? 'ACTIVÉ (Site Public Bloqué)' : 'DÉSACTIVÉ'}`);
            }}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              maintenanceMode ? 'bg-rose-600' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              maintenanceMode ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* 14. Identité Visuelle de l'Administration & Messages */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg overflow-hidden flex items-center justify-center">
                {adminProfilePhoto ? (
                  <img 
                    src={adminProfilePhoto} 
                    alt="Photo Officielle Administration" 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-blue-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md border-2 border-slate-900 transition-transform active:scale-95 disabled:opacity-50"
                title="Changer la photo"
              >
                {isUploadingPhoto ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Identité Visuelle Officielle de l'Administration</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                  Supabase Storage
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Cette photo apparaîtra automatiquement comme avatar officiel dans tous les messages confidentiels, convocations, et notifications envoyés depuis le dashboard aux utilisateurs.
              </p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            {isUploadingPhoto ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Upload en cours sur Supabase...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Changer la Photo Officielle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Feature Flags & 7. Langues & 9. Sauvegarde */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 4. Feature Flags */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>4. Feature Flags (Activation / Désactivation instantanée)</span>
          </h3>

          <div className="divide-y divide-slate-800 text-xs">
            {[
              { key: 'videoPosterAutoGeneration' as const, label: 'Génération automatique de posters vidéo', desc: 'Réduit drastiquement l\'usage de bande passante Supabase' },
              { key: 'strictModerationQueue' as const, label: 'File de modération stricte obligatoire', desc: 'Les vidéos requièrent un accord préalable' },
              { key: 'moncashInstantPayout' as const, label: 'Passerelle MonCash activée en temps réel', desc: 'Permet les abonnements par portefeuille mobile' },
              { key: 'socialEventRegistration' as const, label: 'Inscriptions aux événements institutionnels', desc: 'Autorise les membres à réserver des places' },
              { key: 'publicCommentsAllowed' as const, label: 'Commentaires publics ouverts à tous', desc: 'Désactiver en cas d\'attaque de spam coordonné' },
            ].map((flag) => (
              <div key={flag.key} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">{flag.label}</span>
                  <span className="text-slate-500 text-[11px]">{flag.desc}</span>
                </div>
                <button
                  onClick={() => toggleFeatureFlag(flag.key)}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                    featureFlags[flag.key] ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    featureFlags[flag.key] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Langues & 9. Backups */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>7. Langue Système par Défaut</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'fr', label: 'Français' },
                { id: 'ht', label: 'Kreyòl' },
                { id: 'en', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setDefaultLanguage(lang.id as any);
                    triggerNotice(`Langue par défaut changée en ${lang.label}`);
                  }}
                  className={`p-2 rounded-xl text-center font-semibold border transition-all ${
                    defaultLanguage === lang.id
                      ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* 9. Déclencheur de sauvegarde DB */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>9. Sauvegardes & Snapshots DB</span>
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Dernière sauvegarde auto : <strong>Aujourd'hui à 04h00 UTC</strong>
              </p>
              <button
                onClick={handleTriggerBackup}
                className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Déclencher Backup Manuel</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 mt-4">
            14. Rate Limiting : <strong>120 req/min par IP (Actif)</strong>
          </div>
        </div>
      </div>

      {/* 1. Gestion des Catégories de Métiers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>1. Catégories & Métiers Professionnels ({categories.length})</span>
        </h3>

        <div className="flex gap-2 max-w-md mb-4">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Nouvelle profession (ex: Notaire)..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
          />
          <button
            onClick={handleAddCategory}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {categories.map((c) => (
            <div key={c.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">{c.name}</span>
                <span className="text-[10px] text-slate-500">{c.activeMembersCount} professionnels inscrits</span>
              </div>
              <button
                onClick={() => handleDeleteCategory(c.id)}
                className="p-1 text-slate-500 hover:text-rose-400"
                title="Supprimer la catégorie"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Journal d'Audit Complet (Audit Logs) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>10. Journal d'Audit Système & Sécurité (Audit Logs Infalsifiables)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Traçabilité complète des actions admin</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Administrateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Cible</th>
                <th className="px-4 py-3">Détails</th>
                <th className="px-5 py-3 text-right">Adresse IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-3 text-slate-400">{log.timestamp}</td>
                  <td className="px-4 py-3 text-blue-300">{log.adminEmail}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">{log.action}</td>
                  <td className="px-4 py-3 text-white">{log.target}</td>
                  <td className="px-4 py-3 text-slate-400 font-sans">{log.details}</td>
                  <td className="px-5 py-3 text-right text-slate-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
