import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Users, MessageSquare, Send, Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, ArrowLeft,
  Monitor, Hand, ShieldAlert, UserPlus, UserX, Star, Award, Download, Check
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface Participant {
  id: string
  name: string
  avatar?: string
  isHost?: boolean
  isSpeaker?: boolean
  isHandRaised?: boolean
  isBlocked?: boolean
}

export default function LiveRoom() {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const roomName = searchParams.get('room') || `exile-${eventId}`
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showParticipantsTab, setShowParticipantsTab] = useState(false)
  
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Host', text: 'Bienvenue dans le direct ! Posez vos questions ici.', isHost: true, time: '14:32' },
    { id: 2, user: 'Alice', text: 'Excellente qualité sonore et vidéo !', isHost: false, time: '14:35' },
    { id: 3, user: 'Bob', text: 'Est-ce que le replay sera disponible ?', isHost: false, time: '14:36' },
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [viewerCount, setViewerCount] = useState(156)
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isUserInLive, setIsUserInLive] = useState(true)

  // Host Controls & Participants State
  const [isHost] = useState(true) // Mode organisateur
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Dr. Marc Antoine (Vous)', isHost: true, isSpeaker: true },
    { id: '2', name: 'Sophie Laurent', isSpeaker: true },
    { id: '3', name: 'Pierre Durand', isHandRaised: true },
    { id: '4', name: 'Marie Martin', isHandRaised: false },
  ])

  // Modals de fin de live
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // WebRTC Native Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null
    const startStream = async () => {
      try {
        if (!isVideoOff && !isScreenSharing) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          setMediaStream(stream)
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        }
      } catch (err) {
        console.log('Stream local ou permission:', err)
      }
    }
    startStream()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isVideoOff, isScreenSharing])

  // Partage d'écran (Screen Share - Item 26)
  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setIsScreenSharing(true)
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          if (mediaStream && videoRef.current) {
            videoRef.current.srcObject = mediaStream
          }
        }
        showToast("🖥️ Partage d'écran activé")
      } else {
        setIsScreenSharing(false)
        if (mediaStream && videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
        showToast("Partage d'écran arrêté")
      }
    } catch (err) {
      console.log('Partage d d\'écran annulé ou non supporté:', err)
    }
  }

  // Lever la main (Raise Hand - Item 25)
  const handleToggleHandRaise = () => {
    const nextState = !isHandRaised
    setIsHandRaised(nextState)
    if (nextState) {
      showToast("✋ Vous avez levé la main pour parler")
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        user: 'Système',
        text: '✋ Un participant a levé la main pour demander la parole.',
        isHost: true,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }])
    } else {
      showToast("Main baissée")
    }
  }

  // Inviter sur scène (Item 29)
  const handlePromoteToSpeaker = (id: string, name: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, isSpeaker: true, isHandRaised: false } : p))
    showToast(`🎙️ ${name} est invité(e) sur scène !`)
  }

  // Expulser / Bloquer un participant (Item 30)
  const handleKickParticipant = (id: string, name: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id))
    showToast(`🚫 ${name} a été expulsé(e) du live.`)
  }

  // Simule vre viewer count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 3) - 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const sendReaction = (emoji: string) => {
    if (!isUserInLive) return
    const id = Date.now()
    setReactions(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }])
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id))
    }, 3000)
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    if (!isUserInLive) return
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: 'Moi',
      text: newMessage,
      isHost: false,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }])
    setNewMessage('')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleLeaveLive = () => {
    // Proposer l'évaluation du live à la sortie
    setShowRatingModal(true)
  }

  return (
    <div className={`fixed inset-0 z-50 ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-900'} flex flex-col md:flex-row font-sans`}>
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white border border-zinc-700 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* ============ ZON VIDEO ============ */}
      <div className="flex-1 flex flex-col relative">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-2.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleLeaveLive}
              className="p-1.5 sm:p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-white">{roomName}</h1>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-white/60">
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  EN DIRECT
                </span>
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Users className="w-3 h-3" />
                  {viewerCount} participants
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
              className="p-1.5 sm:p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* WebRTC Live Stream Video */}
        <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
          {isVideoOff && !isScreenSharing ? (
            <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
              <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="text-sm font-medium">Caméra désactivée</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover"
            />
          )}

          {/* Badge main levée sur la vidéo */}
          {isHandRaised && (
            <div className="absolute top-16 left-4 bg-amber-500/90 text-black px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg animate-bounce">
              <Hand size={14} />
              Main levée
            </div>
          )}

          {/* Flying reactions */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {reactions.map(r => (
                <motion.div
                  key={r.id}
                  initial={{ y: '100%', x: `${r.x}%`, opacity: 1, scale: 0.5 }}
                  animate={{ y: '-100%', opacity: 0, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.5, ease: 'easeOut' }}
                  className="absolute bottom-16 sm:bottom-20 text-2xl sm:text-3xl"
                >
                  {r.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls bar */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800/60' : 'bg-gray-800 border-gray-700/60'} border-t p-2 sm:p-3 md:p-4`}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              {/* Micro (Item 23) */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Activer le micro" : "Désactiver le micro"}
                className={`p-2.5 sm:p-3 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Caméra (Item 24) */}
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                title={isVideoOff ? "Activer la caméra" : "Désactiver la caméra"}
                className={`p-2.5 sm:p-3 rounded-full transition-all ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              {/* Partage d'écran (Item 26) */}
              <button
                onClick={handleToggleScreenShare}
                title="Partager l'écran"
                className={`p-2.5 sm:p-3 rounded-full transition-all ${isScreenSharing ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <Monitor size={18} />
              </button>

              {/* Lever la main (Item 25) */}
              <button
                onClick={handleToggleHandRaise}
                title="Lever la main"
                className={`p-2.5 sm:p-3 rounded-full transition-all ${isHandRaised ? 'bg-amber-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <Hand size={18} />
              </button>
            </div>

            {/* Reaction buttons (Item 28) */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              {['👍', '👏', '❤️', '🔥', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  disabled={!isUserInLive}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-base sm:text-lg transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Bouton Quitter (Item 22) */}
            <button
              onClick={handleLeaveLive}
              title="Quitter le live"
              className="p-2.5 sm:p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <PhoneOff size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ============ CHAT & PARTICIPANTS SIDEBAR ============ */}
      <AnimatePresence>
        {(isChatOpen || showParticipantsTab) && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-0 z-40 md:static md:w-[340px] ${resolvedTheme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800/60' : 'bg-gray-900 border-gray-700/60'} border-l flex flex-col`}
          >
            {/* Sidebar Header Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 p-2">
              <button
                onClick={() => { setIsChatOpen(true); setShowParticipantsTab(false); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  isChatOpen && !showParticipantsTab ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MessageSquare size={14} />
                Chat Live
              </button>
              <button
                onClick={() => { setShowParticipantsTab(true); setIsChatOpen(false); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  showParticipantsTab ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users size={14} />
                Participants ({participants.length})
              </button>
              <button
                onClick={() => { setIsChatOpen(false); setShowParticipantsTab(false); }}
                className="p-2 text-zinc-400 hover:text-white md:hidden"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Tab 1: Chat Live */}
            {!showParticipantsTab && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isHost ? 'items-start' : 'items-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
                        msg.isHost
                          ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                          : 'bg-zinc-800 text-zinc-200'
                      }`}>
                        <p className="text-[10px] font-bold opacity-60 mb-0.5">{msg.user}</p>
                        <p className="text-xs">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-zinc-600 mt-0.5">{msg.time}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendMessage} className="p-3 border-t border-white/10">
                  <div className="relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Écrivez un message..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send size={14} className="text-white" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Content Tab 2: Participants Management (Items 29 & 30) */}
            {showParticipantsTab && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Gestion des Participants</p>
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {p.isHost ? '👑 Hôte' : p.isSpeaker ? '🎙️ Intervenant' : '👀 Participant'}
                        </p>
                      </div>
                    </div>

                    {isHost && !p.isHost && (
                      <div className="flex items-center gap-1">
                        {!p.isSpeaker && (
                          <button
                            onClick={() => handlePromoteToSpeaker(p.id, p.name)}
                            title="Inviter sur scène"
                            className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                          >
                            <UserPlus size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleKickParticipant(p.id, p.name)}
                          title="Expulser du live"
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

      {/* Floating Chat Trigger Button (Mobile) */}
      {!isChatOpen && !showParticipantsTab && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-20 right-4 z-30 p-3 bg-blue-600 text-white rounded-full shadow-xl md:hidden"
        >
          <MessageSquare size={18} />
        </button>
      )}

      {/* ============ MODAL 1 : ÉVALUATION POST-LIVE (Items 33 & 34) ============ */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-center">Avez-vous apprécié cet événement ?</h3>
            <p className="text-xs text-zinc-400 text-center">Donnez votre avis pour aider les organisateurs</p>

            {/* Étoiles 1-5 */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star size={28} className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                </button>
              ))}
            </div>

            {/* Commentaire */}
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Laissez un commentaire sur cet événement..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRatingModal(false)
                  setShowCertificateModal(true)
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Award size={14} />
                Voir mon certificat
              </button>
              <button
                onClick={() => navigate('/pro/events')}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL 2 : CERTIFICAT DE PARTICIPATION (Item 36) ============ */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 text-white rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Award size={28} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-amber-400">CERTIFICAT DE PARTICIPATION</h3>
              <p className="text-xs text-zinc-400 mt-1">Délivré par EXILE Platform</p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 text-left space-y-2">
              <p className="text-xs text-zinc-300">Ce certificat atteste que <strong className="text-white font-bold">Dr. Marc Antoine</strong> a participé avec succès à l'événement en direct :</p>
              <p className="text-sm font-bold text-amber-300">"{roomName}"</p>
              <p className="text-[10px] text-zinc-400">Date: {new Date().toLocaleDateString('fr-FR')} · Durée: 45 min</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  showToast("📜 Certificat téléchargé avec succès !")
                  setTimeout(() => navigate('/pro/events'), 1500)
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Download size={15} />
                Télécharger (PDF/PNG)
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
