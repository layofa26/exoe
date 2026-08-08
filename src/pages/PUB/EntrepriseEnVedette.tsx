import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { type Ad, DEMO_ADS } from './AdBanner'

// Récupérer les publicités depuis localStorage ou utiliser DEMO_ADS par défaut
const getStoredAds = (): Ad[] => {
  try {
    const stored = localStorage.getItem('exile_ads')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Erreur lors de la lecture des publicités depuis localStorage:', e)
  }
  // Fallback: utiliser DEMO_ADS
  return DEMO_ADS
}

export const EntrepriseEnVedette = () => {
  const { resolvedTheme } = useTheme()
  const [ads, setAds] = useState<Ad[]>(getStoredAds)
  const [adIdx, setAdIdx] = useState(0)
  const [animatingAds, setAnimatingAds] = useState<number[]>([])
  const activeAds = ads.filter((a) => a.status === "active")

  // Écouter les changements dans localStorage pour se synchroniser avec AdDashboard
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'exile_ads' && e.newValue) {
        try {
          setAds(JSON.parse(e.newValue))
        } catch (err) {
          console.error('Erreur lors de la mise à jour des publicités:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Obtenir une publicité à un index donné
  const getAdAt = (index: number) => activeAds[index % Math.max(activeAds.length, 1)]
  
  // Mobile: 4 publicités (même quantité que laptop)
  const mobileAds = [0, 1, 2, 3].map(i => getAdAt(adIdx + i))
  
  // Tablette: 6 publicités (même quantité que laptop)
  const tabletAds = [0, 1, 2, 3, 4, 5].map(i => getAdAt(adIdx + i))

  // Rotation toutes les 5 secondes - même animation que SectionPub
  useEffect(() => {
    const interval = setInterval(() => {
      // Choisir une publicité aléatoire pour remplacer
      const randomIndex = Math.floor(Math.random() * 6)
      setAnimatingAds([randomIndex])
      
      // Après 500ms d'animation, changer
      setTimeout(() => {
        setAdIdx(prev => prev + 1)
        setAnimatingAds([])
      }, 500)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`px-3 sm:px-4 md:px-6 py-4 ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-50'} rounded-xl`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Entreprise en vedette
        </h3>
        <button className={`text-xs ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
          Voir tout
        </button>
      </div>

      {/* Mobile: 4 publicités horizontales */}
      <div className="flex overflow-x-auto gap-2 px-1 scrollbar-hide sm:hidden" style={{ scrollSnapType: 'x mandatory' }}>
        {mobileAds.map((ad, i) => (
          <div 
            key={`mobile-ad-${ad.id}-${i}`}
            className={`flex-shrink-0 transition-all duration-500 ${
              animatingAds.includes(i) 
                ? 'scale-95 opacity-70' 
                : 'scale-100 opacity-100'
            }`}
            style={{ 
              width: 'calc(25% - 6px)', 
              minWidth: '80px',
              scrollSnapAlign: 'start'
            }}
          >
            <button
              onClick={() => window.open(ad.ctaUrl, '_blank')}
              className="w-full text-left group bg-white dark:bg-zinc-700 rounded-lg overflow-hidden shadow-sm hover:shadow transition-all duration-200 border border-gray-100 dark:border-zinc-600 active:scale-95"
            >
              <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${ad.gradient}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-sm tracking-wider drop-shadow">
                    {ad.brandInitials}
                  </span>
                </div>
                {/* Shine effect lors de la rotation */}
                {animatingAds.includes(i) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className={`text-[10px] font-bold line-clamp-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {ad.brandName}
                </p>
                <p className={`text-[8px] line-clamp-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {ad.category}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Tablette: 6 publicités horizontales */}
      <div className="hidden sm:flex lg:hidden overflow-x-auto gap-2 px-1 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
        {tabletAds.map((ad, i) => (
          <div 
            key={`tablet-ad-${ad.id}-${i}`}
            className={`flex-shrink-0 transition-all duration-500 ${
              animatingAds.includes(i) 
                ? 'scale-95 opacity-70' 
                : 'scale-100 opacity-100'
            }`}
            style={{ 
              width: 'calc(16.666% - 8px)', 
              minWidth: '100px',
              scrollSnapAlign: 'start'
            }}
          >
            <button
              onClick={() => window.open(ad.ctaUrl, '_blank')}
              className="w-full text-left group bg-white dark:bg-zinc-700 rounded-lg overflow-hidden shadow-sm hover:shadow transition-all duration-200 border border-gray-100 dark:border-zinc-600 active:scale-95"
            >
              <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${ad.gradient}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-base tracking-wider drop-shadow">
                    {ad.brandInitials}
                  </span>
                </div>
                {/* Shine effect lors de la rotation */}
                {animatingAds.includes(i) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className={`text-xs font-bold line-clamp-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {ad.brandName}
                </p>
                <p className={`text-[10px] line-clamp-1 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {ad.category}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Animation CSS custom - même que SectionPub */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 0.6s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default EntrepriseEnVedette


