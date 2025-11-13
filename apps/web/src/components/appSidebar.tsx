import { Home, LayoutDashboard, Settings, Users, FileText, Bell } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserAvatar from './userAvatar';
interface NavigationItem {
  title: string;
  url: string;
  icon: typeof Home;
  badge?: string;
}

const mainItems: NavigationItem[] = [
  {
    title: 'Home',
    url: '/home',
    icon: Home,
  },
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
];

const secondaryItems: NavigationItem[] = [
  {
    title: 'Team',
    url: '/team',
    icon: Users,
  },
  {
    title: 'Documents',
    url: '/documents',
    icon: FileText,
  },
  {
    title: 'Notifications',
    url: '/notifications',
    icon: Bell,
    badge: '3',
  },
];

const settingsItems: NavigationItem[] = [
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];
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
      <div className="text-muted-foreground px-2 py-1 text-center text-xs">
        <p>© {year} Corevia</p>
      </div>
    );
  }
  return (
    <div className="text-muted-foreground px-2 py-1 text-center text-xs">
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
  const isActive = (url: string) => {
    return location.pathname === url;
  };

  const renderMenuItems = (items: NavigationItem[]) => {
    return items.map(item => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)} className="group relative">
          <button
            onClick={() => {
              navigate(item.url);
            }}
            className="transition-all duration-200"
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <div className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0 text-xs font-medium text-white">
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
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase">
            Workspace
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
                    ? 'bg-accent border-accent text-accent-foreground'
                    : 'bg-card border-border hover:bg-accent'
                }`}
              >
                <UserAvatar
                  firstName={user.user.firstName}
                  lastName={user.user.lastName}
                  inSideBar
                  isActive={isActive('/profile')}
                />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm leading-none font-medium">{user.user.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{user.user.email}</p>
                </div>
              </Link>
              <FooterDateTime onlyYear />
            </>
          ) : (
            <Link to="/profile" className="flex items-center justify-center p-2">
              <UserAvatar
                firstName={user.user.firstName}
                lastName={user.user.lastName}
                inSideBar
                isActive={isActive('/profile')}
              />
            </Link>
          )
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
