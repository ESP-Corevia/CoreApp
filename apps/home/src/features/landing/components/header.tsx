import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { navLinks } from '../data/navigation';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-white/20 border-b bg-white/70 backdrop-blur-xl dark:bg-gray-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Corevia" className="size-9" />
          <span className="font-display font-extrabold text-primary text-xl tracking-tight">
            Corevia
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta"
            className="rounded-full bg-primary px-5 py-2 font-semibold text-sm text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          >
            Commencer
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-white px-6 pt-3 pb-5 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 font-medium text-foreground text-sm transition-colors hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
