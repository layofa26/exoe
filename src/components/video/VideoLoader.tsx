interface VideoLoaderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Composant pour afficher un loader pendant le chargement de la vidéo
 * Animations fluides pour une expérience utilisateur optimale
 */
export function VideoLoader({ size = 'medium', className = '' }: VideoLoaderProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {/* Spinner principal */}
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full opacity-25" />
        <div className="absolute inset-0 border-4 border-white rounded-full border-t-transparent animate-spin" />
      </div>
    </div>
  );
}

/**
 * Loader avec texte (pour les cas de chargement lent)
 */
export function VideoLoaderWithText({ 
  text = 'Chargement...', 
  className = '' 
}: { 
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <VideoLoader size="medium" />
      <p className="text-sm text-gray-400 animate-pulse">{text}</p>
    </div>
  );
}
