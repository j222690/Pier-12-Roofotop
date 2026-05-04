import { useEffect, useRef, useState } from "react";
import { Bell, X, CheckCheck, Trash2, Users, Phone, Wine, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/reservation-utils";
import { type ReservationNotification, useNotifications } from "@/hooks/use-notifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  return format(date, "dd/MM", { locale: ptBR });
}

function formatReservationDate(dateStr: string): string {
  try {
    return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

interface NotificationItemProps {
  notification: ReservationNotification;
  onRead: (id: string) => void;
}

const NotificationItem = ({ notification: n, onRead }: NotificationItemProps) => (
  <div
    className={cn(
      "p-4 border-b border-border/50 transition-colors cursor-default",
      !n.read && "bg-primary/5"
    )}
    onClick={() => onRead(n.id)}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center gap-2">
        {!n.read && (
          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
        )}
        <p className={cn("font-body text-sm font-semibold text-foreground", n.read && "ml-4")}>
          {n.reservation_name}
        </p>
      </div>
      <span className="font-body text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
        {timeAgo(n.receivedAt)}
      </span>
    </div>

    <div className="ml-4 space-y-1">
      <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
        <Calendar size={11} className="text-primary flex-shrink-0" />
        <span>{formatReservationDate(n.reservation_date)} às {n.reservation_time}</span>
      </div>
      <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
        <Users size={11} className="text-primary flex-shrink-0" />
        <span>{n.guest_count} {n.guest_count === 1 ? "pessoa" : "pessoas"}</span>
        <span className="text-primary font-medium ml-1">{formatCurrency(Number(n.total_price))}</span>
      </div>
      {n.phone && (
        <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
          <Phone size={11} className="text-primary flex-shrink-0" />
          <span>{n.phone}</span>
        </div>
      )}
      {n.open_wine_opt_in && (
        <div className="flex items-center gap-2 font-body text-xs text-primary">
          <Wine size={11} className="flex-shrink-0" />
          <span>Vinho aberto incluído</span>
        </div>
      )}
    </div>
  </div>
);

export const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, markRead, clearAll, requestPermission } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Request permission when first opened
  const handleOpen = () => {
    setOpen((prev) => !prev);
    requestPermission();
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
          open
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-background font-body text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 max-h-[520px] bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-primary" />
              <span className="font-heading text-sm text-foreground">Notificações</span>
              {unreadCount > 0 && (
                <span className="font-body text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Limpar todas"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">Nenhuma notificação</p>
                <p className="font-body text-xs text-muted-foreground/60 mt-1">
                  Novas reservas aparecerão aqui em tempo real
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))
            )}
          </div>

          {/* Footer hint */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border/50 flex-shrink-0">
              <p className="font-body text-[10px] text-muted-foreground/60 text-center">
                Clique em uma notificação para marcá-la como lida
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
