import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoPlayerPage } from '../../components/video/VideoPlayerPage';
import { videoApi, mapApiVideo } from '../../services/videoApi';
import type { Video } from '../../types/video';

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) {
      setError('ID de vidéo manquant');
      setLoading(false);
      return;
    }

    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);

        const numericId = Number(videoId)
        if (Number.isNaN(numericId)) {
          setError('Identifiant de vidéo invalide')
          return
        }

        const result = await videoApi.getVideo(numericId)

        if (!result.success || !result.data) {
          setError(result.error || 'Impossible de charger la vidéo')
          return
        }

        const current = mapApiVideo(result.data)
        setVideo(current)

        // Comptabiliser la vue
        videoApi.incrementView(numericId).then((viewResult) => {
          if (viewResult.success && typeof viewResult.views === 'number') {
            setVideo(prev => (prev ? { ...prev, views: viewResult.views } : prev))
          }
        })

        // Vidéos similaires : les autres vidéos publiques
        const listResult = await videoApi.getVideos()
        if (listResult.success && listResult.data) {
          setRelated(
            listResult.data
              .map(mapApiVideo)
              .filter(v => v.id !== current.id)
          )
        }
      } catch (err) {
        setError('Erreur lors du chargement de la vidéo');
        console.error('Error fetching video:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  const handleBack = () => {
    navigate('/pro');
  };

  const handleSelect = (selectedVideo: Video) => {
    setVideo(selectedVideo);
    // Mettre à jour l'URL sans recharger
    window.history.replaceState(null, '', `/pro/video/${selectedVideo.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center p-8">
          <p className="text-white text-lg mb-4">{error || 'Vidéo non trouvée'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour au feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayerPage
      video={video}
      related={related}
      onBack={handleBack}
      onSelect={handleSelect}
    />
  );
}
