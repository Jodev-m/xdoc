"use client";

import { useState, useEffect, useRef } from "react";
import { ProjectImageService } from "@/services";
import type { ProjectImageEntry } from "@/db";
import { ImagePlus, Trash2, X } from "lucide-react";

interface ProjectGalleryProps {
  projectId: string;
}

export function ProjectGallery({ projectId }: ProjectGalleryProps) {
  const [images, setImages] = useState<ProjectImageEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => ProjectImageService.getImages(projectId).then(setImages);

  useEffect(() => {
    load();
  }, [projectId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await ProjectImageService.addImage(projectId, file);
    await load();
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    await ProjectImageService.deleteImage(id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Références visuelles
        </h3>
        <button
          onClick={() => setOpen(!open)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {open ? "Masquer" : `${images.length} image${images.length > 1 ? "s" : ""}`}
        </button>
      </div>

      {open && (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id="gallery-upload"
          />
          <label
            htmlFor="gallery-upload"
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-sm text-neutral-500"
          >
            <ImagePlus size={18} />
            Ajouter une image
          </label>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border dark:border-neutral-700">
                  <img
                    src={img.data}
                    alt={img.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreview(img.data)}
                  />
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="absolute top-1 right-1 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 text-center py-2">
              Aucune image. Ajoute des captures d&apos;écran, maquettes ou inspirations.
            </p>
          )}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img src={preview} alt="Aperçu" className="max-w-full max-h-[90vh] rounded-lg" />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
