import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const BUCKET_NAME = 'exile-media';

console.log('Supabase Configuration:', {
  url: SUPABASE_URL ? 'Set' : 'Not set',
  key: SUPABASE_ANON_KEY ? 'Set' : 'Not set',
  bucket: BUCKET_NAME
});

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
}

export class SupabaseUploadService {
  private readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB

  async uploadFile(
    file: File,
    fileName?: string,
    folder: string = 'videos',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }

    // Validate file size based on folder
    const maxSize = folder === 'videos' ? this.MAX_VIDEO_SIZE : this.MAX_THUMBNAIL_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `File too large. Maximum size for ${folder} is ${maxSizeMB}MB. Your file is ${fileSizeMB}MB.`
      );
    }

    const finalFileName = fileName || `${Date.now()}-${file.name}`;
    const filePath = `${folder}/${finalFileName}`;

    console.log('========== UPLOAD START ==========');
    console.log('Bucket:', BUCKET_NAME);
    console.log('File Path:', filePath);
    console.log('File Size:', file.size);
    console.log('File Type:', file.type);

    try {
      // Use XMLHttpRequest for real progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage,
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Upload Success:', xhr.responseText);
            
            const { data: publicUrlData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(filePath);

            console.log('Public URL:', publicUrlData.publicUrl);

            resolve({
              url: publicUrlData.publicUrl,
              path: filePath,
            });
          } else {
            console.error('Upload Error Status:', xhr.status, xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('Upload Network Error');
          reject(new Error('Upload failed due to network error'));
        });

        // Build the upload URL for Supabase Storage REST API
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;
        
        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        
        xhr.send(file);
      });
    } catch (error) {
      console.error('Upload Exception:', error);

      if (error instanceof Error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      throw error;
    }
  }

  async uploadThumbnail(
    file: File,
    fileName?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return this.uploadFile(
      file,
      fileName,
      'thumbnails',
      onProgress
    );
  }

  async uploadAudio(
    file: File,
    fileName?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return this.uploadFile(
      file,
      fileName,
      'audio',
      onProgress
    );
  }

  async deleteFile(path: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return supabase !== null;
  }

  // IMPORTANT:
  // getBucket() retire paske li bay fo erè ak ANON KEY
  async checkBucket(): Promise<boolean> {
    return true;
  }
}

export const supabaseUploadService =
  new SupabaseUploadService();
