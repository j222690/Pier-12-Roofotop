import { motion } from "framer-motion";
import rooftopImage from "@/assets/pier12-rooftop.jpg";
import cocktailImage from "@/assets/pier12-cocktail.jpg";
import drinksImage from "@/assets/pier12-drinks.jpg";

const GallerySection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="font-body text-xs tracking-[0.4em] text-primary uppercase mb-3">Galeria</p>
          <h2 className="font-heading text-3xl md:text-4xl text-gradient-gold">Momentos no Pier 12</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cocktail Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-xl overflow-hidden border border-border aspect-[3/4]"
          >
            <img
              src={cocktailImage}
              alt="Drinks no pôr do sol - Pier 12"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          {/* Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-xl overflow-hidden border border-border aspect-[3/4]"
          >
            <video
              src="/videos/pier12-video2.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Rooftop Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-xl overflow-hidden border border-border aspect-[3/4]"
          >
            <img
              src={rooftopImage}
              alt="Vista do Pier 12 Rooftop"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          {/* Drinks Image - full width */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-3 rounded-xl overflow-hidden border border-border aspect-video"
          >
            <img
              src={drinksImage}
              alt="Drinks exclusivos do Pier 12"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
