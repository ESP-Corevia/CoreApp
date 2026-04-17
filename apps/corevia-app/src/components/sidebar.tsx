import {
  CalendarDays,
  ChevronsUpDown,
  HeartPulse,
  House,
  LifeBuoy,
  LogOut,
  PillBottle,
  Settings,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
  SidebarRail,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';

type IconType = typeof House;

interface NavItem {
  title: string;
  url: string;
  icon: IconType;
  exact?: boolean;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();

  const sessionAny = session as unknown as Record<string, unknown> | null;
  const user = sessionAny?.user as Record<string, unknown> | undefined;
  const role = sessionAny?.role as 'patient' | 'doctor' | undefined;
  const userName = (user?.name as string | undefined) ?? '';
  const userEmail = (user?.email as string | undefined) ?? '';

  const prefix = role === 'patient' ? '/patient' : '/doctor';
  const roleLabel = role ? t(`auth.signUp.role${role === 'patient' ? 'Patient' : 'Doctor'}`) : '';

  const mainItems = useMemo<NavItem[]>(() => {
    if (role === 'patient') {
      return [
        { title: t('nav.home'), url: '/patient/home', icon: House },
        { title: t('nav.appointments'), url: '/patient/appointments', icon: CalendarDays },
        { title: t('nav.doctors'), url: '/patient/doctors', icon: Stethoscope },
        { title: t('nav.pillbox'), url: '/patient/pillbox', icon: PillBottle },
      ];
    }
    if (role === 'doctor') {
      return [
        { title: t('nav.home'), url: '/doctor/home', icon: House },
        { title: t('nav.appointments'), url: '/doctor/appointments', icon: CalendarDays },
        { title: t('nav.medications'), url: '/doctor/medications', icon: PillBottle },
      ];
    }
    return [];
  }, [role, t]);

  const libraryItems = useMemo<NavItem[]>(() => {
    if (role === 'patient') {
      return [{ title: t('nav.medications'), url: '/patient/medications', icon: PillBottle }];
    }
    return [];
  }, [role, t]);

  const accountItems = useMemo<NavItem[]>(
    () => [
      { title: t('nav.profile'), url: `${prefix}/profile`, icon: UserRound },
      { title: t('nav.settings'), url: `${prefix}/settings`, icon: Settings },
    ],
    [prefix, t],
  );

  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.url : location.pathname.startsWith(item.url);

  const handleSignOut = async () => {
    await authClient.signOut();
    void navigate('/login', { replace: true });
  };

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => {
            const active = isActive(item);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link to={item.url} aria-current={active ? 'page' : undefined}>
                    <item.icon aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={t('app.name')}
              className="hover:bg-transparent active:bg-transparent"
            >
              <Link to={`${prefix}/home`} aria-label={t('app.name')}>
                <div
                  className="relative flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm ring-1 ring-primary/20"
                  aria-hidden="true"
                >
                  <HeartPulse className="size-4" />
                  <span className="absolute inset-0 rounded-lg bg-primary/30 opacity-0 motion-safe:animate-ping" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">{t('app.name')}</span>
                  {roleLabel && (
                    <span className="truncate text-[11px] text-sidebar-foreground/60 uppercase tracking-wider">
                      {roleLabel}
                    </span>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {mainItems.length > 0 &&
          renderGroup(t('nav.main', { defaultValue: 'Navigation' }), mainItems)}

        {libraryItems.length > 0 &&
          renderGroup(t('nav.library', { defaultValue: 'Library' }), libraryItems)}

        {renderGroup(t('nav.account', { defaultValue: 'Account' }), accountItems)}

        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="sm" className="text-sidebar-foreground/60">
                  <a
                    href="mailto:support@corevia.app"
                    aria-label={t('nav.support', { defaultValue: 'Support' })}
                  >
                    <LifeBuoy aria-hidden="true" />
                    <span>{t('nav.support', { defaultValue: 'Support' })}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {userName && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={userName}
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    aria-label={userEmail ? `${userName}, ${userEmail}` : userName}
                  >
                    <Avatar className="size-8 shrink-0 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 font-medium text-primary text-xs">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{userName}</span>
                      {userEmail && (
                        <span className="truncate text-sidebar-foreground/60 text-xs">
                          {userEmail}
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown
                      className="ml-auto size-4 shrink-0 opacity-60"
                      aria-hidden="true"
                    />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="end"
                  sideOffset={8}
                  className="w-60 rounded-lg"
                >
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
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="mr-2 size-4" aria-hidden="true" />
                    {t('common.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </SidebarPrimitive>
  );
}
