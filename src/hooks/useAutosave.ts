import { useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export function useAutosave(
  documentId: string | undefined,
  content: unknown,
  saveFn: (id: string, content: unknown) => Promise<void>
) {
  const isFirstRender = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const save = saveFn;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!documentId) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save(documentId, content);
    }, settings.autoSaveInterval * 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [documentId, content, saveFn, settings.autoSaveInterval]);
}
