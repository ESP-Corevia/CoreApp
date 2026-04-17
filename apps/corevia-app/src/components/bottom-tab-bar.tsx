import { Calendar, ClipboardList, Home, MoreHorizontal, Pill, Stethoscope } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface TabItem {
  title: string;
  url: string;
  icon: typeof Home;
  exact?: boolean;
}

interface MoreItem {
  title: string;
  url: string;
}

export function BottomTabBar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const [moreOpen, setMoreOpen] = useState(false);

  const role = (session as Record<string, unknown>)?.role as 'patient' | 'doctor' | undefined;

  const { tabs, moreItems } = useMemo(() => {
    if (role === 'patient') {
      return {
        tabs: [
          { title: t('nav.home'), url: '/patient/home', icon: Home },
          { title: t('nav.appointments'), url: '/patient/appointments', icon: Calendar },
          { title: t('nav.pillbox'), url: '/patient/pillbox', icon: ClipboardList },
          { title: t('nav.doctors'), url: '/patient/doctors', icon: Stethoscope },
        ] as TabItem[],
        moreItems: [
          { title: t('nav.medications'), url: '/patient/medications' },
          { title: t('nav.profile'), url: '/patient/profile' },
          { title: t('nav.settings'), url: '/patient/settings' },
        ] as MoreItem[],
      };
    }
    if (role === 'doctor') {
      return {
        tabs: [
          { title: t('nav.home'), url: '/doctor/home', icon: Home },
          { title: t('nav.appointments'), url: '/doctor/appointments', icon: Calendar },
          { title: t('nav.medications'), url: '/doctor/medications', icon: Pill },
        ] as TabItem[],
        moreItems: [
          { title: t('nav.profile'), url: '/doctor/profile' },
          { title: t('nav.settings'), url: '/doctor/settings' },
        ] as MoreItem[],
      };
    }
    return { tabs: [] as TabItem[], moreItems: [] as MoreItem[] };
  }, [role, t]);

  const isActive = (url: string, exact = false) =>
    exact ? location.pathname === url : location.pathname.startsWith(url);

  const isMoreActive = moreItems.some(item => isActive(item.url));

  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed right-0 bottom-0 left-0 z-40 border-border/80 border-t md:hidden',
        'bg-card/90 backdrop-blur-lg supports-[backdrop-filter]:bg-card/70',
        'safe-bottom',
      )}
    >
      <ul className="flex items-stretch justify-around px-1 pt-1">
        {tabs.map(tab => {
          const active = isActive(tab.url, tab.exact);
          return (
            <li key={tab.url} className="flex-1">
              <Link
                to={tab.url}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.title}
                className={cn(
                  'relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5',
                  'text-[11px] font-medium transition-colors duration-150',
                  'active:scale-95 transition-transform',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    '-translate-x-1/2 absolute top-0 left-1/2 h-0.5 w-8 rounded-b-full transition-all duration-200',
                    active ? 'bg-primary opacity-100' : 'opacity-0',
                  )}
                />
                <tab.icon
                  aria-hidden="true"
                  className={cn('h-5 w-5 transition-transform duration-150', active && 'scale-110')}
                />
                <span className="truncate">{tab.title}</span>
              </Link>
            </li>
          );
        })}

        {moreItems.length > 0 && (
          <li className="flex-1">
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={t('nav.more')}
                  aria-expanded={moreOpen}
                  className={cn(
                    'relative flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5',
                    'text-[11px] font-medium transition-colors duration-150 active:scale-95',
                    isMoreActive || moreOpen
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      '-translate-x-1/2 absolute top-0 left-1/2 h-0.5 w-8 rounded-b-full transition-all duration-200',
                      isMoreActive || moreOpen ? 'bg-primary opacity-100' : 'opacity-0',
                    )}
                  />
                  <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
                  <span className="truncate">{t('nav.more')}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl p-0">
                <SheetHeader className="border-border border-b px-5 py-4 text-left">
                  <SheetTitle>{t('nav.more')}</SheetTitle>
                  <SheetDescription className="sr-only">
                    {t('nav.userMenu', { defaultValue: 'Additional navigation' })}
                  </SheetDescription>
                </SheetHeader>
                <ul className="flex flex-col p-2 pb-4 safe-bottom">
                  {moreItems.map(item => {
                    const active = isActive(item.url);
                    return (
                      <li key={item.url}>
                        <Link
                          to={item.url}
                          onClick={() => setMoreOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex min-h-[48px] items-center rounded-lg px-4 py-3 text-sm transition-colors',
                            'active:scale-[0.98] transition-transform',
                            active
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'text-foreground hover:bg-accent',
                          )}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </SheetContent>
            </Sheet>
          </li>
        )}
      </ul>
    </nav>
  );
}
