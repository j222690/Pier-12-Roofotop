import { motion } from "framer-motion";
import { UtensilsCrossed, Wine, GlassWater, Sun, Fish, Sparkles, Star } from "lucide-react";

const eventos = [
  {
    icon: GlassWater,
    nome: "Open Drink",
    descricao: "Drinks e coquetéis autorais à vontade. Uma noite de sabores e descontração no rooftop.",
  },
  {
    icon: Wine,
    nome: "Open Wine",
    descricao: "Rótulos selecionados pelo sommelier para uma noite dedicada aos amantes de vinho.",
  },
  {
    icon: UtensilsCrossed,
    nome: "Open Food",
    descricao: "O chef seleciona um prato especial do dia. Uma experiência gastronômica autoral e exclusiva.",
  },
  {
    icon: Sun,
    nome: "Sunset",
    descricao: "Receba o fim do dia com trilha sonora especial e a vista mais bonita da cidade.",
  },
  {
    icon: Fish,
    nome: "Sushi à La Carte",
    descricao: "Peças artesanais preparadas na hora, com ingredientes selecionados e apresentação impecável.",
  },
  {
    icon: Sparkles,
    nome: "E muito mais...",
    descricao: "Nossos eventos mudam toda semana. Acompanhe nossas redes para não perder nenhuma novidade.",
  },
];

const EventsSection = () => {
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

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {eventos.map((evento, i) => {
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

        {/* Informações & Benefícios */}
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
              "A partir de 10 pessoas: espumante cortesia",
              "Entrada Homem: R$ 45 | Mulher: R$ 25",
              "Open Wine (Quinta): R$ 75/pessoa",
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
