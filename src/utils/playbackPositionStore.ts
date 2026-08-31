/**
 * playbackPositionStore
 * Mémorisation haute-performance de la position de lecture (currentTime) par videoId.
 * - Stockage rapide en mémoire RAM (Map)
 * - Persistance hybride en sessionStorage pour résister aux navigations et remontages de composants
 */

const inMemoryPositions = new Map<string, number>()

export const playbackPositionStore = {
  get(videoId: string | number): number {
    if (!videoId) return 0
    const id = String(videoId)
    if (inMemoryPositions.has(id)) {
      return inMemoryPositions.get(id) || 0
    }
    try {
      const stored = sessionStorage.getItem(`exile_pos_${id}`)
      if (stored) {
        const val = parseFloat(stored)
        if (!Number.isNaN(val) && val >= 0) {
          inMemoryPositions.set(id, val)
          return val
        }
      }
    } catch {}
    return 0
  },

  set(videoId: string | number, time: number) {
    if (!videoId || Number.isNaN(time) || time < 0) return
    const id = String(videoId)
    inMemoryPositions.set(id, time)
    try {
      sessionStorage.setItem(`exile_pos_${id}`, String(time))
    } catch {}
  },

  clear(videoId: string | number) {
    if (!videoId) return
    const id = String(videoId)
    inMemoryPositions.delete(id)
    try {
      sessionStorage.removeItem(`exile_pos_${id}`)
    } catch {}
  }
}
