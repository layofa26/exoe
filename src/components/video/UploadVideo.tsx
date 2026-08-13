import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Loader2, AlertCircle, CheckCircle, Edit3 } from 'lucide-react'
import { getPublicVideoUrl } from '../../services/supabaseClient'
import { api } from '../../services/apiClient'
import { useNotifications } from '../../contexts/NotificationContext'
import { VideoEditor } from './VideoEditor'

interface VideoFilters {
  brightness: number
  contrast: number
  saturate: number
  grayscale: number
  sepia: number
  hueRotate: number
  blur: number
}

interface UploadVideoProps {
  isOpen?: boolean
  onClose?: () => void
  initialVideoData?: { videoFile: File; videoUrl: string; thumbnail: string }
  onSuccess?: () => void
}

export const UploadVideo = ({ isOpen = false, onClose, initialVideoData, onSuccess }: UploadVideoProps): JSX.Element => {
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public')
  
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Gérer l'état d'upload pour le header mobile
  useEffect(() => {
    if (isUploading) {
      localStorage.setItem('exile_uploading_video', 'true')
    } else {
      localStorage.removeItem('exile_uploading_video')
    }
  }, [isUploading])
  const [error, setError] = useState<string | null>(null)
  
  const [showVideoEditor, setShowVideoEditor] = useState(false)
  const [videoFilters, setVideoFilters] = useState<VideoFilters>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    blur: 0
  })
  
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (initialVideoData) {
      setVideoFile(initialVideoData.videoFile)
    }
  }, [initialVideoData])
  
  useEffect(() => {
    if (!isOpen && onClose) {
      setTitle('')
      setDescription('')
      setVisibility('public')
      setVideoFile(null)
      setThumbnailFile(null)
      setUploadProgress(0)
      setError(null)
      if (videoInputRef.current) videoInputRef.current.value = ''
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
    }
  }, [isOpen, onClose])
  
  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > MAX_FILE_SIZE) {
      setError('La vidéo ne doit pas dépasser 2GB')
      return
    }
    
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError('Format de vidéo non supporté. Utilisez MP4, MOV, AVI ou WebM')
      return
    }
    
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setError(null)
  }

  const handleEditVideo = () => {
    if (videoFile && videoUrl) {
      setShowVideoEditor(true)
    }
  }

  const handleApplyFilters = (filters: VideoFilters) => {
    setVideoFilters(filters)
    setShowVideoEditor(false)
  }
  
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Format d\'image non supporté. Utilisez JPEG, PNG ou WebM')
      return
    }
    
    setThumbnailFile(file)
    setError(null)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!videoFile) {
      setError('Veuillez sélectionner une vidéo')
      return
    }
    
    if (!title.trim()) {
      setError('Veuillez entrer un titre')
      return
    }
    
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    
    try {
      // Use backend upload endpoint
      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('is_public', visibility === 'public' ? 'true' : 'false')
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile)
      }
      
      // Simulate upload progress for UX
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 10
        if (progress <= 90) {
          setUploadProgress(progress)
        }
      }, 200)
      
      const result = await api.upload('/accueil/videos/', formData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (result.success) {
        addNotification('success', 'Vidéo uploadée avec succès!')
        setTitle('')
        setDescription('')
        setVisibility('public')
        setVideoFile(null)
        setThumbnailFile(null)
        setUploadProgress(0)
        if (videoInputRef.current) videoInputRef.current.value = ''
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''

        // Rafraîchir le feed de vidéos en appelant une fonction globale
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('video-uploaded'))
        }

        if (onSuccess) onSuccess()
        if (onClose) onClose()
      } else {
        throw new Error(result.error || 'Erreur lors de l\'upload')
      }
    } catch (err) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload'
      setError(errorMessage)
      addNotification('error', errorMessage)
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload une vidéo</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fichier vidéo *</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-zinc-500 transition-colors">
                    {videoFile ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-gray-900 dark:text-white">{videoFile.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button type="button" onClick={() => setVideoFile(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleEditVideo}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Éditer la vidéo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-zinc-500 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">Glissez-déposez votre vidéo ou cliquez pour sélectionner</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">MP4, MOV, AVI, WebM (max 2GB)</p>
                      </div>
                    )}
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm" onChange={handleVideoSelect} className="hidden" />
                    {!videoFile && (
                      <button type="button" onClick={() => videoInputRef.current?.click()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Sélectionner une vidéo
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Miniature (optionnel)</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-zinc-500 transition-colors">
                    {thumbnailFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-gray-900 dark:text-white">{thumbnailFile.name}</span>
                        </div>
                        <button type="button" onClick={() => setThumbnailFile(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
                          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto text-gray-400 dark:text-zinc-500 mb-2" />
                        <p className="text-gray-600 dark:text-gray-400 text-sm">JPEG, PNG, WebM</p>
                      </div>
                    )}
                    <input ref={thumbnailInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailSelect} className="hidden" />
                    {!thumbnailFile && (
                      <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="mt-2 px-3 py-1.5 text-sm bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors">
                        Sélectionner une miniature
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titre *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Titre de votre vidéo" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Décrivez votre vidéo..." />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibilité</label>
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="public">Public</option>
                    <option value="private">Privé</option>
                    <option value="unlisted">Non listé</option>
                  </select>
                </div>
                
                {isUploading && (
                  <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload en cours...</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-zinc-600 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
                
                <button type="submit" disabled={isUploading || !videoFile} className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload la vidéo
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Video Editor Modal */}
      {showVideoEditor && videoFile && videoUrl && (
        <VideoEditor
          videoFile={videoFile}
          videoUrl={videoUrl}
          onApplyFilters={handleApplyFilters}
          onCancel={() => setShowVideoEditor(false)}
        />
      )}
    </>
  )
}
