import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name for videos
const VIDEOS_BUCKET = 'videos'

export const uploadVideoToSupabase = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ path: string; error?: string }> => {
  try {
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `videos/${fileName}`
    
    const { data, error } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          if (onProgress) {
            const percent = (progress.loaded / progress.total) * 100
            onProgress(Math.round(percent))
          }
        }
      })
    
    if (error) {
      throw error
    }
    
    return { path: data.path }
  } catch (error) {
    console.error('Supabase upload error:', error)
    return { path: '', error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

export const getPublicVideoUrl = (path: string): string => {
  const { data } = supabase.storage
    .from(VIDEOS_BUCKET)
    .getPublicUrl(path)
  
  return data.publicUrl
}

export const deleteVideoFromSupabase = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .remove([path])
    
    return !error
  } catch (error) {
    console.error('Supabase delete error:', error)
    return false
  }
}

export const uploadThumbnailToSupabase = async (
  file: File,
  videoPath: string
): Promise<{ path: string; error?: string }> => {
  try {
    const fileName = `thumbnail-${Date.now()}-${file.name}`
    const filePath = `thumbnails/${fileName}`
    
    const { data, error } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw error
    }
    
    return { path: data.path }
  } catch (error) {
    console.error('Supabase thumbnail upload error:', error)
    return { path: '', error: error instanceof Error ? error.message : 'Upload failed' }
  }
}
