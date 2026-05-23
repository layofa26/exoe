import { useState, useRef, useEffect } from 'react'
import { Mic, Send, X, Play, Pause, AlertCircle } from 'lucide-react'

interface VoiceCommentProps {
  onSend: (audioBlob: Blob, duration: number) => void
  maxDuration?: number // in seconds
  autoDeleteAfter?: number // in hours
  accessGranted?: boolean
  commentId?: string // For localStorage persistence
}

export const VoiceComment = ({ 
  onSend, 
  maxDuration = 30, 
  autoDeleteAfter = 72,
  accessGranted = false,
  commentId
}: VoiceCommentProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Load saved audio from localStorage on mount
  useEffect(() => {
    if (commentId && accessGranted) {
      const saved = localStorage.getItem(`voice_comment_${commentId}`)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          const now = Date.now()
          const createdAt = data.createdAt
          const hoursElapsed = (now - createdAt) / (1000 * 60 * 60)
          
          if (hoursElapsed < autoDeleteAfter) {
            // Convert base64 back to blob
            const byteCharacters = atob(data.audioData)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'audio/webm' })
            
            setAudioBlob(blob)
            setAudioUrl(URL.createObjectURL(blob))
            setDuration(data.duration)
            
            // Set up auto-delete timer
            const remainingTime = (autoDeleteAfter - hoursElapsed) * 60 * 60 * 1000
            deleteTimerRef.current = setTimeout(() => {
              setIsDeleted(true)
              setAudioBlob(null)
              setAudioUrl(null)
              localStorage.removeItem(`voice_comment_${commentId}`)
            }, remainingTime)
          } else {
            localStorage.removeItem(`voice_comment_${commentId}`)
          }
        } catch (e) {
          console.error('Error loading saved audio:', e)
          localStorage.removeItem(`voice_comment_${commentId}`)
        }
      }
    }
  }, [commentId, accessGranted, autoDeleteAfter])

  // Auto-delete after specified hours
  useEffect(() => {
    if (audioBlob && accessGranted && autoDeleteAfter > 0 && !commentId) {
      deleteTimerRef.current = setTimeout(() => {
        setIsDeleted(true)
        setAudioBlob(null)
        setAudioUrl(null)
      }, autoDeleteAfter * 60 * 60 * 1000)
    }

    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }
    }
  }, [audioBlob, accessGranted, autoDeleteAfter, commentId])

  // Cleanup audio URL and audio context
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      const chunks: BlobPart[] = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Save to localStorage if commentId is provided
        if (commentId) {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64data = reader.result as string
            localStorage.setItem(`voice_comment_${commentId}`, JSON.stringify({
              audioData: base64data.split(',')[1],
              duration,
              createdAt: Date.now()
            }))
          }
          reader.readAsDataURL(blob)
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Stop audio visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setAudioLevel(0)
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setDuration(0)
      
      // Timer for duration
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
      
      // Audio level visualization
      const visualizeAudio = () => {
        if (!analyserRef.current || !isRecording) return
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average / 255)
        
        animationFrameRef.current = requestAnimationFrame(visualizeAudio)
      }
      
      visualizeAudio()
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('Impossible d\'accéder au microphone. Vérifiez les permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setAudioLevel(0)
    }
  }

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration)
      setAudioBlob(null)
      setAudioUrl(null)
      setDuration(0)
      
      // Clear localStorage
      if (commentId) {
        localStorage.removeItem(`voice_comment_${commentId}`)
      }
    }
  }

  const handleCancel = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setIsRecording(false)
    setError(null)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setAudioLevel(0)
    
    // Clear localStorage
    if (commentId) {
      localStorage.removeItem(`voice_comment_${commentId}`)
    }
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  if (!accessGranted) {
    return null
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        <button
          onClick={() => setError(null)}
          className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
        >
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    )
  }

  if (isDeleted) {
    return (
      <div className="text-sm text-gray-500 dark:text-zinc-400">
        Commentaire vocal supprimé (72h)
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {!isRecording && !audioBlob && (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Mic className="w-4 h-4" />
          Enregistrer
        </button>
      )}
      
      {isRecording && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {/* Audio level visualization */}
          <div className="flex items-center gap-1 h-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, audioLevel * 32 * (1 - i * 0.15))}px`,
                  opacity: audioLevel > (i * 0.2) ? 1 : 0.3
                }}
              />
            ))}
          </div>
          
          <div className="flex-1">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              Enregistrement en cours...
            </div>
            <div className="text-xs text-red-500 dark:text-red-500">
              {duration}s / {maxDuration}s
            </div>
          </div>
          
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Pause className="w-4 h-4" />
            Stop
          </button>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      )}
      
      {audioBlob && audioUrl && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
            className="hidden"
          />
          
          <button
            onClick={togglePlayback}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {isPlaying ? 'Lecture en cours...' : 'Message vocal'}
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-500">
              {duration}s
            </div>
          </div>
          
          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            Envoyer
          </button>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      )}
    </div>
  )
}
