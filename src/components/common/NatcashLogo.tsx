import React from 'react'

interface NatcashLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

/**
 * Logo officiel Natcash (Mobile Money Natcom)
 * Couleurs officielles : Orange Natcash (#FF6B00 / #FF7700) et Bleu Nuit (#002868)
 */
export const NatcashLogo: React.FC<NatcashLogoProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Emblème Natcash officiel */}
      <svg
        className={`${iconSizes[size]} flex-shrink-0`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="48" fill="#FF6B00" />
        {/* Symbole N stylisé et flux de paiement mobile */}
        <path
          d="M28 70V30H38L54 55V30H64V70H54L38 45V70H28Z"
          fill="white"
        />
        <circle cx="73" cy="33" r="6" fill="#002868" />
        <path
          d="M62 70C67 73 73 72 76 68"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className={`flex items-baseline tracking-tight font-black leading-none ${textSizes[size]}`}>
          <span className="text-[#002868] dark:text-white font-extrabold tracking-tight">nat</span>
          <span className="text-[#FF6B00] font-black tracking-tight">cash</span>
        </div>
      )}
    </div>
  )
}

export const NatcashIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="22" fill="#FF6B00" />
    <path
      d="M28 70V30H38L54 55V30H64V70H54L38 45V70H28Z"
      fill="white"
    />
    <circle cx="73" cy="33" r="6" fill="#002868" />
  </svg>
)

export default NatcashLogo
