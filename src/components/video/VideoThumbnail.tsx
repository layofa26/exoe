import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  thumbnailUrl?: string;
  title?: string;
  duration?: string;
  isLive?: boolean;
  showPlayButton?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Composant pour afficher la miniature d'une vidéo
 * Gère les cas suivants:
 * - Si thumbnail existe: afficher miniature + bouton Play
 * - Si thumbnail n'existe pas: afficher placeholder
 * - Erreur de chargement: afficher placeholder
 * - Connexion lente: afficher loader
 */
export function VideoThumbnail({
  thumbnailUrl,
  title = 'Vidéo',
  duration,
  isLive = false,
  showPlayButton = true,
  className = '',
  onLoad,
  onError,
}: VideoThumbnailProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (thumbnailUrl) {
      setImageLoaded(false);
      setImageError(false);

      const img = new Image();
      img.src = thumbnailUrl;
      
      img.onload = () => {
        setImageLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setImageError(true);
        onError?.();
      };
    }
  }, [thumbnailUrl, onLoad, onError]);

  // Si pas de thumbnail ou erreur, afficher placeholder
  if (!thumbnailUrl || imageError) {
    return (
      <div className={`relative aspect-video bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center ${className}`}>
        {showPlayButton && (
          <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        )}
        {duration && !isLive && (
          <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {duration}
          </div>
        )}
      </div>
    );
  }

  // Afficher thumbnail
  return (
    <div className={`relative aspect-video bg-gray-100 overflow-hidden ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900 animate-pulse" />
      )}
      
      <img
        src={thumbnailUrl}
        alt={title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}

      {/* Duration Badge */}
      {duration && !isLive && (
        <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          {duration}
        </div>
      )}

      {/* Play Button Overlay */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
