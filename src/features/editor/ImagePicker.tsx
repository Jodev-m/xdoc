"use client";

import { Camera } from "lucide-react";

interface ImagePickerProps {
  onImagePicked: (base64: string) => void;
  onClose: () => void;
}

export function ImagePicker({ onImagePicked, onClose }: ImagePickerProps) {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { compressImage, fileToBase64 } = await import('./ImageCompressor');

    try {
      const compressed = await compressImage(file);
      const base64 = await fileToBase64(compressed);
      onImagePicked(base64);
    } catch {
      const base64 = await fileToBase64(file);
      onImagePicked(base64);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold mb-4">Ajouter une image</h2>
        <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-neutral-50">
          <Camera size={40} className="text-neutral-500 dark:text-neutral-400" />
          <span className="text-sm text-neutral-600">
            Choisir une photo (JPEG, max 1600px)
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 text-sm rounded-lg border hover:bg-neutral-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
