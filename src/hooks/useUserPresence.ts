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

    const backendUrl = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com' : 'http://localhost:8000')).replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')
    let wsBase = ''
    try {
      const parsed = new URL(backendUrl, window.location.origin)
      const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
      wsBase = `${wsProto}//${parsed.host}`
    } catch {
      wsBase = window.location.protocol === 'https:' ? 'wss://exile-backend-9q6o.onrender.com' : 'ws://localhost:8000'
    }
    const wsUrl = `${wsBase}/ws/presence/?uuid=${encodeURIComponent(userUuid)}`

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
