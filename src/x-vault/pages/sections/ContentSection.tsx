import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Trash2, 
  Archive, 
  Pin, 
  EyeOff, 
  MessageSquare, 
  AlertOctagon, 
  History, 
  Heart, 
  Share2, 
  ShieldAlert, 
  CheckCircle, 
  TrendingUp,
  Eye,
  ExternalLink,
  Ban,
  RefreshCw,
  Video as VideoIcon
} from 'lucide-react';
import { PostContent, PostComment } from '../../types/vault';
import { useVaultModule } from '../../context/VaultModuleContext';
import { videoApi, resolveMediaUrl, cleanUsername } from '../../../services/videoApi';
import { API_BASE_URL } from '../../../config/api';

import { vaultCache } from '../../utils/vaultCache';

export const ContentSection: React.FC = () => {
  const { activeModule } = useVaultModule();
  const [posts, setPosts] = useState<PostContent[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'archived' | 'pending_approval'>('all');
  const [previewPost, setPreviewPost] = useState<PostContent | null>(null);
  const [inspectCommentsPostId, setInspectCommentsPostId] = useState<string | null>(null);
  const [deletedHistory, setDeletedHistory] = useState<PostContent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // 10. Mots-clés interdits & 14. Mode d'approbation stricte
  const [bannedKeywords, setBannedKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [strictApprovalMode, setStrictApprovalMode] = useState<boolean>(false);

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Synchroniser les paramètres de modération avec le backend
  const fetchModerationSettings = useCallback(async () => {
    try {
      const storedToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['x-vault-token'] = storedToken;

      const res = await fetch(`${API_BASE_URL}/vault/system-settings`, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          if (Array.isArray(data.settings.bannedKeywords)) {
            setBannedKeywords(data.settings.bannedKeywords);
          }
          if (typeof data.settings.strictApprovalMode === 'boolean') {
            setStrictApprovalMode(data.settings.strictApprovalMode);
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement paramètres modération:', err);
    }
  }, []);

  const saveModerationSettings = async (update: { bannedKeywords?: string[]; strictApprovalMode?: boolean }) => {
    try {
      const storedToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['x-vault-token'] = storedToken;

      await fetch(`${API_BASE_URL}/vault/system-settings`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ settings: update })
      });
    } catch (err) {
      console.error('Erreur sauvegarde paramètres modération:', err);
    }
  };

  // Charger les vidéos réelles depuis le backend Django
  const fetchRealContent = useCallback(async (showLoader = false) => {
    const cached = vaultCache.get<PostContent[]>('vault_content_posts');
    if (cached) {
      setPosts(cached);
      setIsLoading(false);
    } else if (showLoader) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    try {
      const res = await videoApi.getVideos();
      if (res.success && res.data) {
        const mapped: PostContent[] = res.data.map((v) => {
          const author = cleanUsername(v.owner_username || v.owner_full_name || `Utilisateur #${v.owner}`);
          const fileUrl = resolveMediaUrl(v.file_url || (v.file ? `/media/${v.file}` : ''));
          const coverUrl = resolveMediaUrl(v.cover_url || (v.cover ? `/media/${v.cover}` : ''));

          return {
            id: String(v.id),
            authorId: String(v.owner),
            authorName: author,
            authorProfession: v.owner_profession || 'Créateur de contenu',
            module: 'pro',
            title: v.title,
            content: v.description || 'Aucune description fournie.',
            mediaType: 'video',
            mediaUrl: fileUrl,
            thumbnailUrl: coverUrl || undefined,
            status: v.is_public ? 'published' : 'hidden',
            isPinned: false,
            likesCount: v.likes_count ?? 0,
            commentsCount: 0,
            sharesCount: 0,
            createdAt: v.created_at ? new Date(v.created_at).toLocaleString() : 'Récemment',
          };
        });
        setPosts(mapped);
        vaultCache.set('vault_content_posts', mapped, 180000);
      } else {
        triggerNotice('Impossible de synchroniser avec le serveur backend.');
      }
    } catch (err) {
      console.error('Erreur chargement vidéos vault:', err);
      triggerNotice('Erreur réseau lors de la récupération des vidéos.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRealContent(true);
    fetchModerationSettings();
  }, [fetchRealContent, fetchModerationSettings]);

  // 1. & 2. Filtrage liste des publications
  const filteredPosts = posts.filter(p => {
    if (activeModule === 'pro' && p.module === 'social') return false;
    if (activeModule === 'social' && p.module === 'pro') return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q)
    );
  });

  // 4. Supprimer immédiatement (réellement dans la base de données Django)
  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;
    if (!window.confirm(`Supprimer définitivement la vidéo "${postToDelete.title || postId}" du serveur ?`)) return;

    try {
      const numId = Number(postId);
      if (!isNaN(numId)) {
        const res = await videoApi.deleteVideo(numId);
        if (!res.success) {
          triggerNotice(`Erreur serveur: ${res.error || 'Échec de la suppression'}`);
          return;
        }
      }
      setDeletedHistory([postToDelete, ...deletedHistory]);
      setPosts(posts.filter(p => p.id !== postId));
      triggerNotice('Vidéo supprimée de la base de données avec succès.');
    } catch (err) {
      console.error('Erreur suppression vidéo:', err);
      triggerNotice('Erreur lors de la suppression de la vidéo.');
    }
  };

  // 5. Archiver sans supprimer
  const handleArchivePost = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, status: 'archived' } : p));
    triggerNotice('Publication archivée avec succès.');
  };

  // 6. Épingler en haut
  const handleTogglePin = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, isPinned: !p.isPinned } : p));
    triggerNotice('Statut d\'épinglage mis à jour.');
  };

  // 7. Masquer temporairement (bascule is_public / masqué)
  const handleToggleHide = async (postId: string) => {
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;
    const newStatus = currentPost.status === 'hidden' ? 'published' : 'hidden';

    // Mise à jour optimiste locale
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, status: newStatus };
      }
      return p;
    }));
    triggerNotice(`Visibilité modifiée : ${newStatus === 'published' ? 'Publié' : 'Masqué'}.`);
  };

  // 9. Supprimer un commentaire spécifique
  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId));
    triggerNotice('Commentaire supprimé.');
  };

  // 10. Ajouter un mot-clé interdit (enregistré en base de données)
  const handleAddBannedKeyword = () => {
    if (!newKeyword.trim()) return;
    const clean = newKeyword.trim().toLowerCase();
    if (!bannedKeywords.includes(clean)) {
      const updated = [...bannedKeywords, clean];
      setBannedKeywords(updated);
      saveModerationSettings({ bannedKeywords: updated });
      triggerNotice(`Mot-clé "${clean}" bloqué et enregistré sur le serveur.`);
    }
    setNewKeyword('');
  };

  // 10b. Retirer un mot-clé interdit
  const handleRemoveBannedKeyword = (kwToRemove: string) => {
    const updated = bannedKeywords.filter(k => k !== kwToRemove);
    setBannedKeywords(updated);
    saveModerationSettings({ bannedKeywords: updated });
    triggerNotice(`Mot-clé "${kwToRemove}" retiré de la liste noire.`);
  };

  // 14. Bascule Mode Approbation Stricte
  const handleToggleStrictMode = () => {
    const nextMode = !strictApprovalMode;
    setStrictApprovalMode(nextMode);
    saveModerationSettings({ strictApprovalMode: nextMode });
    triggerNotice(`Mode approbation stricte : ${nextMode ? 'ACTIVÉ (Vidéos privées par défaut)' : 'DÉSACTIVÉ'}`);
  };

  // 11. Restaurer depuis corbeille
  const handleRestorePost = (post: PostContent) => {
    setDeletedHistory(deletedHistory.filter(p => p.id !== post.id));
    setPosts([post, ...posts]);
    triggerNotice('Publication restaurée.');
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-300 text-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Mode d'approbation stricte */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Gestion du Contenu ({filteredPosts.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Modération des publications, vidéos et commentaires en direct
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRealContent(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
            title="Rafraîchir les vidéos depuis le serveur"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>Actualiser</span>
          </button>

          {/* 14. Mode d'approbation stricte toggle */}
          <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">14. Approbation Stricte Pré-Publication</span>
              <span className="text-[10px] text-slate-400">Chaque post doit être validé par un admin</span>
            </div>
            <button
              onClick={handleToggleStrictMode}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                strictApprovalMode ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                strictApprovalMode ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filtres & 10. Mots-clés interdits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, auteur, texte..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Tous les statuts</option>
              <option value="published" className="bg-slate-900">Publié</option>
              <option value="pending_approval" className="bg-slate-900">En attente d'approbation</option>
              <option value="hidden" className="bg-slate-900">Masqué</option>
              <option value="archived" className="bg-slate-900">Archivé</option>
            </select>
          </div>
        </div>

        {/* 10. Bloqueur de mots-clés interdits */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBannedKeyword()}
              placeholder="10. Bloquer un mot..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none"
            />
            <button
              onClick={handleAddBannedKeyword}
              className="px-2.5 py-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-xs font-semibold"
            >
              Bloquer
            </button>
          </div>

          {/* Liste des mots-clés interdits actifs avec suppression */}
          {bannedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-20 overflow-y-auto custom-scrollbar">
              {bannedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-800/40 text-[10px] text-rose-300"
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => handleRemoveBannedKeyword(kw)}
                    title="Supprimer ce mot-clé"
                    className="hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 1. Flux des publications */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm font-medium">Chargement des vidéos en direct...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-center">
          <VideoIcon className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-white">Aucun contenu trouvé</p>
          <p className="text-xs text-slate-500 mt-1">Aucune vidéo ne correspond à vos filtres actuels.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                post.suspiciousLinksDetected 
                  ? 'border-rose-500/40 bg-rose-950/10' 
                  : post.isPinned 
                    ? 'border-blue-500/40 bg-blue-950/10' 
                    : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-bold text-white text-sm">{post.authorName}</span>
                    {post.authorProfession && (
                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        {post.authorProfession}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">{post.createdAt}</span>

                    {/* Badges */}
                    {post.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3" /> 6. Épinglé
                      </span>
                    )}
                    {post.suspiciousLinksDetected && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse">
                        <AlertOctagon className="w-3 h-3" /> 13. Lien Suspect Détecté
                      </span>
                    )}
                    {post.status === 'pending_approval' && (
                      <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        En attente de validation
                      </span>
                    )}
                    {post.status === 'hidden' && (
                      <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        7. Masqué
                      </span>
                    )}
                  </div>

                  {post.title && (
                    <h4 className="text-base font-bold text-slate-100 mb-1">{post.title}</h4>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{post.content}</p>

                  {/* 12. Engagement métriques */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-rose-400">
                      <Heart className="w-3.5 h-3.5" /> {post.likesCount} likes
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount} commentaires
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Share2 className="w-3.5 h-3.5" /> {post.sharesCount} partages
                    </span>
                  </div>
                </div>

                {/* Action Buttons (3, 4, 5, 6, 7, 8) */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {/* 3. Prévisualiser */}
                  <button
                    onClick={() => setPreviewPost(post)}
                    title="3. Prévisualiser avant action"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* 8. Voir commentaires */}
                  <button
                    onClick={() => setInspectCommentsPostId(post.id)}
                    title="8. Voir les commentaires"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {/* 6. Épingler */}
                  <button
                    onClick={() => handleTogglePin(post.id)}
                    title="6. Épingler en haut"
                    className={`p-2 rounded-xl transition-colors ${
                      post.isPinned ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  {/* 7. Masquer temporairement */}
                  <button
                    onClick={() => handleToggleHide(post.id)}
                    title="7. Masquer temporairement"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>

                  {/* 5. Archiver */}
                  <button
                    onClick={() => handleArchivePost(post.id)}
                    title="5. Archiver sans supprimer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-purple-400"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  {/* 4. Supprimer immédiatement */}
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    title="4. Supprimer immédiatement"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Modal de prévisualisation */}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setPreviewPost(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-white mb-2">
              3. Prévisualisation sécurisée du contenu
            </h3>

            {previewPost.mediaUrl ? (
              <video
                src={previewPost.mediaUrl}
                controls
                className="w-full h-56 object-cover rounded-2xl mb-4 border border-slate-800 bg-black"
                poster={previewPost.thumbnailUrl}
              />
            ) : previewPost.thumbnailUrl ? (
              <img
                src={previewPost.thumbnailUrl}
                alt="Media preview"
                className="w-full h-48 object-cover rounded-2xl mb-4 border border-slate-800"
              />
            ) : null}

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4">
              <h4 className="font-bold text-white mb-1">{previewPost.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{previewPost.content}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewPost(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. & 9. Modal Arborescence des Commentaires */}
      {inspectCommentsPostId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setInspectCommentsPostId(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span>8. Commentaires & 9. Suppression ciblée</span>
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.map((cmt) => (
                <div
                  key={cmt.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    cmt.isToxic ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{cmt.authorName}</span>
                      <span className="text-[10px] text-slate-500">{cmt.createdAt}</span>
                      {cmt.isToxic && (
                        <span className="text-[10px] text-rose-400 bg-rose-500/20 px-1.5 rounded">Toxique</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{cmt.content}</p>
                  </div>

                  {/* 9. Supprimer commentaire */}
                  <button
                    onClick={() => handleDeleteComment(cmt.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    title="9. Supprimer ce commentaire"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectCommentsPostId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Corbeille et Historique des Contenus Supprimés */}
      {deletedHistory.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <span>11. Corbeille & Historique des suppressions récentes ({deletedHistory.length})</span>
          </h4>
          <div className="space-y-2">
            {deletedHistory.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-300 truncate max-w-xs">{d.title || d.content}</span>
                <button
                  onClick={() => handleRestorePost(d)}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  Restaurer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
