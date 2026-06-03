import { useEffect, useRef } from 'react';
import { VersionService } from '@/services';

const SNAPSHOT_INTERVAL = 15 * 60 * 1000;

export function useVersionSnapshot(
  documentId: string | undefined,
  content: unknown
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  });

  useEffect(() => {
    if (!documentId) return;

    timerRef.current = setInterval(async () => {
      if (contentRef.current) {
        await VersionService.createVersion(documentId, contentRef.current);
      }
    }, SNAPSHOT_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [documentId]);
}
