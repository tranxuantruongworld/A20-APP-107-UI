'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { PresentationMaterial } from '@/lib/types/interactions';
import { supabase } from '@/lib/supabase';

interface MaterialsUploadProps {
  seminarId: string;
  onMaterialAdded?: (material: PresentationMaterial) => void;
}

export function MaterialsUpload({
  seminarId,
  onMaterialAdded,
}: MaterialsUploadProps) {
  const [materials, setMaterials] = useState<PresentationMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMaterials();
  }, [seminarId]);

  async function fetchMaterials() {
    try {
      const { data, error } = await supabase
        .from('presentation_materials')
        .select('*')
        .eq('seminar_id', seminarId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMaterials((data || []) as PresentationMaterial[]);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];

    try {
      // For now, we'll skip the actual Vercel Blob upload
      // In production, integrate with Vercel Blob storage
      const filePath = `${seminarId}/${Date.now()}_${file.name}`;

      // Add material record to database
      const newMaterial: Omit<PresentationMaterial, 'id' | 'created_at'> = {
        seminar_id: seminarId,
        title: file.name.split('.')[0],
        file_url: filePath,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: 'presenter',
        is_visible: true,
        display_order: materials.length,
      };

      const { data, error } = await supabase
        .from('presentation_materials')
        .insert(newMaterial)
        .select()
        .single();

      if (error) throw error;

      const material = data as PresentationMaterial;
      setMaterials((prev) => [...prev, material]);

      if (onMaterialAdded) {
        onMaterialAdded(material);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      alert('Failed to upload material');
    } finally {
      setUploading(false);
    }
  }

  async function toggleVisibility(id: string, current: boolean) {
    try {
      const { error } = await supabase
        .from('presentation_materials')
        .update({ is_visible: !current })
        .eq('id', id);

      if (error) throw error;

      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_visible: !current } : m))
      );
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  }

  async function deleteMaterial(id: string) {
    try {
      const { error } = await supabase
        .from('presentation_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png,.gif"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Material
            </>
          )}
        </button>
        <p className="text-xs text-muted-foreground mt-3">
          PDF, PowerPoint, Word, Excel, or images
        </p>
      </div>

      {/* Materials List */}
      {materials.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {materials.length} Material{materials.length !== 1 ? 's' : ''}
          </p>
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {material.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(material.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVisibility(material.id, material.is_visible)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                  title={material.is_visible ? 'Hide' : 'Show'}
                >
                  {material.is_visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteMaterial(material.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {materials.length === 0 && !loading && (
        <p className="text-center text-sm text-muted-foreground py-6">
          No materials uploaded yet
        </p>
      )}
    </div>
  );
}
