import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  Briefcase, 
  Building2, 
  Video, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Users,
  Award,
  Globe2,
  TrendingUp,
  MessageSquare,
  Play
} from 'lucide-react'

export const Landing = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-slate-50 text-slate-900'} selection:bg-[#FF6B00]/30 transition-colors duration-300`}>
      
      {/* ── 1. HERO SECTION AVEC LUMIÈRES DYNAMIQUES ── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 px-4 border-b border-zinc-200/60 dark:border-zinc-800/80">
        {/* Glow ambient orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[350px] sm:h-[450px] bg-gradient-to-tr from-blue-600/20 via-[#FF6B00]/15 to-purple-600/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-0 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          {/* Badge officiel de Tiger and Light LLC */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border backdrop-blur-md shadow-sm transition-transform hover:scale-105 duration-200 bg-white/70 dark:bg-zinc-900/80 border-zinc-300/80 dark:border-zinc-700/70 text-zinc-800 dark:text-zinc-200">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            <span>Par <strong className="font-bold text-blue-600 dark:text-blue-400">Tiger and Light LLC</strong></span>
          </div>

          {/* Titre Principal EXILE */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-[#FF6B00] bg-clip-text text-transparent drop-shadow-sm">
              EXILE
            </span>
          </h1>

          {/* Sous-titre percutant */}
          <p className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-4 sm:mb-6 max-w-3xl mx-auto text-zinc-900 dark:text-white leading-tight">
            La plateforme 3-en-1 qui sépare les mondes
          </p>

          {/* Description claire */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Professionnel. Social institutionnel. Divertissement.</span><br />
            Chacun sa place, chacun son écosystème, chacun sa crédibilité.
          </p>

          {/* Boutons d'Action Principaux */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 max-w-md sm:max-w-none mx-auto">
            <Link
              to="/pro"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 group"
            >
              <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
              <span>Accéder directement aux Vidéos Pro</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/register"
              className={`w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 border shadow-sm ${
                isDark 
                  ? 'bg-zinc-800/90 hover:bg-zinc-700/90 text-white border-zinc-700' 
                  : 'bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-300'
              }`}
            >
              <span>Créer un compte</span>
            </Link>
          </div>

          {/* Garanties rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800/80 text-left">
            {[
              { icon: Layers, title: 'Feeds 100% Étanches', desc: 'Zéro mélange de genres' },
              { icon: ShieldCheck, title: 'Vérification Réelle', desc: 'Identité & institutions' },
              { icon: TrendingUp, title: 'Monétisation Pro', desc: 'Lives, devis, billetterie' },
              { icon: Lock, title: 'Données Protégées', desc: 'Confidentialité totale' }
            ].map((g, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/50">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <g.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-zinc-900 dark:text-white">{g.title}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 2. SECTION DES 3 MODULES ÉTANCHES ── */}
      <section className="py-16 sm:py-24 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00] mb-2 block">
            Architecture Innovante
          </span>
          <h2 className="text-2xl sm:text-4xl font-black mb-4">
            Trois modules. Une vision claire.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            EXILE ne mélange pas les genres. Chaque module possède son propre algorithme, 
            ses critères de publication et ses fonctionnalités dédiées.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* CARTE 1 : Module Professionnel */}
          <div className="relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent border-orange-500/30 dark:border-orange-500/20">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-13 h-13 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  Actif
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">
                Professionnel
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Partagez votre expertise, organisez des lives et webinaires, recevez des demandes de devis et monétisez votre savoir-faire en toute crédibilité.
              </p>

              <div className="space-y-2.5 mb-6 text-xs sm:text-sm">
                {[
                  "Vidéos d'expertise éducatives et techniques",
                  "Système de demandes de contact & devis",
                  "Lives interactifs et billetterie d'événements",
                  "Profils pwofesyonèl vérifiés avec compétences"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/pro"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#FF6B00] hover:bg-[#e05e00] shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Accéder à l'Espace Pro</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* CARTE 2 : Module Social Institutionnel */}
          <div className="relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent border-blue-500/30 dark:border-blue-500/20">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-13 h-13 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Institutionnel
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">
                Social Institutionnel
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                L'espace de communication fiable pour les universités, ONG, institutions publiques, ambassades et associations enregistrées.
              </p>

              <div className="space-y-2.5 mb-6 text-xs sm:text-sm">
                {[
                  "Badges de vérification officielle",
                  "Diffusion d'alertes citoyennes prioritaires",
                  "Publication d'offres d'emploi & recrutement",
                  "Forums de discussion sécurisés et modérés"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/social/institution/request"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Demande de Compte Institution</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* CARTE 3 : Module Funny (Divertissement) */}
          <div className="relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent border-purple-500/30 dark:border-purple-500/20">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-13 h-13 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner">
                  <Video className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  Bientôt
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">
                Funny & Divertissement
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Le format court axé sur la créativité et la bonne humeur. Un espace libre sans jamais interférer avec le contenu sérieux des autres modules.
              </p>

              <div className="space-y-2.5 mb-6 text-xs sm:text-sm">
                {[
                  "Vidéos courtes divertissantes et dynamiques",
                  "Cadeaux virtuels et pourboires créateurs",
                  "Clubs de fans et badges de soutien",
                  "Algorithme dédié au divertissement pur"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Disponible prochainement</span>
            </button>
          </div>

        </div>
      </section>

      {/* ── 3. POURQUOI CETTE SÉPARATION EST UNIQUE ? ── */}
      <section className="py-16 px-4 border-y border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-3 text-zinc-900 dark:text-white">
              Pourquoi EXILE sépare les mondes ?
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Sur les réseaux classiques, une information d'urgence gouvernementale ou une masterclass médicale est perdue entre deux mèmes. EXILE redonne à chaque contenu sa dignité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
              <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Sur les plateformes traditionnelles
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <li>• Algorithmes biaisés favorisant le buzz au détriment de l'expertise.</li>
                <li>• Confusion permanente entre opinions personnelles et annonces officielles.</li>
                <li>• Faible taux de conversion pour les professionnels qualifiés.</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                L'Approche Révolutionnaire EXILE
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <li>• Cloisonnement étanche : le pro reste pro, le social reste institutionnel.</li>
                <li>• Vérification d'identité et de compétences réelle.</li>
                <li>• Relations directes : contact client sans intermédiaire ni distraction.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. CTA FINAL ── */}
      <section className="py-16 sm:py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black mb-4 text-zinc-900 dark:text-white">
            Prêt à rejoindre l'écosystème EXILE ?
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-8 max-w-xl mx-auto">
            Créez votre compte professionnel gratuitement ou visitez directement le catalogue des vidéos d'expertise.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all active:scale-95"
            >
              Créer mon compte professionnel
            </Link>
            <Link
              to="/pro"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95"
            >
              Découvrir les vidéos
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Landing
