import { Calendar, ClipboardList, Home, MoreHorizontal, Pill, Stethoscope } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface TabItem {
  title: string;
  url: string;
  icon: typeof Home;
}

interface MoreItem {
  title: string;
  url: string;
}

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const [showMore, setShowMore] = useState(false);

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
          { title: t('nav.profile'), url: '/patient/profile' },
          { title: t('nav.settings'), url: '/patient/settings' },
          { title: t('nav.medications'), url: '/patient/medications' },
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

  const isActive = (url: string) => location.pathname.startsWith(url);

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div
            className="absolute right-0 bottom-16 left-0 border-border border-t bg-card p-2 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            {moreItems.map(item => (
              <button
                key={item.url}
                type="button"
                onClick={() => {
                  setShowMore(false);
                  navigate(item.url);
                }}
                className={cn(
                  'w-full rounded-lg px-4 py-3 text-left text-sm transition-colors',
                  isActive(item.url)
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed right-0 bottom-0 left-0 z-50 border-border border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {tabs.map(tab => (
            <Link
              key={tab.url}
              to={tab.url}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-colors',
                isActive(tab.url) ? 'font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.title}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setShowMore(prev => !prev)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-colors',
              showMore ? 'font-medium text-primary' : 'text-muted-foreground',
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
