/* v8 ignore file -- @preserve */
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

export default function Header() {
  const location = useLocation();
  const { t } = useTranslation();

  // Convert pathname to readable page title
  const getPageTitle = (pathname: string) => {
    const titles: Record<string, { key: string; fallback: string }> = {
      '/': { key: 'header.home', fallback: 'Home' },
      '/dashboard': { key: 'header.dashboard', fallback: 'Dashboard' },
      '/ai-metrics': { key: 'header.aiMetrics', fallback: 'AI Metrics' },
      '/settings': { key: 'header.settings', fallback: 'Settings' },
      '/profile': { key: 'header.profile', fallback: 'Profile' },
    };
    const resolved = titles[pathname];
    if (!resolved) return t('header.page', 'Page');
    return t(resolved.key, resolved.fallback);
  };

  return (
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">{getPageTitle(location.pathname)}</h1>
    </header>
  );
}
