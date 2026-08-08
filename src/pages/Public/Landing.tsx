import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  Briefcase, 
  Building2, 
  Video, 
  ArrowRight, 
  CheckCircle
} from 'lucide-react'

export const Landing = (): JSX.Element => {
  const { resolvedTheme } = useTheme()

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary py-16 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8">
            <span className="text-white/80 text-xs sm:text-sm">Par Tiger and Light LLC</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            EXILE
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-3 sm:mb-4 max-w-3xl mx-auto px-2">
            La plateforme 3-en-1 qui sépare les mondes
          </p>
          <p className="text-base sm:text-lg text-white/70 mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
            Professionnel. Social institutionnel. Divertissement. <br className="hidden sm:block" />
            Chacun sa place, chacun sa crédibilité.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
            <Link
              to="/register"
              className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-primary hover:bg-gray-100'} font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto`}
            >
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link
              to="/pricing"
              className="border-2 border-white text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className={`py-12 sm:py-16 md:py-20 px-4 ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className={`text-2xl sm:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
              Trois modules. Une vision claire.
            </h2>
            <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto px-4 text-sm sm:text-base`}>
              EXILE ne mélange pas les genres. Chaque module est étanche, 
              sécurisé et conçu pour sa mission spécifique.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Module Professional */}
            <div className="bg-gradient-to-br from-pro/5 to-pro/10 rounded-2xl p-5 sm:p-6 md:p-8 border border-pro/20">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pro/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Briefcase className="w-5 h-5 sm:w-7 sm:h-7 text-pro" />
              </div>
              <h3 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-3`}>
                Professionnel
              </h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4 sm:mb-6 text-sm sm:text-base`}>
                Vidéos d'expertise, lives payants, marketplace de compétences. 
                Monétisez votre savoir-faire avec commission 15%.
              </p>
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <li className={`flex items-center text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pro mr-2" />
                  Profils créateurs
                </li>
                <li className={`flex items-center text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pro mr-2" />
                  Système de demandes
                </li>
                <li className={`flex items-center text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pro mr-2" />
                  Revenus directs
                </li>
              </ul>
              <Link
                to="/register"
                className="text-pro font-semibold hover:underline flex items-center text-sm sm:text-base"
              >
                Rejoindre <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              </Link>
            </div>
            
            {/* Module Social */}
            <div className="bg-gradient-to-br from-social/5 to-social/10 rounded-2xl p-5 sm:p-6 md:p-8 border border-social/20">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-social/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Building2 className="w-5 h-5 sm:w-7 sm:h-7 text-social" />
              </div>
              <h3 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-3`}>
                Social Institutionnel
              </h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4 sm:mb-6 text-sm sm:text-base`}>
                Institutions vérifiées uniquement. Alertes officielles, 
                recrutement, appels d'offres et forums sécurisés.
              </p>
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <li className={`flex items-center text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-social mr-2" />
                  Badge vérifié
                </li>
                <li className={`flex items-center text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-social mr-2" />
                  Alertes prioritaires
                </li>
                <li className={`flex items-center text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-social mr-2" />
                  Recrutement sécurisé
                </li>
              </ul>
              <Link
                to="/social/institution/request"
                className="text-social font-semibold hover:underline flex items-center text-sm sm:text-base"
              >
                Demander compte <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              </Link>
            </div>
            
            {/* Module Funny - Coming Soon */}
            <div className={`bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-gray-800 to-gray-900 border-gray-700' : 'from-gray-100 to-gray-50 border-gray-200'} rounded-2xl p-5 sm:p-6 md:p-8 border relative`}>
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
                Bientôt
              </div>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl flex items-center justify-center mb-4 sm:mb-6`}>
                <Video className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400" />
              </div>
              <h3 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-3`}>
                Funny
              </h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4 sm:mb-6 text-sm sm:text-base`}>
                Divertissement court-forme. Cadeaux virtuels, fan clubs, 
                monétisation par engagement.
              </p>
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <li className="flex items-center text-xs sm:text-sm text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 mr-2" />
                  Vidéos courtes
                </li>
                <li className="flex items-center text-xs sm:text-sm text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 mr-2" />
                  Fan clubs
                </li>
                <li className="flex items-center text-xs sm:text-sm text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 mr-2" />
                  Cadeaux virtuels
                </li>
              </ul>
              <span className="text-gray-400 font-semibold cursor-not-allowed text-sm sm:text-base">
                Disponible après lancement
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-br from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Prêt à rejoindre EXILE ?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 px-4">
            Créez votre compte professionnel gratuitement ou demandez 
            la création d'un compte institutionnel vérifié.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
            <Link
              to="/register"
              className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-primary hover:bg-gray-100'} font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-colors w-full sm:w-auto`}
            >
              Créer un compte Pro
            </Link>
            <Link
              to="/social/institution/request"
              className="border-2 border-white text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              Demander compte Institution
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
