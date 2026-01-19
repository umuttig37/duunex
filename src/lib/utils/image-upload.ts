import { createClient } from '@/lib/supabase/client';

export interface ImageUploadResult {
  url: string;
  path: string;
}

export async function uploadChatImage(file: File, taskId: string): Promise<ImageUploadResult> {
  const supabase = createClient();
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${taskId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `chat/${fileName}`;
  
  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('task-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error('Kuvan lataus epäonnistui: ' + uploadError.message);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('task-images')
    .getPublicUrl(uploadData.path);

  if (!urlData?.publicUrl) {
    throw new Error('Kuvan URL:n hakeminen epäonnistui');
  }

  return {
    url: urlData.publicUrl,
    path: uploadData.path,
  };
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Vain kuvatiedostot ovat sallittuja' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Kuvatiedosto on liian suuri (max 5MB)' };
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return { valid: false, error: 'Tiedostomuoto ei ole tuettu (JPEG, PNG, GIF, WebP)' };
  }

  return { valid: true };
}