import {
  CalendarDays,
  ChevronsUpDown,
  FileText,
  HeartPulse,
  House,
  LifeBuoy,
  LogOut,
  PillBottle,
  Search,
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
import { Input } from '@/components/ui/input';
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
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

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
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

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
      return [
        { title: t('nav.medications'), url: '/patient/medications', icon: PillBottle },
        {
          title: t('nav.documents', { defaultValue: 'Documents' }),
          url: '/patient/documents',
          icon: FileText,
        },
      ];
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
      <SidebarGroupLabel className="px-2 font-medium text-[11px] text-sidebar-foreground/55 uppercase tracking-[0.08em]">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map(item => {
            const active = isActive(item);
            return (
              <SidebarMenuItem key={item.url} className="relative">
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-primary transition-all duration-200',
                    active ? 'opacity-100' : 'opacity-0',
                    collapsed && 'hidden',
                  )}
                />
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className={cn(
                    'h-9 gap-3 rounded-lg px-2.5 font-medium text-[13.5px] text-sidebar-foreground/75 transition-colors',
                    'hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                    'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/12',
                    '[&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-sidebar-foreground/60 data-[active=true]:[&>svg]:text-primary',
                  )}
                >
                  <Link to={item.url} aria-current={active ? 'page' : undefined}>
                    <item.icon aria-hidden="true" />
                    <span className="truncate">{item.title}</span>
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
    <SidebarPrimitive collapsible="icon" className="border-sidebar-border/80 border-r">
      <SidebarHeader className="gap-3 px-3 pt-4 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={t('app.name')}
              className="h-11 gap-2.5 rounded-lg px-2 hover:bg-transparent active:bg-transparent"
            >
              <Link to={`${prefix}/home`} aria-label={t('app.name')}>
                <span
                  className="relative flex aspect-square size-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-sm ring-1 ring-primary/25"
                  aria-hidden="true"
                >
                  <HeartPulse className="size-4" strokeWidth={2.25} />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold text-[15px] tracking-tight">
                    {t('app.name')}
                  </span>
                  {roleLabel && (
                    <span className="truncate text-[10.5px] text-sidebar-foreground/55 uppercase tracking-[0.1em]">
                      {roleLabel}
                    </span>
                  )}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {!collapsed && (
          <div className="relative px-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-sidebar-foreground/50"
            />
            <Input
              type="search"
              placeholder={t('common.search')}
              aria-label={t('common.search')}
              disabled
              aria-disabled="true"
              className="h-8 rounded-md border-sidebar-border/70 bg-sidebar-accent/40 pr-9 pl-8 text-[13px] shadow-none placeholder:text-sidebar-foreground/50 focus-visible:bg-background"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-2 hidden h-5 -translate-y-1/2 select-none items-center rounded border border-sidebar-border/70 bg-background/60 px-1.5 font-medium font-mono text-[10px] text-sidebar-foreground/60 md:inline-flex"
            >
              ⌘K
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarSeparator className="mx-3 bg-sidebar-border/60" />

      <SidebarContent className="px-2 py-2">
        {mainItems.length > 0 &&
          renderGroup(t('nav.main', { defaultValue: 'Navigation' }), mainItems)}

        {libraryItems.length > 0 &&
          renderGroup(t('nav.library', { defaultValue: 'Library' }), libraryItems)}

        {renderGroup(t('nav.account', { defaultValue: 'Account' }), accountItems)}

        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  className="h-8 rounded-md px-2.5 text-[12.5px] text-sidebar-foreground/60"
                >
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
        <SidebarFooter className="border-sidebar-border/60 border-t p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={userName}
                    aria-label={userEmail ? `${userName}, ${userEmail}` : userName}
                    className={cn(
                      'h-12 gap-2.5 rounded-lg px-1.5',
                      'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                    )}
                  >
                    <Avatar className="size-8 shrink-0 rounded-md ring-1 ring-sidebar-border/60">
                      <AvatarFallback className="rounded-md bg-gradient-to-br from-primary/25 to-primary/5 font-semibold text-[12px] text-primary">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-semibold text-[13px]">{userName}</span>
                      {userEmail && (
                        <span className="truncate text-[11.5px] text-sidebar-foreground/60">
                          {userEmail}
                        </span>
                      )}
                    </span>
                    <ChevronsUpDown
                      className="ml-auto size-4 shrink-0 text-sidebar-foreground/50"
                      aria-hidden="true"
                    />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="end"
                  sideOffset={12}
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
