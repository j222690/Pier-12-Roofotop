import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/reservation-utils";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import {
  Lock, LayoutDashboard, CalendarDays, Users, DollarSign, LogOut,
  TrendingUp, Wine, UtensilsCrossed, Settings, BarChart3,
  MapPin, Phone, Plus, Trash2, Save, X as XIcon, CalendarOff, Download,
  CheckCircle, Circle, MessageSquare, ChevronDown, ChevronUp, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type AdminRole = "owner" | "manager";

const ADMIN_CREDENTIALS = [
  { username: "jimmybruxel", password: "Autentica090&", role: "owner" as AdminRole },
  { username: "Pier12gerencia", password: "Rooftop090&", role: "manager" as AdminRole },
];

// ─── Login ────────────────────────────────────────────────────────────────────
const AdminLogin = ({ onLogin }: { onLogin: (role: AdminRole) => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const match = ADMIN_CREDENTIALS.find((c) => c.username === username && c.password === password);
    if (match) { onLogin(match.role); } else { setError("Credenciais inválidas"); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="text-primary" size={24} />
          </div>
          <h1 className="font-heading text-2xl text-gradient-gold">Painel Admin</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">Pier 12 Rooftop</p>
        </div>
        <form onSubmit={handleLogin} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Usuário</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-secondary border-border font-body" placeholder="Usuário" autoComplete="username" />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Senha</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary border-border font-body" placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <p className="font-body text-xs text-destructive">{error}</p>}
          <Button variant="gold" className="w-full h-12 uppercase tracking-wider" type="submit">Entrar</Button>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "reservas" | "checkin" | "capacidade" | "eventos" | "horarios" | "config";

interface Reservation {
  id: string;
  reservation_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  total_price: number;
  status: string;
  phone: string | null;
  notes: string | null;
  open_wine_opt_in: boolean;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

interface CustomEvent {
  id: string;
  day_of_week: number;
  event_name: string;
  event_label: string;
  description: string | null;
  start_time: string | null;
  special_price: number | null;
  has_opt_in: boolean;
  opt_in_label: string | null;
  is_active: boolean;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = ({ onLogout, role }: { onLogout: () => void; role: AdminRole }) => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [resRes, evtRes] = await Promise.all([
      supabase.from("reservations").select("*").order("reservation_date", { ascending: false }),
      supabase.from("custom_events").select("*").order("day_of_week"),
    ]);
    if (resRes.data) setReservations(resRes.data as Reservation[]);
    if (evtRes.data) setEvents(evtRes.data as CustomEvent[]);
    setLoading(false);
  }, []);

  // Refresh only events (after toggle/edit) without full reload
  const refreshEvents = useCallback(async () => {
    const { data } = await supabase.from("custom_events").select("*").order("day_of_week");
    if (data) setEvents(data as CustomEvent[]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isOwner = role === "owner";

  const allTabs: { id: Tab; label: string; icon: React.ElementType; ownerOnly?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "reservas", label: "Reservas", icon: CalendarDays },
    { id: "checkin", label: "Check-in", icon: CheckCircle },
    { id: "capacidade", label: "Capacidade", icon: Users },
    { id: "eventos", label: "Eventos", icon: Wine },
    { id: "horarios", label: "Horários", icon: CalendarOff, ownerOnly: true },
    { id: "config", label: "Config", icon: Settings, ownerOnly: true },
  ];

  const tabs = allTabs.filter((t) => !t.ownerOnly || isOwner);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayRes = reservations.filter((r) => r.reservation_date === today && r.status === "confirmed");
  const todayGuests = todayRes.reduce((s, r) => s + r.guest_count, 0);
  const todayRevenue = todayRes.reduce((s, r) => s + Number(r.total_price), 0);
  const totalRevenue = reservations.filter((r) => r.status === "confirmed").reduce((s, r) => s + Number(r.total_price), 0);
  const futureRes = reservations.filter((r) => r.reservation_date >= today && r.status === "confirmed");
  const todayCheckedIn = todayRes.filter((r) => r.checked_in).reduce((s, r) => s + r.guest_count, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border glass-dark sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-lg text-gradient-gold">PIER 12</h1>
            <span className="font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">{isOwner ? "Proprietário" : "Gerente"}</span>
          </div>
          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <Button variant="outline" size="sm" onClick={async () => { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === "accepted") toast.success("App instalado na tela inicial!"); setDeferredPrompt(null); }} className="text-primary border-primary/30 text-xs">
                <Download size={14} className="mr-1" /> Instalar App
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground"><LogOut size={16} className="mr-2" /> Sair</Button>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm whitespace-nowrap transition-all", activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {loading ? (
          <div className="text-center py-20 font-body text-muted-foreground">Carregando...</div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Reservas Hoje", value: String(todayRes.length), icon: CalendarDays, change: `${todayGuests} pessoas` },
                    { label: "Check-in Hoje", value: `${todayCheckedIn}/${todayGuests}`, icon: CheckCircle, change: todayGuests > 0 ? `${Math.round((todayCheckedIn / todayGuests) * 100)}% chegaram` : "" },
                    { label: "Faturamento Dia", value: formatCurrency(todayRevenue), icon: DollarSign, change: "" },
                    { label: "Reservas Futuras", value: String(futureRes.length), icon: LayoutDashboard, change: "" },
                    { label: "Faturamento Total", value: formatCurrency(totalRevenue), icon: TrendingUp, change: "" },
                    { label: "Total Reservas", value: String(reservations.length), icon: BarChart3, change: "" },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-2"><s.icon size={18} className="text-primary" /><span className="font-body text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span></div>
                      <p className="font-heading text-2xl text-foreground">{s.value}</p>
                      {s.change && <p className="font-body text-xs text-primary mt-1">{s.change}</p>}
                    </motion.div>
                  ))}
                </div>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="p-5 border-b border-border"><h2 className="font-heading text-lg text-foreground">Reservas Recentes</h2></div>
                  <div className="divide-y divide-border/50">
                    {reservations.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-body text-sm text-foreground font-medium">{r.reservation_name}</p>
                          <p className="font-body text-xs text-muted-foreground">{r.reservation_date} às {r.reservation_time} • {r.guest_count} pessoas</p>
                        </div>
                        <div className="text-right">
                          <p className="font-body text-sm text-primary">{formatCurrency(Number(r.total_price))}</p>
                          <span className={cn("font-body text-xs px-2 py-0.5 rounded-full", r.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>{r.status === "confirmed" ? "Confirmada" : r.status}</span>
                        </div>
                      </div>
                    ))}
                    {reservations.length === 0 && <div className="p-8 text-center font-body text-sm text-muted-foreground">Nenhuma reserva ainda</div>}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "reservas" && <ReservasTab reservations={reservations} onRefresh={fetchData} />}
            {activeTab === "checkin" && <CheckInTab reservations={reservations} onRefresh={fetchData} />}
            {activeTab === "capacidade" && <CapacidadeTab reservations={reservations} />}
            {activeTab === "eventos" && <EventosTab events={events} onRefresh={refreshEvents} isOwner={isOwner} />}
            {activeTab === "horarios" && isOwner && <HorariosTab />}
            {activeTab === "config" && isOwner && <ConfigTab />}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Nova Reserva Manual ──────────────────────────────────────────────────────
const NovaReservaModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const { settings } = useBusinessSettings();
  const [form, setForm] = useState({
    reservation_name: "",
    reservation_date: format(new Date(), "yyyy-MM-dd"),
    reservation_time: "19:00",
    male_count: 0,
    female_count: 0,
    phone: "",
    notes: "",
    open_wine_opt_in: false,
  });
  const [saving, setSaving] = useState(false);

  const guestCount = form.male_count + form.female_count;

  const calcTotal = () => {
    const dow = new Date(form.reservation_date + "T12:00:00").getDay();
    const prices = settings.dailyPrices?.[dow] ?? settings.prices;
    if (form.open_wine_opt_in) return guestCount * settings.openWinePrice;
    return form.male_count * prices.male + form.female_count * prices.female;
  };

  const total = calcTotal();

  const save = async () => {
    if (!form.reservation_name.trim()) { toast.error("Informe o nome do responsável"); return; }
    if (guestCount === 0) { toast.error("Adicione ao menos 1 pessoa"); return; }
    setSaving(true);
    const { error } = await supabase.from("reservations").insert({
      reservation_name: form.reservation_name.trim(),
      reservation_date: form.reservation_date,
      reservation_time: form.reservation_time,
      guest_count: guestCount,
      guests: [],
      total_price: total,
      phone: form.phone || null,
      notes: form.notes || null,
      open_wine_opt_in: form.open_wine_opt_in,
      status: "confirmed",
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Reserva criada com sucesso! ✓");
    onSaved();
    onClose();
  };

  const dow = new Date(form.reservation_date + "T12:00:00").getDay();
  const prices = settings.dailyPrices?.[dow] ?? settings.prices;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-heading text-base text-foreground">Nova Reserva Manual</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><XIcon size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Nome do Responsável *</label>
            <Input value={form.reservation_name} onChange={(e) => setForm({ ...form, reservation_name: e.target.value })} placeholder="Ex: João Silva" className="h-10 bg-secondary border-border font-body" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Data *</label>
              <input type="date" value={form.reservation_date} onChange={(e) => setForm({ ...form, reservation_date: e.target.value })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 font-body text-sm text-foreground" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Horário *</label>
              <input type="time" value={form.reservation_time} onChange={(e) => setForm({ ...form, reservation_time: e.target.value })} className="w-full h-10 rounded-md bg-secondary border border-border px-3 font-body text-sm text-foreground" />
            </div>
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Convidados</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-lg p-3">
                <p className="font-body text-xs text-muted-foreground mb-2">Homens <span className="text-primary">({formatCurrency(prices.male)}/pessoa)</span></p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setForm({ ...form, male_count: Math.max(0, form.male_count - 1) })} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold hover:bg-primary/20 transition-colors">−</button>
                  <span className="font-heading text-xl text-foreground w-8 text-center">{form.male_count}</span>
                  <button type="button" onClick={() => setForm({ ...form, male_count: form.male_count + 1 })} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold hover:bg-primary/20 transition-colors">+</button>
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="font-body text-xs text-muted-foreground mb-2">Mulheres <span className="text-primary">({formatCurrency(prices.female)}/pessoa)</span></p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setForm({ ...form, female_count: Math.max(0, form.female_count - 1) })} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold hover:bg-primary/20 transition-colors">−</button>
                  <span className="font-heading text-xl text-foreground w-8 text-center">{form.female_count}</span>
                  <button type="button" onClick={() => setForm({ ...form, female_count: form.female_count + 1 })} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold hover:bg-primary/20 transition-colors">+</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Telefone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(49) 99999-9999" type="tel" className="h-10 bg-secondary border-border font-body" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-secondary rounded-lg p-3">
            <input type="checkbox" checked={form.open_wine_opt_in} onChange={(e) => setForm({ ...form, open_wine_opt_in: e.target.checked })} className="w-4 h-4 rounded" />
            <div>
              <p className="font-body text-sm text-foreground">🍷 Open Wine</p>
              <p className="font-body text-xs text-muted-foreground">{formatCurrency(settings.openWinePrice)}/pessoa</p>
            </div>
          </label>

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Observações</label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Aniversário, pedidos especiais..." className="h-10 bg-secondary border-border font-body" />
          </div>
        </div>

        <div className="border-t border-border p-5 bg-card/80 flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-xs text-muted-foreground">Total estimado</p>
            <p className="font-heading text-xl text-primary">{formatCurrency(total)}</p>
            <p className="font-body text-xs text-muted-foreground">{guestCount} pessoa{guestCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={saving} className="px-6">
              {saving ? "Salvando..." : <><Save size={16} className="mr-2" /> Salvar Reserva</>}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Reservas Tab ─────────────────────────────────────────────────────────────
const ReservasTab = ({ reservations, onRefresh }: { reservations: Reservation[]; onRefresh: () => void }) => {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNovaReserva, setShowNovaReserva] = useState(false);

  const filtered = reservations.filter((r) =>
    r.reservation_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.phone || "").includes(search)
  );

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("reservations").update({ status }).eq("id", id);
    toast.success(`Reserva ${status === "confirmed" ? "confirmada" : "cancelada"}`);
    onRefresh();
  };

  const deleteReservation = async (id: string, name: string) => {
  if (!window.confirm(`Excluir reserva de "${name}"? Esta ação não pode ser desfeita.`)) return;
  await supabase.from("reservations").delete().eq("id", id);
  toast.success("Reserva excluída");
  onRefresh();
};

  return (
    <>
      {showNovaReserva && (
        <NovaReservaModal onClose={() => setShowNovaReserva(false)} onSaved={onRefresh} />
      )}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="font-heading text-lg text-foreground">Todas as Reservas ({filtered.length})</h2>
          <div className="flex w-full sm:w-auto gap-2">
            <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 flex-1 sm:w-56 bg-secondary border-border font-body text-sm" />
            <Button variant="gold" size="sm" onClick={() => setShowNovaReserva(true)} className="whitespace-nowrap flex-shrink-0">
              <Plus size={14} className="mr-1" /> Nova Reserva
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Nome", "Data", "Horário", "Pessoas", "Total", "Telefone", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left p-4 font-body text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <>
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    <td className="p-4 font-body text-sm text-foreground font-medium">
                      <div className="flex items-center gap-2">
                        {r.checked_in ? <CheckCircle size={14} className="text-primary flex-shrink-0" /> : <Circle size={14} className="text-muted-foreground flex-shrink-0" />}
                        {r.reservation_name}
                      </div>
                    </td>
                    <td className="p-4 font-body text-sm text-muted-foreground whitespace-nowrap">{r.reservation_date}</td>
                    <td className="p-4 font-body text-sm text-muted-foreground">{r.reservation_time}</td>
                    <td className="p-4 font-body text-sm text-muted-foreground">{r.guest_count}</td>
                    <td className="p-4 font-body text-sm text-primary whitespace-nowrap">{formatCurrency(Number(r.total_price))}</td>
                    <td className="p-4 font-body text-sm text-muted-foreground">{r.phone || "-"}</td>
                    <td className="p-4"><span className={cn("font-body text-xs px-3 py-1 rounded-full whitespace-nowrap", r.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>{r.status === "confirmed" ? "Confirmada" : "Cancelada"}</span></td>
                    <td className="p-4">
                      <div className="flex gap-1 items-center">
                        {r.status === "confirmed"
                           ? <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); updateStatus(r.id, "cancelled"); }} className="text-destructive text-xs">Cancelar</Button>
                               : <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); updateStatus(r.id, "confirmed"); }} className="text-primary text-xs">Confirmar</Button>}
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteReservation(r.id, r.reservation_name); }} className="text-destructive text-xs"><Trash2 size={14} /></Button>
{expandedId === r.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                     </div>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr key={`${r.id}-exp`} className="bg-secondary/30 border-b border-border/50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          {r.notes && <div className="flex items-start gap-2"><MessageSquare size={14} className="text-primary mt-0.5 flex-shrink-0" /><div><p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Observações</p><p className="font-body text-sm text-foreground">{r.notes}</p></div></div>}
                          <div><p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Open Wine</p><p className="font-body text-sm text-foreground">{r.open_wine_opt_in ? "Sim" : "Não"}</p></div>
                          {r.checked_in_at && <div><p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Check-in</p><p className="font-body text-sm text-foreground">{new Date(r.checked_in_at).toLocaleTimeString("pt-BR")}</p></div>}
                          <div><p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Criado em</p><p className="font-body text-sm text-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center font-body text-sm text-muted-foreground">Nenhuma reserva encontrada</div>}
        </div>
      </div>
    </>
  );
};

