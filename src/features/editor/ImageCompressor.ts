import imageCompression from 'browser-image-compression';

interface CompressOptions {
  maxWidthOrHeight?: number;
  maxSizeMB?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const defaultOptions: CompressOptions = {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  const merged = { ...defaultOptions, ...options };
  return imageCompression(file, merged);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function pickAndCompressImage(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const compressed = await compressImage(file);
        const base64 = await fileToBase64(compressed);
        resolve(base64);
      } catch {
        const base64 = await fileToBase64(file);
        resolve(base64);
      }
    };

    input.click();
  });
}
