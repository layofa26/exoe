import { useEffect, useRef, useCallback, useState } from 'react'

const WS_BASE = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? 'wss://exile-backend-9q6o.onrender.com' : 'ws://localhost:8000')

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WSMessage {
  type: string
  [key: string]: unknown
}

interface UseWebSocketOptions {
  conversationId: string | number
  onMessage: (msg: WSMessage) => void
  enabled?: boolean
}

interface UseWebSocketReturn {
  send: (data: WSMessage) => void
  connectionState: ConnectionState
  isConnected: boolean
}

const MAX_RETRIES = 2
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000

function getJWT(): string | null {
  return localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('access_token')
}

export function useWebSocket({
  conversationId,
  onMessage,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)
  const onMessageRef = useRef(onMessage)

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')

  // Always keep the latest onMessage callback without re-connecting
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    const isNumericId = /^\d+$/.test(String(conversationId))
    if (!enabled || !conversationId || !isNumericId) return
    if (!navigator.onLine) {
      setConnectionState('disconnected')
      return
    }

    const token = getJWT()
    if (!token) {
      setConnectionState('error')
      return
    }

    const url = `${WS_BASE}/ws/conversation/${conversationId}/?token=${token}`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws
      setConnectionState('connecting')

      ws.onopen = () => {
        if (!isMounted.current) return
        retryCount.current = 0
        setConnectionState('connected')
      }

      ws.onmessage = (event) => {
        if (!isMounted.current) return
        try {
          const data: WSMessage = JSON.parse(event.data)
          onMessageRef.current(data)
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onclose = () => {
        if (!isMounted.current) return
        setConnectionState('disconnected')
      }

      ws.onerror = () => {
        if (!isMounted.current) return
        setConnectionState('disconnected')
      }
    } catch {
      setConnectionState('disconnected')
    }
  }, [conversationId, enabled])

  // Connect on mount / reconnect when online
  useEffect(() => {
    isMounted.current = true

    if (enabled) {
      connect()
    }

    const handleOnline = () => {
      retryCount.current = 0
      connect()
    }
    const handleOffline = () => {
      setConnectionState('disconnected')
      wsRef.current?.close()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      isMounted.current = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (retryTimer.current) clearTimeout(retryTimer.current)
      wsRef.current?.close(1000, 'Component unmounted')
    }
  }, [connect, enabled])

  const send = useCallback((data: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return {
    send,
    connectionState,
    isConnected: connectionState === 'connected',
  }
}
