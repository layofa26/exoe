import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * useUserPresence:
 * Maintient la connexion WebSocket de présence pour l'utilisateur connecté
 * sur ws/presence/?uuid=<user_uuid>.
 * Dès que l'utilisateur navigue sur le site (feed, vidéos, etc.), son statut
 * est comptabilisé en direct dans X-Vault.
 * Si l'utilisateur quitte le site ou ferme le navigateur, il est retiré de la liste.
 */
export function useUserPresence() {
  const { user } = useAuth()
  const socketRef = useRef<WebSocket | null>(null)
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const userUuid = user?.id ? String(user.id) : null
    if (!userUuid) {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
      return
    }

    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/x-vault')) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/presence/?uuid=${encodeURIComponent(userUuid)}`

    let isUnmounted = false

    const connectPresence = () => {
      if (isUnmounted) return
      try {
        const ws = new WebSocket(wsUrl)
        socketRef.current = ws

        ws.onopen = () => {
          if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)
          heartbeatTimer.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'heartbeat' }))
            }
          }, 30000)
        }

        ws.onclose = () => {
          if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)
          socketRef.current = null
        }

        ws.onerror = () => {
          // Silent fallback
        }
      } catch (e) {
        console.warn('[Presence WS] Error:', e)
      }
    }

    connectPresence()

    return () => {
      isUnmounted = true
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [user?.id])
}
