import { AlertCircle, RefreshCw } from 'lucide-react';

interface VideoErrorProps {
  errorType?: 'deleted' | 'private' | 'processing' | 'network' | 'invalid' | 'generic';
  onRetry?: () => void;
  className?: string;
}

/**
 * Composant pour afficher les erreurs de chargement vidéo
 * Gère différents cas d'erreur avec des messages appropriés
 */
export function VideoError({ 
  errorType = 'generic', 
  onRetry,
  className = '' 
}: VideoErrorProps) {
  const errorMessages: Record<string, { title: string; message: string }> = {
    deleted: {
      title: 'Vidéo supprimée',
      message: 'Cette vidéo n\'est plus disponible',
    },
    private: {
      title: 'Vidéo privée',
      message: 'Cette vidéo n\'est pas accessible',
    },
    processing: {
      title: 'Vidéo en cours de traitement',
      message: 'La vidéo sera bientôt disponible',
    },
    network: {
      title: 'Erreur de connexion',
      message: 'Vérifiez votre connexion internet',
    },
    invalid: {
      title: 'Vidéo invalide',
      message: 'Le format de la vidéo n\'est pas supporté',
    },
    generic: {
      title: 'Erreur de chargement',
      message: 'Impossible de charger la vidéo',
    },
  };

  const { title, message } = errorMessages[errorType] || errorMessages.generic;

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      )}
    </div>
  );
}
