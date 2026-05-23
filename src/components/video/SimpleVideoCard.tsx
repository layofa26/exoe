import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Video } from '../../types/video';
import { Play, MessageCircle, Trash2 } from 'lucide-react';
import { ContactModal } from '../modals/ContactModal';
import { useRequests } from '../../hooks/useRequests';

// Fonksyon pou jwenn koulè kategori
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Mason': '#8B4513',
    'Plomber': '#3B82F6',
    'Electricien': '#F59E0B',
    'Couturier': '#EC4899',
    'Cuisinier': '#EF4444',
    'Peintre': '#10B981',
    'Coiffeur': '#8B5CF6',
    'Menuisier': '#A16207',
    'Informaticien': '#06B6D4',
    'Medecin': '#DC2626',
    'Avocat': '#1E40AF',
    'Comptable': '#059669',
    'Macon': '#92400E',
    'Chauffeur': '#4B5563',
    'Securite': '#1F2937',
    'Jardinier': '#16A34A',
    'Photographe': '#DB2777',
    'Musicien': '#7C3AED',
    'Sport': '#EA580C',
    'Education': '#0891B2',
    'Sante': '#DC2626',
    'Technologie': '#2563EB',
    'Art': '#D946EF',
    'Business': '#CA8A04',
    'Musique': '#9333EA',
    'Cuisine': '#E11D48',
    'default': '#F97316'
  }
  return colors[category] || colors['default']
};

interface SimpleVideoCardProps {
  video: Video;
  onClick?: () => void;
  onDelete?: (videoId: string) => void;
}

export function SimpleVideoCard({ video, onClick, onDelete }: SimpleVideoCardProps) {
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

  // Sekurite: verifye si se pwòp itilizatè a
  const userProfile = JSON.parse(localStorage.getItem('exile_profile') || '{}');
  const currentUserId = userProfile?.id || 'current-user-' + Date.now();
  const isOwnProfile = author.id === currentUserId;

  // Fonksyon pou kontakte otè a
  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContactModal(true);
  };

  const navigate = useNavigate();

  // Fonksyon pou wè profil (ak sekurite)
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Si se pwòp pwofil la, navige nan gran paj pwofil la
    if (isOwnProfile) {
      navigate('/pro/settings'); // Rediriger vers les paramètres ou une autre page de profil temporaire
    }
  };

  // UseRequests hook pou sistèm kontak
  const { sendRequest, dailyRequestCount } = useRequests(currentUserId);

  // Handle send request via ContactModal
  const handleSendRequest = (message: string, requestCategory?: string) => {
    if (!video.author) {
      return { success: false, error: 'Aucun auteur trouvé' };
    }

    const receiver = {
      id: video.author.id,
      name: video.author.name,
      avatar: video.author.avatarUrl || null,
      profession: video.author.profession,
    };

    const sender = {
      id: currentUserId,
      name: userProfile?.name || 'Moi',
      avatar: userProfile?.avatar || null,
      profession: userProfile?.profession || 'Utilisateur',
    };

    // Voye demand lan (category se yon paramèt opstionèl ki ka itilize nan fiti)
    console.log('Category:', requestCategory);
    return sendRequest(receiver, message, sender);
  };

  return (
    <div className="bg-[#0f0f0f] rounded-xl overflow-hidden group cursor-pointer relative" onClick={onClick}>
      {/* Miniature - thumbnail oswa gradient CSS + bouton play */}
      <div className={`relative aspect-video bg-gradient-to-br ${video.gradient} overflow-hidden`}>
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
        
        {/* Thumbnail si li egziste */}
        {video.thumbnail ? (
          <img 
            src={video.thumbnail}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Si thumbnail pa chaje, kache l
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Grain texture overlay (sou thumbnail tou) */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
        
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/20">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info ultra-compact */}
      <div className="p-3">
        {/* Author row - Avatar + Nom + Profession + Date */}
        <div className="flex items-center gap-2.5 mb-2">
          {/* Avatar - foto profil reyèl oswa initials (klikab pou profil) */}
          <button 
            onClick={handleProfileClick}
            className="flex-shrink-0 hover:scale-110 transition-transform"
          >
            {author?.avatarUrl ? (
              <img 
                src={author.avatarUrl}
                alt={author?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-zinc-600"
                onError={(e) => {
                  // Si foto a pa chaje, montre initials
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border border-zinc-600"
                style={{ backgroundColor: author?.avatarColor || '#666' }}
              >
                {author?.initials || '?'}
              </div>
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{author?.name || 'Inconnu'}</p>
            <p className="text-zinc-500 text-[11px] truncate">
              {author?.profession || ''} • {video.postedAt}
            </p>
          </div>
          
          {/* Bouton Contacter - koulè dinamik */}
          <button 
            onClick={handleContact}
            className="px-3 py-1.5 rounded-full text-white text-xs font-medium transition-all hover:opacity-90 active:scale-95 flex items-center gap-1.5"
            style={{ backgroundColor: author?.avatarColor || getCategoryColor(video.category || 'default') }}
          >
            <MessageCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Contacter</span>
            <span className="sm:hidden">Chat</span>
          </button>
        </div>

        {/* Titre sèlman - anyen lòt */}
        <h3 className="text-white font-semibold text-sm line-clamp-2">
          {video.title}
        </h3>
      </div>

      {/* Modal Kontak Reyèl ak ContactModal */}
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
            avatar: userProfile?.avatar || null,
            profession: userProfile?.profession || 'Utilisateur'
          }}
          dailyRequestCount={dailyRequestCount}
          onSendRequest={handleSendRequest}
        />
      )}

    </div>
  );
}

// Fonksyon pou fonse yon koulè
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x00FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
