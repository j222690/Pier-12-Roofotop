import { motion } from "framer-motion";
import { PartyPopper, Briefcase, Heart, MessageCircle } from "lucide-react";

const events = [
  { icon: Briefcase, title: "Corporativos", desc: "Confraternizações, reuniões e lançamentos com vista exclusiva." },
  { icon: PartyPopper, title: "Aniversários", desc: "Celebre seu dia com estilo no rooftop mais elegante da cidade." },
  { icon: Heart, title: "Casamentos", desc: "Mini weddings e recepções íntimas em um cenário inesquecível." },
];

const PrivateEventsSection = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.4em] text-primary uppercase mb-4">Exclusividade</p>
          <h2 className="font-heading text-4xl md:text-5xl text-gradient-gold mb-6">Eventos Privativos</h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Realizamos eventos fechados sob medida. Corporativos, aniversários, casamentos e celebrações exclusivas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {events.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card/60 border border-border rounded-lg p-8 text-center hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <e.icon className="text-primary" size={22} />
              </div>
              <h3 className="font-heading text-xl mb-3 text-foreground">{e.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="https://wa.me/5549933004121?text=Olá! Gostaria de solicitar um orçamento para evento privativo no Pier 12."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gradient-gold text-primary-foreground px-8 py-4 rounded-sm font-body text-sm font-semibold tracking-widest uppercase hover:opacity-90 transition-all shadow-gold"
          >
            <MessageCircle size={18} />
            Solicitar Orçamento
          </a>
          <p className="font-body text-xs text-muted-foreground mt-4">
            Responderemos em até 24 horas pelo WhatsApp
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PrivateEventsSection;
