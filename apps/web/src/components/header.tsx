/* v8 ignore file -- @preserve */
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

export default function Header() {
  const location = useLocation();
  const { t } = useTranslation();

  // Convert pathname to readable page title
  const getPageTitle = (pathname: string) => {
    const titles: Record<string, string> = {
      '/': t('nav.home', 'Home'),
      '/dashboard': t('nav.dashboard', 'Dashboard'),
      '/settings': t('nav.settings', 'Settings'),
      '/profile': t('nav.profile', 'Profile'),
      '/medications': t('nav.medications', 'Medications'),
      '/pillbox': t('nav.pillbox', 'Pillbox'),
      '/doctors': t('nav.doctors', 'Doctors'),
      '/patients': t('nav.patients', 'Patients'),
      '/appointments': t('nav.appointments', 'Appointments'),
    };
    if (titles[pathname]) return titles[pathname];
    if (pathname.startsWith('/pillbox/')) return t('nav.pillboxDetails', 'Pillbox Details');
    return t('nav.page', 'Page');
  };

  return (
    <header className="flex items-center justify-between">
      <h1 className="font-bold text-2xl tracking-tight">{getPageTitle(location.pathname)}</h1>
    </header>
  );
}
