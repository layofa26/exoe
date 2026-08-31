export interface Author {
  id: string;
  name: string;
  username?: string;
  profession: string;
  location: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string; // URL foto profil reyèl (optional)
  // Champs pou modal profil
  bio?: string;
  about?: string;
  isLive?: boolean;
  followers?: number;
  videoCount?: number;
  contacts?: number;
  views?: number;
  videos?: Video[];
}

export interface Comment {
  id: string;
  authorName: string;
  initials: string;
  color: string;
  text: string;
  ago: string;
  likes?: number;
  liked?: boolean;
  disliked?: boolean;
  replies?: Comment[];
  parentId?: string | null;
  audioBlob?: Blob;
  audioDuration?: number;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  category?: string;
  categoryColor?: string;
  duration?: string | number;
  gradient?: string;
  tags?: string[];
  author: Author;
  views?: number;
  viewsCount?: number;
  likes?: number;
  likesCount?: number;
  comments?: Comment[];
  commentsCount?: number;
  sharesCount?: number;
  favoritesCount?: number;
  postedAt?: string;
  createdAt?: string;
  videoUrl?: string; // URL videyo a (optional)
  hlsUrl?: string; // URL HLS .m3u8 (optional)
  mimeType?: string; // Type MIME reyèl videyo a (optional)
  thumbnail?: string; // URL thumbnail la (optional)
  thumbnailUrl?: string; // URL thumbnail la (backend field)
  aspectRatio?: string; // '16:9' | '9:16' (optional)
  qualities?: string[]; // Qualités disponibles (ex: ['240p', '360p', '720p'])
  captions?: {
    src: string;
    srclang: string;
    label: string;
    default?: boolean;
  }[]; // Sous-titres WebVTT (optional)
  videoAvailable?: boolean; // Indique si la vidéo est disponible
  visibility?: 'PUBLIC' | 'PRIVATE' | 'SUBSCRIBERS_ONLY';
  status?: 'PUBLISHED' | 'DRAFT' | 'UPLOADING' | 'FAILED' | 'READY';
  allowComments?: boolean;
  allowLikes?: boolean;
  allowShares?: boolean;
  isLive?: boolean;
}
