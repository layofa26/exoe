/**
 * Cache Service - exile-frontend
 * Système de cache haute performance (Mémoire RAM 0ms + persistance localStorage)
 * Supporte le modèle Stale-While-Revalidate (SWR) avec invalidation ciblée et événements temps réel.
 */

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // en millisecondes
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Durée de validité en ms (par défaut: 5 minutes)
  persist?: boolean; // Si true, sauvegarde dans localStorage (par défaut: true)
}

export interface GetCacheOptions {
  maxAge?: number; // Age max acceptable en ms
  allowStale?: boolean; // Si true, retourne la donnée même si expirée
}

export interface CacheGetResult<T> {
  data: T | null;
  hasCache: boolean;
  isStale: boolean;
  timestamp?: number;
}

type CacheListener<T = unknown> = (data: T | null, key: string) => void;

class CacheService {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private listeners = new Map<string, Set<CacheListener<any>>>();
  private globalListeners = new Set<CacheListener<any>>();
  private storagePrefix = 'exile_cache_v2:';
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.hydrateFromStorage();
  }

  /**
   * Précharge les entrées localStorage valides en mémoire RAM au démarrage
   */
  private hydrateFromStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i);
        if (fullKey && fullKey.startsWith(this.storagePrefix)) {
          const raw = localStorage.getItem(fullKey);
          if (raw) {
            try {
              const entry: CacheEntry<unknown> = JSON.parse(raw);
              const cleanKey = fullKey.replace(this.storagePrefix, '');
              
              // Si pas trop vieux (garder les données même si stale pour affichage immédiat, max 7 jours)
              const maxRetention = 7 * 24 * 60 * 60 * 1000;
              if (now - entry.timestamp < maxRetention) {
                this.memoryCache.set(cleanKey, entry);
              } else {
                keysToRemove.push(fullKey);
              }
            } catch {
              keysToRemove.push(fullKey);
            }
          }
        }
      }

      // Nettoyer les clés trop anciennes
      keysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });
    } catch (e) {
      console.warn('[CacheService] Hydration error:', e);
    }
  }

  /**
   * Récupère une valeur du cache (Mémoire en priorité, sinon localStorage)
   */
  get<T>(key: string, options?: GetCacheOptions): CacheGetResult<T> {
    const allowStale = options?.allowStale ?? true;
    const now = Date.now();

    // 1. Vérifier la mémoire RAM (0ms)
    let entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;

    // 2. Si pas en mémoire, vérifier localStorage
    if (!entry && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(`${this.storagePrefix}${key}`);
        if (raw) {
          entry = JSON.parse(raw) as CacheEntry<T>;
          this.memoryCache.set(key, entry);
        }
      } catch (e) {
        console.warn(`[CacheService] Failed to read ${key} from storage:`, e);
      }
    }

    if (!entry) {
      return { data: null, hasCache: false, isStale: true };
    }

    const ttl = options?.maxAge ?? entry.ttl ?? this.defaultTTL;
    const age = now - entry.timestamp;
    const isStale = age > ttl;

    if (isStale && !allowStale) {
      return { data: null, hasCache: true, isStale: true, timestamp: entry.timestamp };
    }

    return {
      data: entry.data,
      hasCache: true,
      isStale,
      timestamp: entry.timestamp
    };
  }

  /**
   * Enregistre une valeur dans le cache
   */
  set<T>(key: string, data: T, options?: CacheOptions | number): void {
    const ttl = typeof options === 'number' ? options : (options?.ttl ?? this.defaultTTL);
    const persist = typeof options === 'number' ? true : (options?.persist ?? true);
    
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl
    };

    // 1. Stocker en mémoire vive
    this.memoryCache.set(key, entry);

    // 2. Persister dans localStorage si demandé
    if (persist && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`${this.storagePrefix}${key}`, JSON.stringify(entry));
      } catch (e) {
        console.warn(`[CacheService] Quota exceeded or error saving ${key}:`, e);
        // Si quota plein, supprimer les entrées anciennes
        this.pruneStorage();
      }
    }

    // 3. Notifier les observateurs
    this.notify(key, data);
  }

  /**
   * Met à jour une valeur de manière optimiste
   */
  mutate<T>(key: string, updater: (prev: T | null) => T, options?: CacheOptions): T {
    const current = this.get<T>(key, { allowStale: true });
    const newData = updater(current.data);
    this.set(key, newData, options);
    return newData;
  }

  /**
   * Invalide une clé ou un groupe de clés par motif (regex ou wildcard)
   * Ex: cacheService.invalidate('pro:videos:*') ou cacheService.invalidate('pro:profile')
   */
  invalidate(keyOrPattern: string | RegExp): void {
    const keysToDelete: string[] = [];

    if (typeof keyOrPattern === 'string') {
      if (keyOrPattern.includes('*')) {
        const regexStr = '^' + keyOrPattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$';
        const regex = new RegExp(regexStr);
        for (const k of this.memoryCache.keys()) {
          if (regex.test(k)) keysToDelete.push(k);
        }
      } else {
        keysToDelete.push(keyOrPattern);
      }
    } else {
      for (const k of this.memoryCache.keys()) {
        if (keyOrPattern.test(k)) keysToDelete.push(k);
      }
    }

    // Supprimer de la mémoire et du localStorage
    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.removeItem(`${this.storagePrefix}${key}`);
        } catch {}
      }
      this.notify(key, null);
    }
  }

  /**
   * Vide l'ensemble du cache applicatif
   */
  clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.storagePrefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch {}
    }
    this.notify('*', null);
  }

  /**
   * S'abonne aux changements d'une clé spécifique
   */
  subscribe<T>(key: string, listener: CacheListener<T>): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener as CacheListener<any>);

    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(listener as CacheListener<any>);
        if (set.size === 0) this.listeners.delete(key);
      }
    };
  }

  /**
   * S'abonne à tous les changements du cache
   */
  subscribeAll(listener: CacheListener<any>): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  private notify<T>(key: string, data: T | null): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(cb => {
        try { cb(data, key); } catch (e) { console.error('[CacheService] Listener error:', e); }
      });
    }

    this.globalListeners.forEach(cb => {
      try { cb(data, key); } catch (e) { console.error('[CacheService] Global listener error:', e); }
    });
  }

  /**
   * Nettoyage automatique en cas de stockage saturé
   */
  private pruneStorage(): void {
    try {
      const entries: { key: string; timestamp: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.storagePrefix)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const entry = JSON.parse(raw);
              entries.push({ key: k, timestamp: entry.timestamp || 0 });
            } catch {
              entries.push({ key: k, timestamp: 0 });
            }
          }
        }
      }

      // Trier du plus vieux au plus récent et supprimer la moitié la plus ancienne
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, Math.ceil(entries.length / 2));
      toRemove.forEach(item => localStorage.removeItem(item.key));
    } catch {}
  }
}

export const cacheService = new CacheService();
export default cacheService;
