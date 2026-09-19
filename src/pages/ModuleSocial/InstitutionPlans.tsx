import { useState } from 'react'
import { Building2, CheckCircle, ArrowRight, Info } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { InstitutionPlan } from '../../types'
import { useNavigate } from 'react-router-dom'
import { SocialHeader } from '../../components/social/SocialHeader'

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

  const handleContinue = () => {
    localStorage.setItem('exile_selected_plan', selectedPlan)
    navigate('/social/institution/request')
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} pb-24 md:pb-12`}>
      <SocialHeader title="Plans d'abonnement" showSearch={false} showCreateButton={false} />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-16 sm:pt-20">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Offres Institutionnelles EXILE</span>
          </div>
          <h1 className={`text-2xl md:text-4xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
            Choisissez le plan adapté à votre institution
          </h1>
          <p className={`text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Des solutions flexibles pour toutes les tailles d'institutions. Changez ou annulez à tout moment.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className={`text-xs md:text-sm ${!isAnnual ? 'font-semibold text-social' : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-12 h-6 rounded-full bg-social p-1 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs md:text-sm ${isAnnual ? 'font-semibold text-social' : resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              Annuel <span className="text-emerald-500 font-bold">-20%</span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl border-2 p-6 md:p-8 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-social shadow-xl scale-[1.02]'
                  : resolvedTheme === 'dark'
                  ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-social text-white text-xs font-bold rounded-full shadow-md">
                  Recommandé
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-social/10 text-social flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className={`text-lg md:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                {plan.id === 'verified' ? (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {isAnnual
                        ? `$${Math.round(parseInt(plan.price.replace('$', '').replace('/mois', '')) * 0.8)}`
                        : plan.price.split('/')[0]}
                    </span>
                    <span className={`text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>/mois</span>
                  </div>
                )}
                {plan.id === 'verified' && <div className={`text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Toujours gratuit</div>}
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
                className={`w-full py-2.5 md:py-3 rounded-xl font-bold transition-all text-xs md:text-sm ${
                  selectedPlan === plan.id
                    ? 'bg-social text-white shadow-md'
                    : resolvedTheme === 'dark'
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === plan.id ? 'Sélectionné' : 'Sélectionner'}
              </button>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl border p-6 mb-8`}>
          <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
            Comparaison des fonctionnalités
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-medium`}>
                    Fonctionnalité
                  </th>
                  <th className={`text-center py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-medium`}>
                    Verified
                  </th>
                  <th className={`text-center py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-medium text-social font-bold`}>
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
                  <tr key={row.feature} className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-100'} last:border-0`}>
                    <td className={`py-3 px-4 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{row.feature}</td>
                    <td className="text-center py-3 px-4">{row.verified}</td>
                    <td className="text-center py-3 px-4 text-social font-semibold">{row.standard}</td>
                    <td className="text-center py-3 px-4">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl border p-6 mb-8`}>
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
              <div key={index} className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {faq.question}
                </h3>
                <p className={`text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/social/institution/request')}
            className={`px-6 py-3 rounded-xl font-semibold text-xs md:text-sm ${
              resolvedTheme === 'dark'
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            Retour
          </button>
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-3 bg-social text-white rounded-xl font-bold text-xs md:text-sm hover:bg-social/90 shadow-md transition-all active:scale-95"
          >
            Continuer avec {PLANS.find((p) => p.id === selectedPlan)?.name}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstitutionPlans
