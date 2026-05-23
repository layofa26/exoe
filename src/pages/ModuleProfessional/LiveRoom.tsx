import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Users, MessageSquare, Heart, Flame, Trophy,
  Send, Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, ArrowLeft
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

// ============ JITSI MEET INTEGRATION ============
// Si ou bezwen vre Jitsi, itilize bibliyotèk ofisyèl yo:
// npm install @jitsi/react-sdk
// Epi ranplase iframe sa a pa <JitsiMeeting />

export default function LiveRoom() {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const roomName = searchParams.get('room') || `exile-${eventId}`
  const jitsiRef = useRef<HTMLDivElement>(null)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Host', text: 'Bienvenue dans le live ! Posez vos questions ici.', isHost: true, time: '14:32' },
    { id: 2, user: 'Alice', text: 'Super qualité vidéo !', isHost: false, time: '14:35' },
    { id: 3, user: 'Bob', text: 'Est-ce que le replay sera disponible ?', isHost: false, time: '14:36' },
  ])
  const [newMessage, setNewMessage] = useState('')

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [viewerCount, setViewerCount] = useState(156)
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isUserInLive, setIsUserInLive] = useState(true) // Sèlman utilisateur anndan live ka itilize featir yo

  // Jitsi Meet iframe URL
  const jitsiUrl = `https://meet.jit.si/${roomName}#config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.DEFAULT_BACKGROUND=\#0f0f0f&interfaceConfig.DEFAULT_LOGO_URL=&interfaceConfig.SHOW_POWERED_BY=false`

  // Simule vre viewer count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 3) - 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const sendReaction = (emoji: string) => {
    if (!isUserInLive) return // Sèlman utilisateur anndan live ka voye emoji
    const id = Date.now()
    setReactions(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }])
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id))
    }, 3000)
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    if (!isUserInLive) return // Sèlman utilisateur anndan live ka voye mesaj
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

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col md:flex-row">
      {/* ============ ZON VIDEO (JITSI) ============ */}
      <div className="flex-1 flex flex-col relative">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => eventId ? navigate(`/pro/events/${eventId}/preview`) : navigate('/pro/events')}
              className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white">{roomName}</h1>
              <div className="flex items-center gap-2 text-[10px] text-white/60">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {viewerCount}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-colors"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Jitsi iframe - pran TOUT espas videyo */}
        <div className="flex-1 relative bg-black">
          <iframe
            ref={jitsiRef as any}
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-0"
            style={{ display: 'block' }}
          />

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
                  className="absolute bottom-20 text-3xl"
                >
                  {r.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls bar - mobil optimized */}
        <div className="bg-[#0f0f0f] border-t border-zinc-800/60 p-3 md:p-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 md:p-3.5 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3 md:p-3.5 rounded-full transition-all ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </div>

            {/* Reaction buttons */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={() => sendReaction('🔥')}
                disabled={!isUserInLive}
                className={`p-2 md:p-2.5 rounded-xl transition-all text-lg ${isUserInLive ? 'bg-white/5 hover:bg-orange-500/20' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
              >🔥</button>
              <button
                onClick={() => sendReaction('❤️')}
                disabled={!isUserInLive}
                className={`p-2 md:p-2.5 rounded-xl transition-all text-lg ${isUserInLive ? 'bg-white/5 hover:bg-red-500/20' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
              >❤️</button>
              <button
                onClick={() => sendReaction('👏')}
                disabled={!isUserInLive}
                className={`p-2 md:p-2.5 rounded-xl transition-all text-lg ${isUserInLive ? 'bg-white/5 hover:bg-yellow-500/20' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
              >👏</button>
              <button
                onClick={() => sendReaction('🎉')}
                disabled={!isUserInLive}
                className={`p-2 md:p-2.5 rounded-xl transition-all text-lg ${isUserInLive ? 'bg-white/5 hover:bg-purple-500/20' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
              >🎉</button>
            </div>

            <button
              onClick={() => navigate('/pro/events')}
              className="p-3 md:p-3.5 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ============ CHAT SIDEBAR (toggleable on mobile) ============ */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 md:static md:w-[360px] md:inset-auto bg-[#0f0f0f] border-l border-zinc-800/60 flex flex-col"
          >
            {/* Chat header */}
            <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} />
                <h3 className="text-sm font-bold text-white">Chat en direct</h3>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg md:hidden"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.isHost ? 'items-start' : 'items-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.isHost
                      ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}>
                    <p className="text-[10px] font-bold mb-0.5 opacity-60">{msg.user}</p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-zinc-600 mt-0.5">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800/60">
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={isUserInLive ? "Écrivez un message..." : "Rejoignez le live pour envoyer des messages"}
                  disabled={!isUserInLive}
                  className={`w-full rounded-xl pl-4 pr-12 py-3 text-sm transition-colors ${
                    isUserInLive
                      ? 'bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-500 placeholder-zinc-600 cursor-not-allowed opacity-50'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!isUserInLive}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    isUserInLive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              {!isUserInLive && (
                <p className="text-xs text-zinc-500 mt-2 text-center">Vous devez rejoindre le live pour interagir</p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat toggle button (mobile) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-24 right-4 z-30 p-3 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30 md:hidden"
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  )
}
