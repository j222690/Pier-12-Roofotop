import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/pier12-logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const goToReservar = () => {
    setOpen(false);
    navigate("/reservar");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const links = [
    { label: "Início", href: "/" },
    { label: "Sobre", href: "#sobre" },
    { label: "Eventos", href: "#eventos" },
    { label: "Contato", href: "#contato" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Pier 12" className="w-8 h-8 object-contain" />
          <span className="font-heading text-lg tracking-[0.2em] text-gradient-gold">PIER 12</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) =>
            l.href.startsWith("#") ? (
              <a
                key={l.label}
                href={l.href}
                className="font-body text-xs tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors duration-300 uppercase"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                to={l.href}
                className="font-body text-xs tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors duration-300 uppercase"
              >
                {l.label}
              </Link>
            )
          )}
          <button
            onClick={goToReservar}
            className="bg-gradient-gold text-primary-foreground px-6 py-2.5 rounded-sm font-body text-xs font-semibold tracking-[0.2em] uppercase hover:opacity-90 transition-all duration-300 shadow-gold"
          >
            Reservar
          </button>
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={goToReservar}
            className="bg-gradient-gold text-primary-foreground px-4 py-2 rounded-sm font-body text-[10px] font-semibold tracking-widest uppercase hover:opacity-90 transition-all shadow-gold"
          >
            Reservar
          </button>
          <button onClick={() => setOpen(!open)} className="text-primary">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-border/50"
          >
            <div className="flex flex-col p-4 gap-4">
              {links.map((l) =>
                l.href.startsWith("#") ? (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-body text-xs tracking-[0.2em] text-muted-foreground hover:text-primary uppercase"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    to={l.href}
                    onClick={() => setOpen(false)}
                    className="font-body text-xs tracking-[0.2em] text-muted-foreground hover:text-primary uppercase"
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
