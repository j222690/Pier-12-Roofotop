import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useBusinessSettings } from "@/hooks/use-business-settings";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const BusinessHoursSection = () => {
  const { settings, loading } = useBusinessSettings();

  if (loading) return null;

  const today = new Date().getDay();

  // Agrupar dias consecutivos com o mesmo horário
  type DayGroup = {
    days: number[];
    hours: { open: string; close: string } | null;
  };

  const groups: DayGroup[] = [];
  for (let i = 0; i < 7; i++) {
    const hours = settings.businessHours[i];
    const last = groups[groups.length - 1];
    const sameHours =
      last &&
      JSON.stringify(last.hours) === JSON.stringify(hours);
    if (sameHours) {
      last.days.push(i);
    } else {
      groups.push({ days: [i], hours: hours ?? null });
    }
  }

  const formatGroup = (days: number[]) => {
    if (days.length === 1) return DAY_NAMES[days[0]];
    if (days.length === 2) return `${DAY_NAMES_SHORT[days[0]]} e ${DAY_NAMES_SHORT[days[1]]}`;
    return `${DAY_NAMES_SHORT[days[0]]} - ${DAY_NAMES_SHORT[days[days.length - 1]]}`;
  };

  return (
    <section id="horarios" className="py-20 px-4 bg-card/20">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="font-body text-xs tracking-[0.4em] text-primary uppercase mb-4">
            Quando nos visitar
          </p>
          <h2 className="font-heading text-4xl md:text-5xl text-gradient-gold mb-4">
            Horários
          </h2>
          <div className="w-16 h-px bg-gradient-gold mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          {groups.map((group, idx) => {
            const isCurrentGroup = group.days.includes(today);
            return (
              <div
                key={idx}
                className={`flex items-center justify-between px-6 py-4 border-b border-border/50 last:border-0 transition-colors ${
                  isCurrentGroup ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCurrentGroup && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                  )}
                  <span
                    className={`font-body text-sm font-medium ${
                      isCurrentGroup ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {formatGroup(group.days)}
                    {isCurrentGroup && (
                      <span className="ml-2 font-body text-xs text-primary/70">(hoje)</span>
                    )}
                  </span>
                </div>
                {group.hours ? (
                  <div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                    <Clock size={14} className="text-primary/60" />
                    <span>
                      {group.hours.open} – {group.hours.close}
                    </span>
                  </div>
                ) : (
                  <span className="font-body text-sm text-destructive/70">Fechado</span>
                )}
              </div>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="font-body text-xs text-muted-foreground text-center mt-4"
        >
          Funcionamos também sem reserva — basta comparecer. Reservas garantem sua mesa.
        </motion.p>
      </div>
    </section>
  );
};

export default BusinessHoursSection;
