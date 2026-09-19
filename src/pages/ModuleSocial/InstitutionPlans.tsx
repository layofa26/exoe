import { useState } from 'react'
import {
  Building2,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Radio,
  Briefcase,
  Video as VideoIcon,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'

export const InstitutionPlans = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const isDark = resolvedTheme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'} py-8 px-4 pb-24 md:pb-12`}>
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Infrastructure Institutionnelle EXILE
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Adhésion & Formules Officielles
          </h1>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            EXILE Social n'est pas un réseau social classique, mais une infrastructure officielle digitale sécurisée pour les institutions vérifiées.
          </p>
        </div>

        {/* Plan Principal : Standard Institutionnel 20$/mois */}
        <div className="max-w-2xl mx-auto">
          <div className={`relative rounded-3xl border-2 ${
            isDark ? 'bg-zinc-900/90 border-emerald-500/50' : 'bg-white border-emerald-500'
          } p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden`}>
            {/* Top Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Abonnement Standard</h2>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Formule institutionnelle officielle</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
                Recommandé
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 pt-2 border-t border-zinc-800/60 dark:border-zinc-800">
              <span className="text-4xl sm:text-5xl font-extrabold text-emerald-500">20$</span>
              <span className={`text-sm font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>/ mois</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 ml-auto font-medium">Sans engagement</span>
            </div>

            {/* Inclusions / Quotas mensuels officiels */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Quotas & Privilèges Mensuels Inclus :</p>
              <ul className="space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold">3 Alertes Officielles par mois</span>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Diffusion prioritaire en tête de fil sans distraction pour la sécurité civile et la santé.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold">2 Diffusions Lives par mois</span>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Conférences de presse, points de situation officiels en direct.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold">3 Offres de Recrutement par mois</span>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Système simplifié avec dépôt obligatoire de CV au format PDF.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <VideoIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold">2 Vidéos Institutionnelles par mois</span>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Allocutions officielles, rapports d'activité et communications publiques.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold">Statistiques de consultation de base & Badge Vérifié</span>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Audience certifiée, impact des publications et reconnaissance officielle.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button
                onClick={() => navigate('/social/institution/request')}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <span>Demander mon adhésion institutionnelle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Option Boost Unitaire (Feuille de route stratégique) */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              Monétisation de visibilité
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Options Boost Unitaire</h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Pour les alertes et annonces nécessitant une portée maximale immédiate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Boost 5$ */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
            } space-y-3 text-center`}>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="font-bold text-sm">Boost Flash (24h)</p>
              <p className="text-2xl font-extrabold text-amber-500">5$</p>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Placement prioritaire en tête du fil institutionnel pendant 24 heures avec badge "Boosté".
              </p>
            </div>

            {/* Boost 10$ */}
            <div className={`p-5 rounded-2xl border-2 ${
              isDark ? 'bg-zinc-900 border-amber-500/50' : 'bg-white border-amber-500'
            } space-y-3 text-center relative shadow-md`}>
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                Plus populaire
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="font-bold text-sm">Boost Pro (72h)</p>
              <p className="text-2xl font-extrabold text-amber-500">10$</p>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Maintien en tête de fil pendant 3 jours consécutifs avec portée élargie sur les alertes sanitaires ou recrutements.
              </p>
            </div>

            {/* Boost 25$ */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
            } space-y-3 text-center`}>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="font-bold text-sm">Boost National (7 jours)</p>
              <p className="text-2xl font-extrabold text-amber-500">25$</p>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Campagne officielle complète d'une semaine avec priorité absolue et mise en avant dans les flux.
              </p>
            </div>
          </div>
        </div>

        {/* Processus de Vérification & Exigences */}
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
        } max-w-4xl mx-auto space-y-4`}>
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base sm:text-lg">Processus de Vérification Obligatoire</h3>
          </div>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Pour préserver la crédibilité d'EXILE, chaque compte institutionnel fait l'objet d'un audit de conformité sous 24h à 48h. Documents requis :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className={`p-3.5 rounded-xl ${isDark ? 'bg-zinc-800/60' : 'bg-slate-50'} text-xs space-y-1`}>
              <p className="font-bold text-emerald-500">1. Statuts & Acte Légal</p>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Décret de création, statuts enregistrés ou charte officielle.</p>
            </div>
            <div className={`p-3.5 rounded-xl ${isDark ? 'bg-zinc-800/60' : 'bg-slate-50'} text-xs space-y-1`}>
              <p className="font-bold text-emerald-500">2. Immatriculation</p>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Numéro RNC / NIF ou patente commerciale en vigueur.</p>
            </div>
            <div className={`p-3.5 rounded-xl ${isDark ? 'bg-zinc-800/60' : 'bg-slate-50'} text-xs space-y-1`}>
              <p className="font-bold text-emerald-500">3. Représentant Légal</p>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Pièce d'identité officielle et mandat de délégation.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/social')}
            className={`text-xs font-semibold ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} underline`}
          >
            ← Retourner au fil institutionnel
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstitutionPlans

