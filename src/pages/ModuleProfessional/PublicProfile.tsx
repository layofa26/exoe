import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfessionalProfile } from '../../hooks/useProfessionalProfile';
import { useProfessionalVideos } from '../../hooks/useProfessionalVideos';
import { useProfessionalEvents } from '../../hooks/useProfessionalEvents';
import { videoApi } from '../../services/videoApi';
import {
  MapPin,
  Calendar,
  Video,
  UserPlus,
  Share2,
  Flag,
  MessageCircle,
  Eye,
  Heart,
  Award,
  ExternalLink,
  CheckCircle2,
  Users,
  UserMinus,
  ArrowLeft,
  Briefcase,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  CalendarDays,
  Send
} from 'lucide-react';
import { ContactModal } from '../../components/modals/ContactModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1');

export const PublicProfile = () => {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { profile, loading: profileLoading, error: profileError } = useProfessionalProfile(id || '');
  const { videos, loading: videosLoading } = useProfessionalVideos(id || '', 1, 12);
  const { events, loading: eventsLoading } = useProfessionalEvents(id || '');

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'events' | 'about'>('videos');
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);

  const formattedUsername = profile?.username
    ? (profile.username.startsWith('@') ? profile.username : `@${profile.username}`)
    : '@Utilisateur';

  const isOnline = profile?.status === 'online' || (profile?.lastLoginAt && new Date(profile.lastLoginAt) > new Date(Date.now() - 5 * 60 * 1000));

  // Update subscribers count when profile loads
  useEffect(() => {
    if (profile?.followersCount != null) {
      setSubscribersCount(profile.followersCount);
    }
  }, [profile?.followersCount]);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || !id) return;
      
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/abonnement/abonnements/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const subscriptions = Array.isArray(data) ? data : (data.results || []);
          const isSub = subscriptions.some((sub: any) => String(sub.professionnel) === String(id) || String(sub.user?.id) === String(id));
          setIsSubscribed(isSub);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };
    
    checkSubscription();
  }, [isAuthenticated, id]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id) return;

    try {
      const res = await videoApi.toggleSubscription(id);
      if (res.success && res.data) {
        setIsSubscribed(res.data.is_subscribed);
        setSubscribersCount(res.data.subscribers_count);
      } else if (res.error) {
        alert(res.error);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Profil de ${formattedUsername} sur EXILE`,
          url
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Lien du profil copié dans le presse-papier !');
    }
  };

  const handleContactClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const targetUserId = profile?.userId || id;
    if (!targetUserId) return;

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
      if (token) {
        const res = await fetch(`${API_BASE_URL}/conversations/start/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ participant_id: Number(targetUserId) })
        });

        if (res.ok) {
          const convData = await res.json();
          if (convData && convData.id) {
            navigate(`/pro/requests?conv=${convData.id}`);
            return;
          }
        }
      }
    } catch {}

    setShowContactModal(true);
  };

  if (profileLoading) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} flex items-center justify-center`}>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} flex items-center justify-center p-4`}>
        <div className={`p-8 rounded-3xl border text-center max-w-md ${
          resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
        } shadow-lg`}>
          <p className="text-base font-semibold mb-4">Profil introuvable ou indisponible.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const skillsList = profile.skills || [];

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} pb-24`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className={`p-2.5 rounded-xl border transition-all ${
              resolvedTheme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white'
                : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-900'
            } shadow-sm active:scale-95 flex items-center gap-2`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-semibold">Retour</span>
          </button>

          <button
            onClick={handleShare}
            className={`p-2.5 rounded-xl border transition-all ${
              resolvedTheme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white'
                : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-900'
            } shadow-sm active:scale-95 flex items-center gap-2`}
            title="Partager ce profil"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Partager</span>
          </button>
        </div>

        {/* Profile Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          
          {/* Left Column: Identity & Bio & Skills */}
          <div className={`lg:col-span-4 xl:col-span-4 rounded-3xl border p-4 sm:p-5 ${
            resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
          } shadow-sm space-y-4`}>
            
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 shadow-md">
              {profile.bannerUrl && (
                <img
                  src={profile.bannerUrl}
                  alt="Bannière"
                  className="w-full h-full object-cover object-center"
                />
              )}
            </div>

            {/* Avatar & Online status */}
            <div className="flex flex-col items-center -mt-12 sm:-mt-14 relative">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl ring-2 ring-blue-500/30">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={formattedUsername} className="w-full h-full object-cover object-center" />
                  ) : (
                    formattedUsername.replace('@', '').charAt(0).toUpperCase()
                  )}
                </div>
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm ${
                    isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                  title={isOnline ? 'En ligne' : 'Hors ligne'}
                />
              </div>

              {/* Status text */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>

              {/* Username strictly @Username */}
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-center">
                {formattedUsername}
              </h2>

              {/* Profession */}
              {profile.profession && (
                <div className="flex items-center gap-1.5 mt-1 text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm">
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span>{profile.profession}</span>
                  {profile.speciality && (
                    <span className="text-gray-400 font-normal">({profile.speciality})</span>
                  )}
                </div>
              )}
            </div>

            {/* Action CTAs */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleSubscribe}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
                  isSubscribed
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubscribed ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isSubscribed ? 'Abonné' : "S'abonner"}</span>
              </button>

              <button
                onClick={handleContactClick}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Demande</span>
              </button>
            </div>

            {/* Bio & Details */}
            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/80 space-y-3 text-xs sm:text-sm">
              <div>
                <p className="font-semibold text-gray-400 dark:text-zinc-500 text-[11px] uppercase tracking-wider mb-1">
                  À propos
                </p>
                <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
                  {profile.bio || "Aucune biographie renseignée pour le moment."}
                </p>
              </div>

              {profile.location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.createdAt && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span>Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </div>
              )}

              {profile.website && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="hover:underline truncate">
                    {profile.website}
                  </a>
                </div>
              )}
            </div>

            {/* Compétences (Matching Profile.tsx) */}
            {skillsList.length > 0 && (
              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-400 dark:text-zinc-500 text-[11px] uppercase tracking-wider">
                    Compétences ({skillsList.length})
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.slice(0, 2).map((skill: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {skill.name || skill}
                        {skill.level && (
                          <span className="text-[10px] opacity-70">({skill.level})</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {skillsList.length > 2 && (
                    <>
                      <button
                        onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        <span>{isSkillsExpanded ? 'Voir moins' : `+${skillsList.length - 2} autres compétences`}</span>
                        {isSkillsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isSkillsExpanded && (
                        <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in">
                          {skillsList.slice(2).map((skill: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {skill.name || skill}
                              {skill.level && (
                                <span className="text-[10px] opacity-70">({skill.level})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Statistics & Content Tabs */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-6">
            
            {/* Stats Dashboard */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className={`p-4 rounded-2xl border text-center ${
                resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
              } shadow-sm`}>
                <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-semibold">Abonnés</span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold">{subscribersCount}</p>
              </div>

              <div className={`p-4 rounded-2xl border text-center ${
                resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
              } shadow-sm`}>
                <div className="flex items-center justify-center gap-1.5 text-purple-500 mb-1">
                  <Video className="w-4 h-4" />
                  <span className="text-xs font-semibold">Vidéos</span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold">{videos?.length || 0}</p>
              </div>

              <div className={`p-4 rounded-2xl border text-center ${
                resolvedTheme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'
              } shadow-sm`}>
                <div className="flex items-center justify-center gap-1.5 text-emerald-500 mb-1">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-semibold">Événements</span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold">{events?.length || 0}</p>
              </div>
            </div>

            {/* Tab Controls */}
            <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 ${
              resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
            } shadow-sm`}>
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'videos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Vidéos ({videos?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'events'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Événements ({events?.length || 0})</span>
              </button>
            </div>

            {/* Content Rendering */}
            {activeTab === 'videos' && (
              <div>
                {videosLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="aspect-video bg-zinc-800 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : !videos || videos.length === 0 ? (
                  <div className={`p-12 text-center rounded-3xl border ${
                    resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-gray-200'
                  }`}>
                    <Video className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-sm font-semibold">Aucune vidéo publique pour l'instant.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {videos.map((vid: any) => (
                      <div
                        key={vid.id}
                        onClick={() => navigate(`/pro/video/${vid.id}`)}
                        className={`group rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                          resolvedTheme === 'dark'
                            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                          {vid.thumbnailUrl || vid.cover ? (
                            <img src={vid.thumbnailUrl || vid.cover} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                              <Play className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-sm sm:text-base line-clamp-1 group-hover:text-blue-500 transition-colors">
                            {vid.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mt-2">
                            <span>{vid.viewsCount || vid.views || 0} vues</span>
                            <span>{new Date(vid.createdAt || vid.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                {eventsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-24 bg-zinc-800 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : !events || events.length === 0 ? (
                  <div className={`p-12 text-center rounded-3xl border ${
                    resolvedTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-gray-200'
                  }`}>
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-sm font-semibold">Aucun événement à venir.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {events.map((ev: any) => (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-2xl border ${
                          resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
                        } shadow-sm space-y-2`}
                      >
                        <h4 className="font-bold text-sm sm:text-base">{ev.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">{ev.description}</p>
                        <div className="flex items-center gap-2 text-xs text-blue-500 font-semibold pt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(ev.date || ev.start_time).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          targetUserId={profile.id || id || ''}
          targetName={formattedUsername}
          targetProfession={profile.profession}
          targetSpeciality={profile.speciality}
          targetAvatar={profile.avatarUrl}
        />
      )}
    </div>
  );
};

export default PublicProfile;
