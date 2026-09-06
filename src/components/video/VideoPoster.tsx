import { useState } from 'react'
import { Film } from 'lucide-react'

interface VideoPosterProps {
  thumbnail?: string
  videoUrl?: string
  title?: string
  className?: string
}

/**
 * Affiche l'image réelle de la vidéo:
 * - la cover si disponible
 * - sinon un fallback visuel propre et léger sans forcer le téléchargement MP4 via Supabase Storage
 */
export function VideoPoster({ thumbnail, videoUrl: _videoUrl, title, className = 'absolute inset-0 w-full h-full object-cover' }: VideoPosterProps) {
  const [imageFailed, setImageFailed] = useState(false)

  if (thumbnail && !imageFailed) {
    return (
      <img
        src={thumbnail}
        alt={title || 'Miniature de la vidéo'}
        className={className}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    )
  }

  // Fallback sécurisé et sans surconsommation de bande passante
  return (
    <div
      className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-zinc-400 select-none ${className}`}
      aria-label={title || 'Aperçu de la vidéo'}
    >
      <Film className="w-7 h-7 text-zinc-500 opacity-60 mb-1" />
      {title && (
        <span className="text-[10px] font-medium text-zinc-400 text-center line-clamp-1 px-2 max-w-[90%]">
          {title}
        </span>
      )}
    </div>
  )
}
