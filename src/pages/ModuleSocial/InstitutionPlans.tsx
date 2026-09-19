import { useState } from 'react'
import { Building2, CheckCircle, ArrowRight, Info } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { InstitutionPlan } from '../../types'
import { useNavigate } from 'react-router-dom'
import { SocialHeader } from '../../components/social/SocialHeader'

const PLANS = [
  {
    id: 'verified' as InstitutionPlan,
    name: 'Vérifié',
    price: '$20',
    period: 'Paiement unique',
    description: 'Profil institutionnel uniquement avec validation officielle',
    features: [
      'Profil public avec badge ⏳',
      'Recevoir des abonnés (followers)',
      'Réception de messages entrants',
      'Validation juridique par EXILE',
      'Support par email',
    ],
    limitations: [
      'Aucune publication d\'alerte',
      'Pas de recrutement',
      'Pas de live ni de vidéo',
    ],
    popular: false,
    ctaText: 'Demander un compte',
  },
  {
    id: 'starter' as InstitutionPlan,
    name: 'Starter',
    price: '$20/mois',
    period: '/mois',
    description: 'Pour petites institutions, mairies et délégations locales',
    features: [
      'Tout le plan Vérifié inclus',
      '1 alerte officielle / mois',
      '1 offre de recrutement / mois',
      'Badge ✓ vert actif',
      'Statistiques de consultation de base',
      'Support standard sous 24h',
    ],
    limitations: [
      'Pas de live',
      'Pas de vidéo institutionnelle',
    ],
    popular: false,
    ctaText: 'Choisir Starter',
  },
  {
    id: 'standard' as InstitutionPlan,
    name: 'Standard',
    price: '$50/mois',
    period: '/mois',
    description: 'Pour institutions actives ayant une communication officielle régulière',
    features: [
      'Tout le plan Starter inclus',
      '3 alertes officielles / mois',
      '3 offres de recrutement / mois',
      '1 live officiel / mois',
      '1 vidéo institutionnelle / mois',
      'Accès au Boost unitaire pour visibilité',
      'Statistiques complètes & engagement',
      'Support prioritaire',
    ],
    limitations: [],
    popular: true,
    ctaText: 'Choisir Standard',
  },
  {
    id: 'premium' as InstitutionPlan,
    name: 'Premium',
    price: '$70/mois',
    period: '/mois',
    description: 'Pour ministères, grandes institutions, ONG et organisations internationales',
    features: [
      'Publications et alertes illimitées',
      'Lives officiels illimités',
      'Vidéos institutionnelles illimitées',
      'Recrutement officiel illimité',
      'Badge ✓ or officiel premium',
      '5 Boosts de visibilité inclus / mois',
      'Alertes prioritaires avec push ciblé',
      'Support prioritaire dédié 24/7',
    ],
    limitations: [],
    popular: false,
    ctaText: 'Choisir Premium',
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

        {/* Plans Grid - Responsive 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl border-2 p-5 sm:p-6 cursor-pointer transition-all flex flex-col justify-between ${
                selectedPlan === plan.id
                  ? 'border-emerald-500 shadow-xl scale-[1.02] bg-emerald-500/5'
                  : resolvedTheme === 'dark'
                  ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${plan.popular ? 'lg:-mt-2 lg:mb-2' : ''}`}
            >
              <div>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full shadow-md whitespace-nowrap">
                    Recommandé
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className={`text-base sm:text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-3">
                  {plan.period === 'Paiement unique' ? (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl sm:text-3xl font-extrabold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {plan.price}
                      </span>
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>unique</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl sm:text-3xl font-extrabold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {isAnnual
                          ? `$${Math.round(parseInt(plan.price.replace('$', '').replace('/mois', '')) * 0.8)}`
                          : plan.price.split('/')[0]}
                      </span>
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>/mois</span>
                    </div>
                  )}
                  <p className={`text-[11px] mt-0.5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {plan.period === 'Paiement unique' ? 'Paiement unique de validation' : isAnnual ? 'Facturé annuellement (-20%)' : 'Facturé mensuellement'}
                  </p>
                </div>

                {/* Description */}
                <p className={`text-xs mb-4 min-h-[36px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className={`p-2.5 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800/60' : 'bg-gray-100'} mb-4`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Info className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span className={`text-[10px] font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Non inclus</span>
                    </div>
                    <ul className="space-y-0.5">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className={`text-[10px] ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Select Button */}
              <button
                className={`w-full py-2.5 rounded-xl font-bold transition-all text-xs mt-2 ${
                  selectedPlan === plan.id
                    ? 'bg-emerald-600 text-white shadow-md'
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
        <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl border p-5 sm:p-6 mb-8 shadow-sm`}>
          <h2 className={`text-lg sm:text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Comparaison détaillée des 4 plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-3 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-semibold`}>
                    Fonctionnalité
                  </th>
                  <th className={`text-center py-3 px-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-semibold`}>
                    Vérifié ($20 unique)
                  </th>
                  <th className={`text-center py-3 px-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-semibold`}>
                    Starter ($20/mwa)
                  </th>
                  <th className={`text-center py-3 px-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-bold text-emerald-500`}>
                    Standard ($50/mwa)
                  </th>
                  <th className={`text-center py-3 px-2 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} font-semibold`}>
                    Premium ($70/mwa)
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Alertes officielles', verified: '❌', starter: '1 / mois', standard: '3 / mois', premium: 'Illimité + Push' },
                  { feature: 'Offres de recrutement', verified: '❌', starter: '1 / mois', standard: '3 / mois', premium: 'Illimité (CV PDF)' },
                  { feature: 'Événements & Sommets', verified: '❌', starter: '❌', standard: '1 / mois', premium: 'Illimité' },
                  { feature: 'Vidéos institutionnelles', verified: '❌', starter: '❌', standard: '1 / mois', premium: 'Illimité HD' },
                  { feature: 'Badge de validation', verified: 'Badge ⏳', starter: 'Badge ✓ Vert', standard: 'Badge ✓ Vert', premium: 'Badge ✓ Or' },
                  { feature: 'Boost visibilité', verified: '❌', starter: '❌', standard: 'Unitaire (Option)', premium: '5 inclus / mois' },
                  { feature: 'Statistiques', verified: 'Basique', starter: 'Basique', standard: 'Détaillées', premium: 'Avancées & Export' },
                  { feature: 'Support technique', verified: 'Email standard', starter: 'Email 24h', standard: 'Prioritaire', premium: 'Dédié 24/7' },
                ].map((row) => (
                  <tr key={row.feature} className={`border-b ${resolvedTheme === 'dark' ? 'border-zinc-800/60' : 'border-gray-100'} last:border-0`}>
                    <td className={`py-3 px-3 font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{row.feature}</td>
                    <td className="text-center py-3 px-2 text-zinc-400">{row.verified}</td>
                    <td className="text-center py-3 px-2 text-zinc-300">{row.starter}</td>
                    <td className="text-center py-3 px-2 font-bold text-emerald-500 bg-emerald-500/5">{row.standard}</td>
                    <td className="text-center py-3 px-2 text-zinc-300">{row.premium}</td>
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
