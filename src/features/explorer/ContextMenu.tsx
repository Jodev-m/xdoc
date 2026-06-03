"use client";

import { useEffect, useRef } from "react";

interface ContextMenuAction {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function ContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => {
            action.onClick();
            onClose();
          }}
          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-neutral-100 ${
            action.danger ? "text-red-600" : ""
          }`}
        >
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  );
}
