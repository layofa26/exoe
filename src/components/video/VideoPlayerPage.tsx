import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Video, Comment } from '../../types/video';
import { useIsTabletOrBelow } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { fmtNum, formatYouTubeDate } from '../../utils/format';
import { DotsMenu } from './DotsMenu';
import { ContactModal } from '../modals/ContactModal';
import { VoiceComment } from '../common/VoiceComment';
import { PlayIcon, HeartIcon, CommentIcon, ShareIcon, ArrowLeftIcon, SendIcon, ChevronRightIcon, ThumbUpIcon, MessageCircleIcon, XIcon, PauseIcon } from '../icons/VideoIcons';
import { useAccueilAlgo } from '../../algoPro/signals/useAccueilAlgo';
import { useSubsAlgo } from '../../algoPro/signals/useSubsAlgo';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { guessVideoMimeType, toPlayableMimeType } from './VideoPlayer';
import { videoApi } from '../../services/videoApi';

interface VideoPlayerPageProps {
  video: Video;
  related: Video[];
  onBack: () => void;
  onSelect: (v: Video) => void;
}

const COMMENT_COLORS = ['#1d4ed8', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export function VideoPlayerPage({ video, related, onBack, onSelect }: VideoPlayerPageProps) {
  const { resolvedTheme } = useTheme();
  const isTabletOrBelow = useIsTabletOrBelow();
  const { msg, show } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Récupérer ou créer un userId pour les signaux algorithmiques
  const userId = localStorage.getItem('exile_user_id') || 'user_default'
  
  // Initialiser les Logic Hooks
  const accueilAlgo = useAccueilAlgo(userId)
  const subsAlgo = useSubsAlgo(userId)

  // États pour les interactions
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(video.likes || 0);
  const [disliked, setDisliked] = useState(false);
  const [likeId, setLikeId] = useState<number | null>(null);
  const [dislikeId, setDislikeId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribers, setSubscribers] = useState(video.author?.followers || 0);
  const [descOpen, setDescOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>(video.comments || []);
  const [colorIdx, setColorIdx] = useState(0);
  const [commentSort, setCommentSort] = useState<'popular' | 'recent'>('popular');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [playingCommentId, setPlayingCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  // États pour les modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedAuthorForContact, setSelectedAuthorForContact] = useState<typeof video.author | null>(null);
  
  const commentRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<any>(null);
  const lastTapRef = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // États nouvo
  const [heartAnimation, setHeartAnimation] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reportModal, setReportModal] = useState<{ open: boolean; commentId: string | null }>({ open: false, commentId: null });
  const [reportReason, setReportReason] = useState('');
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Double-tap sou videyo pou like (TikTok/Instagram style)
  const handleVideoTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTabletOrBelow) return; // Sèlman sou mobil
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 300;
    lastTapRef.current = now;

    if (isDoubleTap) {
      // Klike like si pa te deja like
      if (!liked) handleLike();
      // Pozisyon animasyon
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const rect = playerRef.current?.getBoundingClientRect();
      if (rect) {
        setHeartAnimation({ show: true, x: clientX - rect.left, y: clientY - rect.top });
        setTimeout(() => setHeartAnimation(prev => ({ ...prev, show: false })), 800);
      }
    }
  };

  // Swipe back pou fèmen overlay sou mobil
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTabletOrBelow) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTabletOrBelow) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Swipe dwat->gòch ak angle < 45deg
    if (dx < -80 && Math.abs(dx) > Math.abs(dy) * 2) {
      onBack();
    }
  };


  // Komposan videyo prensipal la (itilize nan 2 kote pou mobil/desktop)
  const MainPlayer = () => (
    <div
      ref={playerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${isTabletOrBelow ? 'aspect-video' : 'h-[450px]'} bg-gradient-to-br ${video.gradient || 'from-zinc-700 to-zinc-900'} overflow-hidden shadow-xl select-none`}
    >
      {video.videoUrl ? (
        <>
          <video
            ref={videoPlayerRef}
            key={video.videoUrl}
            poster={video.thumbnail}
            controls
            playsInline
            preload="metadata"
            onClick={(e) => {
              e.stopPropagation()
              const videoEl = videoPlayerRef.current
              if (videoEl) {
                if (videoEl.paused) {
                  videoEl.play()
                } else {
                  videoEl.pause()
                }
              }
            }}
            className="w-full h-full object-contain"
            onLoadStart={() => setPlaybackError(null)}
            onError={() => setPlaybackError("Impossible de lire cette vidéo (format non supporté ou lien expiré).")}
          >
            <source src={video.videoUrl} type={video.mimeType ? toPlayableMimeType(video.mimeType) : guessVideoMimeType(video.videoUrl)} />
          </video>
          {playbackError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center pointer-events-none">
              <p className="text-white text-sm">{playbackError}</p>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/60 select-none px-4">
            <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center mx-auto mb-3">
              <span className="w-8 h-8 text-white/80"><PlayIcon /></span>
            </div>
            <p className="text-sm font-medium">{video.title || 'Vidéo'}</p>
            <p className="text-xs mt-1 opacity-60">Vidéo indisponible pour le moment</p>
          </div>
        </div>
      )}
      {/* Animasyon kè pou double-tap */}
      {heartAnimation.show && (
        <div
          className="absolute pointer-events-none animate-heart-pop"
          style={{ left: heartAnimation.x - 20, top: heartAnimation.y - 20 }}
        >
          <span className="w-10 h-10 text-red-500"><HeartIcon /></span>
        </div>
      )}
    </div>
  );

  // Triye kòmantè yo selon filtè
  const sortedComments = useMemo(() => {
    const base = [...comments];
    if (commentSort === 'recent') {
      return base.reverse();
    }
    // popular = plis like anwo
    return base.sort((a, b) => ((b.likes || 0) + (b.replies?.length || 0)) - ((a.likes || 0) + (a.replies?.length || 0)));
  }, [comments, commentSort]);

  // Konte total kòmantè + repons yo
  const totalComments = useMemo(() => {
    return comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
  }, [comments]);

  // Charger les commentaires et le statut like/dislike depuis le backend
  useEffect(() => {
    const loadVideoData = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        // Charger les commentaires
        const commentsResult = await videoApi.getComments(parseInt(video.id), token)
        if (commentsResult.success && commentsResult.data) {
          const transformedComments = commentsResult.data.map((c: any) => ({
            id: c.id.toString(),
            authorName: c.is_anonymous ? 'Anonyme' : (c.user_username || 'Utilisateur'),
            initials: c.is_anonymous ? '?' : (c.user_username?.charAt(0).toUpperCase() || 'U'),
            color: COMMENT_COLORS[Math.floor(Math.random() * COMMENT_COLORS.length)],
            text: c.text,
            ago: formatYouTubeDate(c.created_at),
            likes: c.likes_count || 0,
            liked: c.is_liked || false,
            disliked: c.is_disliked || false,
            replies: c.replies?.map((r: any) => ({
              id: r.id.toString(),
              authorName: r.is_anonymous ? 'Anonyme' : (r.user_username || 'Utilisateur'),
              initials: r.is_anonymous ? '?' : (r.user_username?.charAt(0).toUpperCase() || 'U'),
              color: COMMENT_COLORS[Math.floor(Math.random() * COMMENT_COLORS.length)],
              text: r.text,
              ago: formatYouTubeDate(r.created_at),
              likes: r.likes_count || 0,
              liked: r.is_liked || false,
              disliked: r.is_disliked || false,
              replies: [],
              parentId: r.parent_id?.toString(),
            })) || [],
            parentId: c.parent_id?.toString(),
          }))
          setComments(transformedComments)
        }
        
        // Charger le statut like/dislike (à implémenter avec un endpoint dédié ou via les commentaires)
        // Pour l'instant, on utilise localStorage comme fallback
        const likedVideos = JSON.parse(localStorage.getItem('exile_liked_videos') || '[]');
        const dislikedVideos = JSON.parse(localStorage.getItem('exile_disliked_videos') || '[]');
        setLiked(likedVideos.includes(video.id));
        setDisliked(dislikedVideos.includes(video.id));
      }
    }
    
    loadVideoData()
  }, [video.id])

  useEffect(() => {
    pageRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setDescOpen(false);
    setCommentsOpen(!isTabletOrBelow);
  }, [isTabletOrBelow]);

  useEffect(() => {
    // Charger l'état "saved"
    const savedVideos = JSON.parse(localStorage.getItem('exile_saved_videos') || '[]');
    setSaved(savedVideos.includes(video.id));
    
    // Charger l'état "subscribed" pour cet auteur
    const subscriptions = JSON.parse(localStorage.getItem('exile_subscriptions') || '[]');
    const isSubscribed = subscriptions.some((sub: any) => 
      sub.author?.id === video.author?.id || sub.id === video.author?.id
    );
    setSubscribed(isSubscribed);
    setSubscribers((video.author?.followers || 0) + (isSubscribed ? 1 : 0));
  }, [video.id, video.author?.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onBack]);

  // Scroll nan tèt lè videyo chanje (efè YouTube)
  useEffect(() => {
    // Sou mobil: scrollRef defile, sou desktop: pageRef defile
    const scrollable = scrollRef.current || pageRef.current;
    if (scrollable) {
      scrollable.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [video.id]);

  // Tracker le temps de visionnage avec useAccueilAlgo
  useEffect(() => {
    const startTime = Date.now()
    
    return () => {
      const watchDuration = Math.floor((Date.now() - startTime) / 1000)
      if (watchDuration > 0) {
        accueilAlgo.trackVideoClick(video, watchDuration, false, liked)
      }
    }
  }, [video, liked, accueilAlgo])

  // Fonctions d'interaction
  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    const token = localStorage.getItem('accessToken')
    if (!token) return
    
    if (liked) {
      // Retirer le like
      if (likeId) {
        const result = await videoApi.unlikeVideo(likeId, token)
        if (result.success) {
          setLiked(false)
          setLikes(l => l - 1)
          setLikeId(null)
          show('Like retiré')
        }
      }
    } else {
      // Ajouter le like et retirer dislike si présent
      const result = await videoApi.likeVideo(parseInt(video.id), token)
      if (result.success) {
        setLiked(true)
        setLikes(l => l + 1)
        setLikeId(result.data?.id || null)
        
        if (disliked && dislikeId) {
          await videoApi.undislikeVideo(dislikeId, token)
          setDisliked(false)
          setDislikeId(null)
        }
        show('Vous aimez 👍')
      }
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    const token = localStorage.getItem('accessToken')
    if (!token) return
    
    if (disliked) {
      // Retirer le dislike
      if (dislikeId) {
        const result = await videoApi.undislikeVideo(dislikeId, token)
        if (result.success) {
          setDisliked(false)
          setDislikeId(null)
          show('Dislike retiré')
        }
      }
    } else {
      // Ajouter le dislike et retirer like si présent
      const result = await videoApi.dislikeVideo(parseInt(video.id), token)
      if (result.success) {
        setDisliked(true)
        setDislikeId(result.data?.id || null)
        
        if (liked && likeId) {
          await videoApi.unlikeVideo(likeId, token)
          setLiked(false)
          setLikes(l => l - 1)
          setLikeId(null)
        }
        show('Dislike ajouté 👎')
      }
    }
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const subscriptions = JSON.parse(localStorage.getItem('exile_subscriptions') || '[]');
    
    if (subscribed) {
      // Désabonner
      const updated = subscriptions.filter((sub: any) => 
        sub.author?.id !== video.author?.id && sub.id !== video.author?.id
      );
      localStorage.setItem('exile_subscriptions', JSON.stringify(updated));
      setSubscribed(false);
      setSubscribers(s => Math.max(0, s - 1));
      show(`Vous ne suivez plus ${video.author?.name}`);
      
      // Tracker la désabonnement avec useSubsAlgo
      if (video.author) {
        subsAlgo.removeSubscription(video.author.id)
      }
    } else {
      // S'abonner
      const newSub = {
        id: `sub-${video.author?.id}`,
        author: video.author,
        isActive: true,
        subscribedAt: new Date().toISOString(),
        notifyEnabled: true
      };
      const updated = [...subscriptions, newSub];
      localStorage.setItem('exile_subscriptions', JSON.stringify(updated));
      setSubscribed(true);
      setSubscribers(s => s + 1);
      show(`Vous suivez maintenant ${video.author?.name} 🔔`);
      
      // Tracker l'abonnement avec useSubsAlgo
      if (video.author) {
        subsAlgo.addSubscription(video.author.id)
      }
    }
  };

  const handleSave = () => {
    const savedVideos = JSON.parse(localStorage.getItem('exile_saved_videos') || '[]');
    
    if (saved) {
      const updated = savedVideos.filter((id: string) => id !== video.id);
      localStorage.setItem('exile_saved_videos', JSON.stringify(updated));
      setSaved(false);
      show('Retiré des favoris 📌');
    } else {
      const updated = [...savedVideos, video.id];
      localStorage.setItem('exile_saved_videos', JSON.stringify(updated));
      setSaved(true);
      show('Enregistré dans les favoris 🔖');
    }
  };

  const handleShare = () => {
    // Construire l'URL avec l'ID de la vidéo pour le partage
    const shareUrl = `${window.location.origin}/pro/video/${video.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Regardez cette vidéo de ${video.author?.name}`,
        url: shareUrl
      }).catch(() => {
        // Fallback
        navigator.clipboard.writeText(shareUrl);
        show('Lien copié dans le presse-papiers 🔗');
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      show('Lien copié dans le presse-papiers 🔗');
    }
  };

  const handleProfileClick = () => {
    // Vérifier si c'est le profil de l'utilisateur connecté
    const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}');
    const authorId = video.author?.id;
    
    // Si pa gen otè (author), montre modal default
    if (!authorId) {
      return;
    }
    
    const isOwnProfile = userProfile?.id === authorId;
    
    if (isOwnProfile) {
      onBack(); // Fèmen overlay a anvan
      navigate('/pro/settings'); // Rediriger vers les paramètres ou une autre page de profil temporaire
    }
  };

  const MAX_COMMENT_LENGTH = 1000;

  const sendComment = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const text = commentInput.trim();
    if (!text) return;
    if (text.length > MAX_COMMENT_LENGTH) { show(`Max ${MAX_COMMENT_LENGTH} caractères`); return; }
    
    const token = localStorage.getItem('accessToken')
    if (!token) return
    
    const result = await videoApi.createComment(parseInt(video.id), text, undefined, isAnonymous, token)
    if (result.success) {
      const newComment = {
        id: result.data.id.toString(),
        authorName: result.data.user_username || 'Vous',
        initials: result.data.user_username?.charAt(0).toUpperCase() || 'M',
        color: COMMENT_COLORS[colorIdx % COMMENT_COLORS.length],
        text,
        ago: "À l'instant",
        likes: result.data.likes_count || 0,
        liked: result.data.is_liked || false,
        disliked: result.data.is_disliked || false,
        replies: [],
        parentId: null,
      }
      setComments(prev => [newComment, ...prev])
      setCommentInput('')
      setColorIdx(i => i + 1)
      show(isAnonymous ? 'Commentaire anonyme publié ✓' : 'Commentaire publié ✓')
    } else {
      show(result.error || 'Erreur lors de la publication du commentaire')
    }
  };

  const handleVoiceCommentSend = (audioBlob: Blob, duration: number) => {
    const authorLabel = isAnonymous ? 'Anonyme' : 'Vous';
    const initialsLabel = isAnonymous ? '?' : 'Moi';
    setComments(prev => [...prev, {
      id: `c-${Date.now()}`, authorName: authorLabel, initials: initialsLabel,
      color: COMMENT_COLORS[colorIdx % COMMENT_COLORS.length], text: `🎤 Message vocal (${duration}s)`, ago: "À l'instant",
      likes: 0, liked: false, disliked: false, replies: [], parentId: null,
      audioBlob: audioBlob,
      audioDuration: duration,
    }]);
    setColorIdx(i => i + 1);
    show(isAnonymous ? 'Commentaire vocal anonyme publié ✓' : 'Commentaire vocal publié ✓');
  };

  // Fonksyon rekirsif pou mete ajou like/dislike nan tout nivo
  const updateCommentLike = (comment: Comment, commentId: string): Comment => {
    if (comment.id === commentId) {
      if (comment.liked) return { ...comment, liked: false, likes: Math.max(0, (comment.likes || 0) - 1) };
      return { ...comment, liked: true, disliked: false, likes: (comment.likes || 0) + 1 };
    }
    if (comment.replies) {
      return { ...comment, replies: comment.replies.map(r => updateCommentLike(r, commentId)) };
    }
    return comment;
  };

  const updateCommentDislike = (comment: Comment, commentId: string): Comment => {
    if (comment.id === commentId) {
      if (comment.disliked) return { ...comment, disliked: false };
      return { ...comment, disliked: true, liked: false, likes: comment.liked ? Math.max(0, (comment.likes || 0) - 1) : (comment.likes || 0) };
    }
    if (comment.replies) {
      return { ...comment, replies: comment.replies.map(r => updateCommentDislike(r, commentId)) };
    }
    return comment;
  };

  const handleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(c => updateCommentLike(c, commentId)));
  };

  const handleCommentDislike = (commentId: string) => {
    setComments(prev => prev.map(c => updateCommentDislike(c, commentId)));
  };

  const sendReply = (parentId: string) => {
    const text = replyInput.trim();
    if (!text) return;
    if (text.length > MAX_COMMENT_LENGTH) { show(`Max ${MAX_COMMENT_LENGTH} caractères`); return; }
    const authorLabel = isAnonymous ? 'Anonyme' : 'Vous';
    const initialsLabel = isAnonymous ? '?' : 'Moi';
    setComments(prev => prev.map(c => {
      if (c.id !== parentId) return c;
      const reply: Comment = {
        id: `r-${Date.now()}`, authorName: authorLabel, initials: initialsLabel,
        color: COMMENT_COLORS[colorIdx % COMMENT_COLORS.length], text, ago: "À l'instant",
        likes: 0, liked: false, disliked: false, replies: [], parentId,
      };
      return { ...c, replies: [...(c.replies || []), reply] };
    }));
    setReplyInput(''); setReplyTo(null); setColorIdx(i => i + 1);
    setExpandedReplies(prev => new Set(prev).add(parentId));
    show(isAnonymous ? 'Réponse anonyme publiée ✓' : 'Réponse publiée ✓');
  };

  // Fonksyon pou ekstrè ak klike sou timestamp nan kòmantè
  const handleTimestampClick = (timestamp: string) => {
    const parts = timestamp.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    // Note: This would need access to the Video.js player instance
    // For now, we'll skip this functionality as it requires VideoJSPlayer to expose its player
    show(`Timestamp ${timestamp} - fonctionnalité désactivée`);
  };

  // Fonksyon pou report yon kòmantè
  const handleReportComment = () => {
    if (!reportReason.trim()) return;
    setReportModal({ open: false, commentId: null });
    setReportReason('');
    show('Commentaire signalé. Merci ! 🚩');
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId); else next.add(commentId);
      return next;
    });
  };

  const deleteComment = (commentId: string) => {
    setComments(prev => prev
      .filter(c => c.id !== commentId)
      .map(c => ({
        ...c,
        replies: (c.replies || []).filter(r => r.id !== commentId)
      }))
    );
    show('Commentaire supprimé');
  };

  const editComment = (commentId: string, newText: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, text: newText };
      }
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map(r => 
            r.id === commentId ? { ...r, text: newText } : r
          )
        };
      }
      return c;
    }));
    show('Commentaire modifié');
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const startEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentText);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const saveEditComment = (commentId: string) => {
    if (editCommentText.trim()) {
      editComment(commentId, editCommentText);
    }
  };

  // Parse tèks kòmantè pou detekte timestamp yo
  const renderCommentText = (text: string) => {
    const TIMESTAMP_REGEX = /(\d{1,2}:\d{2}(?::\d{2})?)/g;
    const elements: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = TIMESTAMP_REGEX.exec(text)) !== null) {
      // Tèks anvan match la
      if (match.index > lastIndex) {
        elements.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
      }
      // Match timestamp la
      elements.push(
        <button
          key={key++}
          onClick={() => handleTimestampClick(match![0])}
          className="text-blue-400 hover:text-blue-300 underline cursor-pointer font-medium"
        >
          {match[0]}
        </button>
      );
      lastIndex = TIMESTAMP_REGEX.lastIndex;
    }
    // Rès tèks la
    if (lastIndex < text.length) {
      elements.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }
    return elements.length > 0 ? elements : <span>{text}</span>;
  };

  // Fonksyon pou afiche yon kòmantè (reyitilize desktop + mobil)
  const renderComment = (c: Comment, isMobile: boolean) => {
    const isReplying = replyTo === c.id;
    const hasReplies = (c.replies || []).length > 0;
    const isExpanded = expandedReplies.has(c.id);
    const avatarSize = isMobile ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-[11px] mt-0.5';
    const replyIndent = c.parentId ? 'ml-12 border-l-2 border-zinc-700 pl-3' : '';
    const isOwnComment = c.authorName === 'Vous' || c.authorName === 'Anonyme';
    const isAnonymousComment = c.authorName === 'Anonyme';
    const isVoiceComment = c.audioBlob && c.audioDuration;
    const isPlaying = playingCommentId === c.id;
    const audioUrl = c.audioBlob ? URL.createObjectURL(c.audioBlob) : null;

    const togglePlayback = () => {
      if (isPlaying) {
        setPlayingCommentId(null);
      } else {
        setPlayingCommentId(c.id);
      }
    };

    const handleAudioEnded = () => {
      setPlayingCommentId(null);
    };

    return (
      <li key={c.id} className={`flex gap-3 ${replyIndent}`}>
        {/* Avatar - klikab pou wè pwofil (si pa anonim) */}
        <button
          onClick={() => {
            if (!isAnonymousComment && c.authorName !== 'Vous') {
              // Lòt itilizatè → ouvri profil
              // Profile modal removed
            }
          }}
          className={`${avatarSize} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${!isAnonymousComment && c.authorName !== 'Vous' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          style={{ backgroundColor: c.color }}
          disabled={isAnonymousComment || c.authorName === 'Vous'}
        >
          {c.initials}
        </button>
        <div className="flex-1 min-w-0">
          {!isMobile && (
            <p className="text-[11px] font-semibold text-zinc-400 mb-1">
              {c.authorName} {isAnonymousComment && <span className="text-zinc-600 ml-1">(masqué)</span>} · <span className="font-normal">{c.ago}</span>
            </p>
          )}
          {isMobile && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{c.authorName}</span>
              {isAnonymousComment && <span className="text-[10px] text-zinc-600">(masqué)</span>}
              <span className="text-xs text-zinc-500">• {c.ago}</span>
            </div>
          )}
          
          {isVoiceComment ? (
            <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg ${!isMobile ? 'mt-2' : ''} ${resolvedTheme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
              <audio
                src={audioUrl || undefined}
                onEnded={handleAudioEnded}
                onPlay={() => setPlayingCommentId(c.id)}
                autoPlay={isPlaying}
                className="hidden"
              />
              <button
                onClick={togglePlayback}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <div className="flex-1">
                <div className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  {isPlaying ? 'Lecture en cours...' : 'Message vocal'}
                </div>
                <div className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-blue-500' : 'text-blue-500'}`}>
                  {c.audioDuration}s
                </div>
              </div>
            </div>
          ) : editingCommentId === c.id ? (
            <div className="flex gap-2 mt-2">
              <input
                autoFocus
                value={editCommentText}
                onChange={e => setEditCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEditComment(c.id)}
                maxLength={MAX_COMMENT_LENGTH}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  resolvedTheme === 'dark' 
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-400' 
                    : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={() => saveEditComment(c.id)}
                disabled={!editCommentText.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full text-xs font-medium transition-colors"
              >
                Sauvegarder
              </button>
              <button
                onClick={cancelEditComment}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-full text-xs font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <p className={`text-xs sm:text-sm leading-relaxed ${!isMobile ? `rounded-2xl rounded-tl-none px-2.5 sm:px-3.5 py-2 sm:py-2.5 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-800'}` : resolvedTheme === 'dark' ? 'text-zinc-200' : 'text-gray-800'}`}>
              {renderCommentText(c.text)}
            </p>
          )}

          {/* Like / Dislike / Reply / Report */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleCommentLike(c.id)}
              className={`flex items-center gap-1 text-xs ${c.liked ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
            >
              <span className="w-4 h-4"><ThumbUpIcon /></span>
              <span>{c.likes || 0}</span>
            </button>
            <button
              onClick={() => handleCommentDislike(c.id)}
              className={`flex items-center gap-1 text-xs ${c.disliked ? 'text-red-400' : 'text-zinc-400 hover:text-white'}`}
            >
              <span className="w-4 h-4 rotate-180"><ThumbUpIcon /></span>
            </button>
            {!c.parentId && (
              <button
                onClick={() => { setReplyTo(isReplying ? null : c.id); setReplyInput(''); }}
                className={`text-xs font-medium ${isReplying ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
              >
                Répondre
              </button>
            )}
            {hasReplies && (
              <button
                onClick={() => toggleReplies(c.id)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                {isExpanded ? 'Masquer' : 'Afficher'} {c.replies?.length} réponse{c.replies && c.replies.length > 1 ? 's' : ''}
              </button>
            )}
            {/* Report - pou tout kòmantè ki pa pwòp */}
            {!isOwnComment && (
              <button
                onClick={() => { setReportModal({ open: true, commentId: c.id }); setReportReason(''); }}
                className="text-xs text-zinc-500 hover:text-yellow-400 font-medium transition-colors"
              >
                Signaler
              </button>
            )}
            {/* Siprime - sèlman pwòp kòmantè reyèl (pa Anonyme ki pa ka verifye) */}
            {c.authorName === 'Vous' && (
              <>
                <button
                  onClick={() => startEditComment(c.id, c.text)}
                  className="text-xs text-zinc-500 hover:text-blue-400 font-medium transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => deleteComment(c.id)}
                  className="text-xs text-zinc-500 hover:text-red-400 font-medium transition-colors"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>

          {/* Reply input */}
          {isReplying && (
            <div className="flex gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">
                {isAnonymous ? '?' : 'Moi'}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  autoFocus
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendReply(c.id)}
                  placeholder={`Répondre à ${c.authorName}…`}
                  maxLength={MAX_COMMENT_LENGTH}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  onClick={() => sendReply(c.id)}
                  disabled={!replyInput.trim()}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <span className="w-3.5 h-3.5 text-white"><SendIcon /></span>
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {hasReplies && isExpanded && (
            <ul className="flex flex-col gap-3 mt-3">
              {c.replies!.map(r => renderComment(r, isMobile))}
            </ul>
          )}
        </div>
      </li>
    );
  };

  // Safety check pou asire video la valide
  if (!video || !video.id || !video.author) {
    return (
      <div className={`min-h-screen w-full ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-4`}>Vidéo non disponible</p>
          <button
            onClick={onBack}
            className={`px-4 py-2 ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} rounded-lg`}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={pageRef}
      className={`w-full ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'} pointer-events-auto ${isTabletOrBelow ? 'h-screen flex flex-col overflow-hidden' : 'h-screen overflow-y-auto'}`}
      style={!isTabletOrBelow ? { scrollbarWidth: 'thin' } : {}}
    >
      {/* Bouton retour - MOBILE: flex-shrink-0, DESKTOP: sticky */}
      <div className={`z-30 ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]/90 border-zinc-800' : 'bg-white/90 border-gray-200'} backdrop-blur-md border-b px-4 py-3 flex items-center gap-3 ${isTabletOrBelow ? 'flex-shrink-0' : 'sticky top-0'}`}>
        <button
          onClick={onBack}
          aria-label="Retour au fil d'actualité"
          className={`w-9 h-9 rounded-full flex items-center justify-center ${resolvedTheme === 'dark' ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-200'} transition-colors`}
        >
          <span className="w-5 h-5"><ArrowLeftIcon /></span>
        </button>
        {/* MOBIL: Pwofesyon otè a, DESKTOP: Pwofesyon otè a */}
        <span className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-200' : 'text-gray-900'} truncate flex-1`}>
          {video.author?.profession || 'Professionnel'}
        </span>
      </div>

      {/* MOBILE/TABLET: Premier feed - Profil utilisateur connecté */}
      {isTabletOrBelow && (
        <div className={`flex-shrink-0 p-4 border-b ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
          {/* Profil de l'utilisateur connecté */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
              {(() => {
                const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
                if (userProfile?.photo) {
                  return <img src={userProfile.photo} alt={userProfile.name} className="w-full h-full object-cover" />
                }
                return userProfile?.name?.charAt(0).toUpperCase() || 'U'
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`font-semibold text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                {(() => {
                  const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
                  return userProfile?.name || 'Utilisateur'
                })()}
              </h2>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} truncate`}>
                {(() => {
                  const userProfile = JSON.parse(localStorage.getItem('exile_user_profile') || '{}')
                  const profession = userProfile?.profession || 'Professionnel'
                  const speciality = userProfile?.speciality
                  return speciality ? `${profession} • ${speciality}` : profession
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE/TABLET: Videyo a FIXE an tèt, pa nan zòn ki defile */}
      {isTabletOrBelow && (
        <div className="flex-shrink-0">
          <MainPlayer />
        </div>
      )}

      {/* Corps principal - MOBILE/TABLET: sèlman kontni ki defile, DESKTOP: tout bagay */}
      <div
        ref={scrollRef}
        className={`w-full flex flex-col md:flex-row md:gap-6 md:p-6 md:pt-8 ${isTabletOrBelow ? 'flex-1 min-h-0 overflow-y-auto scrollbar-hide' : 'max-w-screen-xl mx-auto'}`}
      >

        {/* Colonne gauche : player + infos */}
        <div className="flex-1 min-w-0 md:max-w-3xl">

          {/* DESKTOP SELMAN: Videyo nan koulè nòmal la */}
          {!isTabletOrBelow && <MainPlayer />}

          {/* Zone kontni - MOBILE/TABLET: defile anba videyo a, DESKTOP: nòmal */}
          <div className="p-4 md:p-0 md:mt-4">
            
            {/* Commentaires - Directement sous le player vidéo */}
            <div className="mb-4">
              <p className={`text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Commentaires ({totalComments})
              </p>
              
              {/* Champ saisie */}
              <div className="flex gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-950 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-blue-400 flex-shrink-0">
                  {isAnonymous ? '?' : 'Moi'}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex gap-2">
                    <input
                      ref={commentRef}
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendComment()}
                      placeholder='Écrire un commentaire…'
                      aria-label='Écrire un commentaire'
                      maxLength={MAX_COMMENT_LENGTH}
                      className={`flex-1 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        resolvedTheme === 'dark' 
                          ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-400' 
                          : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <button
                      onClick={sendComment}
                      disabled={!commentInput.trim()}
                      aria-label='Envoyer'
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"><SendIcon /></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded accent-blue-500"
                      />
                      <span className={`text-[10px] sm:text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Anonyme</span>
                    </label>
                    <div className={`text-[10px] sm:text-[11px] ${commentInput.length > MAX_COMMENT_LENGTH * 0.9 ? 'text-red-400' : resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-500'}`}>
                      {commentInput.length}/{MAX_COMMENT_LENGTH}
                    </div>
                  </div>
                  
                  {/* Voice Comment */}
                  <VoiceComment
                    onSend={handleVoiceCommentSend}
                    maxDuration={30}
                    autoDeleteAfter={72}
                    commentId={`voice-${video.id}`}
                  />
                </div>
              </div>

              {/* Empty state */}
              {sortedComments.length === 0 && (
                <div className={`text-center py-6 sm:py-8 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                  <p className="text-xs sm:text-sm">Aucun commentaire pour le moment.</p>
                  <p className="text-[10px] sm:text-xs mt-1">Soyez le premier à commenter !</p>
                </div>
              )}

              {/* Liste commentaires */}
              <ul className="flex flex-col gap-2 sm:gap-3" role="list">
                {sortedComments.map(c => renderComment(c, isTabletOrBelow))}
              </ul>
            </div>

            {/* Titre - Tit videyo anba player (Desktop seulement) */}
            {!isTabletOrBelow && (
              <>
                <h1 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} leading-snug mb-2`}>
                  {video.title || 'Vidéo sans titre'}
                </h1>

                {/* Stats ligne - Views, date (Desktop seulement) */}
                <div className={`flex items-center gap-2 text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'} mb-3`}>
                  <span>{fmtNum(video.views || 0)} vues</span>
                  <span>•</span>
                  <span>{formatYouTubeDate(video.postedAt || '')}</span>
                </div>
              </>
            )}

            {/* Barre d'actions - Simplifiée et uniformisée */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide" role="group" aria-label="Actions vidéo">
              {/* Like */}
              <button
                onClick={handleLike}
                aria-label={liked ? "Retirer le like" : "Mettre un like"}
                aria-pressed={liked}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                  liked 
                    ? 'bg-blue-600 text-white' 
                    : resolvedTheme === 'dark' ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-white' : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-900'
                }`}
              >
                <span className="w-4 h-4"><ThumbUpIcon /></span>
                <span className="text-sm font-medium">{fmtNum(likes)}</span>
              </button>

              {/* Dislike */}
              <button 
                onClick={handleDislike}
                aria-label={disliked ? "Retirer le dislike" : "Mettre un dislike"}
                aria-pressed={disliked}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                  disliked 
                    ? 'bg-red-600 text-white' 
                    : resolvedTheme === 'dark' ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-white' : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-900'
                }`}
              >
                <span className="w-4 h-4 rotate-180"><ThumbUpIcon /></span>
              </button>

              {/* Commentaire */}
              <button
                onClick={() => setTimeout(() => commentRef.current?.focus(), 100)}
                aria-label={`Commentaires (${totalComments})`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${resolvedTheme === 'dark' ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-white' : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-900'}`}
              >
                <span className="w-4 h-4"><CommentIcon /></span>
                <span className="text-sm font-medium">{fmtNum(totalComments)}</span>
              </button>

              {/* Partager */}
              <button
                onClick={handleShare}
                aria-label="Partager la vidéo"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${resolvedTheme === 'dark' ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-white' : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-900'}`}
              >
                <span className="w-4 h-4"><ShareIcon /></span>
              </button>

              {/* Enregistrer */}
              <button
                onClick={handleSave}
                aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
                aria-pressed={saved}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                  saved 
                    ? 'bg-yellow-600 text-white' 
                    : resolvedTheme === 'dark' ? 'bg-zinc-800/50 hover:bg-zinc-700/50 text-white' : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-900'
                }`}
              >
                <span className="w-4 h-4 text-yellow-400"><HeartIcon filled={saved} /></span>
              </button>

              {/* Menu trois points */}
              <DotsMenu 
                videoId={video.id} 
                authorId={video.author?.id || ''} 
                show={show}
                saved={saved}
                onSave={handleSave}
                onShare={handleShare}
                onContact={() => setShowContactModal(true)}
              />
            </div>

            {/* Infos auteur - Compact style YouTube */}
            <div className={`flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 border-t ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`} role="group" aria-label="Informations de l'auteur">
              {/* Avatar klikab */}
              <button 
                onClick={handleProfileClick}
                onKeyDown={(e) => e.key === 'Enter' && handleProfileClick()}
                aria-label={`Voir le profil de ${video.author?.name || 'l\'auteur'}`}
                className="flex-shrink-0 hover:scale-105 transition-transform"
              >
                {video.author?.avatarUrl ? (
                  <img 
                    src={video.author.avatarUrl}
                    alt={video.author?.name || 'User'}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-300'}`}
                  />
                ) : (
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white border-2"
                    style={{ backgroundColor: video.author?.avatarColor || '#666', borderColor: resolvedTheme === 'dark' ? '#525252' : '#d4d4d4' }}
                  >
                    {video.author?.initials || '?'}
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <button 
                  onClick={handleProfileClick}
                  onKeyDown={(e) => e.key === 'Enter' && handleProfileClick()}
                  aria-label={`Voir le profil de ${video.author?.name || 'l\'auteur'}`}
                  className={`text-xs sm:text-sm font-semibold hover:text-blue-400 transition-colors text-left w-full ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                  {video.author?.name || 'Inconnu'}
                </button>
                {/* Followers */}
                <p className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{fmtNum(subscribers)} abonnés</p>
              </div>
              {/* Bouton Subscribe */}
              <button 
                onClick={handleSubscribe}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                aria-label={subscribed ? "Se désabonner" : "S'abonner"}
                aria-pressed={subscribed}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  subscribed
                    ? resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    : resolvedTheme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-white text-gray-900 hover:bg-gray-200'
                }`}
              >
                {subscribed ? 'Abonné' : "S'abonner"}
              </button>
            </div>

            {/* Description - Inline pour mobile et desktop */}
            <button
              onClick={() => setDescOpen(o => !o)}
              aria-expanded={descOpen}
              className={`w-full flex items-center justify-between py-2.5 sm:py-3 border-t text-xs sm:text-sm hover:text-white transition-colors text-left ${resolvedTheme === 'dark' ? 'border-zinc-800 text-zinc-300' : 'border-gray-200 text-gray-600'}`}
            >
              <span className="line-clamp-2 flex-1">{video.description || 'Aucune description'}</span>
              <span className={`${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} text-[10px] sm:text-xs ml-2 whitespace-nowrap`}>{descOpen ? 'Moins' : 'Plus'}</span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${descOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className={`text-xs sm:text-sm leading-relaxed pb-2.5 sm:pb-3 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>{video.description || 'Aucune description'}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-2.5 sm:pb-3">
                {(video.tags || []).map(tag => (
                  <span key={tag} className={`text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-700'}`}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* MOBILE/TABLET: Vidéos similaires */}
        {isTabletOrBelow && (
          <aside className="w-full flex-shrink-0 mt-3 sm:mt-4">
            <p className={`text-xs sm:text-sm font-semibold mb-2 sm:mb-3 px-3 sm:px-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Vidéos similaires
            </p>

            {/* MOBILE: 1 kolòn, TABLET: 2 kolòn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 w-full">
              {related.map((rv) => (
                <div
                  key={rv.id}
                  className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gray-100'} overflow-hidden group cursor-pointer text-left`}
                  aria-label={`Regarder : ${rv.title}`}
                  onClick={() => onSelect(rv)}
                >
                  {/* Miniature */}
                  <div className="relative w-full aspect-video bg-black overflow-hidden">
                    {rv.thumbnail ? (
                      <img src={rv.thumbnail} alt={rv.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="w-8 h-8 text-white/70"><PlayIcon /></span>
                      </div>
                    )}
                  </div>

                  {/* Info - Style SimpleVideoCard ultra-compact */}
                  <div className="p-2.5 sm:p-3">
                    {/* Author row - Avatar klikab */}
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      {/* Avatar ki klike pou wè pwofil */}
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white border hover:scale-105 transition-transform ${resolvedTheme === 'dark' ? 'border-zinc-600' : 'border-gray-400'}`}
                        style={{ backgroundColor: rv.author.avatarColor || '#666' }}
                      >
                        {rv.author.initials || '?'}
                      </button>

                      <div className="flex-1 min-w-0 text-left">
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold text-xs sm:text-sm truncate hover:underline text-left`}
                        >
                          {rv.author.name}
                        </button>
                        <p className={`text-[10px] sm:text-[11px] truncate ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>{rv.author.profession || ''} • {formatYouTubeDate(rv.postedAt)}</p>
                      </div>
                    </div>

                    {/* Titre + Bouton Chat */}
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                      <h3
                        className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold text-xs sm:text-sm line-clamp-2 flex-1`}
                        onClick={() => onSelect(rv)}
                      >
                        {rv.title}
                      </h3>
                      {/* BOUTON CHAT - Ouvri ContactModal */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAuthorForContact(rv.author); }}
                        className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: rv.author.avatarColor || '#666' }}
                      >
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3"><MessageCircleIcon /></span>
                        <span className="hidden sm:inline">Contacter</span>
                        <span className="sm:hidden">Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* DESKTOP: Sidebar avec vidéos similaires */}
        {!isTabletOrBelow && (
          <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 overflow-y-auto scrollbar-hide">
            <p className={`text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Vidéos similaires
            </p>

            <div className="space-y-2 sm:space-y-3">
              {related.map((rv) => (
                <div
                  key={rv.id}
                  className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] hover:bg-zinc-900' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl overflow-hidden group cursor-pointer text-left transition-colors`}
                  aria-label={`Regarder : ${rv.title}`}
                  onClick={() => onSelect(rv)}
                >
                  {/* Miniature horizontale */}
                  <div className="flex gap-2 sm:gap-3 p-2 sm:p-3">
                    <div className="relative flex-shrink-0 w-36 sm:w-40 aspect-video rounded-lg overflow-hidden">
                      {rv.thumbnail ? (
                        <img src={rv.thumbnail} alt={rv.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <span className="w-6 h-6 text-white/70"><PlayIcon /></span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1`}>
                          {rv.title}
                        </h3>
                        <p className={`text-[10px] sm:text-xs truncate mb-0.5 sm:mb-1 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                          {rv.author.name}
                        </p>
                        <p className={`text-[10px] sm:text-[11px] ${resolvedTheme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`}>
                          {rv.author.profession || ''} • {formatYouTubeDate(rv.postedAt)}
                        </p>
                      </div>

                      {/* Bouton Chat */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAuthorForContact(rv.author); }}
                        className="mt-1.5 sm:mt-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-white text-[10px] sm:text-xs font-medium flex items-center gap-0.5 sm:gap-1 hover:opacity-90 transition-opacity self-start"
                        style={{ backgroundColor: rv.author.avatarColor || '#666' }}
                      >
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5"><MessageCircleIcon /></span>
                        <span>Contacter</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Toast global */}
      {msg && (
        <div role="status" aria-live="polite"
          className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[999] text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xl whitespace-nowrap pointer-events-none ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
          {msg}
        </div>
      )}


      {/* Contact Modal - Klik sou Chat */}
      {showContactModal && video.author && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          receiver={{
            id: video.author.id,
            name: video.author.name,
            avatar: video.author.avatarUrl || null,
            profession: video.author.profession
          }}
          sender={{
            id: JSON.parse(localStorage.getItem('exile_user_profile') || '{}')?.id || 'current-user',
            name: JSON.parse(localStorage.getItem('exile_user_profile') || '{}')?.name || 'Moi',
            avatar: JSON.parse(localStorage.getItem('exile_user_profile') || '{}')?.photo || null,
            profession: JSON.parse(localStorage.getItem('exile_user_profile') || '{}')?.profession || 'Utilisateur'
          }}
        />
      )}


      {/* Contact Modal pou otè videyo similaire */}
      {selectedAuthorForContact && (
        <ContactModal
          isOpen={!!selectedAuthorForContact}
          onClose={() => setSelectedAuthorForContact(null)}
          receiver={{
            id: selectedAuthorForContact.id,
            name: selectedAuthorForContact.name,
            avatar: selectedAuthorForContact.avatarUrl || null,
            profession: selectedAuthorForContact.profession
          }}
          sender={{
            id: JSON.parse(localStorage.getItem('exile_user_profile') || '{}')?.id || 'current-user',
            name: JSON.parse(localStorage.getItem('exile_user_profile') || '{}')?.name || 'Moi',
            avatar: JSON.parse(localStorage.getItem('exile_user_profile') || '{}')?.photo || null,
            profession: JSON.parse(localStorage.getItem('exile_user_profile') || '{}')?.profession || 'Utilisateur'
          }}
        />
      )}

      {/* Report Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setReportModal({ open: false, commentId: null })}>
          <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 w-[90%] max-w-sm mx-4 shadow-2xl border`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-sm sm:text-lg font-semibold mb-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Signaler ce commentaire</h3>
            <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Pourquoi signalez-vous ce commentaire ?</p>
            <div className="flex flex-col gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {['Contenu inapproprié', 'Harcèlement', 'Spam', 'Fausse information', 'Autre'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-colors ${
                    reportReason === reason 
                      ? 'bg-blue-600 text-white' 
                      : resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setReportModal({ open: false, commentId: null })}
                className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Annuler
              </button>
              <button
                onClick={handleReportComment}
                disabled={!reportReason}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 text-xs sm:text-sm font-medium transition-colors"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
