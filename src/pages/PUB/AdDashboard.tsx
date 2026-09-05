// ============================================================
// EXILE Platform — PUB/AdDashboard.tsx
// Dashboard de gestion des campagnes publicitaires
// Sécurisé & Obfusqué · Import Logo & Confirmation Modal
// ============================================================

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, Megaphone, Plus, Upload, AlertTriangle, CheckCircle2, Trash2, PauseCircle, PlayCircle, Edit3, Lock, Key, Shield, LogOut, Mail, Phone, MessageSquare, RotateCcw, Settings, RefreshCw, Loader2 } from "lucide-react";
import { type Ad, type AdStatus, getStoredAds, saveStoredAds, fetchRemoteAds } from "./AdBanner";
import { useTheme } from "../../contexts/ThemeContext";
import { triggerPubNotification } from "../../services/pubNotificationService";

import { API_BASE_URL } from "../../config/api";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function fmtCurrency(n: number, currency: string = "HTG") {
  const symbolMap: Record<string, string> = {
    HTG: "HTG ",
    USD: "$",
    EUR: "€",
    CAD: "CAD $"
  };
  const symbol = symbolMap[currency] || `${currency} `;
  return `${symbol}${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}`;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString("fr-FR");
}

function ctr(clicks: number, impressions: number) {
  if (!impressions) return "0%";
  return ((clicks / impressions) * 100).toFixed(2) + "%";
}

function progressPct(spent: number, budget: number) {
  return Math.min((spent / (budget || 1)) * 100, 100);
}

const STATUS_LABELS: Record<AdStatus, string> = {
  active: "Active",
  paused: "En pause",
  ended: "Terminée",
};

function getStatusColors(resolvedTheme: string | undefined, status: AdStatus): string {
  switch (status) {
    case "active": return resolvedTheme === 'dark' ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-100 text-emerald-700";
    case "paused": return resolvedTheme === 'dark' ? "bg-amber-900/40 text-amber-400" : "bg-amber-100 text-amber-700";
    case "ended": return resolvedTheme === 'dark' ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500";
    default: return "";
  }
}

function StatCard({ label, value, sub, accent, resolvedTheme }: { label: string; value: string; sub?: string; accent?: string; resolvedTheme?: string | undefined }) {
  return (
    <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-5 shadow-sm`}>
      <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wide mb-2`}>{label}</p>
      <p className={`text-2xl font-bold ${accent ?? (resolvedTheme === 'dark' ? 'text-zinc-100' : 'text-zinc-900')}`}>{value}</p>
      {sub && <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} mt-1`}>{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL : CONFIRMATION D'ACTION (Supprimer, Mettre en pause, Modifier)
// ─────────────────────────────────────────────────────────────

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  resolvedTheme?: string;
}

function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = "Annuler",
  danger = false,
  onConfirm,
  onCancel,
  resolvedTheme,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200'} border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className="text-xs text-zinc-400">Action sécurisée</p>
          </div>
        </div>

        <p className={`text-xs leading-relaxed ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {message}
        </p>

        <div className="flex gap-2 pt-2 justify-end">
          <button
            onClick={onCancel}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'} transition-colors`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL : Créer / Modifier une campagne
// ─────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = ["Technologie", "Commerce", "Finance", "Santé", "Éducation", "Mode", "Alimentation", "Services", "Autre"];
const CURRENCY_OPTIONS = [
  { code: "HTG", label: "Gourdes (HTG)" },
  { code: "USD", label: "Dollar US ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "CAD", label: "Dollar Canadien (CAD $)" }
];

const GRADIENT_OPTIONS = [
  { label: "Bleu → Cyan",     value: "from-blue-600 to-cyan-500" },
  { label: "Ambre → Orange",  value: "from-amber-500 to-orange-600" },
  { label: "Vert → Teal",     value: "from-emerald-500 to-teal-600" },
  { label: "Rose → Fuchsia",  value: "from-rose-500 to-fuchsia-600" },
  { label: "Violet → Indigo", value: "from-violet-600 to-indigo-600" },
  { label: "Slate → Zinc",    value: "from-slate-600 to-zinc-700" },
];

interface CampaignFormData {
  brandName: string;
  brandInitials: string;
  brandColor: string;
  brandLogo: string;
  tagline: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaTextColor: string;
  ctaBgColor: string;
  bgType: "color" | "gradient" | "media";
  bgColor: string;
  bgMediaUrl: string;
  bgVideoUrl: string;
  gradient: string;
  category: string;
  targetAudience: "all" | "interests";
  targetInterests: string[];
  budget: string;
  currency: string;
  exchangeRate: string;
  targetViews: string;
  startDate: string;
  endDate: string;
}

const INTERESTS_LIST = [
  "Technologie", "Entrepreneuriat", "Design & Création", 
  "Musique & Audio", "Finance & Crypto", "Santé & Bien-être", 
  "E-commerce", "Éducation", "Mode & Lifestyle"
];

const EMPTY_FORM: CampaignFormData = {
  brandName: "", brandInitials: "", brandColor: "#2563eb", brandLogo: "",
  tagline: "", description: "", ctaLabel: "En savoir plus",
  ctaUrl: "https://", ctaTextColor: "#ffffff", ctaBgColor: "#FF6B00",
  bgType: "gradient", bgColor: "#2563eb", bgMediaUrl: "", bgVideoUrl: "",
  gradient: GRADIENT_OPTIONS[0].value,
  category: CATEGORY_OPTIONS[0],
  targetAudience: "all",
  targetInterests: [],
  budget: "1000",
  currency: "HTG", exchangeRate: "1 USD = 132 HTG",
  targetViews: "10000",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
};

function CampaignModal({
  initial,
  isConverting = false,
  onSave,
  onClose,
  resolvedTheme,
}: {
  initial?: Ad;
  isConverting?: boolean;
  onSave: (adData: any) => void;
  onClose: () => void;
  resolvedTheme?: string | undefined;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CampaignFormData>(
    initial
      ? {
          brandName: initial.brandName || "",
          brandInitials: initial.brandInitials || "",
          brandColor: initial.brandColor || "#2563eb",
          brandLogo: initial.brandLogo || "",
          tagline: initial.tagline || "",
          description: initial.description || "",
          ctaLabel: initial.ctaLabel || "En savoir plus",
          ctaUrl: initial.ctaUrl || "https://",
          ctaTextColor: initial.ctaTextColor || "#ffffff",
          ctaBgColor: initial.ctaBgColor || "#FF6B00",
          bgType: initial.bgType || (initial.bgMediaUrl ? "media" : initial.gradient ? "gradient" : "color"),
          bgColor: initial.bgColor || initial.brandColor || "#2563eb",
          bgMediaUrl: initial.bgMediaUrl || initial.bgVideoUrl || "",
          bgVideoUrl: initial.bgVideoUrl || initial.bgMediaUrl || "",
          gradient: initial.gradient || "",
          category: initial.category || CATEGORY_OPTIONS[0],
          targetAudience: initial.targetAudience || "all",
          targetInterests: initial.targetInterests || [],
          budget: String(initial.budget || "1000"),
          currency: initial.currency || "HTG",
          exchangeRate: initial.exchangeRate || "1 USD = 132 HTG",
          targetViews: String(initial.targetViews || "10000"),
          startDate: initial.startDate || new Date().toISOString().split("T")[0],
          endDate: initial.endDate ?? "",
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<CampaignFormData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const set = (k: keyof CampaignFormData, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setSubmitError(null);
  };

  // Importer un média d'arrière-plan (GIF, Vidéo, Image) vers Supabase Storage
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setSubmitError("Le fichier ne doit pas dépasser 50 Mo");
      return;
    }

    setIsUploadingMedia(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/pub/annonces/upload/`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          set("bgMediaUrl", json.url);
          set("bgVideoUrl", json.url);
          set("bgType", "media");
          setIsUploadingMedia(false);
          return;
        }
      }
      throw new Error("Échec de l'upload distant");
    } catch {
      // Fallback base64 local si le réseau échoue
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const res = event.target.result as string;
          set("bgMediaUrl", res);
          set("bgVideoUrl", res);
          set("bgType", "media");
        }
        setIsUploadingMedia(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Importer un logo personnalisé vers Supabase Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("L'image du logo est trop lourde (max 10Mo)");
      return;
    }

    setIsUploadingLogo(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/pub/annonces/upload/`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          set("brandLogo", json.url);
          setIsUploadingLogo(false);
          return;
        }
      }
      throw new Error("Échec upload logo");
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          set("brandLogo", event.target.result as string);
        }
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const e: Partial<CampaignFormData> = {};
    if (!form.brandName.trim()) e.brandName = "Requis";
    if (!form.brandInitials.trim()) e.brandInitials = "Requis";
    if (!form.ctaLabel.trim()) e.ctaLabel = "Requis";
    if (Number(form.budget) <= 0) e.budget = "Budget valide requis";
    if (!form.startDate) e.startDate = "Requis";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setSubmitError("Veuillez remplir les champs obligatoires (*)");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validate()) {
      const finalTagline = form.tagline.trim() || `${form.brandName} - Solutions & Services Pro`;
      onSave({
        ...form,
        tagline: finalTagline
      });
    }
  };

  const previewGrad = form.gradient;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Modifier la campagne" : "Nouvelle campagne"}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200'} border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} border-b px-6 py-4 flex items-center justify-between rounded-t-3xl z-10`}>
          <h2 className="text-base font-bold">
            {initial ? "Modifier la campagne publicitaire" : "Lancer une nouvelle campagne (PUB)"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className={`w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 ${resolvedTheme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-colors`}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">

          {submitError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold rounded-xl text-center">
              {submitError}
            </div>
          )}

          {/* Aperçu live avec Logo personnalisable */}
          <div className={`relative rounded-2xl bg-gradient-to-r ${previewGrad} p-5 overflow-hidden shadow-lg`}>
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="flex items-center gap-3">
              {form.brandLogo ? (
                <img
                  src={form.brandLogo}
                  alt={form.brandName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white/30 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0">
                  {form.brandInitials || "??"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold opacity-80">{form.category}</p>
                <p className="text-white text-base font-bold leading-tight">{form.brandName || "Nom de votre marque"}</p>
              </div>
            </div>
            <p className="text-white text-sm font-semibold mt-3">{form.tagline || "Votre accroche percutante ici"}</p>
            {form.description && <p className="text-white/80 text-xs mt-1">{form.description}</p>}
          </div>

          {/* Section : Marque & Logo Personnalisé */}
          <fieldset>
            <legend className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-wide mb-3`}>Informations Marque & Logo Personnalisé</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Nom de la marque *</label>
                <input value={form.brandName} onChange={e => set("brandName", e.target.value)}
                  placeholder="ex: TechHaïti / DigiFinance"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.brandName && <p className="text-xs text-red-500 mt-1">{errors.brandName}</p>}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Initiales (2 lettres) *</label>
                <input value={form.brandInitials} onChange={e => set("brandInitials", e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="TH" maxLength={2}
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.brandInitials && <p className="text-xs text-red-500 mt-1">{errors.brandInitials}</p>}
              </div>

              {/* Import Logo Image */}
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-medium block">Logo de l'entreprise (Importer un logo)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors ${
                      resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                    } disabled:opacity-50`}
                  >
                    {isUploadingLogo ? <Loader2 size={14} className="animate-spin text-[#FF6B00]" /> : <Upload size={14} />}
                    <span>{isUploadingLogo ? "Téléversement Supabase..." : "Téléverser mon logo image"}</span>
                  </button>

                  {form.brandLogo && (
                    <div className="flex items-center gap-2">
                      <img src={form.brandLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover border" />
                      <button
                        type="button"
                        onClick={() => set("brandLogo", "")}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={form.brandLogo}
                  onChange={e => set("brandLogo", e.target.value)}
                  placeholder="Ou collez l'URL directe de votre logo (https://...)"
                  className={`w-full px-3 py-2 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-700'} text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>
          </fieldset>

          {/* Section : Message Publicitaire */}
          <fieldset>
            <legend className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-wide mb-3`}>Message Publicitaire</legend>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 flex justify-between">
                  <span>Accroche (Tagline)</span>
                  <span className={form.tagline.length > 60 ? "text-red-500" : "text-zinc-400"}>{form.tagline.length}/60</span>
                </label>
                <input value={form.tagline} onChange={e => set("tagline", e.target.value)}
                  placeholder="Le futur du numérique commence ici."
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 flex justify-between">
                  <span>Description</span>
                  <span className={form.description.length > 120 ? "text-red-500" : "text-zinc-400"}>{form.description.length}/120</span>
                </label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  rows={2} placeholder="Description courte de votre offre…"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">Texte du bouton *</label>
                  <input value={form.ctaLabel} onChange={e => set("ctaLabel", e.target.value)}
                    placeholder="Visiter / Découvrir"
                    className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                  {errors.ctaLabel && <p className="text-xs text-red-500 mt-1">{errors.ctaLabel}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">URL de destination *</label>
                  <input value={form.ctaUrl} onChange={e => set("ctaUrl", e.target.value)}
                    placeholder="https://votre-site.com"
                    className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                </div>
              </div>

              {/* Personnalisation des Couleurs du Bouton */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-medium mb-1 block">Couleur du Fond du Bouton</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.ctaBgColor || "#FF6B00"}
                      onChange={e => set("ctaBgColor", e.target.value)}
                      className="w-10 h-10 rounded-xl border-0 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={form.ctaBgColor || "#FF6B00"}
                      onChange={e => set("ctaBgColor", e.target.value)}
                      placeholder="#FF6B00"
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Couleur du Texte du Bouton</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.ctaTextColor || "#ffffff"}
                      onChange={e => set("ctaTextColor", e.target.value)}
                      className="w-10 h-10 rounded-xl border-0 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={form.ctaTextColor || "#ffffff"}
                      onChange={e => set("ctaTextColor", e.target.value)}
                      placeholder="#ffffff"
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Sélecteur de style d'arrière-plan complet : Couleur Unie, Dégradé, ou Média GIF/Image/Vidéo */}
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Arrière-Plan (Couleur de Fond / Média)
                  </label>
                  <div className="flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800 gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        set("bgType", "color");
                        set("gradient", "");
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        form.bgType === "color"
                          ? "bg-white dark:bg-zinc-700 text-[#FF6B00] shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      Couleur Unie
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        set("bgType", "gradient");
                        if (!form.gradient) set("gradient", GRADIENT_OPTIONS[0].value);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        form.bgType === "gradient"
                          ? "bg-white dark:bg-zinc-700 text-[#FF6B00] shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      Dégradé
                    </button>
                    <button
                      type="button"
                      onClick={() => set("bgType", "media")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        form.bgType === "media"
                          ? "bg-white dark:bg-zinc-700 text-[#FF6B00] shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      GIF / Image / Vidéo
                    </button>
                  </div>
                </div>

                {/* Mode 1: Couleur Unie Réelle */}
                {form.bgType === "color" && (
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold block">Sélectionnez la couleur de fond réelle (appliquée sans filtre) *</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.bgColor || form.brandColor || "#2563eb"}
                        onChange={e => {
                          set("bgColor", e.target.value);
                          set("brandColor", e.target.value);
                          set("gradient", "");
                        }}
                        className="w-12 h-12 rounded-2xl border-0 cursor-pointer p-0 bg-transparent shadow-sm"
                      />
                      <input
                        type="text"
                        value={form.bgColor || form.brandColor || "#2563eb"}
                        onChange={e => {
                          set("bgColor", e.target.value);
                          set("brandColor", e.target.value);
                          set("gradient", "");
                        }}
                        placeholder="#2563eb"
                        className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold ${
                          resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-200 bg-white text-zinc-900'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Mode 2: Dégradé */}
                {form.bgType === "gradient" && (
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold block">Choisissez un dégradé de fond</label>
                    <div className="flex flex-wrap gap-2.5">
                      {GRADIENT_OPTIONS.map(g => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => set("gradient", g.value)}
                          className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${g.value} transition-transform hover:scale-110 shadow-sm ${
                            form.gradient === g.value ? "ring-2 ring-offset-2 ring-[#FF6B00] scale-110" : ""
                          }`}
                          title={g.label}
                        >
                          {form.gradient === g.value && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 3: Média d'arrière-plan (GIF, Vidéo, Image) */}
                {form.bgType === "media" && (
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold block">
                      Importer un GIF animé, une Image ou une Vidéo (toute extension acceptée)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        ref={videoFileInputRef}
                        onChange={handleMediaUpload}
                        accept="image/*,video/*,.gif,.mp4,.webm,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingMedia}
                        onClick={() => videoFileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition-all active:scale-95"
                      >
                        {isUploadingMedia ? <Loader2 size={14} className="animate-spin text-white" /> : <Upload size={14} />}
                        <span>{isUploadingMedia ? "Téléversement Supabase en cours..." : "📁 Téléverser un GIF, Image ou Vidéo"}</span>
                      </button>

                      {(form.bgMediaUrl || form.bgVideoUrl) && (
                        <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 p-1.5 rounded-xl">
                          {((form.bgMediaUrl || form.bgVideoUrl).startsWith('data:video') || (form.bgMediaUrl || form.bgVideoUrl).endsWith('.mp4') || (form.bgMediaUrl || form.bgVideoUrl).endsWith('.webm')) ? (
                            <video src={form.bgMediaUrl || form.bgVideoUrl} className="w-12 h-9 rounded-lg object-cover" autoPlay muted loop />
                          ) : (
                            <img src={form.bgMediaUrl || form.bgVideoUrl} alt="Aperçu Média" className="w-12 h-9 rounded-lg object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              set("bgMediaUrl", "");
                              set("bgVideoUrl", "");
                            }}
                            className="text-xs text-red-400 hover:underline px-1 font-semibold"
                          >
                            Retirer
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={form.bgMediaUrl || form.bgVideoUrl}
                      onChange={e => {
                        set("bgMediaUrl", e.target.value);
                        set("bgVideoUrl", e.target.value);
                      }}
                      placeholder="Ou collez l'URL directe (ex: https://.../anim.gif ou .mp4)"
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-zinc-200 bg-white text-zinc-700'
                      } text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                )}
              </div>
            </div>
          </fieldset>

          {/* Section : Ciblage d'Audience Réel */}
          <fieldset>
            <legend className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-wide mb-3`}>
              🎯 Ciblage d'Audience (Diffusion Réelle)
            </legend>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => set("targetAudience", "all")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    form.targetAudience === "all"
                      ? "border-[#FF6B00] bg-orange-500/10 ring-1 ring-[#FF6B00]"
                      : resolvedTheme === 'dark' ? "border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800" : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🌐</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">Tous les visiteurs</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-tight">
                    Sans aucun filtrage. Diffusée à 100% des utilisateurs connectés et non-connectés.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => set("targetAudience", "interests")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    form.targetAudience === "interests"
                      ? "border-[#FF6B00] bg-orange-500/10 ring-1 ring-[#FF6B00]"
                      : resolvedTheme === 'dark' ? "border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800" : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🎯</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">Par Centres d'intérêt</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-tight">
                    Ciblage fin selon les profils et catégories d'intérêt sélectionnés.
                  </p>
                </button>
              </div>

              {/* Sélection des centres d'intérêt si ciblage actif */}
              {form.targetAudience === "interests" && (
                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold block text-zinc-700 dark:text-zinc-300">
                    Sélectionnez les catégories d'intérêt ciblées :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {INTERESTS_LIST.map(interest => {
                      const isSelected = form.targetInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? form.targetInterests.filter(i => i !== interest)
                              : [...form.targetInterests, interest];
                            setForm(f => ({ ...f, targetInterests: next }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            isSelected
                              ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm"
                              : resolvedTheme === 'dark'
                              ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}{interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          {/* Section : Monnaie, Taux & Budget */}
          <fieldset>
            <legend className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-wide mb-3`}>Budget, Devise & Taux de Change</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Devise / Monnaie *</label>
                <select
                  value={form.currency}
                  onChange={e => set("currency", e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {CURRENCY_OPTIONS.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Budget total ({form.currency}) *</label>
                <input value={form.budget} onChange={e => set("budget", e.target.value)}
                  placeholder="1000"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium mb-1 block">Préciser votre Taux (Conversion / Change)</label>
                <input value={form.exchangeRate} onChange={e => set("exchangeRate", e.target.value)}
                  placeholder="ex: 1 USD = 132 HTG ou 100 HTG/1000 vues"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium mb-1 block">Objectif Vues (AlgoPro) *</label>
                <input value={form.targetViews} onChange={e => set("targetViews", e.target.value)}
                  placeholder="10000"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Date début *</label>
                <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Date fin</label>
                <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              </div>
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} border-t px-6 py-4 flex items-center justify-end gap-3 rounded-b-3xl`}>
          <button onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'} transition-colors`}>
            Annuler
          </button>
          <button onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#FF6B00] hover:bg-[#e05e00] text-white transition-all shadow-md active:scale-95">
            {isConverting || !initial?.id ? "🚀 Lancer la campagne" : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : AdDashboard
// ─────────────────────────────────────────────────────────────

export default function AdDashboard() {
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  // 🔒 VERROU DE SÉCURITÉ RENFORCÉE — Authentification Administrateur Strict
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('exile_pub_admin_unlocked') === 'true';
  });
  const [pin, setPin] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Minuteur de décompte en cas de blocage anti-force brute
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleUnlockDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    const validPIN = localStorage.getItem('exile_pub_admin_pin') || '8899';
    const validMaster = localStorage.getItem('exile_pub_admin_key') || 'AdminExile2026!';

    if (pin.trim() === validPIN && masterKey.trim() === validMaster) {
      sessionStorage.setItem('exile_pub_admin_unlocked', 'true');
      setIsUnlocked(true);
      setAuthError(null);
      setFailedAttempts(0);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setLockoutTime(30);
        setAuthError('❌ 3 échecs consécutifs ! Système verrouillé pendant 30 secondes.');
      } else {
        setAuthError(`❌ Code PIN ou Clé Maître incorrect ! (${3 - nextAttempts} essai(s) restant(s))`);
      }
    }
  };

  const handleLockDashboard = () => {
    sessionStorage.removeItem('exile_pub_admin_unlocked');
    setIsUnlocked(false);
    setPin('');
    setMasterKey('');
  };

  const [activeTab, setActiveTab] = useState<'ads' | 'inquiries' | 'trash' | 'settings'>('ads');
  const [inquiries, setInquiries] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('exile_pub_inquiries') || '[]');
  });

  const [trash, setTrash] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('exile_pub_trash') || '[]');
  });

  const [platformLogo, setPlatformLogo] = useState<string>(() => {
    return localStorage.getItem('exile_pub_platform_logo') || '';
  });

  const [adminPinInput, setAdminPinInput] = useState<string>(() => {
    return localStorage.getItem('exile_pub_admin_pin') || '8899';
  });
  const [adminKeyInput, setAdminKeyInput] = useState<string>(() => {
    return localStorage.getItem('exile_pub_admin_key') || 'AdminExile2026!';
  });

  const [ads, setAds] = useState<Ad[]>(getStoredAds);
  const [modal, setModal] = useState<{ open: boolean; editing?: Ad; isConverting?: boolean }>({ open: false });
  const [filter, setFilter] = useState<AdStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("L'image ne doit pas dépasser 10 Mo");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE_URL}/pub/annonces/upload/`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          setPlatformLogo(json.url);
          localStorage.setItem('exile_pub_platform_logo', json.url);
          showToast("✓ Logo téléversé sur Supabase et synchronisé !");
          return;
        }
      }
      throw new Error("Upload distant échoué");
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPlatformLogo(dataUrl);
        localStorage.setItem('exile_pub_platform_logo', dataUrl);
        showToast("✓ Logo importé localement");
      };
      reader.readAsDataURL(file);
    }
  };

  // Synchroniser les demandes d'entreprises en direct
  useEffect(() => {
    const handleInquiryUpdate = () => {
      setInquiries(JSON.parse(localStorage.getItem('exile_pub_inquiries') || '[]'));
    };
    window.addEventListener('exile_pub_inquiry_added', handleInquiryUpdate);
    window.addEventListener('storage', handleInquiryUpdate);
    return () => {
      window.removeEventListener('exile_pub_inquiry_added', handleInquiryUpdate);
      window.removeEventListener('storage', handleInquiryUpdate);
    };
  }, []);

  // Soft Delete Inquiry -> Trash
  const handleDeleteInquiry = (id: string) => {
    const itemToDelete = inquiries.find(i => i.id === id);
    if (!itemToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: "Déplacer la demande vers la corbeille ?",
      message: `La demande de "${itemToDelete.companyName}" sera déplacée dans la corbeille. Vous pourrez la restaurer ultérieurement.`,
      confirmText: "Déplacer en Corbeille",
      danger: true,
      onConfirm: () => {
        const nextInquiries = inquiries.filter(i => i.id !== id);
        const trashItem = { type: 'inquiry', data: itemToDelete, deletedAt: new Date().toISOString() };
        const nextTrash = [trashItem, ...trash];

        setInquiries(nextInquiries);
        setTrash(nextTrash);

        localStorage.setItem('exile_pub_inquiries', JSON.stringify(nextInquiries));
        localStorage.setItem('exile_pub_trash', JSON.stringify(nextTrash));

        showToast("Demande déplacée dans la corbeille");
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Soft Delete Ad -> Trash
  const requestDeleteAd = (ad: Ad) => {
    setConfirmModal({
      isOpen: true,
      title: "Déplacer la campagne vers la corbeille ?",
      message: `La campagne "${ad.brandName}" sera déplacée dans la corbeille et pourra être restaurée à tout moment.`,
      confirmText: "Déplacer en Corbeille",
      danger: true,
      onConfirm: () => {
        const nextAds = ads.filter((a) => a.id !== ad.id);
        const trashItem = { type: 'ad', data: ad, deletedAt: new Date().toISOString() };
        const nextTrash = [trashItem, ...trash];

        updateAds(nextAds);
        setTrash(nextTrash);
        localStorage.setItem('exile_pub_trash', JSON.stringify(nextTrash));

        showToast("Campagne déplacée dans la corbeille");
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Restauration depuis la Corbeille
  const handleRestoreTrashItem = (trashItem: any) => {
    if (trashItem.type === 'ad') {
      const nextAds = [trashItem.data, ...ads];
      updateAds(nextAds);
      const nextTrash = trash.filter(t => t.data.id !== trashItem.data.id);
      setTrash(nextTrash);
      localStorage.setItem('exile_pub_trash', JSON.stringify(nextTrash));
      showToast(`✓ Campagne "${trashItem.data.brandName}" restaurée avec succès !`);
    } else if (trashItem.type === 'inquiry') {
      const nextInquiries = [trashItem.data, ...inquiries];
      setInquiries(nextInquiries);
      localStorage.setItem('exile_pub_inquiries', JSON.stringify(nextInquiries));
      const nextTrash = trash.filter(t => t.data.id !== trashItem.data.id);
      setTrash(nextTrash);
      localStorage.setItem('exile_pub_trash', JSON.stringify(nextTrash));
      showToast(`✓ Demande de "${trashItem.data.companyName}" restaurée avec succès !`);
    }
  };

  // Suppression Définitive depuis la Corbeille
  const handlePermanentDeleteTrashItem = (trashItem: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Suppression définitive ?",
      message: "Cette action est irréversible. L'élément sera supprimé définitivement du système.",
      confirmText: "Supprimer définitivement",
      danger: true,
      onConfirm: () => {
        const nextTrash = trash.filter(t => t.data.id !== trashItem.data.id);
        setTrash(nextTrash);
        localStorage.setItem('exile_pub_trash', JSON.stringify(nextTrash));
        showToast("Élément supprimé définitivement");
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Sauvegarder les Paramètres Administrateur & Logo
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('exile_pub_admin_pin', adminPinInput);
    localStorage.setItem('exile_pub_admin_key', adminKeyInput);
    localStorage.setItem('exile_pub_platform_logo', platformLogo);
    showToast("✓ Paramètres administrateur & Logo sauvegardés !");
  };

  // Filtrer les demandes reçues avec la recherche
  const filteredInquiries = useMemo(() => {
    if (!searchQuery.trim()) return inquiries;
    const q = searchQuery.toLowerCase();
    return inquiries.filter(i =>
      (i.companyName && i.companyName.toLowerCase().includes(q)) ||
      (i.contactName && i.contactName.toLowerCase().includes(q)) ||
      (i.email && i.email.toLowerCase().includes(q)) ||
      (i.phoneWhatsApp && i.phoneWhatsApp.toLowerCase().includes(q)) ||
      (i.sector && i.sector.toLowerCase().includes(q)) ||
      (i.message && i.message.toLowerCase().includes(q))
    );
  }, [inquiries, searchQuery]);

  // Convertir une demande en campagne (Bouton -> 🚀 Lancer la campagne)
  const handleConvertInquiryToAd = (inquiry: any) => {
    const prefilledAd: Ad = {
      id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      brandName: inquiry.companyName || "Nouvelle Marque",
      brandInitials: (inquiry.companyName || "NM").slice(0, 2).toUpperCase(),
      brandColor: "#2563eb",
      tagline: inquiry.message ? inquiry.message.slice(0, 55) : "Offre exclusive EXILE",
      description: inquiry.message || "",
      ctaLabel: "Visiter",
      ctaUrl: "https://",
      gradient: "from-blue-600 to-indigo-600",
      category: inquiry.sector || "Technologie",
      budget: Number(inquiry.budget || 1000),
      currency: inquiry.currency || "HTG",
      exchangeRate: "1 USD = 132 HTG",
      targetViews: 10000,
      impressions: 0,
      clicks: 0,
      spent: 0,
      status: "active",
      startDate: new Date().toISOString().split("T")[0]
    };

    setActiveTab('ads');
    setModal({ open: true, editing: prefilledAd, isConverting: true });
  };

  // État pour les Modales de Confirmation (Supprimer, Mettre en pause, Modifier)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirmer",
    danger: false,
    onConfirm: () => {},
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Charger automatiquement les annonces et les demandes depuis le serveur en direct
  const refreshFromServer = async () => {
    setIsRefreshing(true);
    try {
      // 1. Charger les annonces distantes depuis le backend Render
      const remoteAds = await fetchRemoteAds();
      if (Array.isArray(remoteAds) && remoteAds.length > 0) {
        setAds(remoteAds);
      }

      // 2. Charger les demandes d'entreprises (inquiries)
      const inqRes = await fetch(`${API_BASE_URL}/pub/annonces/inquiry/`);
      if (inqRes.ok) {
        const inqData = await inqRes.json();
        if (Array.isArray(inqData)) {
          setInquiries(inqData);
          localStorage.setItem('exile_pub_inquiries', JSON.stringify(inqData));
        }
      }
    } catch (e) {
      console.error("Erreur synchronisation serveur Dashboard PUB:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshFromServer();
  }, []);

  // Synchroniser avec les évènements externes
  useEffect(() => {
    const handleUpdate = () => setAds(getStoredAds())
    window.addEventListener('exile_ads_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('exile_ads_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const updateAds = (nextAds: Ad[]) => {
    setAds(nextAds)
    saveStoredAds(nextAds, { sync: false })

    const syncWithBackend = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        const res = await fetch(`${API_BASE_URL}/pub/annonces/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ campaigns: nextAds })
        })
        if (!res.ok) {
          showToast("⚠️ Publicité enregistrée localement mais non publiée (serveur indisponible)")
        }
      } catch {
        showToast("⚠️ Publicité enregistrée localement mais non publiée (réseau indisponible)")
      }
    }
    syncWithBackend()
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return ads.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.brandName.toLowerCase().includes(q) ||
          a.tagline.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ads, filter, searchQuery]);

  const globalStats = useMemo(() => ({
    totalImpressions: ads.reduce((s, a) => s + a.impressions, 0),
    totalClicks:      ads.reduce((s, a) => s + a.clicks, 0),
    totalBudget:      ads.reduce((s, a) => s + a.budget, 0),
    totalSpent:       ads.reduce((s, a) => s + a.spent, 0),
    active:           ads.filter((a) => a.status === "active").length,
  }), [ads]);

  const handleSave = (data: any) => {
    const isNew = modal.isConverting || !modal.editing || !ads.some(a => a.id === modal.editing?.id);
    if (isNew) {
      const newAd: Ad = {
        id: modal.editing?.id || `ad_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        ...data,
        brandColor: data.brandColor || "#2563eb",
        impressions: 0,
        clicks: 0,
        spent: 0,
        status: "active",
        budget: Number(data.budget || 1000),
        targetViews: Number(data.targetViews || 10000),
      };
      const next = [newAd, ...ads];
      updateAds(next);
      setActiveTab('ads');
      showToast("🚀 Nouvelle campagne lancée & active dans le feed accueil !");

      // Déclencher la notification d'activation avec le logo PUB
      triggerPubNotification({
        type: 'campaign_active',
        brandName: newAd.brandName,
        adId: newAd.id,
        userUuid: newAd.userUuid
      });
    } else {
      const next = ads.map((a) =>
        a.id === modal.editing!.id
          ? {
              ...a,
              ...data,
              budget: Number(data.budget || 0),
              targetViews: Number(data.targetViews || 10000),
            }
          : a
      );
      updateAds(next);
      showToast("✓ Campagne mise à jour avec succès");
    }
    setModal({ open: false });
  };

  // Demander confirmation avant de changer le statut (Mettre en pause / Activer)
  const requestToggleStatus = (ad: Ad) => {
    const isPausing = ad.status === "active";
    setConfirmModal({
      isOpen: true,
      title: isPausing ? "Mettre la campagne en pause ?" : "Activer la campagne ?",
      message: isPausing
        ? `Êtes-vous sûr de vouloir mettre la campagne "${ad.brandName}" en pause ? Elle ne sera plus affichée dans le feed.`
        : `Voulez-vous réactiver la diffusion de la campagne "${ad.brandName}" ?`,
      confirmText: isPausing ? "Oui, mettre en pause" : "Oui, réactiver",
      danger: false,
      onConfirm: () => {
        const next = ads.map((a) =>
          a.id === ad.id
            ? { ...a, status: a.status === "active" ? ("paused" as AdStatus) : ("active" as AdStatus) }
            : a
        );
        updateAds(next);
        showToast(isPausing ? "Campagne mise en pause" : "Campagne réactivée !");

        // Déclencher la notification correspondante
        triggerPubNotification({
          type: isPausing ? 'campaign_paused' : 'campaign_resumed',
          brandName: ad.brandName,
          adId: ad.id,
          userUuid: ad.userUuid
        });

        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };



  // Demander confirmation avant d'ouvrir la modification
  const requestEditAd = (ad: Ad) => {
    setConfirmModal({
      isOpen: true,
      title: "Modifier la campagne ?",
      message: `Voulez-vous modifier les informations ou le budget de la campagne "${ad.brandName}" ?`,
      confirmText: "Ouvrir l'éditeur",
      danger: false,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setModal({ open: true, editing: ad });
      },
    });
  };

  if (!isUnlocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${resolvedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-slate-900 text-white'}`}>
        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center justify-center mx-auto shadow-lg">
            <Lock size={32} />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-white">Zone Administrateur PUB</h2>
            <p className="text-xs text-zinc-400">Authentification renforcée à double facteur requise</p>
          </div>

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-2xl animate-pulse">
              {authError}
            </div>
          )}

          <form onSubmit={handleUnlockDashboard} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <Shield size={14} className="text-blue-400" />
                <span>Code PIN Administrateur (4 chiffres)</span>
              </label>
              <input
                type="password"
                maxLength={4}
                required
                disabled={lockoutTime > 0}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-white text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
              <p className="text-[10px] text-zinc-500 mt-1">PIN par défaut: 8899</p>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <Key size={14} className="text-amber-400" />
                <span>Clé Maître d'Authentification</span>
              </label>
              <input
                type="password"
                required
                disabled={lockoutTime > 0}
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="Clé maître requise"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Clé maître par défaut: AdminExile2026!</p>
            </div>

            <button
              type="submit"
              disabled={lockoutTime > 0}
              className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {lockoutTime > 0 ? (
                <span>Patientez {lockoutTime}s...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>🔓 Déverrouiller le Dashboard Admin</span>
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => navigate('/pro')}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold transition-colors block mx-auto"
          >
            ← Annuler et retourner au site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} font-sans pb-12`}>
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-zinc-900 text-white border border-zinc-700 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header Admin PUB Spécifique (Lien Sécurisé Obfusqué) */}
      <header className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border-b px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-sm`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pro')}
            className={`p-2 rounded-xl border transition-colors ${resolvedTheme === 'dark' ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'}`}
            title="Retour"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Megaphone className="text-[#FF6B00] w-5 h-5" />
              <span>Gestion des Publicités (Espace Sécurisé Pro)</span>
            </h1>
            <p className="text-xs text-zinc-400">EXILE Platform · Module PUB Sécurisé</p>
          </div>
        </div>

        {/* Barre de Recherche Dashboard */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border w-full ${resolvedTheme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'}`}>
            <Search size={16} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une marque, catégorie..."
              className="bg-transparent outline-none text-xs sm:text-sm w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-zinc-200">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={refreshFromServer}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
              resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
            } disabled:opacity-50`}
            title="Actualiser depuis le serveur"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-[#FF6B00]" : ""} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={handleLockDashboard}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
              resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
            }`}
            title="Verrouiller la session"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Verrouiller</span>
          </button>

          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus size={18} />
            <span>Lancer une campagne</span>
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Campagnes actives" value={String(globalStats.active)} sub={`sur ${ads.length} total`} accent={resolvedTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} resolvedTheme={resolvedTheme} />
          <StatCard label="Impressions totales" value={fmtNum(globalStats.totalImpressions)} sub="AlgoPro Connecté" resolvedTheme={resolvedTheme} />
          <StatCard label="Clics totaux" value={fmtNum(globalStats.totalClicks)} sub={`CTR ${ctr(globalStats.totalClicks, globalStats.totalImpressions)}`} resolvedTheme={resolvedTheme} />
          <StatCard label="Budget alloué" value={fmtNum(globalStats.totalBudget)} sub="Devise choisie" resolvedTheme={resolvedTheme} />
          <StatCard label="Dépensé" value={fmtNum(globalStats.totalSpent)} sub={`${Math.round(progressPct(globalStats.totalSpent, globalStats.totalBudget))}% du budget`} accent={resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} resolvedTheme={resolvedTheme} />
        </div>

        {/* Navigation Onglets (Campagnes, Messagerie Demandes, Corbeille, Paramètres) */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 flex-wrap">
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ads'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : `${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'} border`
            }`}
          >
            <Megaphone size={15} />
            <span>Campagnes Active ({ads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'inquiries'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : `${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'} border`
            }`}
          >
            <MessageSquare size={15} />
            <span>Messagerie & Demandes Reçues</span>
            {inquiries.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black animate-pulse">
                {inquiries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'trash'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : `${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'} border`
            }`}
          >
            <Trash2 size={15} />
            <span>Corbeille PUB</span>
            {trash.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/80 text-white text-[10px] font-black">
                {trash.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : `${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'} border`
            }`}
          >
            <Settings size={15} />
            <span>Paramètres & Logo</span>
          </button>
        </div>

        {/* ── ONGLET 1 : CAMPAGNES PUBLICITAIRES ── */}
        {activeTab === 'ads' && (
          <>
            {/* Filtres par Statut */}
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                {(["all", "active", "paused", "ended"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      filter === f
                        ? "bg-[#FF6B00] text-white shadow-sm"
                        : `${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-500'} border hover:border-zinc-300`
                    }`}
                  >
                    {f === "all" ? "Toutes les campagnes" : STATUS_LABELS[f]}
                    {f !== "all" && (
                      <span className="ml-1.5 opacity-70">({ads.filter(a => a.status === f).length})</span>
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-zinc-400 font-medium">
                {filtered.length} {filtered.length > 1 ? "campagnes trouvées" : "campagne trouvée"}
              </p>
            </div>

            {/* Liste des campagnes */}
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3`}>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <Megaphone size={24} />
                  </div>
                  <p className="text-sm font-bold">Aucune campagne publicitaire trouvée</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Cliquez sur le bouton ci-dessous pour créer votre première campagne publicitaire.
                  </p>
                  <button
                    onClick={() => setModal({ open: true })}
                    className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    + Créer une campagne
                  </button>
                </div>
              ) : (
                filtered.map((ad) => (
                  <div
                    key={ad.id}
                    className={`p-5 rounded-2xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm transition-all hover:border-zinc-400/50`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {ad.brandLogo ? (
                        <img
                          src={ad.brandLogo}
                          alt={ad.brandName}
                          className="w-12 h-12 rounded-2xl object-cover border border-white/20 shadow-md flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md flex-shrink-0"
                          style={{ backgroundColor: ad.brandColor || "#2563eb" }}
                        >
                          {ad.brandInitials}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base truncate">{ad.brandName}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColors(resolvedTheme, ad.status)}`}>
                            {STATUS_LABELS[ad.status]}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {ad.category}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 mt-1 truncate">{ad.tagline}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-500 flex-wrap">
                          <span>🎯 Objectif Vues (AlgoPro): <strong className="text-blue-400">{fmtNum(ad.impressions)} / {fmtNum(ad.targetViews)}</strong></span>
                          <span>💰 Budget: <strong className="text-emerald-400">{fmtCurrency(ad.budget, ad.currency)}</strong></span>
                          {ad.exchangeRate && <span>💱 Taux: {ad.exchangeRate}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0">
                      <button
                        onClick={() => requestToggleStatus(ad)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1 ${
                          ad.status === "active"
                            ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        {ad.status === "active" ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        <span>{ad.status === "active" ? "Mettre en pause" : "Activer"}</span>
                      </button>

                      <button
                        onClick={() => requestEditAd(ad)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1"
                      >
                        <Edit3 size={14} />
                        <span>Modifier</span>
                      </button>

                      <button
                        onClick={() => requestDeleteAd(ad)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── ONGLET 2 : MESSAGERIE & DEMANDES REÇUES ── */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {filteredInquiries.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3`}>
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <MessageSquare size={24} />
                </div>
                <p className="text-sm font-bold">Aucune demande d'entreprise trouvée</p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  {searchQuery ? "Aucun résultat ne correspond à votre recherche." : "Lorsqu'un utilisateur soumet une demande publicitaire via la plateforme, elle apparaîtra directement ici."}
                </p>
              </div>
            ) : (
              filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className={`p-5 rounded-2xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      📩
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base">{inquiry.companyName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {inquiry.sector || "Entreprise"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Canal : {inquiry.preferredContact || "WhatsApp 💬"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                        {inquiry.contactName && <span>👤 Contact: <strong className="text-white">{inquiry.contactName}</strong></span>}
                        {inquiry.phoneWhatsApp && (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <Phone size={12} />
                            <span>{inquiry.phoneWhatsApp}</span>
                          </span>
                        )}
                        {inquiry.email && (
                          <span className="flex items-center gap-1 text-blue-400 font-semibold">
                            <Mail size={12} />
                            <span>{inquiry.email}</span>
                          </span>
                        )}
                      </div>

                      <p className={`text-xs p-3 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-800/80 text-zinc-200' : 'bg-zinc-100 text-zinc-800'} mt-2 leading-relaxed`}>
                        "{inquiry.message}"
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-zinc-400 pt-1">
                        <span>💰 Budget Proposé: <strong className="text-emerald-400">{fmtCurrency(Number(inquiry.budget || 0), inquiry.currency || "HTG")}</strong></span>
                        <span>🕒 Date: {new Date(inquiry.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Rapides Admin */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0 flex-shrink-0">
                    {inquiry.phoneWhatsApp && (
                      <a
                        href={`https://wa.me/${inquiry.phoneWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${inquiry.contactName || inquiry.companyName}, concernant votre demande publicitaire sur EXILE...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <MessageSquare size={14} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {inquiry.phoneWhatsApp && (
                      <a
                        href={`tel:${inquiry.phoneWhatsApp}`}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Phone size={14} />
                        <span>Appeler</span>
                      </a>
                    )}

                    {inquiry.email && (
                      <a
                        href={`mailto:${inquiry.email}?subject=Demande Publicitaire EXILE - ${inquiry.companyName}`}
                        className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5"
                      >
                        <Mail size={14} />
                        <span>Email</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleConvertInquiryToAd(inquiry)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#e05e00] text-white transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Convertir en Pub</span>
                    </button>

                    <button
                      onClick={() => handleDeleteInquiry(inquiry.id)}
                      className="p-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ONGLET 3 : CORBEILLE PUB (Restauration) ── */}
        {activeTab === 'trash' && (
          <div className="space-y-4">
            {trash.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3`}>
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <Trash2 size={24} />
                </div>
                <p className="text-sm font-bold">La corbeille PUB est vide</p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Les éléments supprimés apparaîtront ici et pourront être restaurés à tout moment.
                </p>
              </div>
            ) : (
              trash.map((item) => (
                <div
                  key={item.data.id}
                  className={`p-5 rounded-2xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} flex items-center justify-between gap-4 shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm">
                      {item.type === 'ad' ? '📢' : '📩'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">
                        {item.type === 'ad' ? item.data.brandName : item.data.companyName}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {item.type === 'ad' ? `Campagne (${item.data.category})` : `Demande (${item.data.sector || 'Entreprise'})`} · Supprimé le {new Date(item.deletedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreTrashItem(item)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw size={14} />
                      <span>Restaurer</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDeleteTrashItem(item)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Supprimer définitivement</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ONGLET 4 : PARAMÈTRES ADMINISTRATEUR & LOGO ── */}
        {activeTab === 'settings' && (
          <div className={`p-6 rounded-3xl border ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm max-w-2xl space-y-6`}>
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center font-bold">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Paramètres Administrateur PUB & Logo</h3>
                <p className="text-xs text-zinc-400">Configuration du système, sécurité & logo de la plateforme</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Section : Logo Personnalisé de la Plateforme */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 block">
                  Logo Personnalisé de la Plateforme (Apparaît dans les notifications utilisateurs)
                </label>
                <div className="flex items-center gap-4">
                  {platformLogo ? (
                    <img src={platformLogo} alt="Logo Admin" className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-md" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center font-black text-sm border border-[#FF6B00]/30">
                      EXILE
                    </div>
                  )}
                  <div className="flex-1 space-y-2.5">
                    <input
                      type="text"
                      value={platformLogo}
                      onChange={e => setPlatformLogo(e.target.value)}
                      placeholder="Collez l'URL ou importez depuis votre appareil..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Upload size={13} />
                        <span>📁 Importer un logo depuis mon stockage</span>
                      </button>
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        onChange={handleLogoFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {platformLogo && (
                        <button
                          type="button"
                          onClick={() => {
                            setPlatformLogo('');
                            localStorage.removeItem('exile_pub_platform_logo');
                          }}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Supprimer le logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section : Sécurité Admin (PIN & Clé Maître) */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 block">
                  Sécurité Accès Dashboard (PIN & Clé Maître)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Code PIN Administrateur (4 chiffres)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={adminPinInput}
                      onChange={e => setAdminPinInput(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono tracking-widest text-center ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Clé Maître d'Authentification</label>
                    <input
                      type="text"
                      value={adminKeyInput}
                      onChange={e => setAdminKeyInput(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#e05e00] text-white transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>Enregistrer les paramètres</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal Création / Edition */}
      {modal.open && (
        <CampaignModal
          initial={modal.editing}
          isConverting={modal.isConverting}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
          resolvedTheme={resolvedTheme}
        />
      )}

      {/* Modal de Confirmation pour Actions Sensibles (Supprimer, Mettre en pause, Modifier) */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        resolvedTheme={resolvedTheme}
      />
    </div>
  );
}
