import {
  Bell,
  Check,
  ChevronRight,
  Globe,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme';

interface Crumb {
  label: string;
  to?: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
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
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const { title, crumbs } = useBreadcrumbs();

  const sessionAny = session as unknown as Record<string, unknown> | null;
  const user = sessionAny?.user as Record<string, unknown> | undefined;
  const userName = (user?.name as string | undefined) ?? '';
  const userEmail = (user?.email as string | undefined) ?? '';
  const role = sessionAny?.role as 'patient' | 'doctor' | undefined;
  const roleLabel = role
    ? t(role === 'patient' ? 'auth.signUp.rolePatient' : 'auth.signUp.roleDoctor')
    : '';
  const prefix = role === 'patient' ? '/patient' : '/doctor';

  const initials = userName
    ? userName
        .trim()
        .split(/\s+/)
        .map(p => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const handleSignOut = async () => {
    await authClient.signOut();
    void navigate('/login', { replace: true });
  };

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

  const searchPlaceholder =
    role === 'patient'
      ? t('patient.doctors.search', { defaultValue: t('common.search') })
      : role === 'doctor'
        ? t('doctor.medications.search', { defaultValue: t('common.search') })
        : t('common.search');

  return (
    <div className="flex w-full items-center gap-2 md:gap-3">
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
                    className="truncate rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate">{c.label}</span>
                )}
                <ChevronRight aria-hidden="true" className="size-3 shrink-0 opacity-60" />
              </span>
            ))}
          </nav>
        )}
        <h1 className="truncate font-semibold text-base leading-tight tracking-tight md:text-lg">
          {title}
        </h1>
      </div>

      <div className="relative hidden max-w-xs flex-1 lg:block">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          aria-label={t('common.search')}
          className="h-9 pl-9 text-sm"
          disabled
          aria-disabled="true"
        />
      </div>

      <div className="flex items-center gap-0.5 md:gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('nav.language', { defaultValue: 'Language' })}
              className="hidden rounded-full sm:inline-flex"
            >
              <Globe className="size-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
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
          onClick={toggleTheme}
          className="relative rounded-full"
        >
          <Sun
            className={cn(
              'size-5 transition-all duration-200',
              isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100',
            )}
            aria-hidden="true"
          />
          <Moon
            className={cn(
              'absolute size-5 transition-all duration-200',
              isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0',
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
              className="relative rounded-full"
            >
              <Bell className="size-5" aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 block size-1.5 rounded-full bg-primary opacity-0"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{t('nav.notifications', { defaultValue: 'Notifications' })}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-3 py-8 text-center text-muted-foreground text-sm">
              {t('nav.noNotifications', { defaultValue: 'No new notifications' })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('nav.userMenu', { defaultValue: 'User menu' })}
              className="ml-1 rounded-full md:hidden"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 font-medium text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {userName && (
              <>
                <DropdownMenuLabel className="flex flex-col gap-0.5 p-3">
                  <span className="truncate font-medium text-sm">{userName}</span>
                  {userEmail && (
                    <span className="truncate font-normal text-muted-foreground text-xs">
                      {userEmail}
                    </span>
                  )}
                  {roleLabel && (
                    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[10px] text-primary uppercase tracking-wide">
                      {roleLabel}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            {role && (
              <>
                <DropdownMenuItem asChild>
                  <Link to={`${prefix}/profile`} className="cursor-pointer">
                    <UserRound className="mr-2 size-4" aria-hidden="true" />
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`${prefix}/settings`} className="cursor-pointer">
                    <Settings className="mr-2 size-4" aria-hidden="true" />
                    {t('nav.settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" aria-hidden="true" />
              {t('common.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
