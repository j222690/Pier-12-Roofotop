import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import ReservationForm from "@/components/ReservationForm";

const Reservar = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <p className="font-body text-xs tracking-[0.4em] text-primary uppercase mb-3">Reservas</p>
            <h1 className="font-heading text-4xl md:text-5xl text-gradient-gold mb-4">Reserve sua Mesa</h1>
            <p className="font-body text-muted-foreground max-w-md mx-auto">
              Garanta seu lugar no rooftop mais exclusivo de Chapecó. Pagamento seguro e confirmação instantânea.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6 md:p-8"
          >
            <ReservationForm />
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Reservar;
