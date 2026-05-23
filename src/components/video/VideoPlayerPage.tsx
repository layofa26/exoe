import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Video, Comment } from '../../types/video';
import { useIsTabletOrBelow } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { fmtNum } from '../../utils/format';
import { DotsMenu } from './DotsMenu';
import { ContactModal } from '../modals/ContactModal';
import { VoiceComment } from '../common/VoiceComment';
import { PlayIcon, HeartIcon, CommentIcon, ShareIcon, ArrowLeftIcon, SendIcon, ChevronRightIcon, ThumbUpIcon, MessageCircleIcon, XIcon, PauseIcon } from '../icons/VideoIcons';

interface VideoPlayerPageProps {
  video: Video;
  related: Video[];
  onBack: () => void;
  onSelect: (v: Video) => void;
}

const COMMENT_COLORS = ['#1d4ed8', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export function VideoPlayerPage({ video, related, onBack, onSelect }: VideoPlayerPageProps) {
  const isTabletOrBelow = useIsTabletOrBelow();
  const { msg, show } = useToast();
  const navigate = useNavigate();

  // États pour les interactions
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(video.likes || 0);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribers, setSubscribers] = useState(video.author?.followers || 0);
  const [descOpen, setDescOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(!isTabletOrBelow);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>(video.comments || []);
  const [colorIdx, setColorIdx] = useState(0);
  const [commentSort, setCommentSort] = useState<'popular' | 'recent'>('popular');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [voiceCommentAccess, setVoiceCommentAccess] = useState(true);
  const [playingCommentId, setPlayingCommentId] = useState<string | null>(null);
  
  // États pour les modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [selectedAuthorForContact, setSelectedAuthorForContact] = useState<typeof video.author | null>(null);
  
  const commentRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // États nouvo
  const [heartAnimation, setHeartAnimation] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reportModal, setReportModal] = useState<{ open: boolean; commentId: string | null }>({ open: false, commentId: null });
  const [reportReason, setReportReason] = useState('');

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

  // Save/restore videyo progress
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const current = e.currentTarget.currentTime;
    const duration = e.currentTarget.duration;
    if (duration && current > 0 && current < duration - 2) {
      localStorage.setItem(`exile_video_progress_${video.id}`, String(current));
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const saved = localStorage.getItem(`exile_video_progress_${video.id}`);
    if (saved) {
      const time = parseFloat(saved);
      if (time > 0) {
        e.currentTarget.currentTime = time;
      }
    }
  };

  // Komposan videyo a (itilize nan 2 kote pou mobil/desktop)
  const VideoPlayer = () => (
    <div 
      ref={playerRef}
      onClick={handleVideoTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full aspect-video bg-gradient-to-br ${video.gradient || 'from-zinc-700 to-zinc-900'} overflow-hidden shadow-xl select-none`}
    >
      {video.videoUrl ? (
        <video 
          ref={videoRef}
          src={video.videoUrl}
          controls
          className="absolute inset-0 w-full h-full object-cover"
          poster={video.thumbnail}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        >
          Navigatè ou a pa sipòte baliz vidéo a.
        </video>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/60 select-none">
            <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center mx-auto mb-3">
              <span className="w-8 h-8 text-white/80"><PlayIcon /></span>
            </div>
            <p className="text-sm font-medium">{video.title || 'Vidéo'}</p>
            <p className="text-xs mt-1 opacity-60">Lecture simulée — {video.duration || '0:00'}</p>
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

  // Charger les états depuis localStorage
  useEffect(() => {
    pageRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setDescOpen(false);
    setComments(video.comments || []);
    setCommentsOpen(!isTabletOrBelow);
    
    // Charger l'état "like" de cette vidéo
    const likedVideos = JSON.parse(localStorage.getItem('exile_liked_videos') || '[]');
    setLiked(likedVideos.includes(video.id));
    setLikes((video.likes || 0) + (likedVideos.includes(video.id) ? 1 : 0));
    
    // Charger l'état "dislike"
    const dislikedVideos = JSON.parse(localStorage.getItem('exile_disliked_videos') || '[]');
    setDisliked(dislikedVideos.includes(video.id));
    
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
  }, [video.id, video.author?.id, isTabletOrBelow]);

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

  // Fonctions d'interaction
  const handleLike = () => {
    const likedVideos = JSON.parse(localStorage.getItem('exile_liked_videos') || '[]');
    const dislikedVideos = JSON.parse(localStorage.getItem('exile_disliked_videos') || '[]');
    
    if (liked) {
      // Retirer le like
      const updated = likedVideos.filter((id: string) => id !== video.id);
      localStorage.setItem('exile_liked_videos', JSON.stringify(updated));
      setLiked(false);
      setLikes(l => l - 1);
      show('Like retiré');
    } else {
      // Ajouter le like et retirer dislike si présent
      const updatedLiked = [...likedVideos, video.id];
      localStorage.setItem('exile_liked_videos', JSON.stringify(updatedLiked));
      
      if (disliked) {
        const updatedDisliked = dislikedVideos.filter((id: string) => id !== video.id);
        localStorage.setItem('exile_disliked_videos', JSON.stringify(updatedDisliked));
        setDisliked(false);
      }
      
      setLiked(true);
      setLikes(l => l + 1);
      show('Vous aimez 👍');
    }
  };

  const handleDislike = () => {
    const likedVideos = JSON.parse(localStorage.getItem('exile_liked_videos') || '[]');
    const dislikedVideos = JSON.parse(localStorage.getItem('exile_disliked_videos') || '[]');
    
    if (disliked) {
      // Retirer le dislike
      const updated = dislikedVideos.filter((id: string) => id !== video.id);
      localStorage.setItem('exile_disliked_videos', JSON.stringify(updated));
      setDisliked(false);
      show('Dislike retiré');
    } else {
      // Ajouter le dislike et retirer like si présent
      const updatedDisliked = [...dislikedVideos, video.id];
      localStorage.setItem('exile_disliked_videos', JSON.stringify(updatedDisliked));
      
      if (liked) {
        const updatedLiked = likedVideos.filter((id: string) => id !== video.id);
        localStorage.setItem('exile_liked_videos', JSON.stringify(updatedLiked));
        setLiked(false);
        setLikes(l => l - 1);
      }
      
      setDisliked(true);
      show('Dislike ajouté 👎');
    }
  };

  const handleSubscribe = () => {
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
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Regardez cette vidéo de ${video.author?.name}`,
        url: window.location.href
      }).catch(() => {
        // Fallback
        navigator.clipboard.writeText(window.location.href);
        show('Lien copié dans le presse-papiers 🔗');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      show('Lien copié dans le presse-papiers 🔗');
    }
  };

  const handleProfileClick = () => {
    // Vérifier si c'est le profil de l'utilisateur connecté
    const userProfile = JSON.parse(localStorage.getItem('exile_profile') || '{}');
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

  const sendComment = () => {
    const text = commentInput.trim();
    if (!text) return;
    if (text.length > MAX_COMMENT_LENGTH) { show(`Max ${MAX_COMMENT_LENGTH} caractères`); return; }
    const authorLabel = isAnonymous ? 'Anonyme' : 'Vous';
    const initialsLabel = isAnonymous ? '?' : 'Moi';
    setComments(prev => [...prev, {
      id: `c-${Date.now()}`, authorName: authorLabel, initials: initialsLabel,
      color: COMMENT_COLORS[colorIdx % COMMENT_COLORS.length], text, ago: "À l'instant",
      likes: 0, liked: false, disliked: false, replies: [], parentId: null,
    }]);
    setCommentInput(''); setColorIdx(i => i + 1);
    show(isAnonymous ? 'Commentaire anonyme publié ✓' : 'Commentaire publié ✓');
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
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      show(`Saut à ${timestamp} ⏱`);
    }
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
            <div className={`flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${!isMobile ? 'mt-2' : ''}`}>
              <audio
                src={audioUrl}
                onEnded={handleAudioEnded}
                onPlay={() => setPlayingCommentId(c.id)}
                autoPlay={isPlaying}
                className="hidden"
              />
              <button
                onClick={togglePlayback}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {isPlaying ? 'Lecture en cours...' : 'Message vocal'}
                </div>
                <div className="text-xs text-blue-500 dark:text-blue-500">
                  {c.audioDuration}s
                </div>
              </div>
            </div>
          ) : (
            <p className={`text-sm text-zinc-200 leading-relaxed ${!isMobile ? 'bg-zinc-800 rounded-2xl rounded-tl-none px-3.5 py-2.5' : ''}`}>
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
              <button
                onClick={() => deleteComment(c.id)}
                className="text-xs text-zinc-500 hover:text-red-400 font-medium transition-colors"
              >
                Supprimer
              </button>
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
      <div className="min-h-screen w-full bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Vidéo non disponible</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
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
      className={`w-full bg-[#0f0f0f] pointer-events-auto ${isTabletOrBelow ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen overflow-y-auto'}`}
      style={!isTabletOrBelow ? { scrollbarWidth: 'thin' } : {}}
    >
      {/* Bouton retour - MOBILE: flex-shrink-0, DESKTOP: sticky */}
      <div className={`z-30 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center gap-3 ${isTabletOrBelow ? 'flex-shrink-0' : 'sticky top-0'}`}>
        <button
          onClick={onBack}
          aria-label="Retour au fil d'actualité"
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="w-5 h-5"><ArrowLeftIcon /></span>
        </button>
        {/* MOBIL: Pwofesyon otè a, DESKTOP: Tit videyo */}
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate flex-1">
          {isTabletOrBelow ? (video.author?.profession || 'Professionnel') : (video.title || 'Vidéo sans titre')}
        </span>
      </div>

      {/* MOBILE/TABLET: Videyo a FIXE an tèt, pa nan zòn ki defile */}
      {isTabletOrBelow && (
        <div className="flex-shrink-0">
          <VideoPlayer />
        </div>
      )}

      {/* Corps principal - MOBILE/TABLET: sèlman kontni ki defile, DESKTOP: tout bagay */}
      <div
        ref={scrollRef}
        className={`w-full flex flex-col md:flex-row md:gap-6 md:p-6 md:pt-8 ${isTabletOrBelow ? 'flex-1 min-h-0 overflow-y-auto scrollbar-hide' : 'max-w-screen-xl mx-auto'}`}
      >

        {/* Colonne gauche : player + infos */}
        <div className="flex-1 min-w-0">

          {/* DESKTOP SELMAN: Videyo nan koulè nòmal la */}
          {!isTabletOrBelow && <VideoPlayer />}

          {/* Zone kontni - MOBILE/TABLET: defile anba videyo a, DESKTOP: nòmal */}
          <div className="p-4 md:p-0 md:mt-4">
            
            {/* Titre - Tit videyo anba player */}
            <h1 className="text-lg font-bold text-white leading-snug mb-2">
              {video.title || 'Vidéo sans titre'}
            </h1>

            {/* Stats ligne - Views, date */}
            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
              <span>{fmtNum(video.views || 0)} vues</span>
              <span>•</span>
              <span>il y a {video.postedAt || ''}</span>
            </div>

            {/* Barre d'actions - Style YouTube mobile horizontal */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {/* Like */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  liked 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-white'
                }`}
              >
                <span className="w-5 h-5"><ThumbUpIcon /></span>
                <span className="text-sm font-medium">{fmtNum(likes)}</span>
              </button>

              {/* Dislike */}
              <button 
                onClick={handleDislike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  disliked 
                    ? 'bg-red-600 text-white' 
                    : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-white'
                }`}
              >
                <span className="w-5 h-5 rotate-180"><ThumbUpIcon /></span>
              </button>

              {/* Commentaire */}
              <button
                onClick={() => isTabletOrBelow ? setCommentsOpen(true) : setTimeout(() => commentRef.current?.focus(), 100)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-white"
              >
                <span className="w-5 h-5"><CommentIcon /></span>
                <span className="text-sm font-medium">{fmtNum(totalComments)}</span>
              </button>

              {/* Pataje - Mobil/Tablet */}
              {isTabletOrBelow && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-white"
                >
                  <span className="w-5 h-5"><ShareIcon /></span>
                </button>
              )}

              {/* Chat - Mobil/Tablet */}
              {isTabletOrBelow && (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors text-white"
                >
                  <span className="w-4 h-4"><MessageCircleIcon /></span>
                  <span className="text-sm">Chat</span>
                </button>
              )}

              {/* Desktop: Save & More */}
              {!isTabletOrBelow && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      saved 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-white'
                    }`}
                  >
                    <span className="w-5 h-5 text-yellow-400"><HeartIcon filled={saved} /></span>
                    <span className="text-sm">{saved ? 'Enregistré' : 'Enregistrer'}</span>
                  </button>
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
              )}

            </div>

            {/* Infos auteur - Compact style YouTube */}
            <div className="flex items-center gap-3 py-3 border-t border-zinc-800">
              {/* Avatar klikab */}
              <button 
                onClick={handleProfileClick}
                className="flex-shrink-0 hover:scale-105 transition-transform"
              >
                {video.author?.avatarUrl ? (
                  <img 
                    src={video.author.avatarUrl}
                    alt={video.author?.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-zinc-700"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-zinc-700"
                    style={{ backgroundColor: video.author?.avatarColor || '#666' }}
                  >
                    {video.author?.initials || '?'}
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <button 
                  onClick={handleProfileClick}
                  className="text-sm font-semibold text-white hover:text-blue-400 transition-colors text-left w-full"
                >
                  {video.author?.name || 'Inconnu'}
                </button>
                {/* Followers */}
                <p className="text-xs text-zinc-400">{fmtNum(subscribers)} abonnés</p>
              </div>
              {/* Bouton Subscribe */}
              <button 
                onClick={handleSubscribe}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  subscribed 
                    ? 'bg-zinc-700 text-white hover:bg-zinc-600' 
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {subscribed ? 'Abonné' : "S'abonner"}
              </button>
            </div>

            {/* Description - bouton ki ouvri bottom sheet */}
            {isTabletOrBelow ? (
              <button
                onClick={() => setDescModalOpen(true)}
                className="w-full flex items-center justify-between py-3 border-t border-zinc-800 text-sm text-zinc-300 hover:text-white transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs uppercase font-medium">Description</span>
                </span>
                <span className="text-zinc-500 text-xs ml-2 whitespace-nowrap">Plus</span>
              </button>
            ) : (
              /* Desktop: Description deroulan */
              <>
                <button
                  onClick={() => setDescOpen(o => !o)}
                  aria-expanded={descOpen}
                  className="w-full flex items-center justify-between py-3 border-t border-zinc-800 text-sm text-zinc-300 hover:text-white transition-colors text-left"
                >
                  <span className="line-clamp-2 flex-1">{video.description || 'Aucune description'}</span>
                  <span className="text-zinc-500 text-xs ml-2 whitespace-nowrap">{descOpen ? 'Moins' : 'Plus'}</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${descOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-zinc-300 leading-relaxed pb-3">{video.description || 'Aucune description'}</p>
                  <div className="flex flex-wrap gap-2 pb-3">
                    {(video.tags || []).map(tag => (
                      <span key={tag} className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bouton Commentaires - YouTube style */}
          {isTabletOrBelow && (
            <button
              onClick={() => setCommentsOpen(true)}
              className="w-full flex items-center justify-between py-3 border-t border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Commentaires</span>
                <span className="text-sm text-zinc-500">{totalComments}</span>
              </div>
              <span className="w-5 h-5 text-zinc-400"><ChevronRightIcon /></span>
            </button>
          )}

          {/* Desktop: Kòmantè deroulan */}
          {!isTabletOrBelow && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-white mb-3">
                Commentaires ({totalComments})
              </p>
              
              {/* Champ saisie */}
              <div className="flex gap-2 mb-4">
                <div className="w-9 h-9 rounded-full bg-blue-950 flex items-center justify-center text-[11px] font-bold text-blue-400 flex-shrink-0">
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
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      onClick={sendComment}
                      disabled={!commentInput.trim()}
                      aria-label='Envoyer'
                      className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <span className="w-4 h-4 text-white"><SendIcon /></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-blue-500"
                      />
                      <span className="text-[11px] text-zinc-400">Anonyme</span>
                    </label>
                    <div className={`text-[11px] ${commentInput.length > MAX_COMMENT_LENGTH * 0.9 ? 'text-red-400' : 'text-zinc-600'}`}>
                      {commentInput.length}/{MAX_COMMENT_LENGTH}
                    </div>
                  </div>
                  
                  {/* Voice Comment */}
                  <VoiceComment
                    onSend={handleVoiceCommentSend}
                    maxDuration={30}
                    autoDeleteAfter={72}
                    accessGranted={voiceCommentAccess}
                    commentId={`voice-${video.id}`}
                  />
                </div>
              </div>

              {/* Empty state */}
              {sortedComments.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <p className="text-sm">Aucun commentaire pour le moment.</p>
                  <p className="text-xs mt-1">Soyez le premier à commenter !</p>
                </div>
              )}

              {/* Liste commentaires */}
              <ul className="flex flex-col gap-3" role="list">
                {sortedComments.map(c => renderComment(c, false))}
              </ul>
            </div>
          )}

        </div>

        {/* MOBILE/TABLET: Paj Kòmantè monte pi wo - Bottom Sheet Style */}
        {isTabletOrBelow && commentsOpen && (
          <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0f0f0f] rounded-t-2xl shadow-2xl flex flex-col" style={{ top: '32%' }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-12 h-1 bg-zinc-700 rounded-full"></div>
            </div>

            {/* Header paj kòmantè */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <button
                onClick={() => setCommentsOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <span className="w-6 h-6"><XIcon /></span>
              </button>
              <span className="text-lg font-semibold text-white">Commentaires</span>
              <span className="ml-2 px-2 py-0.5 bg-zinc-800 rounded-full text-sm text-zinc-400">{totalComments}</span>
            </div>

            {/* Filtres kòmantè */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <button
                onClick={() => setCommentSort('popular')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  commentSort === 'popular'
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Les plus populaires
              </button>
              <button
                onClick={() => setCommentSort('recent')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  commentSort === 'recent'
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Les plus récents
              </button>
            </div>

            {/* Kontni kòmantè — DEFILAB */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4">
              {/* Champ saisie */}
              <div className="flex gap-2 mb-4 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-blue-950 flex items-center justify-center text-[11px] font-bold text-blue-400 flex-shrink-0">
                  {isAnonymous ? '?' : 'Moi'}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex gap-2">
                    <input
                      ref={commentRef}
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendComment()}
                      placeholder='Ajouter un commentaire…'
                      aria-label='Ajouter un commentaire'
                      maxLength={MAX_COMMENT_LENGTH}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      onClick={sendComment}
                      disabled={!commentInput.trim()}
                      aria-label='Envoyer'
                      className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <span className="w-4 h-4 text-white"><SendIcon /></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-blue-500"
                      />
                      <span className="text-[11px] text-zinc-400">Anonyme</span>
                    </label>
                    <div className={`text-[11px] ${commentInput.length > MAX_COMMENT_LENGTH * 0.9 ? 'text-red-400' : 'text-zinc-600'}`}>
                      {commentInput.length}/{MAX_COMMENT_LENGTH}
                    </div>
                  </div>
                  
                  {/* Voice Comment */}
                  <VoiceComment
                    onSend={handleVoiceCommentSend}
                    maxDuration={30}
                    autoDeleteAfter={72}
                    accessGranted={voiceCommentAccess}
                    commentId={`voice-${video.id}`}
                  />
                </div>
              </div>

              {/* Empty state */}
              {sortedComments.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <p className="text-sm">Aucun commentaire pour le moment.</p>
                  <p className="text-xs mt-1">Soyez le premier à commenter !</p>
                </div>
              )}

              {/* Liste commentaires */}
              <ul className="flex flex-col gap-4 pb-4" role="list">
                {sortedComments.map(c => renderComment(c, true))}
              </ul>
            </div>
          </div>
        )}

        {/* MOBILE/TABLET: Bottom Sheet Description */}
        {isTabletOrBelow && descModalOpen && (
          <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0f0f0f] rounded-t-2xl shadow-2xl" style={{ top: '25%' }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-zinc-700 rounded-full"></div>
            </div>
            
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 sticky top-0 bg-[#0f0f0f] z-10">
              <button
                onClick={() => setDescModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <span className="w-6 h-6"><XIcon /></span>
              </button>
              <span className="text-lg font-semibold text-white">Description</span>
            </div>
            
            {/* Kontni description */}
            <div className="p-4 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(75vh - 120px)' }}>
              <h1 className="text-lg font-bold text-white mb-2">{video.title}</h1>
              
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm text-zinc-400 mb-4">
                <span>{fmtNum(video.views || 0)} vues</span>
                <span>•</span>
                <span>{video.postedAt}</span>
              </div>
              
              {/* Description text */}
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap mb-4">
                {video.description || 'Aucune description'}
              </p>
              
              {/* Tags */}
              {(video.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(video.tags || []).map(tag => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* MOBILE/TABLET: Vidéos similaires - sèlman lè kòmantè pa louvri */}
        {isTabletOrBelow && !commentsOpen && (
          <aside className="w-full flex-shrink-0 mt-4">
            <p className="text-sm font-semibold text-white mb-3 px-4">
              Vidéos similaires
            </p>
            
            {/* MOBILE: 1 kolòn, TABLET: 2 kolòn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {related.map(rv => (
                <div
                  key={rv.id}
                  className="bg-[#0f0f0f] rounded-xl overflow-hidden group cursor-pointer text-left"
                  aria-label={`Regarder : ${rv.title}`}
                >
                  {/* Miniature - Style SimpleVideoCard */}
                  <div 
                    className={`relative aspect-video bg-gradient-to-br ${rv.gradient} overflow-hidden`}
                    onClick={() => onSelect(rv)}
                  >
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                    
                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/20">
                        <span className="w-5 h-5 text-white"><PlayIcon /></span>
                      </div>
                    </div>
                    
                    {/* Duration */}
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {rv.duration}
                    </span>
                  </div>
                  
                  {/* Info - Style SimpleVideoCard ultra-compact */}
                  <div className="p-3">
                    {/* Author row - Avatar klikab */}
                    <div className="flex items-center gap-2 mb-2">
                      {/* Avatar ki klike pou wè pwofil */}
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white border border-zinc-600 hover:scale-105 transition-transform"
                        style={{ backgroundColor: rv.author.avatarColor || '#666' }}
                      >
                        {rv.author.initials || '?'}
                      </button>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="text-white font-semibold text-sm truncate hover:underline text-left"
                        >
                          {rv.author.name}
                        </button>
                        <p className="text-zinc-500 text-[11px] truncate">{rv.author.profession || ''} • {rv.postedAt}</p>
                      </div>
                    </div>
                    
                    {/* Titre + Bouton Chat */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 
                        className="text-white font-semibold text-sm line-clamp-2 flex-1"
                        onClick={() => onSelect(rv)}
                      >
                        {rv.title}
                      </h3>
                      {/* BOUTON CHAT - Ouvri ContactModal */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAuthorForContact(rv.author); }}
                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: rv.author.avatarColor || '#666' }}
                      >
                        <span className="w-3 h-3"><MessageCircleIcon /></span>
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
      </div>

      {/* Toast global */}
      {msg && (
        <div role="status" aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-xl whitespace-nowrap pointer-events-none">
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
            id: JSON.parse(localStorage.getItem('exile_profile') || '{}')?.id || 'current-user',
            name: JSON.parse(localStorage.getItem('exile_profile') || '{}')?.name || 'Moi',
            avatar: JSON.parse(localStorage.getItem('exile_profile') || '{}')?.avatar || null,
            profession: JSON.parse(localStorage.getItem('exile_profile') || '{}')?.profession || 'Utilisateur'
          }}
          dailyRequestCount={0}
          onSendRequest={(message, category) => {
            console.log('Message:', message, 'Category:', category);
            show('Message envoyé !');
            return { success: true };
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
            id: JSON.parse(localStorage.getItem('exile_profile') || '{}')?.id || 'current-user',
            name: JSON.parse(localStorage.getItem('exile_profile') || '{}')?.name || 'Moi',
            avatar: JSON.parse(localStorage.getItem('exile_profile') || '{}')?.avatar || null,
            profession: JSON.parse(localStorage.getItem('exile_profile') || '{}')?.profession || 'Utilisateur'
          }}
          dailyRequestCount={0}
          onSendRequest={(message, category) => {
            console.log('Message:', message, 'Category:', category);
            show('Message envoyé !');
            return { success: true };
          }}
        />
      )}

      {/* Report Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setReportModal({ open: false, commentId: null })}>
          <div className="bg-zinc-900 rounded-2xl p-6 w-[90%] max-w-sm mx-4 shadow-2xl border border-zinc-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-1">Signaler ce commentaire</h3>
            <p className="text-sm text-zinc-400 mb-4">Pourquoi signalez-vous ce commentaire ?</p>
            <div className="flex flex-col gap-2 mb-4">
              {['Contenu inapproprié', 'Harcèlement', 'Spam', 'Fausse information', 'Autre'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    reportReason === reason ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReportModal({ open: false, commentId: null })}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReportComment}
                disabled={!reportReason}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 text-sm font-medium transition-colors"
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
