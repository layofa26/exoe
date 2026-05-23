import { useState, useRef, useEffect, useCallback } from 'react';
import type { Video } from '../../types/video';
import { SimpleVideoCard } from '../../components/video/SimpleVideoCard';
import { VideoPlayerPage } from '../../components/video/VideoPlayerPage';
import SectionPub from '../../pages/PUB/SectionPub';
import { Trash2, Search, X, Play } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function VideoFeed() {
  const { resolvedTheme } = useTheme()
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Chaje videyo depi localStorage SELMAN (pa gen SAMPLE_VIDEOS)
  useEffect(() => {
    const loadVideos = () => {
      const stored = localStorage.getItem('exile_videos');
      const userVideos = stored ? JSON.parse(stored) : [];
      // Konvèti videyo ansyen: date -> postedAt
      const normalized = userVideos.map((v: any) => ({
        ...v,
        postedAt: v.postedAt || v.date || new Date().toISOString(),
        author: v.author || { id: v.id, name: v.author || 'Inconnu', profession: '', location: '', initials: '??', avatarColor: '#666', avatarUrl: '' }
      }));
      setVideos(normalized);
    };
    loadVideos();
    // Rekoute chanjman localStorage
    window.addEventListener('storage', loadVideos);
    return () => window.removeEventListener('storage', loadVideos);
  }, []);

  // Fonksyon pou efase tout videyo (netwaye ansyen kontènè)
  const clearAllVideos = () => {
    if (confirm('ATTENTION: Voulez-vous vider TOUTES les vidéos du stockage local ?')) {
      localStorage.removeItem('exile_videos')
      setVideos([])
      console.log('✅ Toutes les vidéos supprimées du localStorage')
    }
  }

  // Fonksyon pou efase yon sèl videyo
  const handleDeleteVideo = (videoId: string) => {
    const updatedVideos = videos.filter(v => v.id !== videoId)
    setVideos(updatedVideos)
    localStorage.setItem('exile_videos', JSON.stringify(updatedVideos))
    console.log('✅ Vidéo supprimée:', videoId)
  }

  // Fonksyon dev pou efase localStorage (tape nan konsol: clearExileStorage())
  useEffect(() => {
    (window as any).clearExileStorage = () => {
      localStorage.removeItem('exile_videos');
      console.log('✅ localStorage "exile_videos" efase!');
      window.location.reload();
    };
  }, []);

  const handleOpen = useCallback((video: Video) => {
    setActiveVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setActiveVideo(null);
  }, []);

  // Cacher body + html scroll quand on est dans le player
  useEffect(() => {
    if (activeVideo) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [activeVideo]);

  const related = activeVideo
    ? videos.filter(v => v.id !== activeVideo.id)
    : [];

  // Filtrer videyo yo selon rechèch
  const filteredVideos = videos.filter(video => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = video.title?.toLowerCase().includes(query);
    const professionMatch = video.author?.profession?.toLowerCase().includes(query);
    const authorMatch = video.author?.name?.toLowerCase().includes(query);
    return titleMatch || professionMatch || authorMatch;
  });

  return (
    <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      {/* PAGE PLAYER - Overlay ki kouvri TOUT (Header, Sidebar, tout) */}
      {activeVideo && (
        <div
          className={`fixed ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} overflow-hidden`}
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
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

      {/* FEED ACCUEIL - Mobile First: SectionPub anlè, Videyo anba */}
      <div
        ref={feedRef}
        className={`flex-1 flex flex-col ${activeVideo ? 'hidden' : 'flex'}`}
        style={{ scrollPaddingTop: '100px' }}
      >
        {/* Mobile: SectionPub anlè */}
        <div className="lg:hidden order-1">
          <div className="px-4 pb-4">
            <SectionPub />
          </div>
        </div>

        {/* Desktop: 2 KOLON: VIDEO | SECTIONPUB */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-row lg:gap-6 lg:overflow-visible order-2 lg:order-1">
          {/* Kolon GOUCH - Videyo yo (Desktop) */}
          <div className="flex-1 min-w-0">
            {/* Kontenè videyo a - kole pi pre header la */}
            <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 pb-6">
              {/* Grid videyo - Desktop */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-5">
                {filteredVideos.length > 0 ? (
                  filteredVideos.map((video) => (
                    <div key={video.id}>
                      <SimpleVideoCard
                        video={video}
                        onClick={() => handleOpen(video)}
                        onDelete={handleDeleteVideo}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Aucune vidéo trouvée</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
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
          <aside className="w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-[80px] lg:self-start overflow-visible" style={{ scrollbarWidth: 'thin' }}>
            <SectionPub />
          </aside>
        </div>

        {/* Mobile: Videyo */}
        <div className="lg:hidden order-2">
          {/* Grid videyo - Mobile */}
          <div className="mt-10 px-1 pb-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <div key={video.id}>
                    <SimpleVideoCard
                      video={video}
                      onClick={() => handleOpen(video)}
                      onDelete={handleDeleteVideo}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} text-sm`}>Aucune vidéo trouvée</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
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
    </div>
  );
}
