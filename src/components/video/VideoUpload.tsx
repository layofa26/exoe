import { useState, useRef } from 'react'

interface VideoUploadProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (data: { title: string, description: string, thumbnail: string, videoFile: File }) => void
  initialVideoData?: { videoFile: File, videoUrl: string, thumbnail: string } | null
}

export const VideoUpload = ({ isOpen, onClose, onUpload, initialVideoData }: VideoUploadProps): JSX.Element | null => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(initialVideoData?.videoFile || null)
  const [videoUrl, setVideoUrl] = useState(initialVideoData?.videoUrl || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  if (!isOpen) return null

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
    }
  }

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnail(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const captureVideoFrame = () => {
    if (videoRef.current && videoUrl) {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setThumbnail(dataUrl)
      }
    }
  }

  const handleUpload = () => {
    if (videoFile && title) {
      onUpload({
        title,
        description,
        thumbnail,
        videoFile
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[30000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Importer une vidéo</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
              <span className="text-gray-500 dark:text-gray-400 text-2xl">&times;</span>
            </button>
          </div>

          {/* Video Preview */}
          {videoUrl && (
            <div className="mb-6 bg-black rounded-xl overflow-hidden aspect-video">
              <video ref={videoRef} src={videoUrl} controls className="w-full h-full" />
              <button
                onClick={captureVideoFrame}
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Capturer l'image actuelle comme miniature
              </button>
            </div>
          )}

          {/* Video Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sélectionner une vidéo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
              placeholder="Titre de la vidéo"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Description de la vidéo"
            />
          </div>

          {/* Thumbnail */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Miniature (optionnel)
            </label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
            />
            {thumbnail && (
              <div className="mt-2">
                <img src={thumbnail} alt="Thumbnail" className="w-32 h-20 object-cover rounded-lg" />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
            <button
              onClick={handleUpload}
              disabled={!videoFile || !title}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoUpload
