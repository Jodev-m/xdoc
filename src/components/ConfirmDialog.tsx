"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-neutral-50 dark:border-neutral-700 hover:dark:bg-neutral-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white dark:text-neutral-900 ${
              danger ? "bg-red-600 dark:bg-red-400 hover:bg-red-700" : "bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 hover:dark:bg-neutral-200"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
