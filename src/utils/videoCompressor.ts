/**
 * videoCompressor.ts
 * 
 * Modil konpresyon videyo dirèk nan navigatè a (Client-side).
 * Li redwi rezolisyon an (maksimòm 720p/1080p) ak bitrate videyo a
 * pou diminye pwa fichye a (pa egzanp soti 100MB rive 15MB - 25MB)
 * avan li monte sou Supabase.
 */

export interface CompressionOptions {
  maxDimension?: number // eg. 1280 for 720p HD
  videoBitrate?: number // eg. 1_500_000 (1.5 Mbps)
  audioBitrate?: number // eg. 128_000 (128 kbps)
  onProgress?: (percent: number) => void
}

export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<{ compressedFile: File; originalSize: number; compressedSize: number; savedPercent: number }> {
  const originalSize = file.size
  const maxDimension = options.maxDimension || 1280
  const videoBitrate = options.videoBitrate || 1_800_000 // 1.8 Mbps - ideyal pou HD lejè
  const audioBitrate = options.audioBitrate || 128_000

  // Si fichye a deja piti anpil (< 8MB), pa gen bezwen re-konprese l
  if (originalSize < 8 * 1024 * 1024) {
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0
    }
  }

  // Verifye si navigatè a sipòte MediaRecorder ak captureStream
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
    console.warn('[VideoCompressor] MediaRecorder or captureStream not supported in this environment, using original file.')
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0
    }
  }

  return new Promise((resolve) => {
    const videoUrl = URL.createObjectURL(file)
    const videoEl = document.createElement('video')
    videoEl.src = videoUrl
    videoEl.muted = true
    videoEl.playsInline = true
    videoEl.preload = 'auto'

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl)
      videoEl.pause()
      videoEl.removeAttribute('src')
      videoEl.load()
    }

    const fallbackOriginal = () => {
      cleanup()
      resolve({
        compressedFile: file,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0
      })
    }

    videoEl.onerror = () => {
      fallbackOriginal()
    }

    videoEl.onloadedmetadata = () => {
      try {
        const originalWidth = videoEl.videoWidth || 1280
        const originalHeight = videoEl.videoHeight || 720
        const duration = videoEl.duration || 1

        // Kalkile nouvo dimansyon yo avèk menm aspect ratio
        let targetWidth = originalWidth
        let targetHeight = originalHeight

        if (Math.max(originalWidth, originalHeight) > maxDimension) {
          if (originalWidth >= originalHeight) {
            targetWidth = maxDimension
            targetHeight = Math.round((originalHeight * maxDimension) / originalWidth)
          } else {
            targetHeight = maxDimension
            targetWidth = Math.round((originalWidth * maxDimension) / originalHeight)
          }
        }

        // Fòse dimansyon pè (even numbers) pou konpatibilite kodèk
        targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1
        targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d', { alpha: false })

        if (!ctx) {
          fallbackOriginal()
          return
        }

        // Kreye stream soti nan canvas
        const stream = canvas.captureStream(30) // 30 FPS

        // Rekipere odyo si li posib
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const source = audioCtx.createMediaElementSource(videoEl)
          const dest = audioCtx.createMediaStreamDestination()
          source.connect(dest)
          source.connect(audioCtx.destination)
          dest.stream.getAudioTracks().forEach(track => stream.addTrack(track))
        } catch {
          // Si pa ka kaptire odyo a dirèkteman, kontinye ak video stream la
        }

        // Chwazi mimeType ki pi byen sipòte
        let mimeType = 'video/webm;codecs=vp8,opus'
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
          mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
          mimeType = 'video/webm;codecs=h264'
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9'
        }

        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
          videoBitsPerSecond: videoBitrate,
          audioBitsPerSecond: audioBitrate
        })

        const chunks: Blob[] = []

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        recorder.onstop = () => {
          cleanup()
          const outputBlob = new Blob(chunks, { type: mimeType.split(';')[0] || 'video/mp4' })

          // Si fichye konprese a vin pi piti pase orijinal la, sèvi avèk li
          if (outputBlob.size > 0 && outputBlob.size < originalSize) {
            const ext = mimeType.includes('mp4') ? '.mp4' : '.webm'
            const baseName = file.name.replace(/\.[^/.]+$/, '')
            const compressedFile = new File([outputBlob], `${baseName}_optimized${ext}`, {
              type: outputBlob.type
            })

            const savedPercent = Math.round(((originalSize - outputBlob.size) / originalSize) * 100)
            options.onProgress?.(100)
            resolve({
              compressedFile,
              originalSize,
              compressedSize: outputBlob.size,
              savedPercent
            })
          } else {
            // Si l pa vin pi piti, kenbe orijinal la
            fallbackOriginal()
          }
        }

        let animationFrameId: number

        const renderLoop = () => {
          if (videoEl.paused || videoEl.ended) return
          ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight)

          // Pwogresyon
          if (options.onProgress && duration > 0) {
            const percent = Math.min(99, Math.round((videoEl.currentTime / duration) * 100))
            options.onProgress(percent)
          }

          animationFrameId = requestAnimationFrame(renderLoop)
        }

        videoEl.onplay = () => {
          recorder.start(500)
          renderLoop()
        }

        videoEl.onended = () => {
          cancelAnimationFrame(animationFrameId)
          if (recorder.state !== 'inactive') {
            recorder.stop()
          }
        }

        // Lanse lekti videyo a pou konpresyon
        videoEl.play().catch(() => {
          fallbackOriginal()
        })

      } catch (err) {
        console.warn('[VideoCompressor] Compression failed with exception, fallback to original:', err)
        fallbackOriginal()
      }
    }
  })
}
