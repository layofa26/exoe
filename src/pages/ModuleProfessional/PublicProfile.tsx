import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useProfessionalProfile } from '../../hooks/useProfessionalProfile';
import { useProfessionalVideos } from '../../hooks/useProfessionalVideos';
import { useProfessionalEvents } from '../../hooks/useProfessionalEvents';
import { MapPin, Calendar, Video, UserPlus, Share, Flag, Ban, MessageCircle, Star, Eye, Heart, Award, ExternalLink, CheckCircle2, Users, UserMinus } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const PublicProfile = () => {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { profile, loading: profileLoading, error: profileError } = useProfessionalProfile(id || '');
  const { videos, loading: videosLoading } = useProfessionalVideos(id || '', 1, 8);
  const { events, loading: eventsLoading } = useProfessionalEvents(id || '');

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const isOnline = profile?.lastLoginAt && new Date(profile.lastLoginAt) > new Date(Date.now() - 5 * 60 * 1000);

  // Update subscribers count when profile loads
  useEffect(() => {
    if (profile?.followersCount) {
      setSubscribersCount(profile.followersCount);
    }
  }, [profile?.followersCount]);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || !id) return;
      
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/v1/abonnement/abonnements/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const subscriptions = data.results || data;
          const isSubscribed = subscriptions.some((sub: any) => sub.professionnel === id);
          setIsSubscribed(isSubscribed);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };
    
    checkSubscription();
  }, [isAuthenticated, id]);

  // Check block status (disabled - backend removed)
  useEffect(() => {
    if (isAuthenticated && id) {
      setIsBlocked(false);
    }
  }, [isAuthenticated, id]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      if (isSubscribed) {
        // Unsubscribe
        const response = await fetch(`${API_BASE_URL}/v1/abonnement/abonnements/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ professionnel: id })
        });
        
        if (response.ok) {
          setIsSubscribed(false);
          setSubscribersCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Subscribe
        const response = await fetch(`${API_BASE_URL}/v1/abonnement/abonnements/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ professionnel: id })
        });
        
        if (response.ok) {
          setIsSubscribed(true);
          setSubscribersCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    alert('Fonctionnalité de contact bientôt disponible');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/pro/profile/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.fullName || 'Profil EXILE',
          url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Lien copié dans le presse-papier');
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    alert('Fonctionnalité de signalement bientôt disponible');
  };

  const handleBlock = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id) return;

    if (confirm(isBlocked ? 'Voulez-vous vraiment débloquer cet utilisateur ?' : 'Voulez-vous vraiment bloquer cet utilisateur ?')) {
      try {
        // Backend removed - block/unblock disabled
        alert('Backend service not available');
      } catch (error) {
        console.error('Error blocking user:', error);
      }
    }
  };

  if (profileLoading) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`w-8 h-8 border-4 ${resolvedTheme === 'dark' ? 'border-zinc-500 border-t-blue-500' : 'border-gray-400 border-t-blue-600'} rounded-full animate-spin`} />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} text-center`}>
          <p className={`text-lg ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            {profileError || 'Profil non trouvé'}
          </p>
          <button
            onClick={() => navigate('/pro')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} pb-20`}>
      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white/90 border-gray-200'} border-b fixed top-0 left-0 right-0 z-50 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <Calendar className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <h1 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Profil
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      profile.fullName?.charAt(0) || profile.username?.charAt(0) || '?'
                    )}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                
                <h2 className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {profile.fullName}
                </h2>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-2`}>
                  @{profile.username}
                </p>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Vérifié
                  </span>
                )}
              </div>

              {/* Status */}
              <div className={`flex items-center justify-center gap-2 mb-4 ${isOnline ? 'text-green-500' : 'text-zinc-500'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-zinc-500'}`} />
                <span className="text-sm">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>

              {/* Profession & Specialty */}
              {profile.profession && (
                <div className="mb-4">
                  <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    {profile.profession}
                  </p>
                  {profile.specialty && (
                    <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {profile.specialty}
                    </p>
                  )}
                </div>
              )}

              {/* Location */}
              {(profile.city || profile.country) && (
                <div className={`flex items-center gap-2 text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-4`}>
                  <MapPin className="w-4 h-4" />
                  {profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.city || profile.country}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-4`}>
                  {profile.bio.length > 150 ? (
                    <>
                      {profile.bio.substring(0, 150)}...
                      <button className="text-blue-500 ml-1">Voir plus</button>
                    </>
                  ) : (
                    profile.bio
                  )}
                </div>
              )}

              {/* Joined Date */}
              <div className={`flex items-center gap-2 text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} mb-6`}>
                <Calendar className="w-3 h-3" />
                Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleSubscribe}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors font-medium ${
                    isSubscribed
                      ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubscribed ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isSubscribed ? 'Ne plus suivre' : 'Suivre'}
                </button>
                <button
                  onClick={handleContact}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-colors font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contacter
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-colors text-sm"
                  >
                    <Share className="w-4 h-4" />
                    Partager
                  </button>
                  <button
                    onClick={handleReport}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-colors text-sm"
                  >
                    <Flag className="w-4 h-4" />
                    Signaler
                  </button>
                  <button
                    onClick={handleBlock}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors text-sm ${
                      isBlocked
                        ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    {isBlocked ? 'Débloquer' : 'Bloquer'}
                  </button>
                </div>
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Compétences
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: any, index: number) => (
                    <span key={index} className={`px-3 py-1 rounded-full text-sm ${resolvedTheme === 'dark' ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-700'}`}>
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Langues
                </h3>
                <div className="space-y-2">
                  {profile.languages.map((lang, index) => (
                    <div key={index} className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                      {lang}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Links */}
            {profile.websites && profile.websites.length > 0 && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Portfolio
                </h3>
                <div className="space-y-2">
                  {profile.websites.map((website, index) => (
                    <a
                      key={index}
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {website}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle & Right Columns - Stats, Videos, Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Statistiques
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'} text-center`}>
                  <Users className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {subscribersCount}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Abonnés
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'} text-center`}>
                  <Users className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile.followingCount}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Abonnements
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'} text-center`}>
                  <Video className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                  <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile.videosCount}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Vidéos
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'} text-center`}>
                  <Calendar className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                  <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile.eventsCount || 0}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Événements
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'} text-center`}>
                  <Eye className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile.totalViews || 0}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Vues totales
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'} text-center`}>
                  <Heart className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                  <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile.totalLikes || 0}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Likes totaux
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'} text-center`}>
                  <Star className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile.rating?.toFixed(1) || '0.0'}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Note
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-50'} text-center`}>
                  <Award className={`w-6 h-6 mx-auto mb-2 ${resolvedTheme === 'dark' ? 'text-pink-400' : 'text-pink-600'}`} />
                  <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile.recommendationsCount || 0}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Recommandations
                  </p>
                </div>
              </div>
            </div>

            {/* Videos */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Video className="w-5 h-5" />
                  Vidéos ({videos.length})
                </h3>
                {videos.length > 8 && (
                  <button className={`text-sm ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}>
                    Voir toutes
                  </button>
                )}
              </div>

              {videosLoading && videos.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className={`w-8 h-8 border-4 ${resolvedTheme === 'dark' ? 'border-zinc-500 border-t-blue-500' : 'border-gray-400 border-t-blue-600'} rounded-full animate-spin`} />
                </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.slice(0, 8).map((video: any) => (
                    <div
                      key={video.id}
                      className={`${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'} rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group`}
                    >
                      <div className="relative">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-300 flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} line-clamp-2 mb-1`}>
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} flex items-center gap-1`}>
                            <Eye className="w-3 h-3" />
                            {video.views || 0}
                          </span>
                          <span className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} flex items-center gap-1`}>
                            <Heart className="w-3 h-3" />
                            {video.likesCount || 0}
                          </span>
                        </div>
                        <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} mt-1`}>
                          {new Date(video.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className={`w-12 h-12 mx-auto ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mt-2`}>
                    Aucune vidéo
                  </p>
                </div>
              )}
            </div>

            {/* Events */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Calendar className="w-5 h-5" />
                  Événements ({events.length})
                </h3>
                {events.length > 6 && (
                  <button className={`text-sm ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}>
                    Voir tous
                  </button>
                )}
              </div>

              {eventsLoading && events.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className={`w-8 h-8 border-4 ${resolvedTheme === 'dark' ? 'border-zinc-500 border-t-blue-500' : 'border-gray-400 border-t-blue-600'} rounded-full animate-spin`} />
                </div>
              ) : events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.slice(0, 6).map((event: any) => (
                    <div
                      key={event.id}
                      className={`${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'} rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      {event.coverImageUrl ? (
                        <img
                          src={event.coverImageUrl}
                          alt={event.title}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} line-clamp-2 mb-1`}>
                          {event.title}
                        </h4>
                        <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>
                          {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {(event.city || event.country) && (
                          <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} flex items-center gap-1`}>
                            <MapPin className="w-3 h-3" />
                            {event.city || event.country}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {event.liveStatus === 'LIVE' && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              En direct
                            </span>
                          )}
                          {event.status === 'PUBLISHED' && new Date(event.startDate) > new Date() && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                              À venir
                            </span>
                          )}
                          {event.status === 'COMPLETED' && (
                            <span className="px-2 py-0.5 bg-zinc-500 text-white text-xs rounded-full">
                              Terminé
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className={`w-12 h-12 mx-auto ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mt-2`}>
                    Aucun événement
                  </p>
                </div>
              )}
            </div>

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                    <Award className="w-5 h-5" />
                    Certifications ({profile.certifications.length})
                  </h3>
                  {profile.certifications.length > 6 && (
                    <button className={`text-sm ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}>
                      Voir toutes
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profile.certifications.slice(0, 6).map((cert, index) => (
                    <div key={index} className={`p-3 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                      <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {cert}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
