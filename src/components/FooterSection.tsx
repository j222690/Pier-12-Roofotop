import { Link } from "react-router-dom";
import { MapPin, Phone, Instagram, Clock } from "lucide-react";
import { useBusinessSettings } from "@/hooks/use-business-settings";

const DAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const FooterSection = () => {
  const { settings } = useBusinessSettings();

  // Build concise open-day labels from business hours
  const openDays: string[] = [];
  let i = 0;
  while (i < 7) {
    const h = settings.businessHours[i];
    if (h) {
      // Find consecutive days with same hours
      let j = i + 1;
      while (j < 7 && JSON.stringify(settings.businessHours[j]) === JSON.stringify(h)) j++;
      const label = j - i === 1
        ? DAY_NAMES_SHORT[i]
        : `${DAY_NAMES_SHORT[i]} - ${DAY_NAMES_SHORT[j - 1]}`;
      openDays.push(`${label}: ${h.open} às ${h.close}`);
      i = j;
    } else {
      i++;
    }
  }

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
              {openDays.length > 0 ? (
                openDays.map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Clock size={14} className="text-primary/60" />
                    <span>{label}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary/60" />
                  <span>Consulte nossas redes</span>
                </div>
              )}
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
