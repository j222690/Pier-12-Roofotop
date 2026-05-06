import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Wine, GlassWater, Sun, Fish, Sparkles, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrency } from "@/lib/reservation-utils";

interface CustomEvent {
  id: string;
  day_of_week: number;
  event_name: string;
  event_label: string;
  description: string | null;
  start_time: string | null;
  special_price: number | null;
  has_opt_in: boolean;
  is_active: boolean;
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const EVENT_ICONS: Record<string, React.ElementType> = {
  wine: Wine,
  drink: GlassWater,
  food: UtensilsCrossed,
  sunset: Sun,
  sushi: Fish,
};

function getIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  if (lower.includes("wine") || lower.includes("vinho")) return Wine;
  if (lower.includes("drink") || lower.includes("drink")) return GlassWater;
  if (lower.includes("food") || lower.includes("comida") || lower.includes("sushi")) return Fish;
  if (lower.includes("sunset") || lower.includes("pôr")) return Sun;
  if (lower.includes("utenil") || lower.includes("food")) return UtensilsCrossed;
  return Sparkles;
}

const EventsSection = () => {
  const { settings } = useBusinessSettings();
  const [dbEvents, setDbEvents] = useState<CustomEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("custom_events")
      .select("*")
      .eq("is_active", true)
      .order("day_of_week")
      .then(({ data }) => {
        if (data) setDbEvents(data as CustomEvent[]);
        setLoading(false);
      });
  }, []);

  const staticEvents = [
    { icon: GlassWater, nome: "Open Drink", descricao: "Drinks e coquetéis autorais à vontade. Uma noite de sabores e descontração no rooftop." },
    { icon: Wine, nome: "Open Wine", descricao: "Rótulos selecionados pelo sommelier para uma noite dedicada aos amantes de vinho." },
    { icon: UtensilsCrossed, nome: "Open Food", descricao: "O chef seleciona um prato especial do dia. Uma experiência gastronômica autoral e exclusiva." },
    { icon: Sun, nome: "Sunset", descricao: "Receba o fim do dia com trilha sonora especial e a vista mais bonita da cidade." },
    { icon: Fish, nome: "Sushi à La Carte", descricao: "Peças artesanais preparadas na hora, com ingredientes selecionados e apresentação impecável." },
    { icon: Sparkles, nome: "E muito mais...", descricao: "Nossos eventos mudam toda semana. Acompanhe nossas redes para não perder nenhuma novidade." },
  ];

  return (
    <section id="eventos" className="py-24 px-4 bg-card/30">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <p className="font-body text-xs tracking-[0.4em] text-primary uppercase mb-4">Programação</p>
          <h2 className="font-heading text-4xl md:text-5xl text-gradient-gold">Eventos Toda Semana</h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-body text-muted-foreground text-center max-w-xl mx-auto mb-16 leading-relaxed"
        >
          Toda semana tem algo especial no Pier 12. Confira alguns dos eventos que acontecem por aqui.
        </motion.p>

        {/* Eventos do banco (se houver) */}
        {!loading && dbEvents.length > 0 && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {dbEvents.map((evt, i) => {
              const Icon = getIcon(evt.event_name);
              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-card border border-primary/20 rounded-lg p-7 hover:border-primary/50 transition-colors duration-500 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="text-primary" size={18} />
                    </div>
                    <span className="font-body text-[10px] tracking-widest text-primary uppercase">
                      {DAY_NAMES[evt.day_of_week]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-foreground mb-1">{evt.event_label || evt.event_name}</h3>
                    {evt.description && (
                      <p className="font-body text-sm text-muted-foreground leading-relaxed">{evt.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
                    {evt.start_time && (
                      <div className="flex items-center gap-1.5 text-primary/70">
                        <Clock size={12} />
                        <span className="font-body text-xs">A partir das {evt.start_time}</span>
                      </div>
                    )}
                    {evt.special_price && (
                      <span className="font-body text-xs font-semibold text-primary ml-auto">
                        {formatCurrency(evt.special_price)}/pessoa
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Cards estáticos de tipos de eventos */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {staticEvents.map((evento, i) => {
            const Icon = evento.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-card border border-border rounded-lg p-7 hover:border-primary/40 transition-colors duration-500 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-foreground mb-2">{evento.nome}</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{evento.descricao}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Informações & Benefícios — dinâmico */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card/60 border border-border/50 rounded-lg p-8"
        >
          <h3 className="font-heading text-xl text-foreground mb-5 text-center">Informações & Benefícios</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Crianças até 10 anos: entrada gratuita",
              "Crianças de 10 a 12 anos: meia-entrada",
              "Aniversariante não paga entrada",
              `A partir de ${settings.sparklingBonusThreshold} pessoas: espumante cortesia`,
              `Entrada Homem: ${formatCurrency(settings.prices.male)} | Mulher: ${formatCurrency(settings.prices.female)}`,
              ...dbEvents.filter(e => e.has_opt_in && e.special_price).map(
                e => `${e.event_label || e.event_name}: ${formatCurrency(e.special_price!)}/pessoa`
              ),
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <Star size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="font-body text-sm text-muted-foreground">{rule}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EventsSection;
