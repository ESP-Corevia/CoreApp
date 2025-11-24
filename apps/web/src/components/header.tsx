import { useLocation } from 'react-router';

export default function Header() {
  const location = useLocation();

  // Convert pathname to readable page title
  const getPageTitle = (pathname: string) => {
    const titles: Record<string, string> = {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/settings': 'Settings',
      '/profile': 'Profile',
    };
    return titles[pathname] || 'Page';
  };

  return (
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">{getPageTitle(location.pathname)}</h1>
    </header>
  );
}
