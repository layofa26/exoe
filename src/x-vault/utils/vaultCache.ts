/**
 * vaultCache:
 * Système de mise en cache en mémoire ultra-rapide pour X-Vault.
 * Permet à toutes les sections (overview, users, analytics, content, moderation, settings, trash)
 * de s'afficher instantanément (0ms) lorsqu'on navigue d'un onglet à un autre.
 * TTL par défaut : 3 minutes (180 000 ms).
 * Invalidation réactive via WebSocket.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class VaultCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Récupère la valeur du cache si elle est encore valide
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Enregistre une valeur dans le cache
   */
  set<T>(key: string, data: T, ttlMs: number = 180000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Invalide une clé spécifique (ou toutes les clés qui commencent par un préfixe)
   */
  invalidate(prefixOrKey: string): void {
    for (const key of this.cache.keys()) {
      if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vide l'intégralité du cache
   */
  clear(): void {
    this.cache.clear();
  }
}

export const vaultCache = new VaultCache();
