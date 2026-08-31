import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, ThumbsUp, ThumbsDown, Bookmark,
  Share2, MessageCircle, ArrowLeft, Send, X,
  Heart
} from 'lucide-react';
import type { Video, Comment } from '../../types/video';
import { useIsTabletOrBelow } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { fmtNum, formatYouTubeDate } from '../../utils/format';
import { DotsMenu } from './DotsMenu';
import { ContactModal } from '../modals/ContactModal';
import { VoiceComment } from '../common/VoiceComment';
import { useAccueilAlgo } from '../../algoPro/signals/useAccueilAlgo';
import { useSubsAlgo } from '../../algoPro/signals/useSubsAlgo';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { VideoPlayer, guessVideoMimeType, toPlayableMimeType } from './VideoPlayer';
import { videoApi, resolveMediaUrl, cleanUsername } from '../../services/videoApi';
import { VideoPoster } from './VideoPoster';
import { FeedVideoCard } from './FeedVideoCard';
import { useVideoInteractions } from '../../hooks/useVideoInteractions';
import { playbackPositionStore } from '../../utils/playbackPositionStore';

interface VideoPlayerPageProps {
  video: Video;
  related: Video[];
  onBack: () => void;
  onSelect: (v: Video) => void;
}

const COMMENT_COLORS = ['#1d4ed8', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
const MAX_COMMENT_LENGTH = 1000;

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

  const contactReceiver = selectedAuthorForContact || (showContactModal ? video.author : null);

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

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/pro/video/${video.id}`;
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Découvrez cette vidéo sur EXILE`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      show('Lien copié dans le presse-papiers !');
    }
  };

  // Envoi de commentaires
  const sendComment = async () => {
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

  const handleVoiceCommentSend = async (blob: Blob, duration: number) => {
    const fakeAudioUrl = URL.createObjectURL(blob);
    const newComment: Comment = {
      id: `voice-${Date.now()}`,
      authorName: isAnonymous ? 'Anonyme' : (storedProfile?.name || 'Moi'),
      initials: isAnonymous ? '?' : ((storedProfile?.name?.charAt(0) || 'M').toUpperCase()),
      color: '#FF6B00',
      text: '',
      ago: 'À l\'instant',
      likes: 0,
      liked: false,
      disliked: false,
      replies: [],
      audioUrl: fakeAudioUrl,
      audioDuration: duration,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString()
    };
    setComments(prev => [newComment, ...prev]);
    show('Message vocal publié (72h)');
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

  const renderCommentForm = (isMobilePanel: boolean = false) => (
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
        <VoiceComment
          onSend={handleVoiceCommentSend}
          maxDuration={30}
          autoDeleteAfter={72}
          commentId={`voice-${video.id}`}
        />
      </div>
    </div>
  );

  return (
    <div
      ref={pageRef}
      className={`w-full min-h-screen ${isDark ? 'bg-[#0f0f0f] text-white' : 'bg-gray-50 text-gray-900'} pointer-events-auto flex flex-col`}
    >
      {/* ── 1. HEADER TRÈS COMPACT (Hauteur optimisée ~36px) ── */}
      <div className={`sticky top-0 z-30 ${isDark ? 'bg-[#0f0f0f]/95 border-zinc-800/80' : 'bg-white/95 border-gray-200'} backdrop-blur-md border-b px-2 py-1 flex items-center gap-2 flex-shrink-0`}>
        <button
          onClick={handleBackNavigation}
          aria-label="Retour au fil d'actualité"
          className={`p-1 rounded-full transition-colors ${isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-semibold truncate block ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>
            {video.author?.profession || video.author?.name || 'Publication Vidéo'}
          </span>
        </div>
      </div>

      {/* ── MAIN CONTAINER ULTRA-COMPACT SANS ESPACES MORTS ── */}
      <div
        ref={scrollRef}
        className="w-full max-w-[1720px] mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-2 lg:py-4 grid grid-cols-1 xl:grid-cols-12 gap-0 sm:gap-4 lg:gap-6"
      >
        {/* ── COLONNE GAUCHE : FLUX VIDÉO DIRECT ── */}
        <div className="xl:col-span-8 2xl:col-span-8 flex flex-col min-w-0">

          {/* ── 2. VIDÉO DIRECTEMENT SOUS LE HEADER (PLEINE LARGEUR BORD-À-BORD SUR MOBILE, RESPONSIVE ET NON STICKY SUR DESKTOP) ── */}
          <div
            ref={playerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative w-full aspect-video max-h-[75vh] xl:max-h-[580px] bg-black rounded-none sm:rounded-2xl overflow-hidden shadow-xl select-none flex items-center justify-center sticky top-[37px] xl:static z-20"
          >
            {video.videoUrl ? (
              <VideoPlayer
                src={video.videoUrl}
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
              <div className="absolute inset-0 flex items-center justify-center">
                <Play size={28} className="text-white/80" />
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

            {/* ── 3. TITRE (Strictement 1 ligne) + DESCRIPTION (2ème ligne) ── */}
            <div className="flex flex-col gap-0.5">
              <h1 className={`text-[13px] sm:text-base font-bold leading-snug truncate ${isDark ? 'text-white' : 'text-gray-900'}`} title={video.title}>
                {video.title || 'Vidéo sans titre'}
              </h1>
              {video.description && (
                <p className={`text-[11px] sm:text-xs truncate leading-normal ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {video.description}
                </p>
              )}
            </div>

            {/* ── 4. STATISTIQUES (Vues + Date sur une seule ligne) ── */}
            <div className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              <span>{fmtNum(viewsCount || video.views || 0)} vues</span>
              <span>•</span>
              <span>{formatYouTubeDate(video.postedAt || video.createdAt || '')}</span>
            </div>

            {/* ── 5. CRÉATEUR (Avatar + Nom + Abonnés + Bouton S'abonner) ── */}
            <div className="flex items-center justify-between gap-2 py-0.5">
              <div
                className="flex items-center gap-2 min-w-0 cursor-pointer"
                onClick={() => navigate(`/pro/profile/${video.author.id}`)}
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm"
                  style={{ backgroundColor: video.author?.avatarColor || '#FF6B00' }}
                >
                  {video.author?.avatarUrl && (typeof navigator === 'undefined' || navigator.onLine) ? (
                    <img
                      src={video.author.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-[10px] sm:text-xs">{video.author?.initials || 'U'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className={`text-[12px] sm:text-xs font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    @{cleanUsername(video.author?.username || video.author?.name)}
                  </h3>
                  <p className={`text-[9px] sm:text-[10px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {fmtNum(subscribersCount)} abonnés
                  </p>
                </div>
              </div>

              {/* Bouton S'abonner Ultra-Lisible */}
              {!isOwnVideo && (
                <button
                  onClick={handleToggleSubscribe}
                  disabled={isPending}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-md ${
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

            {/* ── 6. ACTIONS (Like, Dislike, Partager, Favori, Contacter, Menu) ── */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 border-y border-zinc-800/40 my-0.5">
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
                <div className="w-[1px] h-3 bg-zinc-700/50" />
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

              {/* Partager */}
              <button
                onClick={handleShare}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium flex-shrink-0 ${
                  isDark ? 'bg-zinc-800/80 hover:bg-zinc-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                <Share2 size={12} />
                <span>Partager</span>
              </button>

              {/* Favoris */}
              <button
                onClick={handleFavorite}
                disabled={isPending}
                className={`p-1.5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
                  isFavorite ? 'bg-yellow-500/20 text-yellow-400' : isDark ? 'bg-zinc-800/80 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <Bookmark size={12} className={isFavorite ? 'fill-yellow-400' : ''} />
              </button>

              {/* Contacter */}
              <button
                onClick={() => setShowContactModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FF6B00] hover:bg-[#e05e00] text-white shadow-sm flex-shrink-0"
              >
                <MessageCircle size={12} />
                <span>Contacter</span>
              </button>

              <DotsMenu
                videoId={video.id}
                authorId={video.author?.id || ''}
                show={show}
                saved={isFavorite}
                onSave={handleFavorite}
                onShare={handleShare}
                onContact={() => setShowContactModal(true)}
              />
            </div>

            {/* ── 7. DESCRIPTION COMPACTE (S'ouvre en panneau sur mobile) ── */}
            <div
              onClick={() => isTabletOrBelow ? setMobileDescOpen(true) : setDescOpen(o => !o)}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'bg-zinc-900/90 hover:bg-zinc-800/80' : 'bg-gray-100 hover:bg-gray-200/70'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold mb-0.5">
                <span>Description</span>
                <span className="text-[#FF6B00] text-[10px] font-bold">{isTabletOrBelow ? 'Ouvrir' : descOpen ? 'Afficher moins' : 'Afficher plus'}</span>
              </div>
              <p className={`text-[11px] sm:text-xs leading-relaxed ${descOpen ? '' : 'line-clamp-2'} ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                {video.description || 'Aucune description fournie.'}
              </p>
            </div>

            {/* ── 8. COMMENTAIRES (Immédiatement après la description) ── */}
            {isTabletOrBelow ? (
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

            {/* ── 9. VIDÉOS SIMILAIRES SUR MOBILE & TABLETTE ── */}
            {isTabletOrBelow && related.length > 0 && (
              <div className="mt-3 flex flex-col pb-16 -mx-2.5 sm:mx-0">
                <h2 className={`text-[13px] sm:text-sm font-bold px-3 sm:px-0 py-1.5 ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>
                  Vidéos similaires
                </h2>
                {/* Mobile: 1 colonne pleine largeur; Tablette: 2 colonnes par ligne (sm:grid sm:grid-cols-2 sm:gap-3) */}
                <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-3">
                  {related.map((rv) => (
                    <FeedVideoCard
                      key={`rel-${rv.id}`}
                      video={rv}
                      onClick={() => handleSelectRelated(rv)}
                      onContact={() => {
                        setSelectedAuthorForContact(rv.author);
                        setShowContactModal(true);
                      }}
                      onProfileClick={(authorId) => navigate(`/pro/profile/${authorId}`)}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ── COLONNE DROITE SUR DESKTOP (Vidéos Similaires) ── */}
        {!isTabletOrBelow && (
          <aside className="xl:col-span-4 2xl:col-span-4 flex flex-col gap-3 min-w-0 pb-12 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto pr-1">
            <p className={`text-sm font-bold px-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Vidéos similaires
            </p>

            <div className="flex flex-col gap-2.5">
              {related.map((rv) => (
                <div
                  key={rv.id}
                  className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                    isDark ? 'bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/50' : 'bg-white hover:bg-gray-100 border border-gray-200 shadow-sm'
                  }`}
                  onClick={() => handleSelectRelated(rv)}
                >
                  <div className="relative flex-shrink-0 w-36 aspect-video rounded-lg overflow-hidden bg-black shadow-sm">
                    {rv.thumbnail || rv.videoUrl ? (
                      <VideoPoster thumbnail={rv.thumbnail} videoUrl={rv.videoUrl} title={rv.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play size={18} className="text-white/70" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className={`font-semibold text-xs line-clamp-2 leading-snug mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {rv.title}
                      </h4>
                      <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                        @{cleanUsername(rv.author?.username || rv.author?.name)}
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                        {fmtNum(rv.views || 0)} vues • {formatYouTubeDate(rv.postedAt || rv.createdAt || '')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

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
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Liste scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {sortedComments.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
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
              <h3 className="font-bold text-xs">Description</h3>
              <button
                type="button"
                onClick={() => setMobileDescOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenu scrollable de la description */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h2 className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>{video.title}</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400 pb-2 border-b border-zinc-800/40">
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
