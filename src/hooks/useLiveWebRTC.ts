import { useState, useEffect, useRef, useCallback } from 'react'

const WS_BASE = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? 'wss://exile-backend-9q6o.onrender.com' : 'ws://localhost:8000')

export interface Participant {
  id: string
  name: string
  username: string
  avatar?: string | null
  isHost?: boolean
  isSpeaker?: boolean
  isHandRaised?: boolean
  channel_name?: string
}

export interface LiveChatMessage {
  id: string | number
  user_id?: string
  user: string
  username: string
  avatar?: string | null
  text: string
  isHost: boolean
  isSpeaker: boolean
  time: string
}

export interface ReactionItem {
  id: number
  emoji: string
  x: number
}

interface UseLiveWebRTCOptions {
  eventId: string | number
  initialIsHost?: boolean
  onStreamEnded?: () => void
  onKicked?: (name: string) => void
  onToast?: (msg: string) => void
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useLiveWebRTC({
  eventId,
  initialIsHost = false,
  onStreamEnded,
  onKicked,
  onToast,
}: UseLiveWebRTCOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isHost, setIsHost] = useState(initialIsHost)
  const [isSpeaker, setIsSpeaker] = useState(initialIsHost)

  useEffect(() => {
    setIsHost(Boolean(initialIsHost))
    setIsSpeaker(Boolean(initialIsHost))
  }, [initialIsHost])
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myChannel, setMyChannel] = useState<string | null>(null)

  const [viewerCount, setViewerCount] = useState(1)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    {
      id: 'welcome',
      user: 'Système',
      username: 'system',
      text: 'Bienvenue dans le direct ! Posez vos questions et interagissez en temps réel.',
      isHost: true,
      isSpeaker: false,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [reactions, setReactions] = useState<ReactionItem[]>([])
  const [isHandRaised, setIsHandRaised] = useState(false)

  // Local media stream (Camera / Mic)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  // Remote stream (Viewer receives Host's or Speakers' stream)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const viewerPeerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const isHostRef = useRef(initialIsHost)
  const isSpeakerRef = useRef(initialIsHost)
  const myChannelRef = useRef<string | null>(null)

  const onToastRef = useRef(onToast)
  onToastRef.current = onToast

  const onStreamEndedRef = useRef(onStreamEnded)
  onStreamEndedRef.current = onStreamEnded

  const onKickedRef = useRef(onKicked)
  onKickedRef.current = onKicked

  useEffect(() => {
    isHostRef.current = isHost
  }, [isHost])

  useEffect(() => {
    isSpeakerRef.current = isSpeaker
  }, [isSpeaker])

  // ─── Helper: Send WebSocket payload ───
  const sendWS = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  // ─── 1. Initialize Local Media (Camera & Mic) with progressive fallback ───
  const startLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('NotSupported')
      onToastRef.current?.('Votre navigateur ne supporte pas l’accès caméra/micro (utiliser HTTPS ou localhost).')
      return null
    }

    // Attempt 1: Full Camera + Microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          frameRate: { ideal: 25, max: 30 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      setMediaError(null)
      return stream
    } catch (bothErr) {
      console.warn('Could not get both video and audio, trying video only:', bothErr)

      // Attempt 2: Video only (if microphone is missing or in use)
      try {
        const videoOnly = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
        localStreamRef.current = videoOnly
        setLocalStream(videoOnly)
        setIsMuted(true)
        setMediaError(null)
        onToastRef.current?.('Caméra activée (sans micro)')
        return videoOnly
      } catch (videoErr) {
        console.warn('Could not get video, trying audio only:', videoErr)

        // Attempt 3: Audio only (if camera is missing or in use)
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          })
          localStreamRef.current = audioOnly
          setLocalStream(audioOnly)
          setIsVideoOff(true)
          setMediaError(null)
          onToastRef.current?.('Micro activé (sans caméra)')
          return audioOnly
        } catch (err: any) {
          console.warn('All getUserMedia attempts failed:', err)
          const errName = err?.name || 'PermissionDenied'
          setMediaError(errName)
          if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
            onToastRef.current?.('Accès caméra/micro bloqué. Cliquez sur le cadenas 🔒 dans la barre d’adresse pour autoriser.')
          } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
            onToastRef.current?.('Aucune caméra ni micro détecté sur votre appareil.')
          } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
            onToastRef.current?.('Caméra ou micro déjà utilisé par une autre application.')
          } else {
            onToastRef.current?.('Accès caméra/micro non autorisé ou indisponible.')
          }
          return null
        }
      }
    }
  }, [])

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
      setIsScreenSharing(false)
    }
  }, [])

  // ─── 2. Host: Create Peer Connection for incoming viewer ───
  const handleHostCreateOfferForViewer = useCallback(async (viewerChannel: string) => {
    if (!localStreamRef.current) {
      await startLocalMedia()
    }
    const stream = localStreamRef.current
    if (!stream) return

    // Close existing connection to this viewer if any
    if (peersRef.current.has(viewerChannel)) {
      peersRef.current.get(viewerChannel)?.close()
      peersRef.current.delete(viewerChannel)
    }

    const pc = new RTCPeerConnection(RTC_CONFIG)
    peersRef.current.set(viewerChannel, pc)

    // Add local tracks (camera or screen share) with optimized bitrate for mesh
    stream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, stream)
      if (track.kind === 'video' && sender && sender.getParameters) {
        try {
          const params = sender.getParameters()
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}]
          }
          params.encodings[0].maxBitrate = 900000 // 900 kbps max per viewer
          sender.setParameters(params).catch(() => {})
        } catch {}
      }
    })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWS({
          type: 'webrtc.signal',
          signal_type: 'candidate',
          payload: event.candidate,
          target_channel: viewerChannel,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peersRef.current.delete(viewerChannel)
      }
    }

    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendWS({
        type: 'webrtc.signal',
        signal_type: 'offer',
        payload: offer,
        target_channel: viewerChannel,
      })
    } catch (e) {
      console.error('Error creating offer for viewer:', e)
    }
  }, [sendWS, startLocalMedia])

  // ─── 3. Viewer: Handle incoming offer from Host ───
  const handleViewerReceiveOffer = useCallback(async (offer: RTCSessionDescriptionInit, senderChannel: string) => {
    if (viewerPeerRef.current) {
      viewerPeerRef.current.close()
      viewerPeerRef.current = null
    }

    const pc = new RTCPeerConnection(RTC_CONFIG)
    viewerPeerRef.current = pc

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWS({
          type: 'webrtc.signal',
          signal_type: 'candidate',
          payload: event.candidate,
          target_channel: senderChannel,
        })
      }
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendWS({
        type: 'webrtc.signal',
        signal_type: 'answer',
        payload: answer,
        target_channel: senderChannel,
      })
    } catch (e) {
      console.error('Error handling offer on viewer:', e)
    }
  }, [sendWS])

  const handleHostCreateOfferForViewerRef = useRef(handleHostCreateOfferForViewer)
  handleHostCreateOfferForViewerRef.current = handleHostCreateOfferForViewer

  const handleViewerReceiveOfferRef = useRef(handleViewerReceiveOffer)
  handleViewerReceiveOfferRef.current = handleViewerReceiveOffer

  const startLocalMediaRef = useRef(startLocalMedia)
  startLocalMediaRef.current = startLocalMedia

  // ─── 4. Main WebSocket Connection ───
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || ''
    const cleanEventId = String(eventId).replace('exile-', '').replace('evt_', '')
    if (!cleanEventId) return

    const wsUrl = `${WS_BASE}/ws/live/${cleanEventId}/?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    ws.onerror = (e) => {
      console.error('Live WebSocket error:', e)
      setIsConnected(false)
    }

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'live.welcome': {
            setMyUserId(msg.user_id)
            setMyChannel(msg.my_channel)
            myChannelRef.current = msg.my_channel
            const hostFlag = Boolean(msg.is_host)
            setIsHost(hostFlag)
            isHostRef.current = hostFlag
            setIsSpeaker(Boolean(msg.is_speaker))
            isSpeakerRef.current = Boolean(msg.is_speaker)
            if (msg.roster) {
              setParticipants(msg.roster)
            }
            if (typeof msg.viewer_count === 'number') {
              setViewerCount(msg.viewer_count)
            }

            // If Host, start local camera stream automatically
            if (hostFlag) {
              await startLocalMediaRef.current()
            } else {
              // Viewer asks Host for WebRTC stream
              sendWS({
                type: 'webrtc.signal',
                signal_type: 'request_stream',
              })
            }
            break
          }

          case 'live.user_joined': {
            if (typeof msg.viewer_count === 'number') {
              setViewerCount(msg.viewer_count)
            }
            if (msg.participant) {
              setParticipants(prev => {
                const exists = prev.some(p => p.channel_name === msg.participant.channel_name || p.id === msg.participant.id)
                if (exists) return prev
                return [...prev, msg.participant]
              })
              // If we are Host, create WebRTC offer for this new viewer!
              if (isHostRef.current && msg.participant.channel_name) {
                handleHostCreateOfferForViewerRef.current(msg.participant.channel_name)
              }
            }
            break
          }

          case 'live.user_left': {
            if (typeof msg.viewer_count === 'number') {
              setViewerCount(msg.viewer_count)
            }
            if (msg.channel_name) {
              setParticipants(prev => prev.filter(p => p.channel_name !== msg.channel_name))
              if (peersRef.current.has(msg.channel_name)) {
                peersRef.current.get(msg.channel_name)?.close()
                peersRef.current.delete(msg.channel_name)
              }
            }
            if (msg.is_host) {
              onToastRef.current?.("L'hôte a quitté le direct.")
              setRemoteStream(null)
            }
            break
          }

          case 'webrtc.signal': {
            const { signal_type, payload, sender_channel } = msg

            if (signal_type === 'request_stream') {
              // Only Host responds to stream requests
              if (isHostRef.current && sender_channel) {
                handleHostCreateOfferForViewerRef.current(sender_channel)
              }
            } else if (signal_type === 'offer') {
              // Viewer receives Host's offer
              if (!isHostRef.current && payload && sender_channel) {
                handleViewerReceiveOfferRef.current(payload, sender_channel)
              }
            } else if (signal_type === 'answer') {
              // Host receives viewer's answer
              if (isHostRef.current && sender_channel && peersRef.current.has(sender_channel)) {
                const pc = peersRef.current.get(sender_channel)
                if (pc) {
                  await pc.setRemoteDescription(new RTCSessionDescription(payload))
                }
              }
            } else if (signal_type === 'candidate') {
              // Add ICE Candidate
              if (isHostRef.current && sender_channel && peersRef.current.has(sender_channel)) {
                const pc = peersRef.current.get(sender_channel)
                if (pc && payload) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(payload))
                  } catch {}
                }
              } else if (!isHostRef.current && viewerPeerRef.current && payload) {
                try {
                  await viewerPeerRef.current.addIceCandidate(new RTCIceCandidate(payload))
                } catch {}
              }
            }
            break
          }

          case 'live.chat_message': {
            setChatMessages(prev => [
              ...prev,
              {
                id: msg.id || Date.now(),
                user_id: msg.user_id,
                user: msg.user || msg.username || 'Utilisateur',
                username: msg.username || '',
                avatar: msg.avatar,
                text: msg.text,
                isHost: Boolean(msg.is_host),
                isSpeaker: Boolean(msg.is_speaker),
                time: msg.time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              },
            ])
            break
          }

          case 'live.reaction': {
            const rId = msg.id || Date.now()
            setReactions(prev => [...prev, { id: rId, emoji: msg.emoji, x: Math.random() * 80 + 10 }])
            setTimeout(() => {
              setReactions(prev => prev.filter(r => r.id !== rId))
            }, 3000)
            break
          }

          case 'live.hand_raise': {
            setParticipants(prev =>
              prev.map(p => (String(p.id) === String(msg.user_id) ? { ...p, isHandRaised: msg.raised } : p))
            )
            if (msg.raised) {
              setChatMessages(prev => [
                ...prev,
                {
                  id: Date.now(),
                  user: 'Système',
                  username: 'system',
                  text: `✋ @${msg.username || msg.name} a levé la main pour demander la parole.`,
                  isHost: true,
                  isSpeaker: false,
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            break
          }

          case 'live.speaker_promoted': {
            setParticipants(prev =>
              prev.map(p => (String(p.id) === String(msg.target_user_id) ? { ...p, isSpeaker: true, isHandRaised: false } : p))
            )
            if (String(msg.target_user_id) === String(myUserId) || msg.target_channel === myChannelRef.current) {
              setIsSpeaker(true)
              isSpeakerRef.current = true
              onToastRef.current?.('🎙️ Vous êtes invité(e) sur scène ! Vous pouvez activer votre micro.')
              await startLocalMediaRef.current()
            }
            break
          }

          case 'live.speaker_demoted': {
            setParticipants(prev =>
              prev.map(p => (String(p.id) === String(msg.target_user_id) ? { ...p, isSpeaker: false } : p))
            )
            if (String(msg.target_user_id) === String(myUserId)) {
              setIsSpeaker(false)
              isSpeakerRef.current = false
              onToastRef.current?.('Vous avez quitté la scène.')
            }
            break
          }

          case 'live.user_kicked': {
            setParticipants(prev => prev.filter(p => String(p.id) !== String(msg.target_user_id)))
            if (String(msg.target_user_id) === String(myUserId)) {
              onKickedRef.current?.(msg.target_name || 'Vous')
            }
            break
          }

          case 'live.stream_ended': {
            onToastRef.current?.('Le direct est terminé par l’organisateur.')
            setRemoteStream(null)
            onStreamEndedRef.current?.()
            break
          }
        }
      } catch (err) {
        console.error('Error handling live ws packet:', err)
      }
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
      stopLocalMedia()
      peersRef.current.forEach(pc => pc.close())
      peersRef.current.clear()
      if (viewerPeerRef.current) {
        viewerPeerRef.current.close()
        viewerPeerRef.current = null
      }
    }
  }, [eventId, sendWS, stopLocalMedia])

  // ─── 5. Actions ───

  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim()) return
    sendWS({
      type: 'live.chat',
      text: text.trim(),
    })
  }, [sendWS])

  const sendReaction = useCallback((emoji: string) => {
    sendWS({
      type: 'live.reaction',
      emoji,
    })
  }, [sendWS])

  const toggleHandRaise = useCallback(() => {
    const nextState = !isHandRaised
    setIsHandRaised(nextState)
    sendWS({
      type: 'live.hand_raise',
      raised: nextState,
    })
    onToastRef.current?.(nextState ? '✋ Vous avez levé la main' : 'Main baissée')
  }, [isHandRaised, sendWS])

  const promoteToSpeaker = useCallback((userId: string, channelName?: string) => {
    sendWS({
      type: 'live.promote_speaker',
      target_user_id: userId,
      target_channel: channelName,
    })
    onToastRef.current?.('🎙️ Invitation envoyée pour monter sur scène')
  }, [sendWS])

  const demoteSpeaker = useCallback((userId: string) => {
    sendWS({
      type: 'live.demote_speaker',
      target_user_id: userId,
    })
    onToastRef.current?.('Participant retiré de la scène')
  }, [sendWS])

  const kickParticipant = useCallback((userId: string, name: string) => {
    sendWS({
      type: 'live.kick_user',
      target_user_id: userId,
      target_name: name,
    })
    onToastRef.current?.(`🚫 ${name} a été expulsé(e) du direct`)
  }, [sendWS])

  const endLive = useCallback(() => {
    sendWS({
      type: 'live.end_stream',
    })
  }, [sendWS])

  // ─── 6. Controls: Mic, Camera, Screen Share ───

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(t => {
        t.enabled = !t.enabled
      })
      const isNowMuted = audioTracks.length > 0 ? !audioTracks[0].enabled : true
      setIsMuted(isNowMuted)
      onToastRef.current?.(isNowMuted ? 'Micro désactivé' : 'Micro activé')
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(t => {
        t.enabled = !t.enabled
      })
      const isNowOff = videoTracks.length > 0 ? !videoTracks[0].enabled : true
      setIsVideoOff(isNowOff)
      onToastRef.current?.(isNowOff ? 'Caméra désactivée' : 'Caméra activée')
    }
  }, [])

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = screenStream
        setIsScreenSharing(true)
        const screenVideoTrack = screenStream.getVideoTracks()[0]

        // Replace video track across all active viewer peer connections
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
          if (sender) {
            sender.replaceTrack(screenVideoTrack)
          }
        })

        screenVideoTrack.onended = () => {
          setIsScreenSharing(false)
          screenStreamRef.current = null
          // Restore original camera track
          if (localStreamRef.current) {
            const camVideoTrack = localStreamRef.current.getVideoTracks()[0]
            peersRef.current.forEach(pc => {
              const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
              if (sender && camVideoTrack) {
                sender.replaceTrack(camVideoTrack)
              }
            })
          }
          onToastRef.current?.("Partage d'écran arrêté")
        }

        onToastRef.current?.("🖥️ Partage d'écran activé")
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop())
          screenStreamRef.current = null
        }
        setIsScreenSharing(false)

        if (localStreamRef.current) {
          const camVideoTrack = localStreamRef.current.getVideoTracks()[0]
          peersRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
            if (sender && camVideoTrack) {
              sender.replaceTrack(camVideoTrack)
            }
          })
        }
        onToastRef.current?.("Partage d'écran arrêté")
      }
    } catch (err) {
      console.warn('Screen share error or canceled:', err)
    }
  }, [isScreenSharing])

  return {
    isConnected,
    isHost,
    isSpeaker,
    myUserId,
    viewerCount,
    participants,
    chatMessages,
    reactions,
    isHandRaised,
    localStream,
    screenStream: screenStreamRef.current,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    sendChatMessage,
    sendReaction,
    toggleHandRaise,
    promoteToSpeaker,
    demoteSpeaker,
    kickParticipant,
    endLive,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startLocalMedia,
    mediaError,
  }
}
