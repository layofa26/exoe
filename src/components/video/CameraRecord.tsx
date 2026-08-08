import { useState, useRef, useEffect } from 'react'
import { X, Video, StopCircle, CheckCircle, AlertCircle, Camera, Flashlight, RotateCcw } from 'lucide-react'

interface CameraRecordProps {
  isOpen: boolean
  onClose: () => void
  onRecordComplete: (videoData: { videoFile: File, videoUrl: string, thumbnail: string }) => void
}

export const CameraRecord = ({ isOpen, onClose, onRecordComplete }: CameraRecordProps): JSX.Element | null => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string>('')
  const [thumbnail, setThumbnail] = useState<string>('')
  const [error, setError] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [flashEnabled, setFlashEnabled] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !isRecording && !recordedVideoUrl) {
      startCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen])

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const startCamera = async () => {
    try {
      // D'abord essayer avec des contraintes minimales
      let stream: MediaStream
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: true 
        })
      } catch (initialError) {
        console.log('Échec avec contraintes HD, tentative avec contraintes minimales:', initialError)
        // Fallback avec contraintes minimales
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facingMode }, 
          audio: true 
        })
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        videoTrackRef.current = stream.getVideoTracks()[0]
        setError('')
      }
    } catch (err) {
      console.error('Erreur caméra détaillée:', err)
      
      // Message d'erreur plus spécifique
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permission refusée. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.')
        } else if (err.name === 'NotFoundError') {
          setError('Aucune caméra détectée. Vérifiez que votre appareil dispose d\'une caméra.')
        } else if (err.name === 'NotReadableError') {
          setError('La caméra est déjà utilisée par une autre application.')
        } else if (err.name === 'OverconstrainedError') {
          setError('Contraintes de caméra non supportées. Tentative avec paramètres par défaut...')
          // Réessayer sans contraintes
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            if (videoRef.current) {
              videoRef.current.srcObject = stream
              streamRef.current = stream
              videoTrackRef.current = stream.getVideoTracks()[0]
              setError('')
            }
          } catch (retryError) {
            setError('Impossible d\'accéder à la caméra. Vérifiez les permissions et votre connexion HTTPS.')
          }
          return
        } else {
          setError(`Erreur: ${err.message}. Vérifiez que vous utilisez HTTPS et que les permissions sont accordées.`)
        }
      } else {
        setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      videoTrackRef.current = null
    }
  }

  const toggleCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)
    stopCamera()
    // Petit délai pour permettre à l'ancienne caméra de se fermer
    setTimeout(() => {
      startCamera()
    }, 100)
  }

  const toggleFlash = async () => {
    if (videoTrackRef.current) {
      const capabilities = (videoTrackRef.current as any).getCapabilities()
      if (capabilities.torch) {
        const newFlashState = !flashEnabled
        await videoTrackRef.current.applyConstraints({
          advanced: [{ torch: newFlashState }] as any
        })
        setFlashEnabled(newFlashState)
      }
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedVideoUrl(url)
        setRecordedChunks(chunks)
        setIsRecording(false)
        setRecordingTime(0)
        
        // Capture thumbnail
        captureThumbnail(url)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setError('')
    } catch (err) {
      console.error('Erreur enregistrement:', err)
      setError('Erreur lors du démarrage de l\'enregistrement')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const captureThumbnail = (videoUrl: string) => {
    const video = document.createElement('video')
    video.src = videoUrl
    video.currentTime = 1
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setThumbnail(dataUrl)
      }
    }
  }

  const handleRetake = () => {
    setRecordedVideoUrl('')
    setRecordedChunks([])
    setThumbnail('')
    setIsRecording(false)
    setRecordingTime(0)
    startCamera()
  }

  const handleConfirm = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const file = new File([blob], `camera-video-${Date.now()}.webm`, { type: 'video/webm' })
      
      onRecordComplete({
        videoFile: file,
        videoUrl: recordedVideoUrl,
        thumbnail: thumbnail || ''
      })
      
      onClose()
    }
  }

  const handleClose = () => {
    stopCamera()
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    setRecordedVideoUrl('')
    setRecordedChunks([])
    setThumbnail('')
    setIsRecording(false)
    setRecordingTime(0)
    setError('')
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
    >
      <div className="h-full w-full sm:h-[90vh] sm:w-full sm:max-w-4xl bg-black flex flex-col overflow-hidden">
        {/* Controls Header - YouTube Style */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2">
            {/* Flash Toggle */}
            <button
              onClick={toggleFlash}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Flash"
            >
              <Flashlight className={`w-6 h-6 ${flashEnabled ? 'text-yellow-400' : 'text-white'}`} />
            </button>
            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Changer de caméra"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Video Preview / Recording - Full Screen */}
        <div className="flex-1 relative bg-black">
          {recordedVideoUrl ? (
            <video
              src={recordedVideoUrl}
              controls
              className="w-full h-full object-contain"
              playsInline
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
              />
              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-20 left-4 bg-red-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                </div>
              )}
              {/* Error Message */}
              {error && (
                <div className="absolute top-20 left-4 right-4 bg-red-600/90 text-white px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls Footer - YouTube Style */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-8 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-center gap-6">
            {recordedVideoUrl ? (
              <>
                <button
                  onClick={handleRetake}
                  className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition-colors"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Recommencer</span>
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-medium">Confirmer</span>
                </button>
              </>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!streamRef.current}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed'
                }`}
              >
                {isRecording ? (
                  <StopCircle className="w-10 h-10 text-white" />
                ) : (
                  <div className="w-8 h-8 bg-white rounded-full" />
                )}
              </button>
            )}
          </div>
          
          {!recordedVideoUrl && !isRecording && (
            <p className="text-center text-white/70 text-sm mt-4">
              Appuyez pour enregistrer
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CameraRecord
