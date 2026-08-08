import { useState } from 'react'
import { Building2, CheckCircle, ArrowRight, Info } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { InstitutionPlan } from '../../types'
import { useNavigate } from 'react-router-dom'

const PLANS = [
  {
    id: 'verified' as InstitutionPlan,
    name: 'Verified',
    price: 'Gratuit',
    description: 'Pour les institutions qui souhaitent une validation de base',
    features: [
      'Validation de l\'institution',
      'Publication d\'alertes (limité à 5/mois)',
      'Recrutement (5 offres/mois)',
      'Événements (2/mois)',
      'Support email',
      'Badge "Vérifié"',
    ],
    limitations: [
      'Pas de vidéos',
      'Pas de boost de visibilité',
      'Support standard',
    ],
    popular: false,
  },
  {
    id: 'standard' as InstitutionPlan,
    name: 'Standard',
    price: '$49/mois',
    description: 'Pour les institutions actives qui ont besoin de fonctionnalités complètes',
    features: [
      'Tout Verified',
      'Publication illimitée',
      'Recrutement illimité',
      'Événements illimités',
      'Vidéos institutionnelles',
      'Analytics détaillés',
      'Support prioritaire',
      'Badge "Standard"',
    ],
    limitations: [],
    popular: true,
  },
  {
    id: 'premium' as InstitutionPlan,
    name: 'Premium',
    price: '$99/mois',
    description: 'Pour les institutions qui veulent une visibilité maximale',
    features: [
      'Tout Standard',
      'Boost de visibilité (x3)',
      'Alertes push automatiques',
      'API accès',
      'Account manager dédié',
      'Personnalisation avancée',
      'Rapports personnalisés',
      'Badge "Premium"',
    ],
    limitations: [],
    popular: false,
  },
]

export const InstitutionPlans = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<InstitutionPlan>('standard')
  const [isAnnual, setIsAnnual] = useState(false)

  const handleSelectPlan = (planId: InstitutionPlan) => {
    setSelectedPlan(planId)
  }

  const handleContinue = () => {
    // Stocker le plan sélectionné et rediriger vers le paiement
    localStorage.setItem('exile_selected_plan', selectedPlan)
    navigate('/social')
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} py-6 md:py-8 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 text-social" />
            <h1 className={`text-2xl md:text-4xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Plans Institutionnels
            </h1>
          </div>
          <p className={`text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Choisissez le plan qui correspond aux besoins de votre institution. Tous les plans incluent la validation de l'identité.
          </p>
        </div>

        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6 md:mb-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-social' : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
            Mensuel
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isAnnual ? 'bg-social' : resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-social' : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
            Annuel <span className="text-emerald-500 text-xs">(-20%)</span>
          </span>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className={`relative p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-social bg-social/5'
                  : resolvedTheme === 'dark'
                  ? 'border-zinc-700 hover:border-zinc-600'
                  : 'border-gray-200 hover:border-gray-300'
              } ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-social text-white text-xs font-bold px-3 py-1 rounded-full">
                  Populaire
                </div>
              )}

              {/* Plan Name */}
              <h3 className={`text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <div className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {isAnnual && plan.id !== 'verified'
                    ? `$${(parseInt(plan.price.replace('$', '').replace('/mois', '')) * 0.8).toFixed(0)}/mois`
                    : plan.price}
                </div>
                {isAnnual && plan.id !== 'verified' && (
                  <div className={`text-sm line-through ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                    {plan.price}
                  </div>
                )}
                {plan.id === 'verified' && <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Toujours gratuit</div>}
              </div>

              {/* Description */}
              <p className={`text-xs md:text-sm mb-4 md:mb-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                {plan.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className={`text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <div className={`p-2 md:p-3 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'} mb-4 md:mb-6`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
                    <span className={`text-[10px] md:text-xs font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Limitations</span>
                  </div>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className={`text-[10px] md:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                        • {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Select Button */}
              <button
                className={`w-full py-2 md:py-3 rounded-lg font-medium transition-colors text-xs md:text-sm ${
                  selectedPlan === plan.id
                    ? 'bg-social text-white'
                    : resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {selectedPlan === plan.id ? 'Sélectionné' : 'Sélectionner'}
              </button>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 mb-8`}>
          <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
            Comparaison des fonctionnalités
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-medium`}>
                    Fonctionnalité
                  </th>
                  <th className={`text-center py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-medium`}>
                    Verified
                  </th>
                  <th className={`text-center py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-medium text-social`}>
                    Standard
                  </th>
                  <th className={`text-center py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-medium`}>
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Alertes', verified: '5/mois', standard: 'Illimité', premium: 'Illimité + Push' },
                  { feature: 'Recrutement', verified: '5 offres/mois', standard: 'Illimité', premium: 'Illimité' },
                  { feature: 'Événements', verified: '2/mois', standard: 'Illimité', premium: 'Illimité' },
                  { feature: 'Vidéos', verified: '❌', standard: '✅', premium: '✅' },
                  { feature: 'Boost visibilité', verified: '❌', standard: '❌', premium: '✅ (x3)' },
                  { feature: 'Analytics', verified: 'Basique', standard: 'Détaillé', premium: 'Avancé' },
                  { feature: 'Support', verified: 'Email', standard: 'Prioritaire', premium: 'Dédié' },
                  { feature: 'API accès', verified: '❌', standard: '❌', premium: '✅' },
                ].map((row) => (
                  <tr key={row.feature} className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'} last:border-0`}>
                    <td className={`py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{row.feature}</td>
                    <td className="text-center py-3 px-4">{row.verified}</td>
                    <td className="text-center py-3 px-4 text-social font-medium">{row.standard}</td>
                    <td className="text-center py-3 px-4">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 mb-8`}>
          <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                question: 'Puis-je changer de plan plus tard?',
                answer: 'Oui, vous pouvez changer de plan à tout moment. Les changements sont appliqués immédiatement.',
              },
              {
                question: 'Quels modes de paiement acceptez-vous?',
                answer: 'Nous acceptons les cartes de crédit (Visa, Mastercard, American Express) et les virements bancaires.',
              },
              {
                question: 'Y a-t-il un engagement?',
                answer: 'Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment.',
              },
              {
                question: 'Comment fonctionne la validation?',
                answer: 'La validation est effectuée manuellement par notre équipe. Le processus prend généralement 1-2 jours ouvrables.',
              },
            ].map((faq, index) => (
              <div key={index} className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {faq.question}
                </h3>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/social/institution/request')}
            className={`px-6 py-3 rounded-lg font-medium ${
              resolvedTheme === 'dark'
                ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            Retour
          </button>
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-3 bg-social text-white rounded-lg font-medium hover:bg-social/90 transition-colors"
          >
            Continuer avec {PLANS.find((p) => p.id === selectedPlan)?.name}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstitutionPlans
