import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ReservationNotification {
  id: string;
  reservationId: string;
  reservation_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  total_price: number;
  phone: string | null;
  open_wine_opt_in: boolean;
  receivedAt: Date;
  read: boolean;
}

const STORAGE_KEY = "pier12_notifications";
const LAST_CHECK_KEY = "pier12_notifications_last_check";
const MAX_NOTIFICATIONS = 50;
const POLL_INTERVAL_MS = 10000;

function loadFromStorage(): ReservationNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((n: ReservationNotification) => ({
      ...n,
      receivedAt: new Date(n.receivedAt),
    }));
  } catch {
    return [];
  }
}

function saveToStorage(notifications: ReservationNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch {}
}

function getLastCheck(): string {
  return localStorage.getItem(LAST_CHECK_KEY) || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

function setLastCheck(iso: string) {
  localStorage.setItem(LAST_CHECK_KEY, iso);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<ReservationNotification[]>(loadFromStorage);
  const lastCheckRef = useRef<string>(getLastCheck());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const processNewReservations = useCallback((rows: {
    id: string;
    reservation_name: string;
    reservation_date: string;
    reservation_time: string;
    guest_count: number;
    total_price: number;
    phone: string | null;
    open_wine_opt_in: boolean;
    created_at: string;
  }[]) => {
    if (rows.length === 0) return;
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.reservationId));
      const newOnes: ReservationNotification[] = rows
        .filter((r) => !existingIds.has(r.id))
        .map((r) => ({
          id: crypto.randomUUID(),
          reservationId: r.id,
          reservation_name: r.reservation_name,
          reservation_date: r.reservation_date,
          reservation_time: r.reservation_time,
          guest_count: r.guest_count,
          total_price: r.total_price,
          phone: r.phone,
          open_wine_opt_in: r.open_wine_opt_in,
          receivedAt: new Date(),
          read: false,
        }));
      if (newOnes.length === 0) return prev;
      if (Notification.permission === "granted") {
        newOnes.forEach((n) => {
          try {
            const dateFormatted = format(new Date(n.reservation_date + "T12:00:00"), "dd/MM", { locale: ptBR });
            new Notification("🎉 Nova Reserva - Pier 12", {
              body: `${n.reservation_name} • ${n.guest_count} pessoa${n.guest_count !== 1 ? "s" : ""} • ${dateFormatted} às ${n.reservation_time}`,
              icon: "/favicon.png",
              tag: n.reservationId,
            });
          } catch {}
        });
      }
      const updated = [...newOnes, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    const poll = async () => {
      const since = lastCheckRef.current;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("reservations")
        .select("id, reservation_name, reservation_date, reservation_time, guest_count, total_price, phone, open_wine_opt_in, created_at")
        .eq("status", "confirmed")
        .gt("created_at", since)
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        processNewReservations(data);
      }
      lastCheckRef.current = now;
      setLastCheck(now);
    };
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [processNewReservations]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return { notifications, unreadCount, markAllRead, markRead, clearAll, requestPermission };
}