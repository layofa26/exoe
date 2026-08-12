import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoPlayerPage } from '../../components/video/VideoPlayerPage';
import type { Video } from '../../types/video';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

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
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/accueil/videos/${videoId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setVideo(data)
        } else {
          setError('Impossible de charger la vidéo')
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
