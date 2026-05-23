import type { Video } from '../types/video';

export const SAMPLE_VIDEOS: Video[] = [
  {
    id: 'v1',
    title: 'Concevoir une API REST scalable avec Node.js et Docker',
    description:
      "Dans cette vidéo, on architecte une API REST performante avec Node.js, Express et Docker. Bonnes pratiques, containerisation avec Docker Compose, déploiement VPS. Code source disponible sur GitHub.",
    category: 'Technologie',
    categoryColor: 'bg-blue-600',
    duration: '18:42',
    gradient: 'from-slate-900 via-blue-950 to-slate-900',
    tags: ['Node.js', 'Docker', 'API REST', 'Backend'],
    author: { id: 'u1', name: 'Jean-Daniel Moreau', profession: 'Architecte logiciel', location: 'Port-au-Prince', initials: 'JD', avatarColor: '#1d4ed8' },
    views: 3847, likes: 248,
    comments: [
      { id: 'c1', authorName: 'Marie-Laure', initials: 'ML', color: '#059669', text: 'Super contenu, merci !', ago: '1h' },
      { id: 'c2', authorName: 'Kev Pierre', initials: 'KP', color: '#d97706', text: 'La partie Docker est parfaite.', ago: '45 min' },
    ],
    postedAt: 'Il y a 2 heures',
  },
  {
    id: 'v2',
    title: 'Design System Figma : construire des composants réutilisables',
    description:
      "Apprenez à créer un Design System complet dans Figma : variables, composants auto-layout, tokens de couleur et documentation.",
    category: 'Design',
    categoryColor: 'bg-violet-600',
    duration: '24:10',
    gradient: 'from-violet-950 via-fuchsia-900 to-violet-950',
    tags: ['Figma', 'Design System', 'UI/UX'],
    author: { id: 'u2', name: 'Claudine St-Fleur', profession: 'Product Designer', location: 'Miami', initials: 'CS', avatarColor: '#7c3aed' },
    views: 2104, likes: 186,
    comments: [
      { id: 'c3', authorName: 'Sandro Louis', initials: 'SL', color: '#0891b2', text: "Exactement ce qu'il me fallait !", ago: '3h' },
    ],
    postedAt: 'Il y a 5 heures',
  },
  {
    id: 'v3',
    title: 'Crypto & DeFi : comprendre les protocoles de liquidité',
    description:
      "Tour d'horizon des protocoles DeFi : AMM, liquidity pools, yield farming. Analyse des risques et opportunités en 2026.",
    category: 'Finance',
    categoryColor: 'bg-emerald-600',
    duration: '31:05',
    gradient: 'from-emerald-950 via-teal-900 to-emerald-950',
    tags: ['Crypto', 'DeFi', 'Finance', 'Blockchain'],
    author: { id: 'u3', name: 'Rolph Desvarieux', profession: 'Analyste financier', location: 'Port-au-Prince', initials: 'RD', avatarColor: '#059669' },
    views: 5632, likes: 421,
    comments: [
      { id: 'c4', authorName: 'Patricia M.', initials: 'PM', color: '#dc2626', text: 'Très bien expliqué, merci !', ago: '2h' },
      { id: 'c5', authorName: 'Louis J.', initials: 'LJ', color: '#7c3aed', text: 'La partie AMM est incroyable.', ago: '30 min' },
    ],
    postedAt: 'Il y a 8 heures',
  },
  {
    id: 'v4',
    title: 'Next.js 15 : Server Components, Suspense & Streaming SSR',
    description:
      "Deep dive dans Next.js 15 : comment les Server Components changent l'architecture frontend. Patterns Suspense, Streaming et PPR expliqués.",
    category: 'Technologie',
    categoryColor: 'bg-blue-600',
    duration: '42:18',
    gradient: 'from-zinc-900 via-sky-950 to-zinc-900',
    tags: ['Next.js', 'React', 'Frontend', 'SSR'],
    author: { id: 'u4', name: 'Marlène Joseph', profession: 'Senior Frontend Dev', location: 'Montréal', initials: 'MJ', avatarColor: '#0284c7' },
    views: 7891, likes: 634,
    comments: [],
    postedAt: 'Il y a 1 jour',
  },
  {
    id: 'v5',
    title: "Santé mentale & entrepreneuriat : trouver l'équilibre",
    description:
      "Comment gérer le stress, le syndrome de l'imposteur et l'isolement quand on est entrepreneur. Témoignages et stratégies concrètes.",
    category: 'Bien-être',
    categoryColor: 'bg-rose-600',
    duration: '28:33',
    gradient: 'from-rose-950 via-pink-900 to-rose-950',
    tags: ['Santé mentale', 'Entrepreneuriat', 'Bien-être'],
    author: { id: 'u5', name: 'Fabienne Dorismond', profession: 'Coach & Psychologue', location: 'Paris', initials: 'FD', avatarColor: '#e11d48' },
    views: 4210, likes: 380,
    comments: [
      { id: 'c6', authorName: 'Edna L.', initials: 'EL', color: '#059669', text: "Merci, j'en avais vraiment besoin.", ago: '5h' },
    ],
    postedAt: 'Il y a 2 jours',
  },
  {
    id: 'v6',
    title: 'PostgreSQL avancé : index, partitionnement et performance',
    description:
      "Optimisez vos requêtes PostgreSQL : index composites, partitionnement par range/hash, EXPLAIN ANALYZE et tuning du query planner.",
    category: 'Base de données',
    categoryColor: 'bg-amber-600',
    duration: '55:47',
    gradient: 'from-amber-950 via-orange-900 to-amber-950',
    tags: ['PostgreSQL', 'SQL', 'Performance', 'Backend'],
    author: { id: 'u6', name: 'Yves Saintelus', profession: 'DBA Senior', location: 'Port-au-Prince', initials: 'YS', avatarColor: '#d97706' },
    views: 1923, likes: 157,
    comments: [],
    postedAt: 'Il y a 3 jours',
  },
];
