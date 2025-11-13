const quickLinks = [
  { label: 'Product', href: '#product' },
  { label: 'Care Teams', href: '#clinicians' },
  { label: 'Security', href: '#security' },
  { label: 'Contact', href: '#contact' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const brandColor = '#00ff00';

  return (
    <footer className="border-border/60 bg-white px-6 py-10 text-slate-700">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: brandColor }}
          >
            Corevia Health
          </p>
          <p className="text-2xl font-semibold text-slate-900">Breathe easy.</p>
          <p className="text-sm leading-relaxed text-slate-500">
            A minimalist health companion to follow your vitals, coordinate with clinicians, and stay
            centered on what matters.
          </p>
        </div>

        <nav className="flex min-w-[10rem] flex-col gap-3 text-sm" aria-label="Quick navigation">
          {quickLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="transition-colors"
              style={{ color: '#1f2933' }}
              onMouseEnter={event => {
                event.currentTarget.style.color = brandColor;
              }}
              onMouseLeave={event => {
                event.currentTarget.style.color = '#1f2933';
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="min-w-[12rem] space-y-2 text-sm">
          <p className="font-semibold text-slate-900">Write to us</p>
          <a
            href="mailto:hello@corevia.health"
            className="hover:underline"
            style={{ color: brandColor }}
          >
            hello@corevia.health
          </a>
          <p className="text-slate-500">+33 1 86 95 32 10</p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-5xl flex-col gap-2 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
        <span>© {year} Corevia. All rights reserved.</span>
      </div>
    </footer>
  );
}
