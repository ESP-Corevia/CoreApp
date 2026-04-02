import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import { Separator } from '@/components/ui/separator';
import { footerLegal, footerNav } from '../data/navigation';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      {/* Gradient separator line */}
      <div className="gradient-line h-px" />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Corevia" className="size-9 brightness-0 invert" />
              <span className="font-display font-extrabold text-xl tracking-tight">Corevia</span>
            </Link>
            <p className="mt-3 max-w-xs text-background/60 text-sm leading-relaxed">
              Votre compagnon santé intelligent. Suivi des constantes, rappels, assistant IA et
              téléconsultation — le tout dans une application simple et sécurisée.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-4 font-semibold text-background/40 text-sm uppercase tracking-wider">
              Navigation
            </p>
            <ul className="space-y-2.5">
              {footerNav.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-background/70 text-sm transition-colors hover:text-background"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 font-semibold text-background/40 text-sm uppercase tracking-wider">
              Légal
            </p>
            <ul className="space-y-2.5">
              {footerLegal.map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-background/70 text-sm transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 font-semibold text-background/40 text-sm uppercase tracking-wider">
              Contact
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:hello@corevia.health"
                  className="text-background/70 transition-colors hover:text-background"
                >
                  hello@corevia.health
                </a>
              </li>
              <li className="text-background/70">+33 1 86 95 32 10</li>
              <li className="text-background/70">Rennes, France</li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-background/10" />

        <div className="flex flex-col items-center justify-between gap-3 text-background/40 text-xs sm:flex-row">
          <span>© {year} Corevia. Tous droits réservés.</span>
          <span className="flex items-center gap-1">
            Fait avec <Heart className="size-3 fill-red-400 text-red-400" /> pour votre santé
          </span>
        </div>
      </div>
    </footer>
  );
}
