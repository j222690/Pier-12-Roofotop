import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Users, Minus, Plus, Sparkles, AlertCircle, Wine, Gift, User, Phone, Info, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAvailableTimeSlots,
  isDateAvailable,
  formatCurrency,
  getGuestPrice,
  type Guest,
  type GuestAgeCategory,
} from "@/lib/reservation-utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessSettings } from "@/hooks/use-business-settings";

interface DBEvent {
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

interface DBClosure {
  id: string;
  closure_date: string;
  reason: string;
}

const ReservationForm = () => {
  const { settings } = useBusinessSettings();
  const [reservationName, setReservationName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [guests, setGuests] = useState<Guest[]>([{ id: 1, gender: "male", ageCategory: "adult" }]);
  const [openWineOptIn, setOpenWineOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbEvents, setDbEvents] = useState<DBEvent[]>([]);
  const [closures, setClosures] = useState<DBClosure[]>([]);
  const [capacityMap, setCapacityMap] = useState<Record<string, number>>({});
  const [capacityFull, setCapacityFull] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [evtRes, closRes] = await Promise.all([
        supabase.from("custom_events").select("*").eq("is_active", true),
        supabase.from("business_closures").select("*"),
      ]);
      if (evtRes.data) setDbEvents(evtRes.data as DBEvent[]);
      if (closRes.data) setClosures(closRes.data as DBClosure[]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const fetchCapacity = async () => {
      const { data } = await supabase
        .from("reservations")
        .select("guest_count")
        .eq("reservation_date", dateStr)
        .eq("status", "confirmed");
      const total = (data || []).reduce((s, r) => s + r.guest_count, 0);
      setCapacityMap((prev) => ({ ...prev, [dateStr]: total }));
      setCapacityFull(total >= settings.maxCapacity);
    };
    fetchCapacity();
  }, [date, settings.maxCapacity]);

  const closedDates = closures.map((c) => c.closure_date);

  const isDateDisabled = (d: Date) => {
    if (d < new Date(new Date().toDateString())) return true;
    if (!isDateAvailable(d, settings.businessHours)) return true;
    const dateStr = format(d, "yyyy-MM-dd");
    if (closedDates.includes(dateStr)) return true;
    return false;
  };

  const dayOfWeek = date?.getDay();
  const currentEvent = dayOfWeek !== undefined ? dbEvents.find((e) => e.day_of_week === dayOfWeek) : null;
  const timeSlots = dayOfWeek !== undefined ? getAvailableTimeSlots(dayOfWeek, settings.businessHours) : [];

  // O evento tem opt-in (open wine) se has_opt_in === true
  const isOpenWineEvent = !!currentEvent?.has_opt_in;

  // Preço do open wine: usa special_price do evento se definido, senão usa o das settings
  const openWineEventPrice = currentEvent?.special_price ?? settings.openWinePrice;

  // Preço de entrada do dia: usa dailyPrices se definido para o dia, senão usa prices padrão
  const effectivePrices = (dayOfWeek !== undefined && settings.dailyPrices?.[dayOfWeek])
    ? settings.dailyPrices[dayOfWeek]!
    : settings.prices;

  // Se o evento tem special_price mas NÃO é open wine (has_opt_in=false),
  // usa o special_price como preço de entrada fixo (igual para homem e mulher)
  const eventFlatPrice = (currentEvent && !currentEvent.has_opt_in && currentEvent.special_price != null)
    ? currentEvent.special_price
    : null;

  const calculateTotal = () => {
    return guests.reduce((total, guest) => {
      if (guest.isBirthday) return total;
      if (guest.ageCategory === "child_free") return total;

      let basePrice: number;
      if (isOpenWineEvent && openWineOptIn) {
        // Open wine: mesmo preço para homem e mulher
        basePrice = openWineEventPrice;
      } else if (eventFlatPrice !== null) {
        // Evento com preço especial fixo (sem opt-in)
        basePrice = eventFlatPrice;
      } else {
        basePrice = effectivePrices[guest.gender];
      }

      if (guest.ageCategory === "child_half") return total + basePrice / 2;
      return total + basePrice;
    }, 0);
  };

  const total = calculateTotal();
  const guestCount = guests.length;
  const hasSparklingBonus = guestCount >= settings.sparklingBonusThreshold;
  const currentDateCapacity = date ? (capacityMap[format(date, "yyyy-MM-dd")] || 0) : 0;
  const remainingCapacity = settings.maxCapacity - currentDateCapacity;

  const addGuest = () => {
    if (guests.length >= settings.maxCapacity) return;
    if (date && guests.length >= remainingCapacity) {
      toast.error("Não há vagas suficientes para mais pessoas nesta data.");
      return;
    }
    setGuests([...guests, { id: Date.now(), gender: "male", ageCategory: "adult" }]);
  };

  const removeGuest = () => {
    if (guests.length <= 1) return;
    setGuests(guests.slice(0, -1));
  };

  const updateGuest = (index: number, updates: Partial<Guest>) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], ...updates };
    setGuests(updated);
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    // Validação completa com feedback por campo
    const errors: Record<string, string> = {};
    if (!reservationName.trim()) errors.name = "Informe o nome da reserva";
    if (!phone.trim()) errors.phone = "Informe seu telefone / WhatsApp";
    if (!date) errors.date = "Selecione a data";
    if (date && !time) errors.time = "Selecione o horário";
    if (guests.length === 0) errors.guests = "Adicione pelo menos um convidado";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll suave até o primeiro campo com erro
      const firstErrorId = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstErrorId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !anonKey) {
        toast.error("Configuração do servidor ausente. Contate o suporte.");
        setIsSubmitting(false);
        return;
      }

      const baseUrl = `${supabaseUrl}/functions/v1`;

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/create-checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": anonKey,
            "Authorization": `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            reservation_name: reservationName.trim(),
            reservation_date: format(date, "yyyy-MM-dd"),
            reservation_time: time,
            guests: JSON.parse(JSON.stringify(guests)),
            guest_count: guests.length,
            total_price: total,
            phone: phone.trim() || null,
            notes: notes.trim() || null,
            open_wine_opt_in: openWineOptIn,
            success_url: `${window.location.origin}/confirmacao?status=success`,
            cancel_url: `${window.location.origin}/confirmacao?status=cancelled`,
          }),
        });
      } catch (networkErr) {
        console.error("Network error reaching checkout function:", networkErr);
        toast.error("Não foi possível conectar ao servidor de pagamento. Verifique sua conexão.");
        setIsSubmitting(false);
        return;
      }

      // Try to parse JSON — function may return HTML on 5xx
      let data: Record<string, unknown> = {};
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try { data = await response.json(); } catch { /* keep empty */ }
      } else {
        const text = await response.text();
        console.error("Non-JSON response from checkout function:", response.status, text);
        if (response.status === 404) {
          toast.error("Função de pagamento não encontrada. A Edge Function 'create-checkout' precisa ser deployada no Supabase.");
        } else if (response.status >= 500) {
          toast.error(`Erro interno do servidor (${response.status}). Verifique se a STRIPE_SECRET_KEY está configurada no Supabase.`);
        } else {
          toast.error(`Erro inesperado (${response.status}). Contate o suporte.`);
        }
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        if (data.error === "capacity_full") {
          setCapacityFull(true);
          toast.error(data.message as string);
        } else {
          const errMsg = (data.error as string) || `Erro ${response.status} ao processar reserva.`;
          console.error("Checkout function error:", errMsg, data);
          toast.error(errMsg);
        }
        return;
      }

      if (data.url) {
        window.location.href = data.url as string;
      } else {
        toast.error("Não foi possível iniciar o pagamento. Tente novamente.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Erro inesperado. Verifique o console e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const adultGuests = guests.filter((g) => g.ageCategory === "adult" && !g.isBirthday);
  const maleAdults = adultGuests.filter((g) => g.gender === "male").length;
  const femaleAdults = adultGuests.filter((g) => g.gender === "female").length;
  const childFree = guests.filter((g) => g.ageCategory === "child_free").length;
  const childHalf = guests.filter((g) => g.ageCategory === "child_half").length;
  const birthdayCount = guests.filter((g) => g.isBirthday).length;

  return (
    <div className="space-y-8">
      {/* Walk-in notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-sm text-foreground font-medium">Também funcionamos sem reserva!</p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Você é bem-vindo(a) mesmo sem reserva — basta comparecer ao restaurante. Porém, para quem reserva, a mesa é garantida.
          </p>
        </div>
      </div>

      {capacityFull && date && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="font-body text-sm text-destructive font-semibold">🚫 Reservas esgotadas para este dia</p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Você ainda pode tentar uma mesa presencialmente — funcionamos por ordem de chegada.
          </p>
        </div>
      )}

      {/* Name */}
      <div id="field-name">
        <label className="font-body text-xs tracking-widest text-primary uppercase mb-3 block">Nome da Reserva</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            value={reservationName}
            onChange={(e) => { setReservationName(e.target.value); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" })); }}
            placeholder="Nome completo"
            className={cn("pl-10 h-12 border-border bg-secondary font-body", fieldErrors.name && "border-destructive focus-visible:ring-destructive")}
          />
        </div>
        {fieldErrors.name && <p className="font-body text-xs text-destructive mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.name}</p>}
      </div>

      {/* Phone */}
      <div id="field-phone">
        <label className="font-body text-xs tracking-widest text-primary uppercase mb-3 block">Telefone / WhatsApp</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            value={phone}
            onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" })); }}
            placeholder="(49) 9 9999-9999"
            className={cn("pl-10 h-12 border-border bg-secondary font-body", fieldErrors.phone && "border-destructive focus-visible:ring-destructive")}
          />
        </div>
        {fieldErrors.phone && <p className="font-body text-xs text-destructive mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.phone}</p>}
      </div>

      {/* Date */}
      <div id="field-date">
        <label className="font-body text-xs tracking-widest text-primary uppercase mb-3 block">Data</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-body h-12 border-border bg-secondary", !date && "text-muted-foreground", fieldErrors.date && "border-destructive")}>
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setTime(undefined); setOpenWineOptIn(false); setCapacityFull(false); if (fieldErrors.date) setFieldErrors((p) => ({ ...p, date: "" })); }} disabled={isDateDisabled} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        {fieldErrors.date && <p className="font-body text-xs text-destructive mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.date}</p>}
      </div>

      {/* Closure notice */}
      {date && closedDates.includes(format(date, "yyyy-MM-dd")) && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="font-body text-sm text-destructive">Este dia está fechado: {closures.find((c) => c.closure_date === format(date!, "yyyy-MM-dd"))?.reason}</p>
        </div>
      )}

      {/* Time */}
      <AnimatePresence>
        {date && !capacityFull && (
          <motion.div id="field-time" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <label className="font-body text-xs tracking-widest text-primary uppercase mb-3 block">Horário</label>
            {timeSlots.length === 0 ? (
              <div className="flex items-center gap-2 text-destructive font-body text-sm"><AlertCircle size={16} /> Este dia não está disponível para reservas.</div>
            ) : (
              <>
                <Select value={time} onValueChange={(v) => { setTime(v); if (fieldErrors.time) setFieldErrors((p) => ({ ...p, time: "" })); }}>
                  <SelectTrigger className={cn("w-full h-12 border-border bg-secondary font-body", fieldErrors.time && "border-destructive")}><SelectValue placeholder="Selecione o horário" /></SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {timeSlots.map((slot) => (<SelectItem key={slot} value={slot} className="font-body">{slot}</SelectItem>))}
                  </SelectContent>
                </Select>
                {fieldErrors.time && <p className="font-body text-xs text-destructive mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.time}</p>}
                <p className="font-body text-xs text-muted-foreground mt-2">📊 {remainingCapacity} vagas disponíveis para esta data</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Info + Open Wine opt-in */}
      <AnimatePresence>
        {currentEvent && date && !capacityFull && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-primary" />
                <span className="font-body text-sm font-semibold text-primary">{currentEvent.event_label}</span>
              </div>
              <p className="font-body text-sm text-muted-foreground">{currentEvent.description}</p>
              {currentEvent.start_time && (
                <p className="font-body text-xs text-primary mt-2">⏰ Início às {currentEvent.start_time}</p>
              )}

              {/* Open Wine opt-in — aparece sempre que has_opt_in = true */}
              {isOpenWineEvent && (
                <div className="mt-4 space-y-2">
                  <label className="font-body text-xs tracking-widest text-primary uppercase block">
                    {currentEvent.opt_in_label || "Participar do Open Wine?"}
                  </label>
                  <p className="font-body text-xs text-muted-foreground">
                    Inclui vinho à vontade da noite — mesmo valor para todos.
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setOpenWineOptIn(true)}
                      className={cn(
                        "flex-1 py-3 rounded-lg font-body text-sm transition-all flex items-center justify-center gap-2",
                        openWineOptIn
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-transparent"
                      )}
                    >
                      <Wine size={16} /> Sim • {formatCurrency(openWineEventPrice)}/pessoa
                    </button>
                    <button
                      onClick={() => setOpenWineOptIn(false)}
                      className={cn(
                        "flex-1 py-3 rounded-lg font-body text-sm transition-all",
                        !openWineOptIn
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-transparent"
                      )}
                    >
                      Não • Valor normal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guests */}
      {!capacityFull && (
        <div id="field-guests">
          <label className="font-body text-xs tracking-widest text-primary uppercase mb-3 block">Pessoas ({guests.length})</label>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={removeGuest} disabled={guests.length <= 1} className="border-border"><Minus size={16} /></Button>
            <div className="flex items-center gap-2"><Users size={18} className="text-primary" /><span className="font-body text-lg font-semibold text-foreground">{guests.length}</span></div>
            <Button variant="outline" size="icon" onClick={addGuest} disabled={guests.length >= settings.maxCapacity} className="border-border"><Plus size={16} /></Button>
          </div>
          {fieldErrors.guests && <p className="font-body text-xs text-destructive mb-3 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.guests}</p>}

          {hasSparklingBonus && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center gap-3">
              <Wine size={20} className="text-primary flex-shrink-0" />
              <p className="font-body text-sm text-primary">🎉 Sua reserva ganha um <strong>espumante selecionado</strong> pelo nosso sommelier!</p>
            </motion.div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {guests.map((guest, i) => (
              <div key={guest.id} className="bg-secondary rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-body text-xs text-muted-foreground w-20">Pessoa {i + 1}</span>
                  <div className="flex gap-2 flex-1">
                    <button onClick={() => updateGuest(i, { gender: "male" })} className={cn("flex-1 py-2 rounded-md font-body text-xs transition-all", guest.gender === "male" ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-transparent")}>Homem</button>
                    <button onClick={() => updateGuest(i, { gender: "female" })} className={cn("flex-1 py-2 rounded-md font-body text-xs transition-all", guest.gender === "female" ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-transparent")}>Mulher</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={guest.ageCategory} onValueChange={(v) => updateGuest(i, { ageCategory: v as GuestAgeCategory })}>
                    <SelectTrigger className="flex-1 h-8 text-xs bg-muted border-transparent font-body"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="adult" className="font-body text-xs">Adulto</SelectItem>
                      <SelectItem value="child_free" className="font-body text-xs">Até 10 anos (cortesia)</SelectItem>
                      <SelectItem value="child_half" className="font-body text-xs">10 a 12 anos (meia-entrada)</SelectItem>
                    </SelectContent>
                  </Select>
                  <button onClick={() => updateGuest(i, { isBirthday: !guest.isBirthday })} className={cn("flex items-center gap-1 px-3 py-1.5 rounded-md font-body text-xs transition-all", guest.isBirthday ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-transparent")}>
                    <Gift size={12} /> Aniver.
                  </button>
                </div>
                <div className="text-right font-body text-xs text-muted-foreground">
                  {guest.isBirthday
                    ? "🎂 Aniversariante — cortesia da casa!"
                    : guest.ageCategory === "child_free"
                    ? "Cortesia"
                    : isOpenWineEvent && openWineOptIn
                    ? formatCurrency(guest.ageCategory === "child_half" ? openWineEventPrice / 2 : openWineEventPrice)
                    : eventFlatPrice !== null
                    ? formatCurrency(guest.ageCategory === "child_half" ? eventFlatPrice / 2 : eventFlatPrice)
                    : formatCurrency(getGuestPrice(guest, false, false, effectivePrices, settings.openWinePrice))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {!capacityFull && (
        <div>
          <label className="font-body text-xs tracking-widest text-primary uppercase mb-3 block">Observações (opcional)</label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-primary" />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alergias, pedidos especiais, acessibilidade, aniversário do grupo..."
              className="pl-10 min-h-[80px] border-border bg-secondary font-body text-sm resize-none"
              maxLength={300}
            />
          </div>
          <p className="font-body text-xs text-muted-foreground mt-1 text-right">{notes.length}/300</p>
        </div>
      )}

      {/* Info box */}
      <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-1">
        <p className="font-body text-xs text-muted-foreground">👶 Crianças até 10 anos: <strong className="text-foreground">cortesia</strong></p>
        <p className="font-body text-xs text-muted-foreground">🧒 De 10 a 12 anos: <strong className="text-foreground">meia-entrada</strong></p>
        <p className="font-body text-xs text-muted-foreground">🎂 Aniversariante: <strong className="text-foreground">entrada cortesia</strong></p>
        <p className="font-body text-xs text-muted-foreground">🍾 {settings.sparklingBonusThreshold}+ pessoas: <strong className="text-foreground">espumante selecionado de cortesia</strong></p>
        <p className="font-body text-xs text-muted-foreground">🍷 Open Wine (quinta): <strong className="text-foreground">{formatCurrency(settings.openWinePrice)}/pessoa — mesmo valor para todos</strong></p>
        <p className="font-body text-xs text-muted-foreground">🪑 Mesa: <strong className="text-foreground">por ordem de chegada ou tamanho do grupo</strong></p>
      </div>

      {/* Summary */}
      {!capacityFull && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h4 className="font-heading text-lg text-foreground">Resumo da Reserva</h4>

          {isOpenWineEvent && openWineOptIn ? (
            <>
              {/* Open wine: todos pagam o mesmo preço */}
              {(maleAdults + femaleAdults) > 0 && (
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>{maleAdults + femaleAdults}x Adulto (Open Wine)</span>
                  <span>{formatCurrency((maleAdults + femaleAdults) * openWineEventPrice)}</span>
                </div>
              )}
            </>
          ) : eventFlatPrice !== null ? (
            <>
              {/* Evento com preço especial fixo: mesmo valor para todos */}
              {(maleAdults + femaleAdults) > 0 && (
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>{maleAdults + femaleAdults}x Adulto ({currentEvent?.event_label})</span>
                  <span>{formatCurrency((maleAdults + femaleAdults) * eventFlatPrice)}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {maleAdults > 0 && (
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>{maleAdults}x Homem</span>
                  <span>{formatCurrency(maleAdults * effectivePrices.male)}</span>
                </div>
              )}
              {femaleAdults > 0 && (
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>{femaleAdults}x Mulher</span>
                  <span>{formatCurrency(femaleAdults * effectivePrices.female)}</span>
                </div>
              )}
            </>
          )}

          {childHalf > 0 && (
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>{childHalf}x Criança (meia)</span>
              <span>{formatCurrency(childHalf * (
                isOpenWineEvent && openWineOptIn
                  ? openWineEventPrice / 2
                  : eventFlatPrice !== null
                  ? eventFlatPrice / 2
                  : (effectivePrices.male + effectivePrices.female) / 2
              ))}</span>
            </div>
          )}
          {childFree > 0 && (
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>{childFree}x Criança (cortesia)</span><span>R$ 0,00</span>
            </div>
          )}
          {birthdayCount > 0 && (
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>{birthdayCount}x Aniversariante</span><span>R$ 0,00</span>
            </div>
          )}
          {hasSparklingBonus && (
            <div className="flex justify-between font-body text-sm text-primary">
              <span>🍾 Espumante cortesia</span><span>Brinde da casa</span>
            </div>
          )}
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-body text-sm font-semibold text-foreground">Total</span>
            <span className="font-heading text-xl text-gradient-gold">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* PIX notice */}
      {!capacityFull && (
        <div className="bg-secondary/50 border border-border rounded-lg p-3 flex items-center gap-3">
          <span className="text-lg">💳</span>
          <p className="font-body text-xs text-muted-foreground">Pagamento seguro via <strong className="text-foreground">cartão de crédito ou PIX</strong> pelo Stripe.</p>
        </div>
      )}

      {/* Banner de campos faltando */}
      {Object.values(fieldErrors).some(Boolean) && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-destructive font-semibold mb-1">Preencha os campos obrigatórios:</p>
            <ul className="space-y-0.5">
              {Object.values(fieldErrors).filter(Boolean).map((msg) => (
                <li key={msg} className="font-body text-xs text-destructive">• {msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!capacityFull && (
        <Button
          variant="gold"
          size="lg"
          className="w-full h-14 text-base tracking-wider uppercase"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Aguarde..." : "Reservar"}
        </Button>
      )}
    </div>
  );
};

export default ReservationForm;
