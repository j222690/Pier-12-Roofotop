import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background video */}
      <div className="absolute inset-0">
        <video
          src="/videos/pier12-video1.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          style={{ minHeight: "100%", minWidth: "100%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Title text instead of logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="mb-6"
        >
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl tracking-[0.15em] text-gradient-gold">
            PIER 12
          </h1>
          <p className="font-body text-xs md:text-sm tracking-[0.5em] text-primary/70 uppercase mt-2">
            Rooftop & Lounge
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="w-24 h-px bg-gradient-gold mx-auto mb-8"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-body text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed"
        >
          Uma experiência gastronômica elevada, com vista panorâmica e o melhor pôr do sol da cidade.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <a
            href="#sobre"
            className="border border-gold/50 text-primary px-10 py-4 rounded-sm font-body text-xs font-semibold tracking-[0.3em] uppercase hover:bg-primary/10 transition-all duration-300"
          >
            Conheça o Pier
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown className="text-primary/40" size={24} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
