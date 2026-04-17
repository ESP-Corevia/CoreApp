import { Bell, Check, ChevronRight, Globe, Moon, Sun } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme';

interface Crumb {
  label: string;
  to?: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const;

function useBreadcrumbs(): { title: string; crumbs: Crumb[] } {
  const location = useLocation();
  const params = useParams();
  const { t } = useTranslation();

  return useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return { title: t('app.name'), crumbs: [] };

    const root = segments[0];
    const section = segments[1];

    const sectionKeyMap: Record<string, string> = {
      home: t('nav.home'),
      appointments: t('nav.appointments'),
      doctors: t('nav.doctors'),
      pillbox: t('nav.pillbox'),
      medications: t('nav.medications'),
      documents: t('nav.documents', { defaultValue: 'Documents' }),
      profile: t('nav.profile'),
      settings: t('nav.settings'),
      patients: t('nav.pillbox'),
      onboarding: t('patient.onboarding.title'),
      'pending-verification': t('doctor.pendingVerification.title'),
    };

    const rootLabel =
      root === 'patient' || root === 'doctor'
        ? t(`auth.signUp.role${root === 'patient' ? 'Patient' : 'Doctor'}`)
        : root;

    const sectionLabel = section ? (sectionKeyMap[section] ?? section) : '';

    const crumbs: Crumb[] = [];
    if (section && section !== 'home') {
      crumbs.push({ label: rootLabel });
    }

    const title = sectionLabel || rootLabel;

    const hasDetail = segments.length > 2 && (params.id || params.patientId);
    if (hasDetail) {
      crumbs.push({ label: sectionLabel, to: `/${root}/${section}` });
      return { title: t('common.detail', { defaultValue: 'Detail' }), crumbs };
    }

    return { title, crumbs };
  }, [location.pathname, params.id, params.patientId, t]);
}

export function Header() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const { title, crumbs } = useBreadcrumbs();

  const sessionAny = session as unknown as Record<string, unknown> | null;
  const role = sessionAny?.role as 'patient' | 'doctor' | undefined;

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const changeLanguage = (code: string) => {
    void i18n.changeLanguage(code);
    try {
      localStorage.setItem('lang', code);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="flex w-full items-center gap-3">
      <div className="min-w-0 flex-1">
        {crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="hidden items-center gap-1 text-muted-foreground text-xs md:flex"
          >
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {c.to ? (
                  <Link
                    to={c.to}
                    className="truncate rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate">{c.label}</span>
                )}
                <ChevronRight aria-hidden="true" className="size-3 shrink-0 opacity-50" />
              </span>
            ))}
          </nav>
        )}
        <h1 className="truncate font-semibold text-[15px] leading-tight tracking-tight md:text-base">
          {title}
        </h1>
      </div>

      <div
        role="toolbar"
        aria-label={t('nav.headerActions', { defaultValue: 'Header actions' })}
        className="flex items-center gap-1"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('nav.language', { defaultValue: 'Language' })}
              className="size-9 rounded-full text-muted-foreground hover:text-foreground"
            >
              <Globe className="size-[18px]" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-44">
            <DropdownMenuLabel className="text-xs">
              {t('shared.settings.language')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LANGUAGES.map(lang => {
              const active = i18n.language.startsWith(lang.code);
              return (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <span>{lang.label}</span>
                  {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          aria-label={t('nav.toggleTheme', { defaultValue: 'Toggle theme' })}
          aria-pressed={isDark}
          onClick={toggleTheme}
          className="relative size-9 rounded-full text-muted-foreground hover:text-foreground"
        >
          <Sun
            className={cn(
              'size-[18px] transition-all duration-200',
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
            )}
            aria-hidden="true"
          />
          <Moon
            className={cn(
              'absolute size-[18px] transition-all duration-200',
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
            )}
            aria-hidden="true"
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('nav.notifications', { defaultValue: 'Notifications' })}
              className="relative size-9 rounded-full text-muted-foreground hover:text-foreground"
            >
              <Bell className="size-[18px]" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
              <span className="font-semibold text-sm">
                {t('nav.notifications', { defaultValue: 'Notifications' })}
              </span>
              {role && (
                <span className="text-muted-foreground text-xs">
                  {t(role === 'patient' ? 'auth.signUp.rolePatient' : 'auth.signUp.roleDoctor')}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-3 py-10 text-center text-muted-foreground text-sm">
              {t('nav.noNotifications', { defaultValue: 'No new notifications' })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
