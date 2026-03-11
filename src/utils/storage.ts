import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'project-files';

/**
 * Upload a file to Supabase Storage and return its public URL.
 * Falls back to base64 data URL if Storage is not configured.
 */
export async function uploadFile(
    file: File,
    folder: string = 'uploads'
): Promise<string> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${folder}/${timestamp}_${safeName}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.warn('Supabase Storage upload failed, falling back to base64:', error.message);
        // Fallback: return base64 data URL
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return urlData.publicUrl;
}

/**
 * Upload an image with compression, then store in Supabase Storage.
 * Returns public URL (or base64 fallback).
 */
export async function uploadImage(
    file: File,
    folder: string = 'images',
    maxWidth: number = 1200,
    quality: number = 0.7
): Promise<string> {
    // Compress first
    const compressed = await compressToBlob(file, maxWidth, quality);
    const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
    return uploadFile(compressedFile, folder);
}

/**
 * Compress an image to a Blob (JPEG)
 */
function compressToBlob(file: File, maxWidth: number, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = Math.min(maxWidth / img.width, 1);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Compression failed'));
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Delete a file from Supabase Storage by path
 */
export async function deleteFile(filePath: string): Promise<void> {
    // Only try to delete if it's a Supabase URL
    if (filePath.includes(BUCKET_NAME)) {
        const path = filePath.split(`${BUCKET_NAME}/`)[1];
        if (path) {
            await supabase.storage.from(BUCKET_NAME).remove([path]);
        }
    }
}
