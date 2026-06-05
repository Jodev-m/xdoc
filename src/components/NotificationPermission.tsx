"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";

export function NotificationPermission() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const dismissed = localStorage.getItem("notif-banner-dismissed");
    if (!dismissed) setShow(true);
  }, []);

  const handleAllow = async () => {
    await Notification.requestPermission();
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("notif-banner-dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-xl shadow-2xl p-4 flex items-center justify-between gap-3 max-w-md mx-auto animate-[slideUp_0.3s_ease-out]">
      <div className="flex items-center gap-3 min-w-0">
        <Bell size={20} className="text-neutral-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Activer les notifications
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Pour les rappels d&apos;échéances et tâches
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleAllow}
          className="px-3 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 whitespace-nowrap"
        >
          Activer
        </button>
        <button
          onClick={dismiss}
          className="p-2 text-neutral-400 hover:text-neutral-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