// ─── Check-in Tab ─────────────────────────────────────────────────────────────
const CheckInTab = ({ reservations, onRefresh }: { reservations: Reservation[]; onRefresh: () => void }) => {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const dayRes = reservations.filter((r) => r.reservation_date === selectedDate && r.status === "confirmed");
  const filtered = dayRes.filter((r) => r.reservation_name.toLowerCase().includes(search.toLowerCase()) || (r.phone || "").includes(search));
  const totalGuests = dayRes.reduce((s, r) => s + r.guest_count, 0);
  const checkedInGuests = dayRes.filter((r) => r.checked_in).reduce((s, r) => s + r.guest_count, 0);

  const toggleCheckIn = async (r: Reservation) => {
    const newVal = !r.checked_in;
    await supabase.from("reservations").update({ checked_in: newVal, checked_in_at: newVal ? new Date().toISOString() : null }).eq("id", r.id);
    toast.success(newVal ? `${r.reservation_name} chegou! ✓` : "Check-in desfeito");
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div><label className="font-body text-xs text-muted-foreground mb-1 block">Data</label><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9 rounded-md bg-secondary border border-border px-3 font-body text-sm text-foreground" /></div>
          <div className="flex gap-4 sm:ml-auto">
            <div className="text-center"><p className="font-heading text-2xl text-foreground">{checkedInGuests}</p><p className="font-body text-xs text-primary">chegaram</p></div>
            <div className="text-center"><p className="font-heading text-2xl text-foreground">{totalGuests - checkedInGuests}</p><p className="font-body text-xs text-muted-foreground">aguardando</p></div>
            <div className="text-center"><p className="font-heading text-2xl text-foreground">{totalGuests}</p><p className="font-body text-xs text-muted-foreground">total</p></div>
          </div>
        </div>
        {totalGuests > 0 && <div className="w-full bg-secondary rounded-full h-2"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min((checkedInGuests / totalGuests) * 100, 100)}%` }} /></div>}
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border"><Input placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 bg-secondary border-border font-body text-sm" /></div>
        <div className="divide-y divide-border/50">
          {filtered.length === 0 && <div className="p-8 text-center font-body text-sm text-muted-foreground">{dayRes.length === 0 ? "Nenhuma reserva para esta data" : "Nenhum resultado"}</div>}
          {filtered.map((r) => (
            <div key={r.id} className={cn("flex items-center gap-4 p-4 transition-colors", r.checked_in && "bg-primary/5")}>
              <button onClick={() => toggleCheckIn(r)} className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-2", r.checked_in ? "bg-primary/20 border-primary text-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/50")}>
                {r.checked_in ? <CheckCircle size={20} /> : <Circle size={20} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("font-body text-sm font-medium truncate", r.checked_in ? "text-primary" : "text-foreground")}>{r.reservation_name}</p>
                <p className="font-body text-xs text-muted-foreground">{r.reservation_time} • {r.guest_count} pessoa{r.guest_count > 1 ? "s" : ""}{r.phone ? ` • ${r.phone}` : ""}</p>
                {r.notes && <p className="font-body text-xs text-muted-foreground/60 truncate mt-0.5">📝 {r.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-body text-xs text-muted-foreground">{formatCurrency(Number(r.total_price))}</p>
                {r.checked_in_at && <p className="font-body text-xs text-primary">{new Date(r.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>}
                {r.open_wine_opt_in && <span className="font-body text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">🍷 Wine</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Capacidade Tab ───────────────────────────────────────────────────────────
const CapacidadeTab = ({ reservations }: { reservations: Reservation[] }) => {
  const { settings } = useBusinessSettings();
  const [days, setDays] = useState(30);
  const today = new Date();
  const nextDays = Array.from({ length: days }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return format(d, "yyyy-MM-dd"); });
  const openDays = nextDays.filter((ds) => settings.businessHours[new Date(ds + "T12:00:00").getDay()] !== null);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
        <div><h2 className="font-heading text-lg text-foreground mb-1">Capacidade Máxima</h2><p className="font-body text-sm text-muted-foreground">Limite de <strong className="text-foreground">{settings.maxCapacity} pessoas</strong> por noite.</p></div>
        <div className="flex gap-2">{[7, 14, 30].map((d) => (<button key={d} onClick={() => setDays(d)} className={cn("px-3 py-1.5 rounded-md font-body text-xs transition-all", days === d ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-transparent")}>{d}d</button>))}</div>
      </div>
      <div className="grid gap-3">
        {openDays.map((ds) => {
          const dayRes = reservations.filter((r) => r.reservation_date === ds && r.status === "confirmed");
          const total = dayRes.reduce((s, r) => s + r.guest_count, 0);
          const checked = dayRes.filter((r) => r.checked_in).reduce((s, r) => s + r.guest_count, 0);
          const pct = Math.round((total / settings.maxCapacity) * 100);
          const d = new Date(ds + "T12:00:00");
          const isToday = ds === format(new Date(), "yyyy-MM-dd");
          return (
            <div key={ds} className={cn("bg-card border rounded-lg p-5", isToday && "border-primary/30")}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm font-medium text-foreground">{isToday && <span className="text-primary mr-2">●</span>}{format(d, "dd/MM")} ({DAY_NAMES[d.getDay()]})</span>
                <div className="flex items-center gap-3">{checked > 0 && <span className="font-body text-xs text-primary">{checked} chegaram</span>}<span className="font-body text-xs text-muted-foreground">{total}/{settings.maxCapacity}</span></div>
              </div>
              <div className="w-full bg-secondary rounded-full h-3"><div className={cn("h-3 rounded-full transition-all", pct > 80 ? "bg-destructive" : pct > 50 ? "bg-amber-500" : "bg-primary")} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <div className="flex justify-between mt-2"><span className="font-body text-xs text-muted-foreground">{settings.maxCapacity - total} vagas</span><span className="font-body text-xs font-semibold text-foreground">{pct}%</span></div>
            </div>
          );
        })}
        {openDays.length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-8">Nenhum dia aberto neste período</p>}
      </div>
    </div>
  );
};

// ─── Eventos Tab ──────────────────────────────────────────────────────────────
const EventosTab = ({ events, onRefresh, isOwner }: { events: CustomEvent[]; onRefresh: () => void; isOwner: boolean }) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ day_of_week: 3, event_name: "", event_label: "", description: "", start_time: "18:00", special_price: "", has_opt_in: false, opt_in_label: "", is_active: true });

  const resetForm = () => { setForm({ day_of_week: 3, event_name: "", event_label: "", description: "", start_time: "18:00", special_price: "", has_opt_in: false, opt_in_label: "", is_active: true }); setEditing(null); setShowForm(false); };

  const saveEvent = async () => {
    if (!form.event_name) { toast.error("Informe o nome do evento"); return; }
    const data = { day_of_week: form.day_of_week, event_name: form.event_name, event_label: form.event_label || form.event_name, description: form.description || null, start_time: form.start_time || null, special_price: form.special_price ? Number(form.special_price) : null, has_opt_in: form.has_opt_in, opt_in_label: form.opt_in_label || null, is_active: form.is_active };
    if (editing) { await supabase.from("custom_events").update(data).eq("id", editing); toast.success("Evento atualizado"); }
    else { await supabase.from("custom_events").insert(data); toast.success("Evento criado"); }
    resetForm();
    await onRefresh();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("custom_events").delete().eq("id", id);
    toast.success("Evento removido");
    await onRefresh();
  };

  // Toggle ativo/inativo — atualiza no banco e recarrega lista
  const toggleActive = async (evt: CustomEvent) => {
    const { error } = await supabase.from("custom_events").update({ is_active: !evt.is_active }).eq("id", evt.id);
    if (error) { toast.error("Erro ao atualizar evento"); return; }
    toast.success(evt.is_active ? "Evento desativado — não aparecerá para clientes" : "Evento ativado");
    await onRefresh();
  };

  const startEdit = (evt: CustomEvent) => {
    setEditing(evt.id); setShowForm(true);
    setForm({ day_of_week: evt.day_of_week, event_name: evt.event_name, event_label: evt.event_label, description: evt.description || "", start_time: evt.start_time || "18:00", special_price: evt.special_price ? String(evt.special_price) : "", has_opt_in: evt.has_opt_in, opt_in_label: evt.opt_in_label || "", is_active: evt.is_active });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg text-foreground">Eventos Semanais</h2>
            <p className="font-body text-xs text-muted-foreground mt-1">Eventos ativos aparecem para os clientes na página de reserva.</p>
          </div>
          {isOwner && (
            <Button variant="gold" size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus size={14} className="mr-1" /> Novo Evento</Button>
          )}
        </div>

        {showForm && isOwner && (
          <div className="bg-secondary rounded-lg p-4 mb-6 space-y-3 border border-border">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-wider">{editing ? "Editar Evento" : "Novo Evento"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Dia da Semana</label>
                <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })} className="w-full h-9 rounded-md bg-muted border border-border px-3 font-body text-sm text-foreground">
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Horário Início</label>
                <Input value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="h-9 bg-muted border-border font-body text-sm" placeholder="18:00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Nome do Evento</label>
                <Input value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} placeholder="Ex: Open Sushi" className="h-9 bg-muted border-border font-body text-sm" />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Label (com emoji)</label>
                <Input value={form.event_label} onChange={(e) => setForm({ ...form, event_label: e.target.value })} placeholder="🍣 Open Sushi" className="h-9 bg-muted border-border font-body text-sm" />
              </div>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Descrição</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-9 bg-muted border-border font-body text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Preço Especial (R$)</label>
                <Input value={form.special_price} onChange={(e) => setForm({ ...form, special_price: e.target.value })} placeholder="Ex: 85" type="number" className="h-9 bg-muted border-border font-body text-sm" />
              </div>
              <div className="space-y-2 pt-4">
                <label className="flex items-center gap-2 font-body text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={form.has_opt_in} onChange={(e) => setForm({ ...form, has_opt_in: e.target.checked })} /> Tem opt-in
                </label>
                <label className="flex items-center gap-2 font-body text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Visível para clientes
                </label>
              </div>
            </div>
            {form.has_opt_in && (
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Texto do opt-in</label>
                <Input value={form.opt_in_label} onChange={(e) => setForm({ ...form, opt_in_label: e.target.value })} placeholder="Ex: Participar do Open Wine?" className="h-9 bg-muted border-border font-body text-sm" />
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="gold" size="sm" onClick={saveEvent}><Save size={14} className="mr-1" /> Salvar</Button>
              <Button variant="ghost" size="sm" onClick={resetForm}><XIcon size={14} className="mr-1" /> Cancelar</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {events.map((evt) => (
            <div key={evt.id} className={cn("flex items-start gap-4 rounded-lg p-4 border", evt.is_active ? "bg-secondary/50 border-transparent" : "bg-secondary/10 border-border/30 opacity-60")}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {evt.event_name.toLowerCase().includes("food") ? <UtensilsCrossed size={18} className="text-primary" /> : <Wine size={18} className="text-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body text-sm font-semibold text-foreground">{DAY_NAMES[evt.day_of_week]} — {evt.event_name}</p>
                  <span className={cn("font-body text-xs px-2 py-0.5 rounded-full", evt.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    {evt.is_active ? "Visível" : "Oculto"}
                  </span>
                </div>
                {evt.start_time && <p className="font-body text-xs text-muted-foreground mt-1">Início: {evt.start_time}</p>}
                {evt.description && <p className="font-body text-xs text-muted-foreground">{evt.description}</p>}
                {evt.special_price && <p className="font-body text-xs text-primary mt-1">Preço: {formatCurrency(evt.special_price)}/pessoa</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                <Button variant="ghost" size="sm" onClick={() => toggleActive(evt)} className={cn("text-xs gap-1", evt.is_active ? "text-muted-foreground" : "text-primary")}>
                  {evt.is_active ? <><EyeOff size={13} /> Ocultar</> : <><Eye size={13} /> Mostrar</>}
                </Button>
                {isOwner && <Button variant="ghost" size="sm" onClick={() => startEdit(evt)} className="text-xs">Editar</Button>}
                {isOwner && <Button variant="ghost" size="sm" onClick={() => deleteEvent(evt.id)} className="text-destructive text-xs"><Trash2 size={14} /></Button>}
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-4">Nenhum evento cadastrado</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Horarios Tab ─────────────────────────────────────────────────────────────
const HorariosTab = () => {
  const { settings, update } = useBusinessSettings();
  const [hours, setHours] = useState<Record<number, { open: string; close: string } | null>>({});
  const [closures, setClosures] = useState<{ id: string; closure_date: string; reason: string }[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("Fechamento especial");
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    setHours(settings.businessHours);
  }, [settings.businessHours]);

  useEffect(() => {
    supabase.from("business_closures").select("*").order("closure_date").then(({ data }) => { if (data) setClosures(data); });
  }, []);

  const toggleDay = (day: number) => {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: "18:00", close: "23:00" },
    }));
  };

  const updateTime = (day: number, field: "open" | "close", value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? { open: "18:00", close: "23:00" }), [field]: value },
    }));
  };

  const saveHours = async () => {
    setSavingHours(true);
    await update("business_hours", hours);
    toast.success("Horários salvos!");
    setSavingHours(false);
  };

  const addClosure = async () => {
    if (!newDate) { toast.error("Selecione a data"); return; }
    await supabase.from("business_closures").insert({ closure_date: newDate, reason: newReason });
    toast.success("Fechamento adicionado");
    const { data } = await supabase.from("business_closures").select("*").order("closure_date");
    if (data) setClosures(data);
    setNewDate(""); setNewReason("Fechamento especial");
  };

  const removeClosure = async (id: string) => {
    await supabase.from("business_closures").delete().eq("id", id);
    toast.success("Fechamento removido");
    setClosures(closures.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Horário semanal editável */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg text-foreground">Horário de Funcionamento</h2>
            <p className="font-body text-xs text-muted-foreground mt-1">Ative ou desative cada dia e defina o horário de abertura e fechamento.</p>
          </div>
          <Button variant="gold" size="sm" onClick={saveHours} disabled={savingHours}>
            <Save size={14} className="mr-1" /> {savingHours ? "Salvando..." : "Salvar"}
          </Button>
        </div>
        <div className="space-y-3">
          {DAY_NAMES.map((dayName, i) => {
            const isOpen = hours[i] !== null && hours[i] !== undefined;
            return (
              <div key={i} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", isOpen ? "bg-secondary/50 border-border/50" : "bg-secondary/20 border-transparent opacity-60")}>
                <button
                  onClick={() => toggleDay(i)}
                  className={cn("w-10 h-6 rounded-full transition-all flex-shrink-0 relative", isOpen ? "bg-primary" : "bg-muted")}
                >
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", isOpen ? "left-4" : "left-0.5")} />
                </button>
                <span className="font-body text-sm text-foreground w-20 flex-shrink-0">{dayName}</span>
                {isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={hours[i]?.open ?? "18:00"} onChange={(e) => updateTime(i, "open", e.target.value)} className="h-8 rounded-md bg-muted border border-border px-2 font-body text-sm text-foreground flex-1 min-w-0" />
                    <span className="font-body text-xs text-muted-foreground flex-shrink-0">até</span>
                    <input type="time" value={hours[i]?.close ?? "23:00"} onChange={(e) => updateTime(i, "close", e.target.value)} className="h-8 rounded-md bg-muted border border-border px-2 font-body text-sm text-foreground flex-1 min-w-0" />
                  </div>
                ) : (
                  <span className="font-body text-sm text-destructive">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fechamentos especiais */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-heading text-lg text-foreground mb-1">Fechamentos Especiais</h2>
        <p className="font-body text-xs text-muted-foreground mb-4">Datas específicas em que o restaurante não abrirá (feriados, eventos privados, etc.).</p>
        <div className="flex gap-3 mb-4 flex-wrap">
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-9 bg-secondary border-border font-body text-sm flex-1 min-w-32" />
          <Input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Motivo" className="h-9 bg-secondary border-border font-body text-sm flex-1 min-w-32" />
          <Button variant="gold" size="sm" onClick={addClosure}><Plus size={14} className="mr-1" /> Adicionar</Button>
        </div>
        <div className="space-y-2">
          {closures.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
              <div>
                <span className="font-body text-sm text-foreground">{c.closure_date}</span>
                <span className="font-body text-xs text-muted-foreground ml-3">{c.reason}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeClosure(c.id)} className="text-destructive"><Trash2 size={14} /></Button>
            </div>
          ))}
          {closures.length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-4">Nenhum fechamento programado</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Config Tab ───────────────────────────────────────────────────────────────
const DAY_NAMES_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const ConfigTab = () => {
  const { settings, update, loading } = useBusinessSettings();
  const [prices, setPrices] = useState({ male: 0, female: 0 });
  // dailyPrices: null = usa preço padrão, objeto = preço específico para o dia
  const [dailyPrices, setDailyPrices] = useState<Record<number, { male: number; female: number } | null>>({
    0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null,
  });
  const [maxCap, setMaxCap] = useState(0);
  const [openWinePrice, setOpenWinePrice] = useState(0);
  const [sparklingThreshold, setSparklingThreshold] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setPrices(settings.prices);
      setDailyPrices(settings.dailyPrices ?? { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
      setMaxCap(settings.maxCapacity);
      setOpenWinePrice(settings.openWinePrice);
      setSparklingThreshold(settings.sparklingBonusThreshold);
    }
  }, [loading, settings]);

  const toggleDayPrice = (day: number) => {
    setDailyPrices((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { male: prices.male, female: prices.female },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    const results = await Promise.all([
      update("prices", prices),
      update("daily_prices", dailyPrices),
      update("max_capacity", maxCap),
      update("open_wine_price", openWinePrice),
      update("sparkling_bonus_threshold", sparklingThreshold),
    ]);
    const allOk = results.every(Boolean);
    if (allOk) {
      toast.success("Configurações salvas!");
    } else {
      toast.error("Algumas configurações não foram salvas. Verifique o console.");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 font-body text-muted-foreground">Carregando...</div>;

  // dias que o estabelecimento abre
  const openDays = Object.entries(settings.businessHours)
    .filter(([, h]) => h !== null)
    .map(([d]) => Number(d));

  return (
    <div className="space-y-6">
      {/* ── Preços Padrão ── */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-heading text-lg text-foreground mb-1">Preços de Entrada — Padrão</h2>
        <p className="font-body text-xs text-muted-foreground mb-4">Aplicado nos dias sem preço específico configurado abaixo.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Entrada Homem (R$)</label>
            <Input type="number" value={prices.male} onChange={(e) => setPrices({ ...prices, male: Number(e.target.value) })} className="h-10 bg-secondary border-border font-body" />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Entrada Mulher (R$)</label>
            <Input type="number" value={prices.female} onChange={(e) => setPrices({ ...prices, female: Number(e.target.value) })} className="h-10 bg-secondary border-border font-body" />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Preço Open Wine (R$)</label>
            <Input type="number" value={openWinePrice} onChange={(e) => setOpenWinePrice(Number(e.target.value))} className="h-10 bg-secondary border-border font-body" />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Espumante cortesia a partir de (pessoas)</label>
            <Input type="number" value={sparklingThreshold} onChange={(e) => setSparklingThreshold(Number(e.target.value))} className="h-10 bg-secondary border-border font-body" />
          </div>
        </div>
      </div>

      {/* ── Preços por Dia ── */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-heading text-lg text-foreground mb-1">Preços de Entrada — Por Dia</h2>
        <p className="font-body text-xs text-muted-foreground mb-4">
          Ative um dia para definir um valor de entrada diferente do padrão. Dias fechados não aparecem aqui.
        </p>
        <div className="space-y-3">
          {openDays.map((day) => {
            const dayPrice = dailyPrices[day];
            const isCustom = dayPrice !== null;
            return (
              <div key={day} className="border border-border rounded-lg overflow-hidden">
                {/* cabeçalho do dia */}
                <button
                  type="button"
                  onClick={() => toggleDayPrice(day)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 transition-colors",
                    isCustom ? "bg-primary/10" : "bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("w-2 h-2 rounded-full", isCustom ? "bg-primary" : "bg-muted-foreground/30")} />
                    <span className="font-body text-sm font-medium text-foreground">{DAY_NAMES_FULL[day]}</span>
                    {!isCustom && (
                      <span className="font-body text-xs text-muted-foreground">
                        (padrão: H R${prices.male} / M R${prices.female})
                      </span>
                    )}
                  </div>
                  <span className="font-body text-xs text-primary">
                    {isCustom ? "Personalizado ▲" : "Usar padrão ▼"}
                  </span>
                </button>

                {/* inputs do dia — exibidos quando ativo */}
                {isCustom && (
                  <div className="px-4 py-4 grid grid-cols-2 gap-3 bg-card">
                    <div>
                      <label className="font-body text-xs text-muted-foreground mb-1 block">Homem (R$)</label>
                      <Input
                        type="number"
                        value={dayPrice.male}
                        onChange={(e) =>
                          setDailyPrices((prev) => ({ ...prev, [day]: { ...prev[day]!, male: Number(e.target.value) } }))
                        }
                        className="h-10 bg-secondary border-border font-body"
                      />
                    </div>
                    <div>
                      <label className="font-body text-xs text-muted-foreground mb-1 block">Mulher (R$)</label>
                      <Input
                        type="number"
                        value={dayPrice.female}
                        onChange={(e) =>
                          setDailyPrices((prev) => ({ ...prev, [day]: { ...prev[day]!, female: Number(e.target.value) } }))
                        }
                        className="h-10 bg-secondary border-border font-body"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Capacidade ── */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-heading text-lg text-foreground mb-4">Capacidade</h2>
        <div className="max-w-xs">
          <label className="font-body text-xs text-muted-foreground mb-1 block">Capacidade máxima (pessoas)</label>
          <Input type="number" value={maxCap} onChange={(e) => setMaxCap(Number(e.target.value))} className="h-10 bg-secondary border-border font-body" />
        </div>
      </div>

      {/* ── Informações ── */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-heading text-lg text-foreground mb-4">Informações do Restaurante</h2>
        <div className="space-y-4">
          {[
            { icon: MapPin, label: "Endereço", value: "R. Mal. Deodoro, 299e - Centro, Chapecó - SC, 89803-003" },
            { icon: Phone, label: "WhatsApp", value: "+55 (49) 93300-4121" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <item.icon size={16} className="text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="font-body text-sm text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button variant="gold" className="w-full h-12 uppercase tracking-wider" onClick={saveAll} disabled={saving}>
        {saving ? "Salvando..." : <><Save size={16} className="mr-2" /> Salvar Configurações</>}
      </Button>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<AdminRole>("manager");
  return !authenticated
    ? <AdminLogin onLogin={(r) => { setRole(r); setAuthenticated(true); }} />
    : <AdminDashboard onLogout={() => setAuthenticated(false)} role={role} />;
};

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
  interface WindowEventMap { beforeinstallprompt: BeforeInstallPromptEvent; }
}

export default Admin;
