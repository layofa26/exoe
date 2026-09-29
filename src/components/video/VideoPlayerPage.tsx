import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, ThumbsUp, ThumbsDown, Bookmark,
  Share2, MessageCircle, ArrowLeft, Send, X,
  Heart, Users, Clock, Bell, Check, Mic, MicOff,
  Video as VideoIcon, VideoOff, Monitor, PhoneOff,
  Volume2, MessageSquare
} from 'lucide-react';
import { useLiveWebRTC } from '../../hooks/useLiveWebRTC';
import type { Video, Comment } from '../../types/video';
import { useIsTabletOrBelow } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { fmtNum, formatYouTubeDate } from '../../utils/format';
import { useProfessionalProfile } from '../../hooks/useProfessionalProfile';
import { DotsMenu } from './DotsMenu';
import { ContactModal } from '../modals/ContactModal';
import { useAccueilAlgo } from '../../algoPro/signals/useAccueilAlgo';
import { useSubsAlgo } from '../../algoPro/signals/useSubsAlgo';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { VideoPlayer, guessVideoMimeType, toPlayableMimeType } from './VideoPlayer';
import { videoApi, resolveMediaUrl, cleanUsername } from '../../services/videoApi';
import { VideoPoster } from './VideoPoster';
import { useVideoInteractions } from '../../hooks/useVideoInteractions';
import { playbackPositionStore } from '../../utils/playbackPositionStore';
import SectionPub from '../../pages/PUB/SectionPub';

interface VideoPlayerPageProps {
  video: Video;
  related: Video[];
  onBack: () => void;
  onSelect: (v: Video) => void;
}

