import { useState, useEffect, useCallback } from "react";
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
const MAX_NOTIFICATIONS = 50;

function loadFromStorage(): ReservationNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((n: ReservationNotification) => ({
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
  } catch {
    // ignore storage errors
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<ReservationNotification[]>(loadFromStorage);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((reservation: {
    id: string;
    reservation_name: string;
    reservation_date: string;
    reservation_time: string;
    guest_count: number;
    total_price: number;
    phone: string | null;
    open_wine_opt_in: boolean;
  }) => {
    setNotifications((prev) => {
      // Avoid duplicates
      if (prev.some((n) => n.reservationId === reservation.id)) return prev;

      const newNotification: ReservationNotification = {
        id: crypto.randomUUID(),
        reservationId: reservation.id,
        reservation_name: reservation.reservation_name,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        guest_count: reservation.guest_count,
        total_price: reservation.total_price,
        phone: reservation.phone,
        open_wine_opt_in: reservation.open_wine_opt_in,
        receivedAt: new Date(),
        read: false,
      };

      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveToStorage(updated);
      return updated;
    });
  }, []);

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

  // Subscribe to Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel("reservation-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reservations",
          filter: "status=eq.confirmed",
        },
        (payload) => {
          const r = payload.new as {
            id: string;
            reservation_name: string;
            reservation_date: string;
            reservation_time: string;
            guest_count: number;
            total_price: number;
            phone: string | null;
            open_wine_opt_in: boolean;
          };
          addNotification(r);

          // Browser notification (if permission granted)
          if (Notification.permission === "granted") {
            const dateFormatted = format(new Date(r.reservation_date + "T12:00:00"), "dd/MM", { locale: ptBR });
            new Notification("🎉 Nova Reserva - Pier 12", {
              body: `${r.reservation_name} • ${r.guest_count} pessoas • ${dateFormatted} às ${r.reservation_time}`,
              icon: "/favicon.png",
              tag: r.id,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    clearAll,
    requestPermission,
  };
}
