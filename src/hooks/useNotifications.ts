"use client";

import { useCallback, useEffect, useState } from "react";
import { ProjectService, ChecklistService } from "@/services";
import { db } from "@/db";

const NOTIFIED_KEY = "xdoc-notified";

function getNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markNotified(id: string) {
  const set = getNotified();
  set.add(id);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
}

function sendNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icons/icon-192x192.png" });
  } catch {
    // fallback for older browsers
  }
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unavailable">("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unavailable");
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const checkReminders = useCallback(async () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const notified = getNotified();
    const today = new Date();
    const todayStr = today.toDateString();
    const hour = today.getHours();

    // ── Projets avec date de fin qui approche ──
    const projects = await ProjectService.getProjects();
    for (const p of projects) {
      if (!p.endDate) continue;
      const end = new Date(p.endDate);
      const diffMs = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        const key = `${p.id}-end-1day-${todayStr}`;
        if (!notified.has(key)) {
          sendNotification("Échéance demain", `Le projet "${p.name}" se termine demain.`);
          markNotified(key);
        }
      } else if (diffDays === 7) {
        const key = `${p.id}-end-7day-${todayStr}`;
        if (!notified.has(key)) {
          sendNotification("Échéance dans une semaine", `Le projet "${p.name}" se termine dans 7 jours.`);
          markNotified(key);
        }
      }
    }

    // ── Checklists non terminées (entre 18h et 22h) ──
    if (hour >= 18 && hour < 22) {
      const allChecklists = await db.checklists.toArray();
      const todayKey = `checklist-incomplete-${todayStr}`;
      if (!notified.has(todayKey)) {
        let totalIncomplete = 0;
        for (const cl of allChecklists) {
          const tasks = await ChecklistService.getTasks(cl.id);
          const incomplete = tasks.filter((t) => !t.completed).length;
          if (incomplete > 0) {
            totalIncomplete += incomplete;
          }
        }
        if (totalIncomplete > 0) {
          sendNotification(
            "Tâches en attente",
            `Tu as ${totalIncomplete} tâche${totalIncomplete > 1 ? "s" : ""} non terminée${totalIncomplete > 1 ? "s" : ""}.`
          );
          markNotified(todayKey);
        }
      }
    }
  }, []);

  useEffect(() => {
    checkReminders();
  }, [checkReminders]);

  return { permission, requestPermission, checkReminders };
}
