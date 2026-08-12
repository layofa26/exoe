import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name for videos (matching backend configuration)
const VIDEOS_BUCKET = 'Exile_videos'

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
