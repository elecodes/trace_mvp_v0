'use client';

import { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  value?: string;
  onChange: (path: string) => void;
  onImageSelected?: (base64: string, mimeType: string) => void;
  projectId: string;
  assetId: string;
}

export function ImageUploader({ value, onChange, onImageSelected, projectId, assetId }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    if (value.startsWith('http://') || value.startsWith('https://')) {
      setPreview(value);
      return;
    }

    let isMounted = true;
    const fetchSignedUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('asset-images')
          .createSignedUrl(value, 3600);
        if (error) throw error;
        if (isMounted && data) {
          setPreview(data.signedUrl);
        }
      } catch (err) {
        console.error('Error fetching preview signed URL:', err);
      }
    };

    fetchSignedUrl();
    return () => {
      isMounted = false;
    };
  }, [value, supabase]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Get current authenticated user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Debes iniciar sesión para subir imágenes');
      }

      // 2. Client-side Image Compression
      setCompressing(true);
      const options = {
        maxSizeMB: 0.5, // Max 500KB
        maxWidthOrHeight: 1600, // Max 1600px on the longest side
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      setCompressing(false);

      // 3. Upload to Supabase Storage bucket `asset-images`
      const fileExt = compressedFile.type.split('/')[1] || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      // Structured path: {userId}/{projectId}/{assetId}/{unique-file-name}.{ext}
      const filePath = `${user.id}/${projectId}/${assetId}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('asset-images')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Error al subir la imagen a Supabase Storage');
      }

      // Return the storage path, e.g. "userId/projectId/assetId/filename"
      onChange(data.path);

      if (onImageSelected) {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          const base64String = reader.result?.toString().split(',')[1];
          if (base64String) {
            onImageSelected(base64String, compressedFile.type);
          }
        };
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar la imagen');
    } finally {
      setLoading(false);
      setCompressing(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded">
          {error} (Asegúrate de haber creado el bucket `asset-images` privado en tu panel de Supabase)
        </div>
      )}

      {preview ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
          <Image src={preview} alt="Asset photo" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="gap-1 cursor-pointer"
            >
              <X className="h-4 w-4" /> Eliminar Imagen
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition-colors p-4">
          <div className="flex flex-col items-center justify-center text-center">
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  {compressing ? 'Comprimiendo foto en el navegador...' : 'Subiendo a Supabase...'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Optimizando peso (máx 500KB)...</p>
              </>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Hacé clic para seleccionar una foto de tu asset
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Se comprimirá automáticamente antes de subir
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>
      )}
    </div>
  );
}
