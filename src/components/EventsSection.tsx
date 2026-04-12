import { motion } from "framer-motion";
import { UtensilsCrossed, Wine, Clock, Star } from "lucide-react";

const EventsSection = () => {
  return (
    <section id="eventos" className="py-24 px-4 bg-card/30">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.4em] text-primary uppercase mb-4">Programação</p>
          <h2 className="font-heading text-4xl md:text-5xl text-gradient-gold">Noites Especiais</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-lg p-10 hover:border-primary/30 transition-colors duration-500"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <UtensilsCrossed className="text-primary" size={24} />
              </div>
              <div>
                <p className="font-body text-xs tracking-widest text-primary uppercase">Quarta-feira</p>
                <h3 className="font-heading text-2xl text-foreground">Open Food</h3>
              </div>
            </div>
            <p className="font-body text-muted-foreground leading-relaxed mb-4">
              Toda quarta, o chef seleciona um prato especial do dia. Uma experiência gastronômica autoral e exclusiva.
            </p>
            <div className="flex items-center gap-2 text-primary/70">
              <Clock size={14} />
              <span className="font-body text-xs tracking-wider">A partir das 19:30</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-lg p-10 hover:border-primary/30 transition-colors duration-500"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Wine className="text-primary" size={24} />
              </div>
              <div>
                <p className="font-body text-xs tracking-widest text-primary uppercase">Quinta-feira</p>
                <h3 className="font-heading text-2xl text-foreground">Open Wine</h3>
              </div>
            </div>
            <p className="font-body text-muted-foreground leading-relaxed mb-4">
              Toda quinta, rótulos selecionados pelo sommelier para uma noite dedicada aos amantes de vinho.
            </p>
            <div className="flex items-center gap-2 text-primary/70">
              <Clock size={14} />
              <span className="font-body text-xs tracking-wider">A partir das 18:00</span>
            </div>
          </motion.div>
        </div>

        {/* Rules */}
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
