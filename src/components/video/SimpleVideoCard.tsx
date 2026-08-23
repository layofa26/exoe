import { useState, useEffect, useRef } from 'react';
import type { Video } from '../../types/video';
import { Play, MessageCircle, Trash2 } from 'lucide-react';
import { ContactModal } from '../modals/ContactModal';
import { useTheme } from '../../contexts/ThemeContext';
import { VideoPoster } from './VideoPoster';

interface SimpleVideoCardProps {
  video: Video;
  onClick?: () => void;
  onDelete?: (videoId: string) => void;
  autoplay?: boolean;
}

export function SimpleVideoCard({ video, onClick, onDelete, autoplay = false }: SimpleVideoCardProps) {
  const { resolvedTheme } = useTheme();
  
  // Defensive: asire video ak author egziste
  if (!video) {
    return null;
  }
  
  const author = video.author || {
    id: 'unknown',
    name: 'Inconnu',
    profession: '',
    initials: '?',
    avatarColor: '#666',
    avatarUrl: ''
  };
  
  const [showContactModal, setShowContactModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay logic
  useEffect(() => {
    if (autoplay && video.videoUrl && videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.muted = true;
      videoElement.play().catch(err => {
        console.log('Autoplay prevented:', err);
      });

      // Ne pas arrêter l'autoplay si la lecture aléatoire est activée
      const previewEnabled = localStorage.getItem('exile_video_preview_enabled');
      if (previewEnabled !== 'true') {
        // Arrêter autoplay après 5 secondes si la lecture aléatoire n'est pas activée
        const timeout = setTimeout(() => {
          videoElement.pause();
        }, 5000);

        return () => {
          clearTimeout(timeout);
          videoElement.pause();
        };
      }

      return () => {
        videoElement.pause();
      };
    }
  }, [autoplay, video.videoUrl]);

  // Profil de l'utilisateur connecté
  const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}');
  const currentUserId = userProfile?.id || 'current-user-' + Date.now();

  const displayUser = {
    id: userProfile?.id || currentUserId,
    name: userProfile?.name || 'Utilisateur',
    profession: userProfile?.profession || 'Professionnel',
    photo: userProfile?.photo || null,
    avatarColor: userProfile?.avatarColor || '#666'
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContactModal(true);
  };

  return (
    <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'} rounded-xl overflow-hidden group cursor-pointer relative`} onClick={onClick}>
      {/* Miniature - thumbnail oswa gradient CSS + bouton play */}
      <div className={`relative aspect-video lg:aspect-video bg-gradient-to-br ${video.gradient} overflow-hidden`}>
        {/* Bouton efase (parèt lè hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Supprimer cette vidéo ?')) {
              onDelete?.(video.id);
            }
          }}
          className="absolute top-2 right-2 z-20 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Supprimer la vidéo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        {/* Video element for autoplay */}
        {autoplay && video.videoUrl ? (
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            loop
          />
        ) : (
          <>
            {/* Cover du backend, sinon première image de la vidéo */}
            <VideoPoster thumbnail={video.thumbnail} videoUrl={video.videoUrl} title={video.title} />
            
            {/* Grain texture overlay (sou thumbnail tou) */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
            
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
            
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/20">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info ultra-compact - Hauteur réduite */}
      <div className={`p-2 ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'}`}>
        {/* User row - Avatar + Nom */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* Avatar - profil utilisateur connecté - Plus petit */}
          <div className="flex-shrink-0">
            {displayUser?.photo ? (
              <img
                src={displayUser.photo}
                alt={displayUser?.name || 'User'}
                className="w-6 h-6 rounded-full object-cover border border-zinc-600"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] border border-zinc-600 bg-gradient-to-br from-blue-500 to-purple-600"
              >
                {displayUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold text-xs truncate`}>{displayUser?.name || 'Utilisateur'}</p>
          </div>

          {/* Bouton Contacter - Plus petit */}
          <button
            onClick={handleContact}
            className="px-2 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium transition-all hover:opacity-90 active:scale-95 flex items-center gap-1"
          >
            <MessageCircle className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Contacter</span>
            <span className="sm:hidden">Chat</span>
          </button>
        </div>

        {/* Titre - 1 ligne seulement */}
        <h3 className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-bold text-sm truncate mb-0.5`}>
          {video.title}
        </h3>

        {/* Vues - Compact */}
        <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-[10px]`}>
          {video.views || 0} vues
        </p>
      </div>

      {/* Modal Kontak */}
      {showContactModal && author && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          receiver={{
            id: author.id,
            name: author.name,
            avatar: author.avatarUrl || null,
            profession: author.profession
          }}
          sender={{
            id: currentUserId,
            name: userProfile?.name || 'Moi',
            avatar: userProfile?.photo || null,
            profession: userProfile?.profession || 'Utilisateur'
          }}
        />
      )}

    </div>
  );
}
