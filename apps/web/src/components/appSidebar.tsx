/* v8 ignore file -- @preserve */

import { useQuery } from '@tanstack/react-query';
import {
  Bot,
  Calendar,
  ClipboardList,
  Home,
  LayoutDashboard,
  Pill,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

interface NavigationItem {
  title: string;
  url: string;
  icon: typeof Home;
  badge?: string;
}
export default function FooterDateTime({ onlyYear = false }: { onlyYear?: boolean }) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(now);
  const day = new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(now);
  const year = now.getFullYear();
  const time = now.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  if (onlyYear) {
    return (
      <div className="px-2 py-1 text-center text-muted-foreground text-xs">
        <p>© {year} Corevia</p>
      </div>
    );
  }
  return (
    <div className="px-2 py-1 text-center text-muted-foreground text-xs">
      <p>
        {weekday} {day} {year}
        <br />
        {time}
        <br />@ {year} Corevia
      </p>
    </div>
  );
}
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = authClient.useSession();
  const trpc = useTrpc();
  const { data: user, isLoading } = useQuery({
    ...trpc.user.getMe.queryOptions({}),
    enabled: Boolean(session),
  });
  const { state: sidebarState } = useSidebar();
  const { t } = useTranslation();
  const role = (session as Record<string, unknown>)?.role as
    | 'patient'
    | 'admin'
    | 'doctor'
    | undefined;

  const baseMainItems = useMemo<NavigationItem[]>(
    () => [
      { title: t('nav.home', 'Home'), url: '/', icon: Home },
      { title: t('nav.dashboard', 'Dashboard'), url: '/dashboard', icon: LayoutDashboard },
      { title: t('nav.aiMetrics', 'AI Metrics'), url: '/ai-metrics', icon: Bot },
      { title: t('nav.doctors', 'Doctors'), url: '/doctors', icon: Stethoscope },
      { title: t('nav.appointments', 'Appointments'), url: '/appointments', icon: Calendar },
    ],
    [t],
  );

  const secondaryItems = useMemo<NavigationItem[]>(() => [], []);

  const settingsItems = useMemo<NavigationItem[]>(
    () => [{ title: t('nav.settings', 'Settings'), url: '/settings', icon: Settings }],
    [t],
  );

  const mainItems = useMemo<NavigationItem[]>(() => {
    const items = [...baseMainItems];

    if (role === 'admin') {
      items.push(
        { title: t('nav.patients', 'Patients'), url: '/patients', icon: Users },
        { title: t('nav.medications', 'Medications'), url: '/medications', icon: Pill },
        { title: t('nav.pillbox', 'Pillbox'), url: '/pillbox', icon: ClipboardList },
      );
    } else if (role === 'patient') {
      items.push(
        { title: t('nav.medications', 'Medications'), url: '/medications', icon: Pill },
        { title: t('nav.myPillbox', 'My Pillbox'), url: '/pillbox', icon: ClipboardList },
      );
    }

    return items;
  }, [baseMainItems, role, t]);

  const isActive = (url: string) => {
    return location.pathname === url;
  };

  const renderMenuItems = (items: NavigationItem[]) => {
    return items.map(item => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive(item.url)} className="group relative">
          <button
            type="button"
            onClick={() => {
              navigate(item.url);
            }}
            className="transition-all duration-200"
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <div className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0 font-medium text-white text-xs">
                {item.badge}
              </div>
            )}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };

  return (
    <Sidebar className="border-r" collapsible="icon" variant="floating">
      <SidebarContent className="overflow-hidden">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold text-xs uppercase tracking-wider">
            {t('nav.main', 'Main')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold text-xs uppercase tracking-wider">
            {t('nav.workspace', 'Workspace')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(secondaryItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(settingsItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - User Profile */}
      <SidebarFooter>
        {isLoading ? (
          <Skeleton className="h-14 w-full rounded-lg" />
        ) : session && user ? (
          sidebarState !== 'collapsed' ? (
            <>
              <Link
                to="/profile"
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isActive('/profile')
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user.image ?? undefined} />
                  <AvatarFallback>{user.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium text-sm leading-none">{user.user.name}</p>
                  <p className="truncate text-muted-foreground text-xs">{user.user.email}</p>
                </div>
              </Link>
              <FooterDateTime onlyYear />
            </>
          ) : (
            <Link to="/profile" className="flex items-center justify-center p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user.image ?? undefined} />
                <AvatarFallback>{user.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
          )
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