const COMMENT_COLORS = ['#1d4ed8', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
const MAX_COMMENT_LENGTH = 1000;

function formatEventDateTime(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export function VideoPlayerPage({ video, related, onBack, onSelect }: VideoPlayerPageProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isTabletOrBelow = useIsTabletOrBelow();
  const { msg, show } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const userId = localStorage.getItem('exile_user_id') || 'user_default';
  const accueilAlgo = useAccueilAlgo(userId);
  const subsAlgo = useSubsAlgo(userId);

  // Hook centralisé unique pour toutes les interactions (Zéro duplication, autorité backend)
  const {
    likesCount,
    dislikesCount,
    viewsCount,
    subscribersCount,
    isLiked,
    isDisliked,
    isFavorite,
    isSubscribed,
    isPending,
    handleLike,
    handleDislike,
    handleFavorite,
    handleToggleSubscribe,
    recordView,
    refreshInteractions,
  } = useVideoInteractions({
    videoId: video.id,
    authorId: video.author?.id,
    initialLikes: video.likes,
    initialDislikes: video.dislikes,
    initialViews: video.views || video.viewsCount || 0,
    initialSubscribersCount: video.author?.followers || 0,
  });

  const [descOpen, setDescOpen] = useState(false);
  const [mobileDescOpen, setMobileDescOpen] = useState(false);
  const [desktopChatOpen, setDesktopChatOpen] = useState(true);
  const [mobileLiveChatOpen, setMobileLiveChatOpen] = useState(false);
  
  // États commentaires
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>(video.comments || []);
  const [colorIdx, setColorIdx] = useState(0);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [playingCommentId, setPlayingCommentId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Modals & Contact
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedAuthorForContact, setSelectedAuthorForContact] = useState<typeof video.author | null>(null);

  // Profil créateur en direct depuis le backend (profession, avatar, username, followers)
  const authorId = String(video.author?.id || '');
  const { profile: authorProfile } = useProfessionalProfile(authorId);

  const effectiveName = authorProfile?.fullName || authorProfile?.username || video.author?.name || 'Créateur';
  const effectiveUsername = authorProfile?.username || video.author?.username || video.author?.name || 'utilisateur';
  const effectiveProfession = authorProfile?.profession || video.author?.profession || '';
  const effectiveAvatar = authorProfile?.avatarUrl || video.author?.avatarUrl;
  const effectiveInitials = authorProfile?.initials || video.author?.initials || (effectiveName.charAt(0).toUpperCase());

  const contactReceiver = selectedAuthorForContact || (showContactModal ? {
    id: authorId,
    name: effectiveName,
    username: effectiveUsername,
    avatar: effectiveAvatar || null,
    profession: effectiveProfession || 'Créateur',
  } : null);

  const [eventFavoriteSaved, setEventFavoriteSaved] = useState(Boolean(video.isRegistered));

  const storedProfile = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('exile_user_profile') || '{}'); } catch { return {}; }
  }, []);

  const isOwnVideo = useMemo<boolean>(() => {
    const myUsername = cleanUsername(storedProfile?.username || '').toLowerCase();
    const videoUsername = cleanUsername(video.author?.username || video.author?.name || '').toLowerCase();
    const myId = storedProfile?.id != null ? String(storedProfile.id) : (localStorage.getItem('exile_user_id') || '');
    return (
      (Boolean(myUsername) && myUsername === videoUsername) ||
      (Boolean(myId) && myId === String(video.author?.id)) ||
      video.author?.id === 'me'
    );
  }, [storedProfile, video.author]);

  const rawEventId = video.eventId || (video.isLive ? String(video.id).replace('evt-', '').replace('exile-', '') : '');
  const isUpcomingEvent = Boolean(!video.isLive && video.startDate && new Date(video.startDate).getTime() > Date.now() && !video.replayUrl);
  
  const isLiveHost = Boolean(isOwnVideo || (storedProfile?.id && String(video.author?.id) === String(storedProfile.id)));

  // Hook WebRTC temps réel pour les diffusions en direct
  const {
    localStream,
    remoteStream,
    screenStream,
    viewerCount: liveViewerCount,
    chatMessages,
    sendChatMessage,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    endLive,
    loadChatHistory,
    isSpeaker
  } = useLiveWebRTC({
    eventId: rawEventId,
    initialIsHost: isLiveHost
  });

  const [liveChatInput, setLiveChatInput] = useState('');
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [isNotified, setIsNotified] = useState(Boolean(video.isRegistered));
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Bind WebRTC stream to video element
  useEffect(() => {
    if (!liveVideoRef.current || !video.isLive) return;

    if (isLiveHost || isSpeaker) {
      const activeStream = isScreenSharing && screenStream ? screenStream : localStream;
      if (activeStream) {
        liveVideoRef.current.srcObject = activeStream;
        liveVideoRef.current.play().catch(() => {});
      }
    } else {
      if (remoteStream) {
        liveVideoRef.current.srcObject = remoteStream;
        liveVideoRef.current.play().catch((err: any) => {
          if (err?.name === 'NotAllowedError') {
            if (liveVideoRef.current) {
              liveVideoRef.current.muted = true;
              liveVideoRef.current.play().catch(() => {});
            }
            setIsAudioBlocked(true);
          }
        });
      } else {
        liveVideoRef.current.srcObject = null;
      }
    }
  }, [video.isLive, isLiveHost, isSpeaker, isScreenSharing, screenStream, localStream, remoteStream]);

  // Débloquer le son si autoplay avec audio a été bloqué par le navigateur
  const unblockAudio = () => {
    if (liveVideoRef.current) {
      liveVideoRef.current.muted = false;
      liveVideoRef.current.play().catch(() => {});
      setIsAudioBlocked(false);
    }
  };

  // Charger l'historique complet des messages du chat en direct à l'arrivée
  useEffect(() => {
    if (!rawEventId) return;
    const cleanId = String(rawEventId).replace('evt-', '').replace('exile-', '');
    if (!cleanId || isNaN(Number(cleanId))) return;

    const fetchChatHistory = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/live_messages/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const rawMessages = await res.json();
          if (Array.isArray(rawMessages) && rawMessages.length > 0) {
            const formatted = rawMessages.map((m: any) => ({
              id: m.id,
              user_id: String(m.user_id),
              user: m.user_name || m.username || 'Utilisateur',
              username: m.username || '',
              avatar: m.user_avatar,
              text: m.text,
              isHost: Boolean(m.is_host),
              isSpeaker: Boolean(m.is_speaker),
              time: m.created_at ? new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
            }));
            loadChatHistory(formatted);
          }
        }
      } catch (err) {
        console.warn('[VideoPlayerPage] Erreur chargement historique live_messages:', err);
      }
    };
    fetchChatHistory();
  }, [rawEventId, loadChatHistory]);

  // Auto-scroll au bas du chat lors de nouveaux messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length]);

  const handleSendLiveMessage = () => {
    const trimmed = liveChatInput.trim();
    if (!trimmed) return;
    sendChatMessage(trimmed);
    setLiveChatInput('');
  };

  // Countdown timer pour les événements planifiés
  const [countdownString, setCountdownString] = useState('');
  useEffect(() => {
    if (!isUpcomingEvent || !video.startDate) return;

    const calculateCountdown = () => {
      const target = new Date(video.startDate!).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdownString('Commence incessamment');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setCountdownString(`Dans ${days} j ${hours % 24} h`);
      } else {
        setCountdownString(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isUpcomingEvent, video.startDate]);

  // Bouton "M'avertir" connecté au Backend Django (sauvegarde directe en DB sans localStorage)
  const handleToggleNotify = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const cleanId = String(rawEventId).replace('evt-', '').replace('exile-', '');
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    const nextNotified = !isNotified;
    setIsNotified(nextNotified);
    show(nextNotified ? 'Rappel activé pour cet événement !' : 'Rappel désactivé');

    if (token && cleanId && !isNaN(Number(cleanId))) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/register/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.warn('Erreur API inscription rappel:', err);
      }
    }
  };

  const isCommentsDisabled = useMemo(() => {
    if (video.allowComments === false) return true;
    if ((video as any).allow_comments === false || (video as any).comments_enabled === false) return true;
    if (typeof localStorage !== 'undefined') {
      const storedChoice = localStorage.getItem(`video_allow_comments_${video.id}`);
      if (storedChoice !== null && storedChoice === 'false') return true;
    }
    return false;
  }, [video]);

  const contactSender = {
    id: storedProfile?.id || 'current-user',
    name: storedProfile?.name || 'Moi',
    avatar: storedProfile?.photo || null,
    profession: storedProfile?.profession || 'Utilisateur'
  };

  const commentRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Sauvegarder la position exacte lors du retour
  const handleBackNavigation = () => {
    if (videoPlayerRef.current && videoPlayerRef.current.currentTime > 0) {
      playbackPositionStore.set(video.id, videoPlayerRef.current.currentTime);
    }
    onBack();
  };

  const handleSelectRelated = (rv: Video) => {
    if (videoPlayerRef.current && videoPlayerRef.current.currentTime > 0) {
      playbackPositionStore.set(video.id, videoPlayerRef.current.currentTime);
    }
    onSelect(rv);
  };

  const watchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sauvegarde au démontage
  useEffect(() => {
    return () => {
      if (watchTimerRef.current) {
        clearTimeout(watchTimerRef.current);
        watchTimerRef.current = null;
      }
      if (videoPlayerRef.current && videoPlayerRef.current.currentTime > 0) {
        playbackPositionStore.set(video.id, videoPlayerRef.current.currentTime);
      }
    };
  }, [video.id]);

  // Restauration de la position précédente et lecture automatique
  const handleLoadedMetadata = () => {
    const v = videoPlayerRef.current;
    if (!v) return;
    const savedTime = playbackPositionStore.get(video.id);
    if (savedTime > 0 && v.duration && savedTime < v.duration) {
      v.currentTime = savedTime;
    }
    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        v.muted = true;
        const retry = v.play();
        if (retry !== undefined) retry.catch(() => {});
      });
    }
  };

  const handlePlaying = () => {
    setPlaybackError(null);
    if (watchTimerRef.current) clearTimeout(watchTimerRef.current);
    watchTimerRef.current = setTimeout(() => {
      recordView();
    }, 3000);
  };

  const handlePause = () => {
    if (videoPlayerRef.current && videoPlayerRef.current.currentTime > 0) {
      playbackPositionStore.set(video.id, videoPlayerRef.current.currentTime);
    }
    if (watchTimerRef.current) {
      clearTimeout(watchTimerRef.current);
      watchTimerRef.current = null;
    }
  };

  const handleTimeUpdate = () => {
    const v = videoPlayerRef.current;
    if (v && v.currentTime > 0) {
      playbackPositionStore.set(video.id, v.currentTime);
    }
  };

  // Double-tap sur vidéo pour like
  const handleVideoTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTabletOrBelow) return;
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 300;
    lastTapRef.current = now;

    if (isDoubleTap) {
      if (!isLiked) handleLike();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const rect = playerRef.current?.getBoundingClientRect();
      if (rect) {
        setHeartAnimation({ show: true, x: clientX - rect.left, y: clientY - rect.top });
        setTimeout(() => setHeartAnimation(prev => ({ ...prev, show: false })), 800);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTabletOrBelow) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTabletOrBelow) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dx < -90 && Math.abs(dx) > Math.abs(dy) * 2) {
      handleBackNavigation();
    }
  };

  // Liste triée des commentaires
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => ((b.likes || 0) + (b.replies?.length || 0)) - ((a.likes || 0) + (a.replies?.length || 0)));
  }, [comments]);

  const totalComments = useMemo(() => {
    return comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
  }, [comments]);

  // Charger les données de la vidéo
  useEffect(() => {
    const loadVideoData = async () => {
      const token = localStorage.getItem('accessToken') || undefined;
      const numericId = parseInt(video.id) || 0;
      
      const commentsResult = await videoApi.getComments(numericId, token);
      if (commentsResult.success && commentsResult.data) {
        const transformed = commentsResult.data.map((c: any) => {
          const cleanUser = (c.user_username || 'Utilisateur').replace(/^@+/, '');
          return {
            id: c.id.toString(),
            authorName: c.is_anonymous ? 'Anonyme' : cleanUser,
            initials: c.is_anonymous ? '?' : (cleanUser.charAt(0).toUpperCase() || 'U'),
            color: COMMENT_COLORS[Math.floor(Math.random() * COMMENT_COLORS.length)],
            text: c.text,
            ago: formatYouTubeDate(c.created_at),
            likes: c.likes_count || 0,
            liked: c.is_liked || false,
            disliked: c.is_disliked || false,
            replies: c.replies?.map((r: any) => {
              const cleanReplyUser = (r.user_username || 'Utilisateur').replace(/^@+/, '');
              return {
                id: r.id.toString(),
                authorName: r.is_anonymous ? 'Anonyme' : cleanReplyUser,
                initials: r.is_anonymous ? '?' : (cleanReplyUser.charAt(0).toUpperCase() || 'U'),
                color: COMMENT_COLORS[Math.floor(Math.random() * COMMENT_COLORS.length)],
                text: r.text,
                ago: formatYouTubeDate(r.created_at),
                likes: r.likes_count || 0,
                liked: r.is_liked || false,
                disliked: r.is_disliked || false,
                replies: [],
                parentId: r.parent_id?.toString(),
              };
            }) || [],
            parentId: c.parent_id?.toString(),
          };
        });
        setComments(transformed);
      }
    };

    loadVideoData();
    refreshInteractions();
  }, [video.id, video.author?.id, refreshInteractions]);

  // Scroll to top when video changes
  useEffect(() => {
    const scrollable = scrollRef.current || pageRef.current;
    if (scrollable) scrollable.scrollTo({ top: 0, behavior: 'smooth' });
    setDescOpen(false);
    setMobileDescOpen(false);
    setMobileCommentsOpen(false);
    setMobileLiveChatOpen(false);
  }, [video.id]);

  // Algo tracking
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (duration > 0) {
        accueilAlgo.trackVideoClick(video, duration, false, isLiked);
      }
    };
  }, [video, isLiked, accueilAlgo]);

  const handleShare = async () => {
    const cleanId = String(video.eventId || video.id).replace('evt-', '').replace('exile-', '');
    const isEventOrLive = Boolean(video.eventId || video.isLive || String(video.id).startsWith('evt-'));
    const shareUrl = isEventOrLive
      ? `${window.location.origin}/pro?${video.isLive ? 'live' : 'event'}=${cleanId}`
      : `${window.location.origin}/pro/video/${cleanId}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        show('Lien copié dans le presse-papiers !');
      }
    } catch {
      // Fallback
    }

    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Regardez "${video.title}" sur EXILE`,
        url: shareUrl,
      }).catch(() => {});
    } else if (!navigator.clipboard) {
      show('Lien: ' + shareUrl);
    }
  };

  const handleFavoriteAction = async () => {
    const isEvent = Boolean(video.eventId || String(video.id).startsWith('evt-'));
    if (isEvent) {
      const cleanId = String(video.eventId || video.id).replace('evt-', '').replace('exile-', '');
      if (!isAuthenticated) {
        show('Veuillez vous connecter pour enregistrer dans vos favoris');
        return;
      }
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/register/`, {
          method: 'POST',
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const isReg = data.is_registered ?? !eventFavoriteSaved;
          setEventFavoriteSaved(isReg);
          show(isReg ? 'Ajouté aux favoris ⭐' : 'Retiré des favoris');
        } else {
          setEventFavoriteSaved(prev => !prev);
          show(!eventFavoriteSaved ? 'Ajouté aux favoris ⭐' : 'Retiré des favoris');
        }
      } catch {
        setEventFavoriteSaved(prev => !prev);
        show(!eventFavoriteSaved ? 'Ajouté aux favoris ⭐' : 'Retiré des favoris');
      }
    } else {
      handleFavorite();
    }
  };

  // Envoi de commentaires
  const sendComment = async () => {
    if (isCommentsDisabled) {
      show('Les commentaires sont désactivés pour cette vidéo');
      return;
    }
    const text = commentInput.trim();
    if (!text) return;
    if (text.length > MAX_COMMENT_LENGTH) {
      show(`Max ${MAX_COMMENT_LENGTH} caractères`);
      return;
    }

    const token = localStorage.getItem('accessToken') || undefined;
    const result = await videoApi.createComment(parseInt(video.id) || 0, text, undefined, isAnonymous, token);
    
    if (result.success && result.data) {
      const newComment: Comment = {
        id: result.data.id.toString(),
        authorName: isAnonymous ? 'Anonyme' : (storedProfile?.name || 'Moi'),
        initials: isAnonymous ? '?' : ((storedProfile?.name?.charAt(0) || 'M').toUpperCase()),
        color: COMMENT_COLORS[colorIdx % COMMENT_COLORS.length],
        text: result.data.text,
        ago: 'À l\'instant',
        likes: 0,
        liked: false,
        disliked: false,
        replies: [],
      };
      setComments(prev => [newComment, ...prev]);
      setCommentInput('');
      setColorIdx(i => i + 1);
      show('Commentaire publié');
    } else {
      show(result.error || 'Erreur lors de la publication');
    }
  };

  const sendReply = async (parentId: string) => {
    if (isCommentsDisabled) {
      show('Les commentaires sont désactivés pour cette vidéo');
      return;
    }
    const text = replyInput.trim();
    if (!text) return;

    const token = localStorage.getItem('accessToken') || undefined;
    const result = await videoApi.createComment(parseInt(video.id) || 0, text, parseInt(parentId), isAnonymous, token);

    if (result.success && result.data) {
      const newReply: Comment = {
        id: result.data.id.toString(),
        authorName: isAnonymous ? 'Anonyme' : (storedProfile?.name || 'Moi'),
        initials: isAnonymous ? '?' : ((storedProfile?.name?.charAt(0) || 'M').toUpperCase()),
        color: COMMENT_COLORS[colorIdx % COMMENT_COLORS.length],
        text: result.data.text,
        ago: 'À l\'instant',
        likes: 0,
        liked: false,
        disliked: false,
        replies: [],
        parentId: parentId,
      };

      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), newReply] };
        }
        return c;
      }));

      setReplyInput('');
      setReplyTo(null);
      setExpandedReplies(prev => new Set(prev).add(parentId));
      show('Réponse publiée');
    } else {
      show(result.error || 'Erreur lors de la réponse');
    }
  };

  const handleCommentLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const token = localStorage.getItem('accessToken') || '';
    const numericId = parseInt(commentId);

    setComments(prev => prev.map(c => {
      if (!isReply && c.id === commentId) {
        const nextLiked = !c.liked;
        const diff = nextLiked ? 1 : -1;
        if (nextLiked) {
          videoApi.likeComment(numericId, token);
        } else {
          videoApi.removeCommentReaction(numericId, token);
        }
        return {
          ...c,
          liked: nextLiked,
          disliked: false,
          likes: Math.max(0, (c.likes || 0) + diff),
        };
      }
      if (isReply && c.id === parentId && c.replies) {
        const updatedReplies = c.replies.map(r => {
          if (r.id === commentId) {
            const nextLiked = !r.liked;
            const diff = nextLiked ? 1 : -1;
            if (nextLiked) {
              videoApi.likeComment(numericId, token);
            } else {
              videoApi.removeCommentReaction(numericId, token);
            }
            return {
              ...r,
              liked: nextLiked,
              disliked: false,
              likes: Math.max(0, (r.likes || 0) + diff),
            };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      }
      return c;
    }));
  };

  const handleCommentDislike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const token = localStorage.getItem('accessToken') || '';
    const numericId = parseInt(commentId);

    setComments(prev => prev.map(c => {
      if (!isReply && c.id === commentId) {
        const nextDisliked = !c.disliked;
        if (nextDisliked) {
          videoApi.dislikeComment(numericId, token);
        } else {
          videoApi.removeCommentReaction(numericId, token);
        }
        return {
          ...c,
          disliked: nextDisliked,
          liked: false,
          likes: c.liked ? Math.max(0, (c.likes || 0) - 1) : c.likes,
        };
      }
      if (isReply && c.id === parentId && c.replies) {
        const updatedReplies = c.replies.map(r => {
          if (r.id === commentId) {
            const nextDisliked = !r.disliked;
            if (nextDisliked) {
              videoApi.dislikeComment(numericId, token);
            } else {
              videoApi.removeCommentReaction(numericId, token);
            }
            return {
              ...r,
              disliked: nextDisliked,
              liked: false,
              likes: r.liked ? Math.max(0, (r.likes || 0) - 1) : r.likes,
            };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      }
      return c;
    }));
  };

  const renderComment = (c: Comment, isMobilePanel: boolean = false) => {
    const hasReplies = c.replies && c.replies.length > 0;
    const isExpanded = expandedReplies.has(c.id);

    return (
      <li key={c.id} className="flex gap-2 text-xs">
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: c.color }}
        >
          {c.initials}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{c.authorName}</span>
            <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{c.ago}</span>
          </div>

          {c.audioUrl ? (
            <div className="my-1.5 flex items-center gap-2 p-2 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 max-w-xs">
              <button
                type="button"
                onClick={() => {
                  if (playingCommentId === c.id) {
                    setPlayingCommentId(null);
                  } else {
                    setPlayingCommentId(c.id);
                    const audio = new Audio(c.audioUrl);
                    audio.play();
                    audio.onended = () => setPlayingCommentId(null);
                  }
                }}
                className="w-7 h-7 rounded-full bg-[#FF6B00] text-white flex items-center justify-center flex-shrink-0"
              >
                <Play size={12} className={playingCommentId === c.id ? 'opacity-50' : 'fill-white ml-0.5'} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#FF6B00]">Message vocal</p>
                <p className="text-[9px] text-zinc-400">Expire dans 72h</p>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400">{c.audioDuration || 30}s</span>
            </div>
          ) : (
            <p className={`text-xs leading-relaxed break-words ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{c.text}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
            <button
              onClick={() => handleCommentLike(c.id, false)}
              className={`flex items-center gap-1 hover:text-white transition-colors ${c.liked ? 'text-[#FF6B00]' : ''}`}
            >
              <ThumbsUp size={12} className={c.liked ? 'fill-[#FF6B00]' : ''} />
              <span>{c.likes || 0}</span>
            </button>
            <button
              onClick={() => handleCommentDislike(c.id, false)}
              className={`hover:text-white transition-colors ${c.disliked ? 'text-red-400' : ''}`}
            >
              <ThumbsDown size={12} className={c.disliked ? 'fill-red-400' : ''} />
            </button>
            <button
              onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              className="font-medium hover:text-[#FF6B00] transition-colors"
            >
              Répondre
            </button>
          </div>

          {/* Formulaire de réponse */}
          {replyTo === c.id && (
            <div className="mt-2 flex gap-1.5">
              <input
                type="text"
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                placeholder={`Répondre à @${c.authorName}...`}
                className={`flex-1 px-2.5 py-1 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-black'
                }`}
                onKeyDown={e => e.key === 'Enter' && sendReply(c.id)}
                autoFocus
              />
              <button
                onClick={() => sendReply(c.id)}
                disabled={!replyInput.trim()}
                className="px-2.5 py-1 bg-[#FF6B00] text-white text-xs font-bold rounded-lg disabled:opacity-40"
              >
                Envoyer
              </button>
            </div>
          )}

          {/* Réponses */}
          {hasReplies && (
            <div className="mt-1.5">
              <button
                onClick={() => setExpandedReplies(prev => {
                  const next = new Set(prev);
                  if (next.has(c.id)) next.delete(c.id);
                  else next.add(c.id);
                  return next;
                })}
                className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1"
              >
                <span>{isExpanded ? 'Masquer les réponses' : `Voir les ${c.replies?.length} réponses`}</span>
              </button>

              {isExpanded && (
                <ul className="mt-2 space-y-2 pl-3 border-l border-zinc-800">
                  {c.replies?.map(r => (
                    <li key={r.id} className="flex gap-2 text-xs">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ backgroundColor: r.color }}
                      >
                        {r.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-semibold text-zinc-200">{r.authorName}</span>
                          <span className="text-[9px] text-zinc-500">{r.ago}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed break-words">{r.text}</p>
                        <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-zinc-400">
                          <button
                            onClick={() => handleCommentLike(r.id, true, c.id)}
                            className={`flex items-center gap-0.5 ${r.liked ? 'text-[#FF6B00]' : ''}`}
                          >
                            <ThumbsUp size={10} className={r.liked ? 'fill-[#FF6B00]' : ''} />
                            <span>{r.likes || 0}</span>
                          </button>
                          <button
                            onClick={() => handleCommentDislike(r.id, true, c.id)}
                            className={r.disliked ? 'text-red-400' : ''}
                          >
                            <ThumbsDown size={10} className={r.disliked ? 'fill-red-400' : ''} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </li>
    );
  };

  const renderCommentForm = (isMobilePanel: boolean = false) => {
    if (isCommentsDisabled) {
      return (
        <div className={`p-3 rounded-xl text-center text-xs font-medium ${
          isDark ? 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50' : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          <span>Les commentaires sont désactivés pour cette vidéo.</span>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <div className="flex gap-1.5 items-center">
          <input
            ref={commentRef}
            type="text"
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className={`flex-1 px-3 py-1.5 rounded-xl border text-xs outline-none transition-colors ${
              isDark ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            onKeyDown={e => e.key === 'Enter' && sendComment()}
          />
          <button
            onClick={sendComment}
            disabled={!commentInput.trim()}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-all flex-shrink-0"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Publier</span>
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="w-3 h-3 rounded accent-[#FF6B00]"
            />
            <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Commenter en anonyme</span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={pageRef}
      className={`w-full min-h-screen ${isDark ? 'bg-[#0f0f0f] text-white' : 'bg-gray-50 text-gray-900'} pointer-events-auto flex flex-col`}
    >
      {/* ── 1. HEADER MINIMAL (Flèch retou sèlman pou ankadreman an parèt pi laj) ── */}
      <div className={`sticky top-0 z-30 ${isDark ? 'bg-[#0f0f0f]/90 border-zinc-800/80' : 'bg-white/95 border-gray-200'} backdrop-blur-md border-b px-3 py-1.5 flex items-center justify-between flex-shrink-0`}>
        <button
          onClick={handleBackNavigation}
          aria-label="Retour"
          className={`p-1.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold ${
            isDark ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Retour"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* ── MAIN CONTAINER ULTRA-COMPACT SANS ESPACES MORTS ── */}
      <div
        ref={scrollRef}
        className="w-full max-w-[1720px] mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-2 lg:py-4 grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-4 lg:gap-6"
      >
        {/* ── COLONNE GAUCHE : FLUX VIDÉO DIRECT ── */}
        <div className="lg:col-span-8 flex flex-col min-w-0">

          {/* ── 2. VIDÉO DIRECTEMENT SOUS LE HEADER (PLEINE LARGEUR BORD-À-BORD SUR MOBILE, RESPONSIVE ET NON STICKY SUR DESKTOP) ── */}
          <div
            ref={playerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`relative w-full aspect-video max-h-[75vh] xl:max-h-[580px] rounded-none sm:rounded-2xl overflow-hidden select-none flex items-center justify-center sticky top-[37px] xl:static z-20 ${
              isDark ? 'bg-zinc-950 shadow-xl' : 'bg-zinc-900 sm:bg-zinc-100 shadow-md sm:border sm:border-gray-200'
            }`}
          >
            {video.isLive ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={liveVideoRef}
                  autoPlay
                  playsInline
                  muted={isLiveHost}
                  className={`w-full h-full ${isScreenSharing ? 'object-contain' : 'object-cover'}`}
                />

                {/* Badge En Direct & Spectateurs */}
                <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 pointer-events-none">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>En Direct</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-zinc-200 text-[10px] font-medium border border-white/10">
                    <Users size={11} className="text-zinc-400" />
                    <span>{liveViewerCount}</span>
                  </div>
                </div>

                {/* Contrôles de l'Hôte */}
                {isLiveHost && (
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-30 flex items-center justify-center gap-2 p-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                      }`}
                    >
                      {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
                      <span className="hidden sm:inline">{isMuted ? 'Muet' : 'Micro'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleVideo}
                      className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                      }`}
                    >
                      {isVideoOff ? <VideoOff size={13} /> : <VideoIcon size={13} />}
                      <span className="hidden sm:inline">{isVideoOff ? 'Cam OFF' : 'Caméra'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleScreenShare}
                      className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isScreenSharing ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                      }`}
                    >
                      <Monitor size={13} />
                      <span className="hidden sm:inline">{isScreenSharing ? 'Arrêter' : 'Écran'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => endLive()}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      <PhoneOff size={13} />
                      <span className="hidden sm:inline">Terminer</span>
                    </button>
                  </div>
                )}

                {/* Déblocage du son spectateur si autoplay bloqué */}
                {!isLiveHost && isAudioBlocked && (
                  <button
                    type="button"
                    onClick={unblockAudio}
                    className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 cursor-pointer"
                  >
                    <Volume2 size={30} className="text-zinc-200 animate-bounce" />
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700">
                      Cliquer pour activer le son
                    </span>
                  </button>
                )}
              </div>
            ) : isUpcomingEvent ? (
              <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className={`w-full h-full flex flex-col items-center justify-center ${isDark ? 'bg-zinc-950 text-zinc-600' : 'bg-gray-100 text-gray-400'} gap-2`}>
                    <Clock size={36} className={isDark ? 'text-zinc-500' : 'text-gray-400'} />
                  </div>
                )}
                {/* Dégradé sombre discret en bas pour garantir la lisibilité du badge */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

                {/* Badge compact façon YouTube Première en bas */}
                <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs font-medium shadow-lg">
                    <Clock size={13} className="text-zinc-300" />
                    <span>Diffusion planifiée • {countdownString || 'Bientôt disponible'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleNotify}
                    style={{
                      backgroundColor: isNotified ? '#27272a' : '#ffffff',
                      color: isNotified ? '#f4f4f5' : '#000000',
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg active:scale-95 border ${
                      isNotified ? 'border-zinc-700' : 'border-white'
                    }`}
                  >
                    {isNotified ? (
                      <>
                        <Check size={14} className="stroke-[3]" style={{ color: '#f4f4f5' }} />
                        <span style={{ color: '#f4f4f5' }} className="font-bold">Rappel activé</span>
                      </>
                    ) : (
                      <>
                        <Bell size={14} style={{ color: '#000000', fill: '#000000' }} />
                        <span style={{ color: '#000000' }} className="font-bold">M'avertir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (video.videoUrl || video.replayUrl) ? (
              <VideoPlayer
                src={video.videoUrl || video.replayUrl || ''}
                hlsUrl={video.hlsUrl}
                poster={video.thumbnail}
                videoId={video.id}
                autoplay={true}
                type={video.mimeType}
                captions={video.captions}
                onPlay={handlePlaying}
                onPause={handlePause}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                <Play size={28} className="text-zinc-600" />
              </div>
            )}
            {heartAnimation.show && (
              <div
                className="absolute pointer-events-none animate-heart-pop z-30"
                style={{ left: heartAnimation.x - 20, top: heartAnimation.y - 20 }}
              >
                <Heart size={36} className="fill-red-500 text-red-500 drop-shadow-lg" />
              </div>
            )}
          </div>

          {/* ── CONTENEUR INFOS & INTERACTIONS ── */}
          <div className="px-2.5 sm:px-1 pt-1.5 flex flex-col gap-1.5">

            {/* ── 3. TITRE (Strictement 1 ligne) ── */}
            <div className="flex flex-col gap-0.5">
              <h1 className={`text-[13px] sm:text-base font-bold leading-snug truncate ${isDark ? 'text-white' : 'text-gray-900'}`} title={video.title}>
                {video.title || 'Vidéo sans titre'}
              </h1>
            </div>

            {/* ── 4. STATISTIQUES (Vues + Date sur une seule ligne) ── */}
            <div className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              <span>{fmtNum(viewsCount || video.views || 0)} vues</span>
              {isUpcomingEvent && video.startDate ? (
                <>
                  <span>•</span>
                  <span>{formatEventDateTime(video.startDate)}</span>
                </>
              ) : (video.postedAt || video.createdAt) ? (
                <>
                  <span>•</span>
                  <span>{formatYouTubeDate(video.postedAt || video.createdAt)}</span>
                </>
              ) : null}
            </div>

            {/* ── 5. CRÉATEUR & ACTIONS (Alinye sou yon sèl liy pou evite gaspiye espas) ── */}
            <div className={`flex items-center justify-between gap-2 py-1.5 border-y my-1 ${
              isDark ? 'border-zinc-800/40' : 'border-gray-200'
            }`}>
              {/* Créateur (Avatar + Nom/Username + Profession + Abonnés) */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="flex items-center gap-2 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/pro/profile/${authorId}`)}
                >
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm"
                    style={{ backgroundColor: video.author?.avatarColor || '#27272a' }}
                  >
                    {effectiveAvatar ? (
                      <img
                        src={effectiveAvatar}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">{effectiveInitials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-xs sm:text-sm font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      @{cleanUsername(effectiveUsername)}
                    </h3>
                    <p className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {effectiveProfession ? `${effectiveProfession} • ` : ''}{fmtNum(Math.max(subscribersCount, authorProfile?.followersCount || 0))} abonnés
                    </p>
                  </div>
                </div>

                {/* Bouton S'abonner Ultra-Lisible */}
                {!isOwnVideo && (
                  <button
                    onClick={handleToggleSubscribe}
                    disabled={isPending}
                    className={`px-3 py-1 rounded-full text-xs font-black tracking-wide transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-sm ml-1 ${
                      isSubscribed
                        ? isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-slate-200 text-slate-800 border border-slate-300'
                        : 'bg-white text-zinc-950 hover:bg-zinc-100'
                    }`}
                    style={{
                      color: isSubscribed ? (isDark ? '#e4e4e7' : '#1e293b') : '#09090b',
                      backgroundColor: isSubscribed ? (isDark ? '#27272a' : '#e2e8f0') : '#ffffff',
                    }}
                  >
                    {isSubscribed ? 'Abonné' : "S'abonner"}
                  </button>
                )}
              </div>

              {/* Bouton Like/Dislike sou bò dwat bouton abòne a, epi meni 3 pwen sou bò dwat li pou plis espas */}
              <div className="flex items-center gap-1.5 py-0.5 ml-auto flex-shrink-0">
                {/* Like / Dislike */}
                <div className={`flex items-center rounded-full flex-shrink-0 ${isDark ? 'bg-zinc-800/80 border border-zinc-700/50' : 'bg-gray-100 border border-gray-200'}`}>
                  <button
                    onClick={handleLike}
                    disabled={isPending}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-l-full transition-colors disabled:opacity-50 ${
                      isLiked ? 'text-[#FF6B00] bg-[#FF6B00]/10' : isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    <ThumbsUp size={12} className={isLiked ? 'fill-[#FF6B00]' : ''} />
                    <span>{fmtNum(likesCount)}</span>
                  </button>
                  <div className={`w-[1px] h-3 ${isDark ? 'bg-zinc-700/50' : 'bg-gray-300'}`} />
                  <button
                    onClick={handleDislike}
                    disabled={isPending}
                    className={`px-2 py-1 rounded-r-full transition-colors disabled:opacity-50 ${
                      isDisliked ? 'text-red-400 bg-red-500/10' : isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    <ThumbsDown size={12} className={isDisliked ? 'fill-red-400' : ''} />
                  </button>
                </div>

                {/* DotsMenu (Contacter, Partager, Ajouter aux favoris, Signaler) */}
                <DotsMenu
                  videoId={video.id}
                  authorId={authorId}
                  show={show}
                  saved={Boolean(video.eventId || String(video.id).startsWith('evt-') ? eventFavoriteSaved : isFavorite)}
                  onSave={handleFavoriteAction}
                  onShare={handleShare}
                  onContact={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    if (isOwnVideo) {
                      show("Vous ne pouvez pas vous contacter vous-même.");
                      return;
                    }
                    setShowContactModal(true);
                  }}
                />
              </div>
            </div>

            {/* ── 7. DESCRIPTION COMPACTE (S'ouvre en panneau sur mobile) ── */}
            <div
              onClick={() => isTabletOrBelow ? setMobileDescOpen(true) : setDescOpen(o => !o)}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                isDark ? 'bg-zinc-900/90 hover:bg-zinc-800/80 border-zinc-800/60' : 'bg-gray-100/90 hover:bg-gray-200/70 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold mb-0.5">
                <span className={isDark ? 'text-zinc-200' : 'text-gray-900'}>Description</span>
                <span className="text-[#FF6B00] text-[10px] font-bold">{isTabletOrBelow ? 'Ouvrir' : descOpen ? 'Afficher moins' : 'Afficher plus'}</span>
              </div>
              <p className={`text-[11px] sm:text-xs leading-relaxed ${descOpen ? '' : 'line-clamp-2'} ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                {video.description || 'Aucune description fournie.'}
              </p>
            </div>

            {/* ── 8. COMMENTAIRES / CHAT EN DIRECT (Mobile sèlman - kache sou desktop pou evite doublon) ── */}
            {(video.isLive || video.eventId) ? (
              /* 📱 Aperçu Ultra-Compact Discussion en direct sur Mobile */
              <div
                onClick={() => setMobileLiveChatOpen(true)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isDark ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-[#FF6B00]" />
                    <span className="font-bold text-[11px] sm:text-xs">Discussion en direct</span>
                    {video.isLive && (
                      <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>• {liveViewerCount} en direct</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#FF6B00] font-bold">Ouvrir</span>
                </div>
                {chatMessages.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                    <span className="font-semibold text-zinc-200 truncate max-w-[120px]">
                      @{cleanUsername(chatMessages[chatMessages.length - 1].user || chatMessages[chatMessages.length - 1].username)}:
                    </span>
                    <span className="truncate">{chatMessages[chatMessages.length - 1].text}</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500">Participer à la discussion en direct...</p>
                )}
              </div>
            ) : isTabletOrBelow ? (
              /* 📱 Aperçu Ultra-Compact sur Mobile */
              <div
                onClick={() => setMobileCommentsOpen(true)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isDark ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={13} className="text-[#FF6B00]" />
                    <span className="font-bold text-[11px] sm:text-xs">Commentaires</span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>• {totalComments}</span>
                  </div>
                  <span className="text-[10px] text-[#FF6B00] font-bold">Ouvrir</span>
                </div>
                {sortedComments.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                    <span className="font-semibold text-zinc-200">@{sortedComments[0].authorName.replace(/^@+/, '')}:</span>
                    <span className="truncate">{sortedComments[0].text}</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500">Ajouter un commentaire public...</p>
                )}
              </div>
            ) : (
              /* 💻 Vue Desktop Standard Inline */
              <div className="mt-2 mb-6">
                <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {totalComments} commentaire{totalComments > 1 ? 's' : ''}
                </h3>
                <div className="mb-4">
                  {renderCommentForm(false)}
                </div>
                {sortedComments.length === 0 ? (
                  <div className={`text-center py-6 rounded-xl border border-dashed ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-gray-200 text-gray-400'}`}>
                    <p className="text-xs font-medium">Aucun commentaire pour le moment.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {sortedComments.map(c => renderComment(c, false))}
                  </ul>
                )}
              </div>
            )}

            {/* ── SECTION PUB AVAN VIDÉOS RECOMMANDÉES SUR MOBILE & TABLETTE ── */}
            {isTabletOrBelow && (
              <div className="mt-4 mb-2 -mx-2.5 sm:mx-0">
                <SectionPub variant="mobile" />
              </div>
            )}

            {/* ── 9. DEZYÈM FEED SUR MOBILE & TABLETTE (Vidéos recommandées en pleine largeur) ── */}
            {isTabletOrBelow && related.length > 0 && (
              <div className="mt-2 flex flex-col pb-16 -mx-2.5 sm:mx-0">
                <h2 className={`text-sm sm:text-base font-bold px-3 py-2 ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>
                  Vidéos recommandées
                </h2>
                {/* Mobile: 1 colonne pleine largeur; Tablette: 2 colonnes par ligne */}
                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:px-1">
                  {related.map((rv) => {
                    const thumb = rv.thumbnail || (rv as any).cover || (rv as any).cover_url || (rv as any).thumbnailUrl;
                    const dateStr = rv.postedAt || rv.createdAt;
                    return (
                      <div
                        key={`rel-m-${rv.id}`}
                        className={`w-full flex flex-col cursor-pointer transition-all active:scale-[0.99] border-b pb-3 mb-1.5 ${
                          isDark ? 'border-zinc-800/80 bg-zinc-950 sm:bg-zinc-900/60 sm:border sm:rounded-xl sm:p-2 sm:mb-0' : 'border-gray-200 bg-white sm:border sm:rounded-xl sm:p-2 sm:mb-0 shadow-xs'
                        }`}
                        onClick={() => handleSelectRelated(rv)}
                      >
                        {/* Miniature Pleine Largeur (Bord-à-bord sur téléphone) */}
                        <div className="relative w-full aspect-video bg-black overflow-hidden sm:rounded-lg">
                          {thumb || rv.videoUrl ? (
                            <VideoPoster thumbnail={thumb} videoUrl={rv.videoUrl} title={rv.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                              <Play size={24} className="text-zinc-500" />
                            </div>
                          )}
                          {rv.isLive ? (
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span>Direct</span>
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center">
                                <Play size={18} className="text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Metadonnées & Auteur sous la miniature */}
                        <div className="px-3 pt-2.5 flex items-start gap-2.5">
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-zinc-800 text-white font-bold text-xs shadow-xs"
                            style={{ backgroundColor: rv.author?.avatarColor || '#27272a' }}
                          >
                            {rv.author?.avatar ? (
                              <img src={rv.author.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{(rv.author?.name || rv.author?.username || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-xs sm:text-sm line-clamp-2 leading-snug mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {rv.title}
                            </h4>
                            <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                              @{cleanUsername(rv.author?.username || rv.author?.name)}
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                              {rv.isLive ? (
                                <span className="text-red-500 font-semibold">{fmtNum(rv.views || 0)} spectateurs • En direct</span>
                              ) : (
                                `${fmtNum(rv.views || 0)} vues${dateStr ? ` • ${formatYouTubeDate(dateStr)}` : ''}`
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ── COLONNE DROITE SUR DESKTOP (Chat en direct + Dezyèm Feed) ── */}
        {!isTabletOrBelow && (
          <aside className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 flex flex-col gap-4 min-w-0 pb-12 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-1">
            {/* Si direct ou événement : Chat en direct au-dessus */}
            {(video.isLive || video.eventId) && (
              <div className={`rounded-xl border overflow-hidden flex flex-col transition-all duration-200 ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                {/* Header du Chat */}
                <div className={`px-3 py-2 border-b flex items-center justify-between select-none ${
                  isDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />
                    <span className={`text-xs font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>Discussion en direct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {video.isLive && (
                      <span className={`text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {liveViewerCount} en ligne
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDesktopChatOpen(o => !o)}
                      className={`text-[11px] px-2 py-0.5 rounded transition-colors font-medium cursor-pointer ${
                        isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                      title={desktopChatOpen ? "Masquer la discussion" : "Afficher la discussion"}
                    >
                      {desktopChatOpen ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                </div>

                {desktopChatOpen && (
                  <>
                    {/* Messages scrollables */}
                    <div className="h-64 sm:h-72 overflow-y-auto p-3 space-y-2 text-xs [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      {chatMessages.length === 0 ? (
                        <div className={`text-center py-10 text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                          Aucun message pour le moment.
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => (
                          <div key={msg.id || idx} className="flex items-start gap-2 leading-relaxed">
                            <span className={`font-semibold text-[11px] truncate max-w-[110px] ${
                              msg.isHost ? (isDark ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : isDark ? 'text-zinc-200' : 'text-gray-900 font-semibold'
                            }`}>
                              {msg.user || msg.username}
                              {msg.isHost && (
                                <span className={`ml-1 px-1 py-0.2 rounded text-[9px] ${
                                  isDark ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  Hôte
                                </span>
                              )}
                            </span>
                            <span className={`flex-1 break-words text-[11px] ${
                              isDark ? 'text-zinc-300' : 'text-gray-800'
                            }`}>
                              {msg.text}
                            </span>
                          </div>
                        ))
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    {/* Saisie du message */}
                    <div className={`p-2 border-t flex items-center gap-1.5 ${
                      isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <input
                        type="text"
                        value={liveChatInput}
                        onChange={(e) => setLiveChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendLiveMessage()}
                        placeholder={isAuthenticated ? "Envoyer un message..." : "Connectez-vous pour discuter"}
                        disabled={!isAuthenticated}
                        className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs outline-none transition-colors ${
                          isDark
                            ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleSendLiveMessage}
                        disabled={!liveChatInput.trim() || !isAuthenticated}
                        className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                          liveChatInput.trim()
                            ? 'bg-[#FF6B00] text-white hover:bg-[#e05e00] shadow-sm cursor-pointer'
                            : isDark
                              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Send size={13} className={liveChatInput.trim() ? "text-white" : isDark ? "text-zinc-400" : "text-gray-400"} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── SECTION PUB AVAN VIDÉOS RECOMMANDÉES (Desktop) ── */}
            <div className="my-1">
              <SectionPub variant="auto" />
            </div>

            {/* DEZYÈM FEED : Vidéos recommandées / À suivre */}
            {related.length > 0 && (
              <div>
                <p className={`text-xs font-bold px-1 mb-2.5 uppercase tracking-wider ${
                  isDark ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  Vidéos recommandées
                </p>

                <div className="flex flex-col gap-2">
                  {related.map((rv) => {
                    const thumb = rv.thumbnail || (rv as any).cover || (rv as any).cover_url || (rv as any).thumbnailUrl;
                    const dateStr = rv.postedAt || rv.createdAt;
                    return (
                      <div
                        key={rv.id}
                        className={`flex gap-2.5 p-1.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] border ${
                          isDark ? 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800/60' : 'bg-white hover:bg-gray-100 border-gray-200 shadow-xs'
                        }`}
                        onClick={() => handleSelectRelated(rv)}
                      >
                        <div className="relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-black shadow-xs">
                          {thumb || rv.videoUrl ? (
                            <VideoPoster thumbnail={thumb} videoUrl={rv.videoUrl} title={rv.title} />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                              <Play size={14} className={isDark ? 'text-zinc-500' : 'text-gray-400'} />
                            </div>
                          )}
                          {rv.isLive ? (
                            <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                              <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                              <span>Direct</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <h4 className={`font-semibold text-xs line-clamp-2 leading-snug mb-0.5 ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>
                              {rv.title}
                            </h4>
                            <p className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                              @{cleanUsername(rv.author?.username || rv.author?.name)}
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                              {rv.isLive ? (
                                <span className="text-red-500 font-semibold">{fmtNum(rv.views || 0)} spectateurs • En direct</span>
                              ) : (
                                `${fmtNum(rv.views || 0)} vues${dateStr ? ` • ${formatYouTubeDate(dateStr)}` : ''}`
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── 📱 PANNEAU DISCUSSION EN DIRECT FULL-WIDTH SUR MOBILE & TABLETTE ── */}
      {isTabletOrBelow && mobileLiveChatOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-black/60 backdrop-blur-sm"
          style={{ top: 'calc(100vw * 9 / 16 + 37px)' }}
          onClick={() => setMobileLiveChatOpen(false)}
        >
          <div
            className={`flex-1 flex flex-col w-full shadow-2xl overflow-hidden border-t ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header du panneau collé sous la vidéo */}
            <div className={`px-3 py-2 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-[#FF6B00]" />
                <h3 className="font-bold text-xs">Discussion en direct</h3>
                {video.isLive && (
                  <span className="text-[11px] text-zinc-400 font-medium">({liveViewerCount} en ligne)</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileLiveChatOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages scrollables sur mobile */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {chatMessages.length === 0 ? (
                <div className={`text-center py-10 text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Aucun message pour l'instant.<br />Soyez le premier à participer !
                </div>
              ) : (
                chatMessages.map((m, idx) => (
                  <div key={m.id || idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className={`font-bold text-[11px] truncate max-w-[120px] ${
                      m.isHost ? (isDark ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (isDark ? 'text-zinc-200' : 'text-gray-900 font-semibold')
                    }`}>
                      {m.user || m.username}:
                    </span>
                    <span className={`text-[11px] break-words ${isDark ? 'text-zinc-300' : 'text-gray-800'}`}>{m.text}</span>
                  </div>
                ))
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Saisie chat mobile */}
            <div className={`p-2.5 border-t flex-shrink-0 pb-5 sm:pb-2.5 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={liveChatInput}
                  onChange={(e) => setLiveChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendLiveMessage()}
                  placeholder={isAuthenticated ? "Message en direct..." : "Connectez-vous pour écrire"}
                  disabled={!isAuthenticated}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs outline-none transition-colors ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSendLiveMessage}
                  disabled={!liveChatInput.trim() || !isAuthenticated}
                  className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                    liveChatInput.trim()
                      ? 'bg-[#FF6B00] text-white hover:bg-[#e05e00] shadow-sm cursor-pointer'
                      : isDark
                        ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={14} className={liveChatInput.trim() ? "text-white" : isDark ? "text-zinc-400" : "text-gray-400"} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 📱 PANNEAU COMMENTAIRES FULL-WIDTH SUR MOBILE & TABLETTE ── */}
      {isTabletOrBelow && mobileCommentsOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-black/60 backdrop-blur-sm"
          style={{ top: 'calc(100vw * 9 / 16 + 37px)' }}
          onClick={() => setMobileCommentsOpen(false)}
        >
          <div
            className={`flex-1 flex flex-col w-full shadow-2xl overflow-hidden border-t ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header du panneau collé sous la vidéo */}
            <div className={`px-3 py-2 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <MessageCircle size={15} className="text-[#FF6B00]" />
                <h3 className="font-bold text-xs">Commentaires</h3>
                <span className="text-[11px] text-zinc-400 font-medium">({totalComments})</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileCommentsOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Liste scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {sortedComments.length === 0 ? (
                <div className={`text-center py-8 text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Aucun commentaire pour le moment.<br />Soyez le premier à donner votre avis !
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {sortedComments.map(c => renderComment(c, true))}
                </ul>
              )}
            </div>

            {/* Formulaire collé au bas du panneau */}
            <div className={`p-2.5 border-t flex-shrink-0 pb-5 sm:pb-2.5 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'}`}>
              {renderCommentForm(true)}
            </div>
          </div>
        </div>
      )}

      {/* ── 📱 PANNEAU DESCRIPTION FULL-WIDTH SUR MOBILE & TABLETTE ── */}
      {isTabletOrBelow && mobileDescOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-black/60 backdrop-blur-sm"
          style={{ top: 'calc(100vw * 9 / 16 + 37px)' }}
          onClick={() => setMobileDescOpen(false)}
        >
          <div
            className={`flex-1 flex flex-col w-full shadow-2xl overflow-hidden border-t ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header du panneau collé sous la vidéo */}
            <div className={`px-3 py-2.5 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className={`font-bold text-xs ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>Description</h3>
              <button
                type="button"
                onClick={() => setMobileDescOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenu scrollable de la description */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h2 className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>{video.title}</h2>
              <div className={`flex items-center gap-2 text-xs pb-2 border-b ${isDark ? 'text-zinc-400 border-zinc-800/40' : 'text-gray-500 border-gray-200'}`}>
                <span>{fmtNum(viewsCount || video.views || 0)} vues</span>
                <span>•</span>
                <span>{formatYouTubeDate(video.postedAt || video.createdAt || '')}</span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                {video.description || 'Aucune description fournie.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {msg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] text-xs font-semibold px-4 py-2 rounded-full shadow-2xl bg-zinc-900 text-white border border-zinc-700/80 animate-in fade-in slide-in-from-bottom-2">
          {msg}
        </div>
      )}

      {/* Contact Modal */}
      {contactReceiver && (
        <ContactModal
          isOpen
          onClose={() => {
            setSelectedAuthorForContact(null);
            setShowContactModal(false);
          }}
          receiver={contactReceiver}
          sender={contactSender}
          theme={resolvedTheme}
        />
      )}
    </div>
  );
}

export default VideoPlayerPage;
