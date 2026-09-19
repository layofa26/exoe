import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Calendar,
  Building2,
  Plus,
  ShieldCheck,
  LayoutDashboard,
  AlertTriangle,
  Briefcase,
  Video as VideoIcon,
  CalendarPlus,
  Megaphone,
  X,
  ArrowLeftRight
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const SOCIAL_DESKTOP_NAV = [
  { to: '/social', label: 'Fil d\'actualité', icon: Home, end: true },
  { to: '/social/events', label: 'Événements & Sommets', icon: Calendar, end: true },
  { to: '/social/institution', label: 'Mon Institution', icon: Building2, end: true },
  { to: '/social/institution/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/social/plans', label: 'Plans d\'abonnement', icon: ShieldCheck, end: true },
  { to: '/social/institution/request', label: 'Demande d\'adhésion', icon: Building2, end: true },
]

export function SocialSidebar(): JSX.Element | null {
  const { resolvedTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleAction = (actionType: 'alert' | 'job' | 'video' | 'event' | 'announcement') => {
    setShowActionSheet(false)
    if (location.pathname !== '/social') {
      navigate('/social', { state: { openAction: actionType } })
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('exile_social_action', { detail: { action: actionType } }))
      }, 150)
    } else {
      window.dispatchEvent(new CustomEvent('exile_social_action', { detail: { action: actionType } }))
    }
  }

  const isExcludedMobileRoute = location.pathname.startsWith('/social/events/register')

  return (
    <>
      {/* Mobile Action Sheet Backdrop */}
      {showActionSheet && (
        <div
          className="fixed inset-0 z-[20000] bg-black/75 backdrop-blur-sm md:hidden flex items-end animate-in fade-in duration-150"
          onClick={() => setShowActionSheet(false)}
        >
          <div
            className={`w-full ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} rounded-t-3xl border-t p-5 pb-8 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle & Title */}
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="w-10 h-1 rounded-full bg-zinc-600/50" />
              <div className="w-full flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Publication Institutionnelle</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Sélectionnez le type d'émission officielle</p>
                </div>
                <button
                  onClick={() => setShowActionSheet(false)}
                  className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 1. Alerte Officielle */}
            <button
              onClick={() => handleAction('alert')}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Diffuser une Alerte</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Sécurité civile, urgence sanitaire, vigilance</p>
              </div>
            </button>

            {/* 2. Recrutement Institutionnel */}
            <button
              onClick={() => handleAction('job')}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Offre de Recrutement</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Poste officiel, concours, candidature CV PDF</p>
              </div>
            </button>

            {/* 3. Vidéo Institutionnelle */}
            <button
              onClick={() => handleAction('video')}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <VideoIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Vidéo Institutionnelle</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Allocution, rapport annuel, documentaire</p>
              </div>
            </button>

            {/* 4. Créer un Événement */}
            <button
              onClick={() => handleAction('event')}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Créer un Événement / Sommet</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Conférence, assemblée, diffusion Live</p>
              </div>
            </button>

            {/* 5. Communiqué Officiel */}
            <button
              onClick={() => handleAction('announcement')}
              className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                isDark ? 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Communiqué & Déclaration</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Annonce générale, information publique</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Mobile: 5-slot Bottom Navigation Bar (Coherent with ProSidebar) */}
      {isMobile && !isExcludedMobileRoute && (
        <div className={`md:hidden fixed bottom-3 left-3 right-3 ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-slate-200'} border rounded-2xl z-[10000] safe-area-pb backdrop-blur-md shadow-xl`}>
          <nav className="flex justify-around items-center h-14 sm:h-16 px-1 relative">
            {/* 1. Accueil */}
            <NavLink
              to="/social"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 flex-1 min-w-0 transition-colors ${
                  isActive
                    ? 'text-emerald-500 font-bold'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium truncate">Accueil</span>
            </NavLink>

            {/* 2. Événements */}
            <NavLink
              to="/social/events"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 flex-1 min-w-0 transition-colors ${
                  isActive
                    ? 'text-emerald-500 font-bold'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium truncate">Événements</span>
            </NavLink>

            {/* 3. Center Elevated + Button */}
            <div className="flex-1 flex items-center justify-center -mt-5">
              <button
                onClick={() => setShowActionSheet(true)}
                className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform"
                title="Créer une publication institutionnelle"
                aria-label="Créer"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* 4. Mon Institution */}
            <NavLink
              to="/social/institution"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 flex-1 min-w-0 transition-colors ${
                  isActive
                    ? 'text-emerald-500 font-bold'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Building2 className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium truncate">Mon Inst.</span>
            </NavLink>

            {/* 5. Abonnement */}
            <NavLink
              to="/social/plans"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 flex-1 min-w-0 transition-colors ${
                  isActive
                    ? 'text-emerald-500 font-bold'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium truncate">Abonnement</span>
            </NavLink>
          </nav>
        </div>
      )}

      {/* Desktop: Sleek Left Sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 w-64 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} border-r z-40 flex flex-col justify-between`}>
        <div className="p-4">
          {/* Logo & Module Title */}
          <div className="flex items-center gap-3 mb-6 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className={`font-bold text-base block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>EXILE Social</span>
              <span className="text-[11px] text-emerald-500 font-semibold tracking-wider uppercase">Infrastructure</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {SOCIAL_DESKTOP_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : isDark
                      ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Module Switcher */}
        <div className={`p-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <button
            onClick={() => navigate('/pro')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              isDark
                ? 'border-zinc-700 bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Passer au Module Pro</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default SocialSidebar

