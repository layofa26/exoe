import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Video } from '../../types/video';
import { VideoPlayerPage } from '../../components/video/VideoPlayerPage';
import { VideoPlayer } from '../../components/video/VideoPlayer';
import SectionPub from '../../pages/PUB/SectionPub';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAccueilAlgo } from '../../algoPro/signals/useAccueilAlgo';
import { useSubsAlgo } from '../../algoPro/signals/useSubsAlgo';
import { useRequestsAlgo } from '../../algoPro/signals/useRequestsAlgo';
import { useSearch } from '../../hooks/useSearch';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MessageCircle } from 'lucide-react';
import { ContactModal } from '../../components/modals/ContactModal';
import EntrepriseEnVedette from '../../pages/PUB/EntrepriseEnVedette';

export default function VideoFeed() {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, []);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedVideoForContact, setSelectedVideoForContact] = useState<Video | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Use search hook
  const { query, setQuery, type, setType, results, loading: searchLoading, error: searchError, reset, loadMore } = useSearch();

  // Récupérer ou créer un userId pour les signaux algorithmiques
  const userId = localStorage.getItem('exile_user_id') || 'user_default'
  
  // Initialiser les Logic Hooks
  const accueilAlgo = useAccueilAlgo(userId)
  const subsAlgo = useSubsAlgo(userId)
  const requestsAlgo = useRequestsAlgo(userId)

  // Chaje videyo depi API
  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      const { videoApi } = await import('../../services/videoApi')
      // Ne pas envoyer le token pour les vidéos publiques
      const result = await videoApi.getVideos()

      if (result.success && result.data) {
        // Transformer les données Django vers le format frontend
        const transformedVideos = result.data.map((djangoVideo: any) => ({
          id: djangoVideo.id.toString(),
          title: djangoVideo.title,
          description: djangoVideo.description || '',
          videoUrl: djangoVideo.file_url,
          thumbnail: djangoVideo.cover_url,
          thumbnailUrl: djangoVideo.cover_url,
          author: {
            id: djangoVideo.owner || 'unknown',
            name: djangoVideo.owner || 'Unknown',
            profession: 'Professionnel',
            location: 'Unknown',
            initials: (djangoVideo.owner || 'U').charAt(0).toUpperCase(),
            avatarColor: '#F97316',
          },
          views: 0,
          likes: 0,
          comments: [],
          postedAt: djangoVideo.created_at,
          createdAt: djangoVideo.created_at,
          category: 'Vidéo',
          visibility: (djangoVideo.is_public ? 'PUBLIC' : 'PRIVATE') as 'PUBLIC' | 'PRIVATE',
          status: 'PUBLISHED',
          allowComments: true,
          allowLikes: true,
          allowShares: true,
        }))
        setVideos(transformedVideos)
      } else {
        setError(result.error || 'Erreur lors du chargement des vidéos')
      }
    } catch (error) {
      console.error('Error loading videos:', error)
      setVideos([]);
      setError('Erreur lors du chargement des vidéos');
    } finally {
      setLoading(false);
    }
  };

  // Écouter l'événement de vidéo uploadée
  useEffect(() => {
    const handleVideoUploaded = () => {
      console.log('Video uploaded event detected, refreshing feed')
      loadVideos()
    }

    window.addEventListener('video-uploaded', handleVideoUploaded)
    return () => window.removeEventListener('video-uploaded', handleVideoUploaded)
  }, [])

  // Wrapper useCallback pour loadVideos
  const loadVideosCallback = useCallback(loadVideos, []);

  useEffect(() => {
    loadVideosCallback();
  }, [loadVideosCallback]);

  const handleOpen = useCallback((video: Video) => {
    console.log('handleOpen called with video:', video);
    // Tracker le clic sur la vidéo avec useAccueilAlgo
    accueilAlgo.trackVideoClick(video, 0, false, false)
    
    // Tracker la visite du profil créateur avec useSubsAlgo
    if (video.author) {
      subsAlgo.trackProfileVisit(video.author, 0)
    }
    
    setActiveVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [accueilAlgo, subsAlgo]);

  const handleBack = useCallback(() => {
    setActiveVideo(null);
  }, []);

  const handleContact = useCallback((video: Video) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setSelectedVideoForContact(video);
    setShowContactModal(true);
  }, [isAuthenticated, navigate]);


  // Cacher body + html scroll quand on est dans le player
  useEffect(() => {
    if (activeVideo) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      localStorage.setItem('exile_video_player_active', 'true')
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      localStorage.setItem('exile_video_player_active', 'false')
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      localStorage.setItem('exile_video_player_active', 'false')
    };
  }, [activeVideo]);

  // Écouter l'événement de publication de vidéo pour rafraîchir le feed
  useEffect(() => {
    const handleVideoPublished = () => {
      loadVideosCallback()
    }

    window.addEventListener('video-published', handleVideoPublished)

    return () => {
      window.removeEventListener('video-published', handleVideoPublished)
    }
  }, [loadVideosCallback])

  const related = activeVideo
    ? videos.filter(v => v.id !== activeVideo.id)
    : [];

  // Profil utilisateur connecté
  const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
  const currentUserId = userProfile?.id || 'current-user-' + Date.now()

  // Wrapper component pour afficher vidéo avec infos utilisateur - Design selon image de référence
  const VideoCardWithInfo = ({ video, onClick }: { video: Video; onClick: () => void }) => {
    console.log('VideoCardWithInfo rendering for video:', video.id, video.title);
    return (
      <div 
        className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-sm`}
        onClick={() => {
          console.log('VideoCard clicked for video:', video.id);
          onClick();
        }}
      >
        {/* Video Player */}
        <div className="pointer-events-none">
          <VideoPlayer
            src={video.videoUrl}
            poster={video.thumbnail}
            autoplay={false}
            className="rounded-xl overflow-hidden"
          />
        </div>
        
        {/* Info Section - Design compact selon image */}
        <div className="p-3">
          {/* User Info */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
              {userProfile?.photo ? (
                <img src={userProfile.photo} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xs">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                {userProfile?.name || 'Utilisateur'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleContact(video)
              }}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-medium transition-colors flex items-center gap-1"
            >
              <MessageCircle className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Contacter</span>
              <span className="sm:hidden">Chat</span>
            </button>
          </div>
          
          {/* Title */}
          <h4 className={`font-bold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate mb-1`}>
            {video.title}
          </h4>
          
          {/* Views */}
          <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
            {video.views || 0} vues
          </p>
        </div>
      </div>
    )
  }

  // Filtrer videyo yo selon rechèch - Use real search results when searching
  const displayVideos = query && results 
    ? results.videos.map(v => ({
        ...v,
        postedAt: v.createdAt,
        videoUrl: v.videoUrl || v.url || v.src || '',
        thumbnail: v.thumbnailUrl || v.thumbnail || '',
        author: v.author || { id: v.author?.id, name: v.author?.fullName || 'Inconnu', profession: v.author?.profession || '', location: '', initials: '??', avatarColor: '#666', avatarUrl: v.author?.avatarUrl || '' }
      }))
    : videos.filter(video => {
        if (!query.trim()) return true;
        const searchLower = query.toLowerCase();
        const titleMatch = video.title?.toLowerCase().includes(searchLower);
        const professionMatch = video.author?.profession?.toLowerCase().includes(searchLower);
        const authorMatch = video.author?.name?.toLowerCase().includes(searchLower);
        return titleMatch || professionMatch || authorMatch;
      });

  // Tracker les recherches avec useRequestsAlgo
  useEffect(() => {
    if (query.trim()) {
      const resultsCount = displayVideos.length
      requestsAlgo.trackSearch(query, undefined, resultsCount)
    }
  }, [query, displayVideos.length, requestsAlgo])

  // Infinite scroll for search results
  useEffect(() => {
    const handleScroll = () => {
      if (!searchResultsRef.current || !results?.hasMore || searchLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = searchResultsRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore();
      }
    };

    const container = searchResultsRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [results?.hasMore, searchLoading, loadMore]);

  return (
    <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20 m-0 p-0`}>
      {/* PAGE PLAYER - Overlay ki kouvri TOUT (Header, Sidebar, tout) */}
      {activeVideo && (
        <div
          className={`fixed ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} overflow-y-auto`}
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            zIndex: 9999,
            transform: 'translateZ(0)'
          }}
        >
          <VideoPlayerPage
            video={activeVideo}
            related={related}
            onBack={handleBack}
            onSelect={handleOpen}
          />
        </div>
      )}

      {/* FEED ACCUEIL - Mobile First: Videyo anba */}
      <div
        ref={feedRef}
        className={`flex-1 flex flex-col ${activeVideo ? 'hidden' : 'flex'}`}
        style={{ 
          scrollPaddingTop: isMobile ? '160px' : '64px'
        }}
      >
        {/* Loading State */}
        {searchLoading && (
          <div className="px-4 md:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center">
              <div className={`w-8 h-8 border-4 ${resolvedTheme === 'dark' ? 'border-zinc-500 border-t-blue-500' : 'border-gray-400 border-t-blue-600'} rounded-full animate-spin`} />
            </div>
          </div>
        )}

        {/* Error State */}
        {searchError && (
          <div className="px-4 md:px-6 lg:px-8 py-8">
            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border text-center`}>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{searchError}</p>
              <button
                onClick={() => reset()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Professional Results */}
        {query && results && results.professionals.length > 0 && type !== 'videos' && (
          <div className="px-4 md:px-6 lg:px-8 py-4">
            <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Professionnels ({results.professionals.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.professionals.map((prof: any) => (
                <div
                  key={prof.id}
                  onClick={() => navigate(`/pro/profile/${prof.id}`)}
                  className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-xl p-4 cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {prof.fullName?.charAt(0) || prof.username?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {prof.fullName}
                      </h4>
                      <p className={`text-sm truncate ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                        @{prof.username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      {prof.profession}
                    </p>
                    {prof.company && (
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                        {prof.company}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs">
                    <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                      {prof.followersCount} abonnés
                    </span>
                    <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                      {prof.videosCount} vidéos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Results with Load More */}
        {query && results && results.videos.length > 0 && type !== 'professionals' && (
          <div ref={searchResultsRef} className="px-4 md:px-6 lg:px-8 py-4 max-h-[600px] overflow-y-auto">
            <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Vidéos ({results.videos.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.videos.map((video: any) => (
                <div
                  key={video.id}
                  onClick={() => {
                    const normalizedVideo = {
                      ...video,
                      postedAt: video.createdAt,
                      videoUrl: video.videoUrl || video.url || video.src || '',
                      thumbnail: video.thumbnailUrl || video.thumbnail || '',
                      author: video.author || { id: video.author?.id, name: video.author?.fullName || 'Inconnu', profession: video.author?.profession || '', location: '', initials: '??', avatarColor: '#666', avatarUrl: video.author?.avatarUrl || '' }
                    };
                    handleOpen(normalizedVideo);
                  }}
                  className={`${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  {video.thumbnailUrl || video.thumbnail ? (
                    <img
                      src={video.thumbnailUrl || video.thumbnail}
                      alt={video.title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-300 flex items-center justify-center">
                      <div className={`w-8 h-8 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>📹</div>
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                      {video.title}
                    </h4>
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mt-1`}>
                      {video.author?.fullName || 'Inconnu'}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                        {video.views} vues
                      </span>
                      <span className={resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>
                        {video.likesCount} likes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {results.hasMore && (
              <button
                onClick={() => loadMore()}
                disabled={searchLoading}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchLoading ? 'Chargement...' : 'Charger plus de résultats'}
              </button>
            )}
          </div>
        )}

        {/* Mobile/Tablette: Videyo - Design selon l'image de référence */}
        <div className="lg:hidden">
          <div className="px-0 py-4 mt-[120px] sm:mt-[128px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-0 sm:gap-4">
              {loading ? (
                <div className="col-span-full py-12 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-sm`}>Chargement des vidéos...</p>
                </div>
              ) : error ? (
                <div className="col-span-full py-12 text-center">
                  <p className={`${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'} text-sm`}>{error}</p>
                  <button
                    onClick={() => loadVideosCallback()}
                    className={`mt-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-sm hover:underline`}
                  >
                    Réessayer
                  </button>
                </div>
              ) : displayVideos.length > 0 ? (
                <>
                  {displayVideos.map((video, index) => (
                    <React.Fragment key={video.id}>
                      <VideoCardWithInfo video={video} onClick={() => handleOpen(video)} />
                      {/* Entreprise en vedette - Après la 2ème vidéo */}
                      {index === 1 && (
                        <div className="col-span-full">
                          <EntrepriseEnVedette />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-sm`}>
                    {query ? 'Aucun résultat trouvé' : 'Aucune vidéo trouvée'}
                  </p>
                  {query && (
                    <button
                      onClick={() => { setQuery(''); reset(); }}
                      className={`mt-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-sm hover:underline`}
                    >
                      Effacer la recherche
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: 2 KOLON: VIDEO | SECTIONPUB */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-row lg:gap-6 lg:overflow-visible order-2 lg:order-1">
          {/* Kolon GOUCH - Videyo yo (Desktop) */}
          <div className="flex-1 min-w-0 pr-80">
            {/* Kontenè videyo a - kole pi pre header la */}
            <div className="px-4 md:px-6 lg:px-8 pb-6 mt-0">
              {/* Grid videyo - Desktop: 3 cols */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 mt-32">
                {loading ? (
                  <div className="col-span-full py-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Chargement des vidéos...</p>
                  </div>
                ) : error ? (
                  <div className="col-span-full py-12 text-center">
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                    <button
                      onClick={() => loadVideosCallback()}
                      className={`mt-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-sm hover:underline`}
                    >
                      Réessayer
                    </button>
                  </div>
                ) : displayVideos.length > 0 ? (
                  displayVideos.map((video) => (
                    <VideoCardWithInfo key={video.id} video={video} onClick={() => handleOpen(video)} />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {query ? 'Aucun résultat trouvé' : 'Aucune vidéo trouvée'}
                    </p>
                    {query && (
                      <button
                        onClick={() => { setQuery(''); reset(); }}
                        className={`mt-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-sm hover:underline`}
                      >
                        Effacer la recherche
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolon DWAT - SectionPub (Desktop) */}
          <aside className="w-72 xl:w-80 flex-shrink-0 lg:fixed lg:right-0 lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto overflow-visible" style={{ scrollbarWidth: 'thin' }}>
            <SectionPub />
          </aside>
        </div>
      </div>

      {/* Animation CSS custom */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* ContactModal */}
      {showContactModal && selectedVideoForContact && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          receiver={{
            id: selectedVideoForContact.author?.id || 'unknown',
            name: selectedVideoForContact.author?.name || 'Inconnu',
            avatar: selectedVideoForContact.author?.avatarUrl || null,
            profession: selectedVideoForContact.author?.profession || 'Professionnel'
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
