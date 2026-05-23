export interface Author {
  id: string;
  name: string;
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
  description: string;
  category: string;
  categoryColor: string;
  duration: string;
  gradient: string;
  tags: string[];
  author: Author;
  views: number;
  likes: number;
  comments: Comment[];
  postedAt: string;
  videoUrl?: string; // URL videyo a (optional)
  thumbnail?: string; // URL thumbnail la (optional)
}
