import { motion } from "framer-motion";
import { Wine, Utensils, Music, Sunset } from "lucide-react";

const features = [
  { icon: Sunset, title: "Vista Panorâmica", desc: "O melhor pôr do sol da cidade, a céu aberto." },
  { icon: Utensils, title: "Gastronomia Premium", desc: "Cardápio autoral com ingredientes selecionados." },
  { icon: Wine, title: "Carta de Vinhos", desc: "Rótulos exclusivos nacionais e internacionais." },
  { icon: Music, title: "Ambiente Exclusivo", desc: "DJ sets e atmosfera sofisticada toda semana." },
];

const AboutSection = () => {
  return (
    <section id="sobre" className="py-24 px-4 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[150px]" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.4em] text-primary uppercase mb-4">Experiência</p>
          <h2 className="font-heading text-4xl md:text-5xl text-gradient-gold mb-6">O Rooftop</h2>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            No topo da cidade, o Pier 12 oferece uma experiência gastronômica única, 
            combinando alta gastronomia, drinks autorais e uma vista que encanta.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="bg-card border border-border rounded-lg p-8 text-center hover:border-primary/30 transition-colors duration-500 group"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                <f.icon className="text-primary" size={24} />
              </div>
              <h3 className="font-heading text-lg mb-3 text-foreground">{f.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
