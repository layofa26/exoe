import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Users, MessageSquare, Send, Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, ArrowLeft,
  Monitor, Hand, UserPlus, UserMinus, UserX, Star, Award, Download, Wifi, WifiOff, Loader2, Sparkles,
  Crown, Eye, Lock, Volume2, ThumbsUp, Heart, Flame, PartyPopper
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useLiveWebRTC } from '../../hooks/useLiveWebRTC'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

export default function LiveRoom() {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const roomNameParam = searchParams.get('room')
  const { user } = useAuth()

  const [eventData, setEventData] = useState<any>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showParticipantsTab, setShowParticipantsTab] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAudioBlocked, setIsAudioBlocked] = useState(false)

  // Enregistrement du direct (Host Recording)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<any>(null)

  // Modals de fin de live
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }, [])

  const handleStreamEnded = useCallback(() => {
    setShowRatingModal(true)
  }, [])

  const handleKicked = useCallback(() => {
    alert("Vous avez été retiré(e) du direct par l'organisateur.")
    navigate('/pro/events')
  }, [navigate])

  // Fetch Event Details to check ownership
  useEffect(() => {
    if (!eventId) return
    const fetchEvent = async () => {
      const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
      try {
        const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/`)
        if (res.ok) {
          const data = await res.json()
          setEventData(data)
        }
      } catch (e) {
        console.warn('Error fetching event data:', e)
      }
    }
    fetchEvent()
  }, [eventId])

  const isOwner = Boolean(
    user?.id && eventData?.owner_id && String(user.id) === String(eventData.owner_id)
  )

  // WebRTC & WebSocket Live Hook
  const {
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
    screenStream,
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
  } = useLiveWebRTC({
    eventId: eventId || 'default',
    initialIsHost: isOwner,
    onToast: showToast,
    onStreamEnded: handleStreamEnded,
    onKicked: handleKicked,
  })

  // Bind Video Stream to video element
  useEffect(() => {
    if (!videoRef.current) return

    if (isHost || isSpeaker) {
      const activeStream = isScreenSharing && screenStream ? screenStream : localStream
      if (activeStream) {
        videoRef.current.srcObject = activeStream
        videoRef.current.play().catch(() => {})
      }
    } else {
      if (remoteStream) {
        videoRef.current.srcObject = remoteStream
        videoRef.current.play().catch((err: any) => {
          if (err?.name === 'NotAllowedError') {
            if (videoRef.current) {
              videoRef.current.muted = true
              videoRef.current.play().catch(() => {})
            }
            setIsAudioBlocked(true)
          }
        })
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [isHost, isSpeaker, isScreenSharing, screenStream, localStream, remoteStream])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    sendChatMessage(newMessage)
    setNewMessage('')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = useCallback(() => {
    const activeStream = isScreenSharing && screenStream ? screenStream : localStream
    if (!activeStream || activeStream.getTracks().length === 0) {
      showToast('Flux vidéo introuvable pour enregistrer')
      return
    }

    try {
      recordedChunksRef.current = []
      let options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9,opus' }
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options = { mimeType: 'video/webm' }
      }

      const recorder = new MediaRecorder(activeStream, options)
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        clearInterval(recordingTimerRef.current)
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        if (blob.size > 0) {
          showToast("Sauvegarde de l'enregistrement en cours...")
          
          // Téléchargement local automatique pour l'hôte
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = `live-recording-${eventId || Date.now()}.webm`
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }, 200)

          // Upload automatique vers l'API backend pour la rediffusion
          const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
          const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
          if (token && cleanId && !isNaN(Number(cleanId))) {
            const formData = new FormData()
            formData.append('recording', blob, `live-${cleanId}.webm`)
            try {
              const res = await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/upload_recording/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
              })
              if (res.ok) {
                showToast("Rediffusion enregistrée et disponible sur la plateforme !")
              }
            } catch (err) {
              console.warn('Erreur téléversement enregistrement:', err)
            }
          }
        }
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingDuration(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1)
      }, 1000)
      showToast('Enregistrement du direct commencé')
    } catch (e) {
      console.error('Erreur lancement enregistrement:', e)
      showToast("Impossible d'enregistrer sur ce navigateur")
    }
  }, [eventId, isScreenSharing, localStream, screenStream, showToast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    clearInterval(recordingTimerRef.current)
  }, [])

  const handleLeaveLive = async () => {
    if (isRecording) {
      stopRecording()
    }
    if (isHost) {
      if (window.confirm('Voulez-vous terminer le direct pour tous les participants ?')) {
        endLive()
        try {
          const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
          const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
          await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/end_live/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
        } catch {}
        setShowRatingModal(true)
      }
    } else {
      setShowRatingModal(true)
    }
  }

  const handleRatingSubmit = async () => {
    setIsSubmittingRating(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
      if (token) {
        await fetch(`${API_BASE_URL}/evenement/evenements/${cleanId}/rate/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ score: rating, feedback }),
        })
      }
      showToast('Merci pour votre avis !')
    } catch {
      showToast('Avis enregistré')
    } finally {
      setIsSubmittingRating(false)
      setShowRatingModal(false)
      setShowCertificateModal(true)
    }
  }

  const downloadCertificate = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 800
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const grad = ctx.createLinearGradient(0, 0, 1200, 800)
    grad.addColorStop(0, '#0f172a')
    grad.addColorStop(1, '#1e1b4b')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1200, 800)

    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 12
    ctx.strokeRect(40, 40, 1120, 720)

    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 2
    ctx.strokeRect(55, 55, 1090, 690)

    ctx.fillStyle = '#f59e0b'
    ctx.font = 'bold 44px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('CERTIFICAT DE PARTICIPATION', 600, 160)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '20px sans-serif'
    ctx.fillText('Délivré par EXILE Professional Platform', 600, 210)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '24px sans-serif'
    ctx.fillText('Ce certificat atteste que', 600, 310)

    const participantName = user?.fullName || user?.username || 'Participant EXILE'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px sans-serif'
    ctx.fillText(participantName, 600, 380)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '24px sans-serif'
    ctx.fillText('a assisté et participé activement à l’événement en direct :', 600, 450)

    const eventTitle = eventData?.title || eventData?.name || roomNameParam || `Salon Live #${eventId}`
    ctx.fillStyle = '#38bdf8'
    ctx.font = 'bold 34px sans-serif'
    ctx.fillText(`"${eventTitle}"`, 600, 520)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '18px sans-serif'
    ctx.fillText(`Délivré le ${new Date().toLocaleDateString('fr-FR')} • Session WebRTC Live HD`, 600, 610)

    const link = document.createElement('a')
    link.download = `Certificat_EXILE_${participantName.replace(/\s+/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('Certificat téléchargé avec succès !')
    setTimeout(() => navigate('/pro/events'), 1500)
  }

  const roomTitle = eventData?.title || eventData?.name || roomNameParam || `Direct #${eventId}`

  return (
    <div className={`fixed inset-0 z-50 ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-900'} flex flex-col md:flex-row font-sans select-none`}>
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white border border-zinc-700 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* MAIN VIDEO STAGE */}
      <div className="flex-1 flex flex-col relative min-h-0">
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent p-3 sm:p-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={handleLeaveLive}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors text-white"
              title="Quitter le live"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-white max-w-[200px] sm:max-w-md truncate">
                  {roomTitle}
                </h1>
                {isHost && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown size={12} className="text-amber-400" /> Hôte
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/70">
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  EN DIRECT
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {viewerCount} en ligne
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Wifi size={11} /> Connecté
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400">
                      <WifiOff size={11} /> Reconnexion...
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowParticipantsTab(!showParticipantsTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                showParticipantsTab ? 'bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users size={14} />
              <span className="hidden sm:inline">Participants ({participants.length})</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Video Canvas / Player */}
        <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
          {(isHost || isSpeaker) && !localStream && !isScreenSharing ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-6 max-w-md bg-zinc-900/80 border border-zinc-800 rounded-3xl backdrop-blur-md m-4 shadow-2xl animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
                <VideoOff size={32} />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Caméra & Micro à autoriser
                </h2>
                <p className="text-xs text-zinc-400">
                  Votre navigateur a besoin de votre autorisation pour diffuser votre vidéo.
                </p>
              </div>

              <div className="w-full bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 text-left text-[11px] text-zinc-300 space-y-1">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-400" /> Fason pou w pèmèt li :
                </p>
                <p>1. Klike sou ikòn kadna nan ba adrès navigatè a anlè a.</p>
                <p>2. Mete <strong>Caméra</strong> ak <strong>Microphone</strong> sou <strong>Autoriser (Allow)</strong>.</p>
                <p>3. Klike sou bouton « Réessayer » ki anba a.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 w-full">
                <button
                  onClick={() => startLocalMedia()}
                  className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <Video size={14} />
                  <span>Réessayer la caméra</span>
                </button>

                <button
                  onClick={toggleScreenShare}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <Monitor size={14} />
                  <span>Partager mon écran</span>
                </button>
              </div>
            </div>
          ) : (isHost || isSpeaker) && isVideoOff && !isScreenSharing ? (
            <div className="flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
                <VideoOff size={36} className="text-zinc-500" />
              </div>
              <p className="text-sm font-semibold">Votre caméra est désactivée</p>
              <p className="text-xs text-zinc-500">Les spectateurs entendent toujours votre audio</p>
            </div>
          ) : !isHost && !isSpeaker && !remoteStream ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-6 max-w-md">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-2xl">
                  <Sparkles size={40} className="animate-pulse" />
                </div>
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 animate-ping" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Direct en cours de connexion</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Le flux vidéo WebRTC de l'organisateur se synchronise automatiquement. Vous pouvez déjà interagir dans le chat live et envoyer des réactions !
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isHost || isSpeaker}
              className="w-full h-full object-cover"
            />
          )}

          {isAudioBlocked && !isHost && (
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = false
                  videoRef.current.play().catch(() => {})
                }
                setIsAudioBlocked(false)
              }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold text-xs rounded-full shadow-2xl flex items-center gap-2 animate-bounce cursor-pointer active:scale-95 transition-all"
            >
              <Volume2 size={16} />
              <span>Cliquez ici pour activer le son en direct</span>
            </button>
          )}

          {isHandRaised && (
            <div className="absolute top-20 left-4 bg-amber-500 text-black px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-2xl animate-bounce">
              <Hand size={14} />
              Main levée
            </div>
          )}

          {/* Floating Font Icon Reactions */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {reactions.map((r) => {
                const renderReactionIcon = (val: string) => {
                  if (val === 'like' || val === '\uD83D\uDC4D') return <ThumbsUp className="w-8 h-8 text-blue-400 drop-shadow-md fill-blue-400/30" />
                  if (val === 'heart' || val === '\u2764\uFE0F' || val === '\u2764') return <Heart className="w-8 h-8 text-rose-500 drop-shadow-md fill-rose-500" />
                  if (val === 'fire' || val === '\uD83D\uDD25') return <Flame className="w-8 h-8 text-amber-500 drop-shadow-md fill-amber-500" />
                  if (val === 'celebrate' || val === '\uD83C\uDF89' || val === '\uD83D\uDC4F') return <PartyPopper className="w-8 h-8 text-purple-400 drop-shadow-md" />
                  return <Sparkles className="w-8 h-8 text-yellow-400 drop-shadow-md fill-yellow-400" />
                }
                return (
                  <motion.div
                    key={r.id}
                    initial={{ y: '100%', x: `${r.x}%`, opacity: 1, scale: 0.6 }}
                    animate={{ y: '-100%', opacity: 0, scale: 1.6 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.8, ease: 'easeOut' }}
                    className="absolute bottom-20 select-none pointer-events-none"
                  >
                    {renderReactionIcon(r.emoji)}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800/80' : 'bg-gray-800 border-gray-700'} border-t p-2.5 sm:p-3.5`}>
          <div className="flex items-center justify-between max-w-4xl mx-auto gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {(isHost || isSpeaker) ? (
                <>
                  <button
                    onClick={toggleMute}
                    title={isMuted ? 'Activer le micro' : 'Couper le micro'}
                    className={`p-3 rounded-full transition-all ${
                      isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    title={isVideoOff ? 'Activer la caméra' : 'Couper la caméra'}
                    className={`p-3 rounded-full transition-all ${
                      isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>

                  {isHost && (
                    <>
                      <button
                        onClick={toggleScreenShare}
                        title="Partager l'écran"
                        className={`p-3 rounded-full transition-all ${
                          isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <Monitor size={18} />
                      </button>

                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer le direct (Replay)"}
                        className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-full transition-all flex items-center gap-1.5 ${
                          isRecording
                            ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white animate-ping' : 'bg-red-500'}`} />
                        <span className="text-[11px] font-bold">
                          {isRecording ? formatDuration(recordingDuration) : 'REC'}
                        </span>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button
                  onClick={toggleHandRaise}
                  title={isHandRaised ? 'Baisser la main' : 'Lever la main pour parler'}
                  className={`px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${
                    isHandRaised ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Hand size={16} />
                  <span>{isHandRaised ? 'Main levée' : 'Demander la parole'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'like', icon: ThumbsUp, label: "J'aime", color: 'text-blue-400 hover:bg-blue-500/20' },
                { id: 'heart', icon: Heart, label: 'Cœur', color: 'text-rose-500 hover:bg-rose-500/20' },
                { id: 'fire', icon: Flame, label: 'Feu', color: 'text-amber-500 hover:bg-amber-500/20' },
                { id: 'celebrate', icon: PartyPopper, label: 'Bravo', color: 'text-purple-400 hover:bg-purple-500/20' },
                { id: 'sparkles', icon: Sparkles, label: 'Top', color: 'text-yellow-400 hover:bg-yellow-500/20' },
              ].map((item) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => sendReaction(item.id)}
                    title={item.label}
                    className={`p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white/5 transition-transform hover:scale-125 active:scale-95 flex items-center justify-center ${item.color}`}
                  >
                    <IconComponent size={18} />
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleLeaveLive}
              title={isHost ? 'Terminer le direct' : 'Quitter le direct'}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-red-600/30"
            >
              <PhoneOff size={16} />
              <span className="hidden sm:inline">{isHost ? 'Fin du direct' : 'Quitter'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHAT & PARTICIPANTS SIDEBAR */}
      <AnimatePresence>
        {(isChatOpen || showParticipantsTab) && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-0 z-40 md:static md:w-[350px] lg:w-[380px] ${
              resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-gray-900 border-gray-700'
            } border-l flex flex-col`}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-2.5">
              <button
                onClick={() => {
                  setIsChatOpen(true)
                  setShowParticipantsTab(false)
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  isChatOpen && !showParticipantsTab ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MessageSquare size={14} />
                Chat Live
              </button>

              <button
                onClick={() => {
                  setShowParticipantsTab(true)
                  setIsChatOpen(false)
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  showParticipantsTab ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users size={14} />
                Participants ({participants.length})
              </button>

              <button
                onClick={() => {
                  setIsChatOpen(false)
                  setShowParticipantsTab(false)
                }}
                className="p-2 text-zinc-400 hover:text-white md:hidden"
              >
                <X size={16} />
              </button>
            </div>

            {!showParticipantsTab && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                  {chatMessages.map((msg) => {
                    const isMe = String(msg.user_id) === String(myUserId)
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                            msg.isHost
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                              : msg.isSpeaker
                              ? 'bg-purple-600/20 border border-purple-500/40 text-purple-200'
                              : isMe
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-800 text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold opacity-80">
                            <span>{msg.user}</span>
                            {msg.isHost && <span className="text-amber-400 flex items-center gap-0.5"><Crown size={11} /> Hôte</span>}
                            {msg.isSpeaker && !msg.isHost && <span className="text-purple-300 flex items-center gap-0.5"><Mic size={11} /> Scène</span>}
                          </div>
                          <p className="leading-relaxed break-words">{msg.text}</p>
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-1 px-1">{msg.time}</span>
                      </div>
                    )
                  })}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Envoyer un message en direct..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="absolute right-1.5 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showParticipantsTab && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Membres en direct ({participants.length})
                </p>
                {participants.map((p) => (
                  <div
                    key={p.channel_name || p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {p.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-white truncate text-xs">{p.name}</p>
                          {p.isHandRaised && (
                            <span className="text-amber-400 text-xs animate-bounce" title="A levé la main">
                              <Hand size={13} />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          p.isHost ? (
                            <span className="inline-flex items-center gap-1"><Crown size={11} className="text-amber-400" /> Hôte</span>
                          ) : p.isSpeaker ? (
                            <span className="inline-flex items-center gap-1"><Mic size={11} className="text-purple-300" /> Sur scène</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Eye size={11} className="text-zinc-400" /> Spectateur</span>
                          )
                        </p>
                      </div>
                    </div>

                    {isHost && !p.isHost && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!p.isSpeaker ? (
                          <button
                            onClick={() => promoteToSpeaker(p.id, p.channel_name)}
                            title="Inviter à parler sur scène"
                            className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                          >
                            <UserPlus size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => demoteSpeaker(p.id)}
                            title="Retirer de la scène"
                            className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 transition-colors"
                          >
                            <UserMinus size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => kickParticipant(p.id, p.name)}
                          title="Expulser du direct"
                          className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                        >
                          <UserX size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isChatOpen && !showParticipantsTab && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-20 right-4 z-30 p-3 bg-blue-600 text-white rounded-full shadow-2xl md:hidden"
        >
          <MessageSquare size={18} />
        </button>
      )}

      {/* MODAL 1 : EVALUATION */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-center">Évaluer l'événement en direct</h3>
            <p className="text-xs text-zinc-400 text-center">Votre avis aide les organisateurs à progresser</p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star size={30} className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Partagez vos impressions ou remarques sur ce live..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleRatingSubmit}
                disabled={isSubmittingRating}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmittingRating ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                Valider & Certificat
              </button>
              <button
                onClick={() => navigate('/pro/events')}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-xs transition-colors"
              >
                Passer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : CERTIFICAT */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 text-white rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
              <Award size={28} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-amber-400">CERTIFICAT DE PARTICIPATION</h3>
              <p className="text-xs text-zinc-400 mt-1">Délivré par EXILE Professional Platform</p>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/30 text-left space-y-2">
              <p className="text-xs text-zinc-300">
                Ce certificat atteste que{' '}
                <strong className="text-white font-bold">{user?.fullName || user?.username || 'Participant'}</strong> a
                participé avec succès à l'événement en direct :
              </p>
              <p className="text-sm font-bold text-amber-300">"{roomTitle}"</p>
              <p className="text-[10px] text-zinc-400">
                Date : {new Date().toLocaleDateString('fr-FR')} • Session WebRTC Live HD
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadCertificate}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Download size={15} />
                Télécharger le Certificat (PNG)
              </button>
              <button
                onClick={() => navigate('/pro/events')}
                className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
