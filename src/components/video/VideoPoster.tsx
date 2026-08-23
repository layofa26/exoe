import { useState } from 'react'

interface VideoPosterProps {
  thumbnail?: string
  videoUrl?: string
  title?: string
  className?: string
}

/**
 * Affiche l'image réelle de la vidéo:
 * - la cover si le backend en a une
 * - sinon la première image de la vidéo (fragment média #t=0.1, sans téléchargement complet)
 */
export function VideoPoster({ thumbnail, videoUrl, title, className = 'absolute inset-0 w-full h-full object-cover' }: VideoPosterProps) {
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

  if (videoUrl) {
    return (
      <video
        src={`${videoUrl}${videoUrl.includes('#') ? '' : '#t=0.1'}`}
        className={className}
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
        aria-label={title || 'Aperçu de la vidéo'}
      />
    )
  }

  return null
}
