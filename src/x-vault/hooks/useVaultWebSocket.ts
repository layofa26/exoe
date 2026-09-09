import { useEffect, useRef, useCallback, useState } from 'react'

export interface VaultLiveMessage {
  type: string
  data?: any
}

interface UseVaultWebSocketOptions {
  onEvent?: (event: VaultLiveMessage) => void
  enabled?: boolean
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useVaultWebSocket({
  onEvent,
  enabled = true,
}: UseVaultWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const connect = useCallback(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    // Clean up previous socket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setConnectionState('connecting')

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const vaultToken = sessionStorage.getItem('vault_token') || localStorage.getItem('vault_token') || ''
    const wsUrl = `${protocol}//${host}/ws/vault/live-events/?token=${encodeURIComponent(vaultToken)}`

    try {
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        setConnectionState('connected')
        retryCount.current = 0
      }

      socket.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data)
          if (onEventRef.current) {
            onEventRef.current(payload)
          }
        } catch (err) {
          console.error('[Vault WS] JSON Parse Error:', err)
        }
      }

      socket.onerror = (err) => {
        console.warn('[Vault WS] Error:', err)
        setConnectionState('error')
      }

      socket.onclose = (event) => {
        setConnectionState('disconnected')
        wsRef.current = null

        // Auto reconnect with exponential backoff if not cleanly closed
        if (event.code !== 1000 && event.code !== 4003) {
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), 15000)
          retryCount.current += 1
          retryTimer.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    } catch (err) {
      console.error('[Vault WS] Connection setup error:', err)
      setConnectionState('error')
    }
  }, [enabled])

  useEffect(() => {
    connect()

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
      if (wsRef.current) {
        wsRef.current.close(1000)
        wsRef.current = null
      }
    }
  }, [connect])

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    reconnect: connect
  }
}
