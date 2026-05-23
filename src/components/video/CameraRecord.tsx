import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Video, StopCircle, CheckCircle, AlertCircle } from 'lucide-react'

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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      
      setError('')
    } catch (err) {
      console.error('Erreur caméra:', err)
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
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
      className="fixed inset-0 bg-[#0f0f0f]/90 z-[9999] flex items-center justify-center"
    >
      <div className="h-full sm:h-[90vh] w-full max-w-4xl bg-white flex flex-col sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {recordedVideoUrl ? 'Prévisualisation' : 'Enregistrement vidéo'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Video Preview / Recording */}
          <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
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
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {recordedVideoUrl ? (
              <>
                <button
                  onClick={handleRetake}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Recommencer
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-3 bg-pro text-white font-medium rounded-lg hover:bg-pro/90 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmer
                </button>
              </>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!streamRef.current}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                {isRecording ? (
                  <StopCircle className="w-8 h-8 text-white" />
                ) : (
                  <div className="w-6 h-6 bg-white rounded-full" />
                )}
              </button>
            )}
          </div>

          {!recordedVideoUrl && !isRecording && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Cliquez sur le bouton pour commencer l'enregistrement
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CameraRecord
