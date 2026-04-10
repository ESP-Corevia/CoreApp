import { Calendar, ClipboardList, Home, Pill, Settings, Stethoscope, User } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();

  const role = (session as Record<string, unknown>)?.role as 'patient' | 'doctor' | undefined;

  const mainItems = useMemo<NavItem[]>(() => {
    if (role === 'patient') {
      return [
        { title: t('nav.home'), url: '/patient/home', icon: Home },
        { title: t('nav.appointments'), url: '/patient/appointments', icon: Calendar },
        { title: t('nav.doctors'), url: '/patient/doctors', icon: Stethoscope },
        { title: t('nav.pillbox'), url: '/patient/pillbox', icon: ClipboardList },
        { title: t('nav.medications'), url: '/patient/medications', icon: Pill },
      ];
    }
    if (role === 'doctor') {
      return [
        { title: t('nav.home'), url: '/doctor/home', icon: Home },
        { title: t('nav.appointments'), url: '/doctor/appointments', icon: Calendar },
        { title: t('nav.medications'), url: '/doctor/medications', icon: Pill },
      ];
    }
    return [];
  }, [role, t]);

  const settingsItems = useMemo<NavItem[]>(() => {
    const prefix = role === 'patient' ? '/patient' : '/doctor';
    return [
      { title: t('nav.profile'), url: `${prefix}/profile`, icon: User },
      { title: t('nav.settings'), url: `${prefix}/settings`, icon: Settings },
    ];
  }, [role, t]);

  const isActive = (url: string) => location.pathname === url;

  return (
    <SidebarPrimitive className="border-r" collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold text-xs uppercase tracking-wider">
            {t('app.name')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="group relative"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(item.url)}
                      className="transition-all duration-200"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="group relative"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(item.url)}
                      className="transition-all duration-200"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1 text-center text-muted-foreground text-xs">
          <p>&copy; {new Date().getFullYear()} Corevia</p>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
