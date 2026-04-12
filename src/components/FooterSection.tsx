import { Link } from "react-router-dom";
import { MapPin, Phone, Instagram, Clock } from "lucide-react";

const FooterSection = () => {
  return (
    <footer id="contato" className="py-16 px-4 border-t border-border bg-card/30">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-heading text-2xl text-gradient-gold mb-4">PIER 12</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              O rooftop mais exclusivo da cidade. Gastronomia, drinks e experiências inesquecíveis.
            </p>
          </div>

          <div>
            <h4 className="font-body text-sm tracking-widest text-primary uppercase mb-4">Horários</h4>
            <div className="space-y-2 font-body text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-primary/60" />
                <span>Qua - Sáb: 18:00 às 23:00</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-primary/60" />
                <span>Dom - Ter: Fechado</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-body text-sm tracking-widest text-primary uppercase mb-4">Contato</h4>
            <div className="space-y-2 font-body text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary/60" />
                <span>R. Mal. Deodoro, 299e - Centro, Chapecó - SC</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary/60" />
                <a href="https://wa.me/5549933004121" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">+55 (49) 93300-4121</a>
              </div>
              <div className="flex items-center gap-2">
                <Instagram size={14} className="text-primary/60" />
                <a href="https://www.instagram.com/pier12chapeco/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">@pier12chapeco</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-xs text-muted-foreground">
            © 2026 Pier 12 Rooftop. Todos os direitos reservados.
          </p>
          <Link
            to="/admin"
            className="font-body text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
