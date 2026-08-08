import { useState, useRef, useEffect } from 'react'
import { RotateCw, Zap, Palette, X, RotateCcw } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface VideoFilters {
  brightness: number
  contrast: number
  saturate: number
  grayscale: number
  sepia: number
  hueRotate: number
  blur: number
}

interface VideoEditorProps {
  videoFile: File
  videoUrl: string
  onApplyFilters: (filters: VideoFilters) => void
  onCancel: () => void
}

export const VideoEditor = ({ videoFile, videoUrl, onApplyFilters, onCancel }: VideoEditorProps): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [filters, setFilters] = useState<VideoFilters>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    blur: 0
  })
  
  const [playbackRate, setPlaybackRate] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const getFilterString = (): string => {
    return `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturate}%)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
      hue-rotate(${filters.hueRotate}deg)
      blur(${filters.blur}px)
    `
  }

  const handleFilterChange = (key: keyof VideoFilters, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturate: 100,
      grayscale: 0,
      sepia: 0,
      hueRotate: 0,
      blur: 0
    })
    setPlaybackRate(1)
    setRotation(0)
  }

  const handleApply = () => {
    onApplyFilters(filters)
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  return (
    <div className={`fixed inset-0 z-[10003] ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'} flex flex-col`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <X className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
        </button>
        <h2 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Éditeur vidéo</h2>
        <button onClick={handleApply} className="bg-orange-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors">
          Appliquer
        </button>
      </div>

      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        <div className="relative max-w-full max-h-full">
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-[60vh] object-contain"
            style={{
              filter: getFilterString(),
              transform: `rotate(${rotation}deg)`
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Play/Pause Overlay */}
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            {isPlaying ? (
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-[-8px]" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className={`p-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'} space-y-4 max-h-[40vh] overflow-y-auto`}>
        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser tout
        </button>

        {/* Filters Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-5 h-5 text-blue-500" />
            <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Filtres</h3>
          </div>
          
          <div className="space-y-3">
            {/* Brightness */}
            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Luminosité</label>
                <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{filters.brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.brightness}
                onChange={(e) => handleFilterChange('brightness', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Contraste</label>
                <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{filters.contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.contrast}
                onChange={(e) => handleFilterChange('contrast', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Saturation</label>
                <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{filters.saturate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturate}
                onChange={(e) => handleFilterChange('saturate', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Grayscale */}
            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Noir & Blanc</label>
                <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{filters.grayscale}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.grayscale}
                onChange={(e) => handleFilterChange('grayscale', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Sepia */}
            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Sépia</label>
                <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{filters.sepia}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.sepia}
                onChange={(e) => handleFilterChange('sepia', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Hue Rotate */}
            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Teinte</label>
                <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{filters.hueRotate}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={filters.hueRotate}
                onChange={(e) => handleFilterChange('hueRotate', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Blur */}
            <div>
              <div className="flex justify-between mb-1">
                <label className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>Flou</label>
                <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{filters.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={filters.blur}
                onChange={(e) => handleFilterChange('blur', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Speed Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-green-500" />
            <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Vitesse</h3>
          </div>
          
          <div className="flex gap-2">
            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  playbackRate === rate
                    ? 'bg-orange-500 text-white'
                    : resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Rotation Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <RotateCw className="w-5 h-5 text-purple-500" />
            <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rotation</h3>
          </div>
          
          <div className="flex gap-2">
            {[0, 90, 180, 270].map((angle) => (
              <button
                key={angle}
                onClick={() => setRotation(angle)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  rotation === angle
                    ? 'bg-orange-500 text-white'
                    : resolvedTheme === 'dark'
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
