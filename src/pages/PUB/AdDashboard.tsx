// ============================================================
// EXILE Platform — PUB/AdDashboard.tsx
// Dashboard de gestion des campagnes publicitaires
// Pour les marques / entreprises qui veulent faire de la pub
// React 18 + TypeScript — fichier unique
// ============================================================

import { useState, useMemo } from "react";
import { type Ad, type AdStatus, DEMO_ADS } from "./AdBanner";
import { useTheme } from "../../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function fmtEUR(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
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
  return Math.min((spent / budget) * 100, 100);
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

// ─────────────────────────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, resolvedTheme }: { label: string; value: string; sub?: string; accent?: string; resolvedTheme?: string | undefined }) {
  return (
    <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-5`}>
      <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wide mb-2`}>{label}</p>
      <p className={`text-2xl font-bold ${accent ?? (resolvedTheme === 'dark' ? 'text-zinc-100' : 'text-zinc-900')}`}>{value}</p>
      {sub && <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} mt-1`}>{sub}</p>}
    </div>
  );
}

function ProgressBar({ pct, color, resolvedTheme }: { pct: number; color: string; resolvedTheme?: string | undefined }) {
  return (
    <div className={`w-full ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-full h-1.5 overflow-hidden`}>
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL : Créer / Modifier une campagne
// ─────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = ["Technologie", "Commerce", "Finance", "Santé", "Éducation", "Mode", "Alimentation", "Services", "Autre"];
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
  tagline: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  gradient: string;
  category: string;
  budget: string;
  targetViews: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: CampaignFormData = {
  brandName: "", brandInitials: "", brandColor: "#2563eb",
  tagline: "", description: "", ctaLabel: "En savoir plus",
  ctaUrl: "https://", gradient: GRADIENT_OPTIONS[0].value,
  category: CATEGORY_OPTIONS[0], budget: "300", targetViews: "10000",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
};

function CampaignModal({
  initial,
  onSave,
  onClose,
  resolvedTheme,
}: {
  initial?: Ad;
  onSave: (ad: Ad) => void;
  onClose: () => void;
  resolvedTheme?: string | undefined;
}) {
  const [form, setForm] = useState<CampaignFormData>(
    initial
      ? {
          brandName: initial.brandName,
          brandInitials: initial.brandInitials,
          brandColor: initial.brandColor,
          tagline: initial.tagline,
          description: initial.description,
          ctaLabel: initial.ctaLabel,
          ctaUrl: initial.ctaUrl,
          gradient: initial.gradient,
          category: initial.category,
          budget: String(initial.budget),
          targetViews: String(initial.targetViews),
          startDate: initial.startDate,
          endDate: initial.endDate ?? "",
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<CampaignFormData>>({});

  const set = (k: keyof CampaignFormData, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<CampaignFormData> = {};
    if (!form.brandName.trim()) e.brandName = "Requis";
    if (!form.brandInitials.trim()) e.brandInitials = "Requis";
    if (form.tagline.length < 5) e.tagline = "Min 5 caractères";
    if (form.tagline.length > 60) e.tagline = "Max 60 caractères";
    if (form.description.length > 120) e.description = "Max 120 caractères";
    if (!form.ctaLabel.trim()) e.ctaLabel = "Requis";
    if (Number(form.budget) < 10) e.budget = "Budget min 10 EUR";
    if (!form.startDate) e.startDate = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSave(form);
  };

  const previewGrad = form.gradient;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Modifier la campagne" : "Nouvelle campagne"}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 ${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} border-b px-6 py-4 flex items-center justify-between rounded-t-3xl z-10`}>
          <h2 className={`text-base font-bold ${resolvedTheme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
            {initial ? "Modifier la campagne" : "Nouvelle campagne publicitaire"}
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

          {/* Aperçu live */}
          <div className={`relative rounded-2xl bg-gradient-to-r ${previewGrad} p-5 overflow-hidden`}>
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white font-black text-xs">
                {form.brandInitials || "??"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{form.tagline || "Votre accroche ici…"}</p>
                <p className="text-white/60 text-xs truncate">{form.description || "Description courte…"}</p>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/30 whitespace-nowrap">
                {form.ctaLabel || "CTA"}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 text-center -mt-4">Aperçu en temps réel</p>

          {/* Section : Marque */}
          <fieldset>
            <legend className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-wide mb-3`}>Marque / Entreprise</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Nom de la marque *</label>
                <input value={form.brandName} onChange={e => set("brandName", e.target.value)}
                  placeholder="ex: TechHaïti"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.brandName && <p className="text-xs text-red-500 mt-1">{errors.brandName}</p>}
              </div>
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Initiales (2–3 lettres) *</label>
                <input value={form.brandInitials} onChange={e => set("brandInitials", e.target.value.slice(0, 3).toUpperCase())}
                  placeholder="TH"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.brandInitials && <p className="text-xs text-red-500 mt-1">{errors.brandInitials}</p>}
              </div>
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Catégorie</label>
                <select value={form.category} onChange={e => set("category", e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Couleur principale</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.brandColor} onChange={e => set("brandColor", e.target.value)}
                    className={`w-10 h-10 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'} cursor-pointer p-1`} />
                  <span className="text-xs text-zinc-400">{form.brandColor}</span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section : Contenu */}
          <fieldset>
            <legend className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-wide mb-3`}>Contenu publicitaire</legend>
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 flex justify-between`}>
                  <span>Accroche *</span>
                  <span className={form.tagline.length > 60 ? "text-red-500" : "text-zinc-400"}>{form.tagline.length}/60</span>
                </label>
                <input value={form.tagline} onChange={e => set("tagline", e.target.value)}
                  placeholder="Le futur du numérique commence ici."
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.tagline && <p className="text-xs text-red-500 mt-1">{errors.tagline}</p>}
              </div>
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 flex justify-between`}>
                  <span>Description</span>
                  <span className={form.description.length > 120 ? "text-red-500" : "text-zinc-400"}>{form.description.length}/120</span>
                </label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  rows={2} placeholder="Description courte de votre offre…"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`} />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Texte du bouton *</label>
                  <input value={form.ctaLabel} onChange={e => set("ctaLabel", e.target.value)}
                    placeholder="Découvrir"
                    className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                  {errors.ctaLabel && <p className="text-xs text-red-500 mt-1">{errors.ctaLabel}</p>}
                </div>
                <div>
                  <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>URL de destination *</label>
                  <input value={form.ctaUrl} onChange={e => set("ctaUrl", e.target.value)}
                    placeholder="https://votre-site.com"
                    className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                </div>
              </div>
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-2 block`}>Couleur du fond</label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENT_OPTIONS.map(g => (
                    <button key={g.value} onClick={() => set("gradient", g.value)}
                      className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${g.value} transition-transform hover:scale-110 ${form.gradient === g.value ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""}`}
                      aria-label={g.label} title={g.label}
                    >
                      {form.gradient === g.value && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section : Budget & Dates */}
          <fieldset>
            <legend className={`text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-wide mb-3`}>Budget & Diffusion</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Budget total (EUR) *</label>
                <input value={form.budget} onChange={e => set("budget", e.target.value)}
                  placeholder="300"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
              </div>
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Objectif vues</label>
                <input value={form.targetViews} onChange={e => set("targetViews", e.target.value)}
                  placeholder="10000"
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.targetViews && <p className="text-xs text-red-500 mt-1">{errors.targetViews}</p>}
              </div>
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Date début</label>
                <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} mb-1 block`}>Date fin</label>
                <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${resolvedTheme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-800'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
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
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm">
            {initial ? "Enregistrer" : "Lancer la campagne"}
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
  const { resolvedTheme } = useTheme()
  const [ads, setAds] = useState<Ad[]>(DEMO_ADS);
  const [modal, setModal] = useState<{ open: boolean; editing?: Ad }>({ open: false });
  const [filter, setFilter] = useState<AdStatus | "all">("all");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const filtered = useMemo(
    () => (filter === "all" ? ads : ads.filter((a) => a.status === filter)),
    [ads, filter]
  );

  const globalStats = useMemo(() => ({
    totalImpressions: ads.reduce((s, a) => s + a.impressions, 0),
    totalClicks:      ads.reduce((s, a) => s + a.clicks, 0),
    totalBudget:      ads.reduce((s, a) => s + a.budget, 0),
    totalSpent:       ads.reduce((s, a) => s + a.spent, 0),
    active:           ads.filter((a) => a.status === "active").length,
  }), [ads]);

  const handleSave = (data: CampaignFormData) => {
    if (modal.editing) {
      setAds((prev) =>
        prev.map((a) =>
          a.id === modal.editing!.id
            ? {
                ...a,
                ...data,
                budget: Number(data.budget),
                targetViews: Number(data.targetViews),
              }
            : a
        )
      );
      showToast("Campagne mise à jour ✓");
    } else {
      const newAd: Ad = {
        id: crypto.randomUUID(),
        ...data,
        impressions: 0,
        clicks: 0,
        spent: 0,
        status: "active",
      };
      setAds((prev) => [...prev, newAd]);
      showToast("Campagne créée ✓");
    }
    setModal({ open: false });
  };

  const toggleStatus = (id: string) => {
    setAds((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "active" ? "paused" : "active" }
          : a
      )
    );
    showToast("Statut mis à jour ✓");
  };

  const deleteAd = (id: string) => {
    setAds((prev) => prev.filter((a) => a.id !== id));
    showToast("Campagne supprimée");
  };

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50'} font-sans`}>

      {/* Header */}
      <header className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20`}>
        <div>
          <h1 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>Gestion des Publicités</h1>
          <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>EXILE Platform · Module PUB</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Nouvelle campagne
        </button>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Campagnes actives" value={String(globalStats.active)} sub={`sur ${ads.length} total`} accent={resolvedTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} resolvedTheme={resolvedTheme} />
          <StatCard label="Impressions totales" value={fmtNum(globalStats.totalImpressions)} sub="toutes campagnes" resolvedTheme={resolvedTheme} />
          <StatCard label="Clics totaux" value={fmtNum(globalStats.totalClicks)} sub={`CTR moyen ${ctr(globalStats.totalClicks, globalStats.totalImpressions)}`} resolvedTheme={resolvedTheme} />
          <StatCard label="Budget total" value={fmtEUR(globalStats.totalBudget)} sub="alloué" resolvedTheme={resolvedTheme} />
          <StatCard label="Dépensé" value={fmtEUR(globalStats.totalSpent)} sub={`${Math.round(progressPct(globalStats.totalSpent, globalStats.totalBudget))}% du budget`} accent={resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} resolvedTheme={resolvedTheme} />
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "active", "paused", "ended"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : `${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-500'} border hover:border-zinc-300`
              }`}
            >
              {f === "all" ? "Toutes" : STATUS_LABELS[f]}
              {f !== "all" && (
                <span className="ml-1.5 opacity-70">({ads.filter(a => a.status === f).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Liste des campagnes */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className={`text-center py-16 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm font-medium">Aucune campagne dans cette catégorie</p>
            </div>
          )}
          {filtered.map((ad) => (
            <div
              key={ad.id}
              className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">

                {/* Logo */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 bg-gradient-to-br ${ad.gradient}`}
                >
                  {ad.brandInitials}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{ad.brandName}</h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getStatusColors(resolvedTheme, ad.status)}`}>
                      {ad.status === "active" && <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />}
                      {STATUS_LABELS[ad.status]}
                    </span>
                    <span className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-500 border-zinc-700' : 'text-zinc-400 border-zinc-200'} border px-2 py-0.5 rounded-full`}>{ad.category}</span>
                  </div>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'} font-medium mb-0.5`}>{ad.tagline}</p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} mb-3`}>{ad.description}</p>

                  {/* Métriques */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {[
                      { label: "Impressions", value: fmtNum(ad.impressions) },
                      { label: "Clics",        value: fmtNum(ad.clicks) },
                      { label: "CTR",           value: ctr(ad.clicks, ad.impressions) },
                      { label: "Budget restant", value: fmtEUR(ad.budget - ad.spent) },
                    ].map((m) => (
                      <div key={m.label} className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-50'} rounded-xl px-3 py-2`}>
                        <p className={`text-[10px] font-medium ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wide`}>{m.label}</p>
                        <p className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Budget progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className={`flex justify-between text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} mb-1`}>
                        <span>Budget dépensé</span>
                        <span>{fmtEUR(ad.spent)} / {fmtEUR(ad.budget)}</span>
                      </div>
                      <ProgressBar
                        pct={progressPct(ad.spent, ad.budget)}
                        color={ad.status === "active" ? "bg-blue-500" : resolvedTheme === 'dark' ? "bg-zinc-600" : "bg-zinc-300"}
                        resolvedTheme={resolvedTheme}
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`flex justify-between text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} mb-1`}>
                        <span>Vues</span>
                        <span>{fmtNum(ad.impressions)}/{fmtNum(ad.targetViews)}</span>
                      </div>
                      <div className="w-24">
                        <ProgressBar
                          pct={progressPct(ad.impressions, ad.targetViews)}
                          color={ad.status === "active" ? "bg-emerald-500" : resolvedTheme === 'dark' ? "bg-zinc-600" : "bg-zinc-300"}
                          resolvedTheme={resolvedTheme}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <p className={`text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} mt-2`}>
                    Du {ad.startDate}{ad.endDate ? ` au ${ad.endDate}` : " (sans date de fin)"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => setModal({ open: true, editing: ad })}
                    className={`px-3 py-2 text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-300 border-zinc-700 hover:bg-zinc-800' : 'text-zinc-600 border-zinc-200 hover:bg-zinc-50'} border rounded-xl transition-colors`}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleStatus(ad.id)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      ad.status === "active"
                        ? `${resolvedTheme === 'dark' ? 'text-amber-600 border-amber-800 hover:bg-amber-950/30' : 'text-amber-600 border-amber-200 hover:bg-amber-50'} border`
                        : `${resolvedTheme === 'dark' ? 'text-emerald-600 border-emerald-800 hover:bg-emerald-950/30' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'} border`
                    }`}
                  >
                    {ad.status === "active" ? "Pause" : "Activer"}
                  </button>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className={`px-3 py-2 text-xs font-semibold ${resolvedTheme === 'dark' ? 'text-red-500 border-red-800 hover:bg-red-950/30' : 'text-red-500 border-red-200 hover:bg-red-50'} border rounded-xl transition-colors`}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <CampaignModal
          initial={modal.editing}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
          resolvedTheme={resolvedTheme}
        />
      )}

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] ${resolvedTheme === 'dark' ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'} text-sm font-semibold px-5 py-3 rounded-full shadow-xl whitespace-nowrap`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
