import { Link } from 'react-router-dom'
import { 
  Briefcase, 
  Building2, 
  Video, 
  ArrowRight, 
  CheckCircle,
  Globe,
  Shield
} from 'lucide-react'

export const Landing = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 mb-8">
            <span className="text-white/80 text-sm">Par Tiger and Light LLC</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            EXILE
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            La plateforme 3-en-1 qui sépare les mondes
          </p>
          <p className="text-lg text-white/70 mb-12 max-w-2xl mx-auto">
            Professionnel. Social institutionnel. Divertissement. <br/>
            Chacun sa place, chacun sa crédibilité.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="bg-white text-primary font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trois modules. Une vision claire.
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              EXILE ne mélange pas les genres. Chaque module est étanche, 
              sécurisé et conçu pour sa mission spécifique.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Module Professional */}
            <div className="bg-gradient-to-br from-pro/5 to-pro/10 rounded-2xl p-8 border border-pro/20">
              <div className="w-14 h-14 bg-pro/20 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-pro" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Professionnel
              </h3>
              <p className="text-gray-600 mb-6">
                Vidéos d'expertise, lives payants, marketplace de compétences. 
                Monétisez votre savoir-faire avec commission 15%.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-pro mr-2" />
                  Profils créateurs
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-pro mr-2" />
                  Système de demandes
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-pro mr-2" />
                  Revenus directs
                </li>
              </ul>
              <Link
                to="/register"
                className="text-pro font-semibold hover:underline flex items-center"
              >
                Rejoindre <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {/* Module Social */}
            <div className="bg-gradient-to-br from-social/5 to-social/10 rounded-2xl p-8 border border-social/20">
              <div className="w-14 h-14 bg-social/20 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-social" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Social Institutionnel
              </h3>
              <p className="text-gray-600 mb-6">
                Institutions vérifiées uniquement. Alertes officielles, 
                recrutement, appels d'offres et forums sécurisés.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-social mr-2" />
                  Badge vérifié
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-social mr-2" />
                  Alertes prioritaires
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-social mr-2" />
                  Recrutement sécurisé
                </li>
              </ul>
              <Link
                to="/social/institution/request"
                className="text-social font-semibold hover:underline flex items-center"
              >
                Demander compte <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {/* Module Funny - Coming Soon */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-8 border border-gray-200 relative">
              <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                Bientôt
              </div>
              <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mb-6">
                <Video className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Funny
              </h3>
              <p className="text-gray-600 mb-6">
                Divertissement court-forme. Cadeaux virtuels, fan clubs, 
                monétisation par engagement.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-gray-300 mr-2" />
                  Vidéos courtes
                </li>
                <li className="flex items-center text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-gray-300 mr-2" />
                  Fan clubs
                </li>
                <li className="flex items-center text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-gray-300 mr-2" />
                  Cadeaux virtuels
                </li>
              </ul>
              <span className="text-gray-400 font-semibold cursor-not-allowed">
                Disponible après lancement
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à rejoindre EXILE ?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Créez votre compte professionnel gratuitement ou demandez 
            la création d'un compte institutionnel vérifié.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="bg-white text-primary font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Créer un compte Pro
            </Link>
            <Link
              to="/social/institution/request"
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
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
