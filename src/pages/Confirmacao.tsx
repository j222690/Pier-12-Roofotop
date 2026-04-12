import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Calendar, Clock, Users, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/reservation-utils";

interface Reservation {
  id: string;
  reservation_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  total_price: number;
  phone: string | null;
  open_wine_opt_in: boolean;
  notes: string | null;
}

const Confirmacao = () => {
  const [params] = useSearchParams();
  const status = params.get("status");
  const sessionId = params.get("session_id");
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (status === "success" && sessionId) {
      // Small delay to let webhook process
      setTimeout(async () => {
        const { data } = await supabase
          .from("reservations")
          .select("*")
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (data) setReservation(data as Reservation);
      }, 1500);
    }
  }, [status, sessionId]);

  if (status === "cancelled") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-24 pb-16 px-4 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="text-destructive" size={40} />
            </div>
            <h1 className="font-heading text-3xl text-foreground mb-3">Pagamento Cancelado</h1>
            <p className="font-body text-muted-foreground mb-8">
              Sua reserva não foi efetivada. Nenhuma cobrança foi realizada.
            </p>
            <Button variant="gold" asChild>
              <Link to="/reservar">Tentar Novamente</Link>
            </Button>
          </motion.div>
        </section>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="text-primary" size={48} />
            </motion.div>
            <p className="font-body text-xs tracking-[0.4em] text-primary uppercase mb-3">Reserva Confirmada</p>
            <h1 className="font-heading text-4xl text-gradient-gold mb-4">Tudo certo! 🎉</h1>
            <p className="font-body text-muted-foreground">
              Seu pagamento foi aprovado e sua mesa está garantida no Pier 12 Rooftop.
            </p>
          </motion.div>

          {reservation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6"
            >
              <h2 className="font-heading text-xl text-foreground border-b border-border pb-3">
                Detalhes da Reserva
              </h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Nome</p>
                    <p className="font-body text-sm text-foreground font-medium">{reservation.reservation_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Data</p>
                    <p className="font-body text-sm text-foreground font-medium">
                      {new Date(reservation.reservation_date + "T12:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long", day: "2-digit", month: "long", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Horário</p>
                    <p className="font-body text-sm text-foreground font-medium">{reservation.reservation_time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Pessoas</p>
                    <p className="font-body text-sm text-foreground font-medium">{reservation.guest_count} pessoa{reservation.guest_count > 1 ? "s" : ""}</p>
                  </div>
                </div>

                {reservation.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">WhatsApp</p>
                      <p className="font-body text-sm text-foreground font-medium">{reservation.phone}</p>
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-body text-sm text-muted-foreground">Total Pago</span>
                  <span className="font-heading text-xl text-gradient-gold">{formatCurrency(Number(reservation.total_price))}</span>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6"
          >
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-body text-sm text-foreground font-medium mb-1">Como chegar</p>
                <p className="font-body text-xs text-muted-foreground">R. Mal. Deodoro, 299e - Centro, Chapecó - SC</p>
                <p className="font-body text-xs text-muted-foreground mt-2">
                  🪑 A escolha da mesa é por ordem de chegada ou pelo tamanho do grupo.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button variant="gold" className="flex-1" asChild>
              <Link to="/">Voltar ao Início</Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/reservar">Nova Reserva</Link>
            </Button>
          </motion.div>
        </div>
      </section>
      <FooterSection />
    </div>
  );
};

export default Confirmacao;
