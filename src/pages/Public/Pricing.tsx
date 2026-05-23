import { Link } from 'react-router-dom'
import { Check, X, Building2, Briefcase } from 'lucide-react'

interface PlanFeature {
  text: string
  included: boolean
}

interface InstitutionPlan {
  name: string
  price: number
  period: 'one-time' | 'month'
  description: string
  features: PlanFeature[]
  cta: string
  ctaLink: string
  highlighted: boolean
}

export const Pricing = (): JSX.Element => {
  const institutionPlans: InstitutionPlan[] = [
    {
      name: 'Vérifié',
      price: 20,
      period: 'one-time',
      description: 'Profil institutionnel uniquement',
      features: [
        { text: 'Profil public avec badge ⏳', included: true },
        { text: 'Recevoir des followers', included: true },
        { text: 'Messages entrants', included: true },
        { text: 'Aucune publication', included: false },
        { text: 'Pas de recrutement', included: false },
        { text: 'Pas de live', included: false },
      ],
      cta: 'Demander un compte',
      ctaLink: '/social/institution/request',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 20,
      period: 'month',
      description: 'Pour petites institutions',
      features: [
        { text: 'Tout du plan Vérifié', included: true },
        { text: '1 alerte/mois', included: true },
        { text: '1 recrutement/mois', included: true },
        { text: 'Badge ✓ vert actif', included: true },
        { text: 'Pas de live', included: false },
        { text: 'Pas de vidéo', included: false },
      ],
      cta: 'Choisir Starter',
      ctaLink: '/social/plans',
      highlighted: false,
    },
    {
      name: 'Standard',
      price: 50,
      period: 'month',
      description: 'Pour institutions actives',
      features: [
        { text: 'Tout du plan Starter', included: true },
        { text: '3 alertes/mois', included: true },
        { text: '3 recrutements/mois', included: true },
        { text: '1 live/mois', included: true },
        { text: '1 vidéo/mois', included: true },
        { text: 'Boost unitaire disponible', included: true },
      ],
      cta: 'Choisir Standard',
      ctaLink: '/social/plans',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: 70,
      period: 'month',
      description: 'Pour grandes institutions',
      features: [
        { text: 'Publications illimitées', included: true },
        { text: 'Lives illimités', included: true },
        { text: 'Vidéos illimitées', included: true },
        { text: 'Badge ✓ or premium', included: true },
        { text: 'Boost inclus (5/mois)', included: true },
        { text: 'Support prioritaire', included: true },
      ],
      cta: 'Choisir Premium',
      ctaLink: '/social/plans',
      highlighted: false,
    },
  ]

  const proFeatures: string[] = [
    'Compte gratuit',
    'Publication vidéos illimitée',
    'Lives gratuits ou payants',
    'Commission 15% sur revenus',
    'Système de demandes',
    'Profil public avec stats',
    'Boost de visibilité',
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tarifs EXILE
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choisissez le plan adapté à vos besoins. Professionnels gratuits, 
            institutions vérifiées.
          </p>
        </div>

        {/* Professional Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-pro/10 text-pro px-4 py-2 rounded-full mb-4">
              <Briefcase className="w-5 h-5" />
              <span className="font-semibold">Module Professionnel</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Gratuit pour les professionnels
            </h2>
          </div>

          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 border-2 border-pro/20">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-pro mb-2">
                Gratuit
              </div>
              <p className="text-gray-600">
                Commission de 15% sur les transactions uniquement
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-pro flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="block w-full text-center bg-pro text-white font-semibold py-4 rounded-xl hover:bg-pro/90"
            >
              Créer un compte Pro gratuit
            </Link>
          </div>
        </div>

        {/* Institution Section */}
        <div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-social/10 text-social px-4 py-2 rounded-full mb-4">
              <Building2 className="w-5 h-5" />
              <span className="font-semibold">Module Social Institutionnel</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Institutions vérifiées
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {institutionPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-social to-blue-600 text-white shadow-xl scale-105'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.period === 'one-time' ? ' unique' : '/mois'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start space-x-3">
                      {feature.included ? (
                        <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-social'}`} />
                      ) : (
                        <X className="w-5 h-5 flex-shrink-0 text-gray-300" />
                      )}
                      <span className={`text-sm ${
                        feature.included
                          ? plan.highlighted ? 'text-white' : 'text-gray-700'
                          : 'text-gray-400'
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.ctaLink}
                  className={`block w-full text-center font-semibold py-3 rounded-xl ${
                    plan.highlighted
                      ? 'bg-white text-social hover:bg-gray-100'
                      : 'bg-social/10 text-social hover:bg-social/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing
