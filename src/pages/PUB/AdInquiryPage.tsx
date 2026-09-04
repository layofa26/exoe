import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Megaphone, CheckCircle2, Send } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { triggerPubNotification } from '../../services/pubNotificationService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

export default function AdInquiryPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const navigate = useNavigate()
  const { user } = useAuth()

  const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
  const userUuid = String(user?.id || userProfile?.id || userProfile?.uuid || 'guest_' + Date.now())
  const platformLogo = localStorage.getItem('exile_pub_platform_logo')

  const [form, setForm] = useState({
    companyName: '',
    contactName: userProfile?.name || '',
    email: userProfile?.email || '',
    phoneWhatsApp: '',
    preferredContact: 'WhatsApp 💬',
    sector: 'Technologie',
    budget: '1000',
    currency: 'HTG',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const newInquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userUuid,
      ...form,
      createdAt: new Date().toISOString()
    }

    try {
      const existing = JSON.parse(localStorage.getItem('exile_pub_inquiries') || '[]')
      localStorage.setItem('exile_pub_inquiries', JSON.stringify([newInquiry, ...existing]))
      window.dispatchEvent(new CustomEvent('exile_pub_inquiry_added', { detail: newInquiry }))
      window.dispatchEvent(new Event('storage'))

      await fetch(`${API_BASE_URL}/pub/annonces/inquiry/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInquiry)
      }).catch(() => {})

      // Déclencher la notification utilisateur avec le logo PUB
      triggerPubNotification({
        type: 'inquiry_received',
        brandName: form.companyName,
        inquiryId: newInquiry.id,
        userUuid
      })
    } catch {}

    setIsSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'} py-3 sm:py-8 px-2 sm:px-6`}>
      <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6">
        
        {/* En-tête avec bouton retour */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <ArrowLeft size={16} />
            <span>Retour</span>
          </button>

          {platformLogo && (
            <img src={platformLogo} alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-white/20 shadow-sm" />
          )}
        </div>

        {/* Titre & Description */}
        <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Megaphone size={24} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black">Demande de Campagne Publicitaire</h1>
              <p className="text-xs text-zinc-400">Espace Entreprise (PUB) · Visibilité auprès de la communauté EXILE</p>
            </div>
          </div>

          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-500">Demande envoyée avec succès !</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                  Notre équipe va examiner votre demande et configurer votre campagne dans le Dashboard PUB. Vous recevrez une notification dès validation.
                </p>
              </div>
              <div className="pt-3 flex gap-3 justify-center">
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-700 hover:bg-zinc-800"
                >
                  Envoyer une autre demande
                </button>
                <button
                  onClick={() => navigate('/pro')}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF6B00] text-white hover:bg-[#e05e00]"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Nom de votre entreprise / Marque *</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Ex: CaribTech, Solèy Market, etc."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    isDark ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Nom du contact *</label>
                  <input
                    type="text"
                    required
                    value={form.contactName}
                    onChange={e => setForm({ ...form, contactName: e.target.value })}
                    placeholder="Votre nom complet"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Secteur d'activité *</label>
                  <select
                    value={form.sector}
                    onChange={e => setForm({ ...form, sector: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                  >
                    <option value="Technologie">Technologie & IT</option>
                    <option value="Finance">Finance & Fintech</option>
                    <option value="Commerce">Commerce & Distribution</option>
                    <option value="Santé">Santé & Médical</option>
                    <option value="Éducation">Éducation & Formation</option>
                    <option value="Services">Services Professionnels</option>
                    <option value="Autre">Autre secteur</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Numéro Téléphone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={form.phoneWhatsApp}
                    onChange={e => setForm({ ...form, phoneWhatsApp: e.target.value })}
                    placeholder="+509 3xxx-xxxx"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Email professionnel</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@entreprise.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Budget envisagé</label>
                  <input
                    type="number"
                    min="100"
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Devise</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                  >
                    <option value="HTG">Gourde (HTG)</option>
                    <option value="USD">Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="CAD">Dollar Canadien (CAD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Message ou objectif de la publicité</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Décrivez brièvement le produit, service ou événement que vous souhaitez promouvoir..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    isDark ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande publicitaire'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
