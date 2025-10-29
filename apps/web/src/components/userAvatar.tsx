import { useSidebar } from '@/components/ui/sidebar';

export default function UserAvatar({
  firstName,
  lastName,
  inSideBar = false,
  isActive = true,
}: {
  firstName: string;
  lastName: string;
  inSideBar?: boolean;
  isActive?: boolean;
}) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${isCollapsed && inSideBar ? 'h-8 w-8' : 'h-16 w-16'} ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-purple-600'
          : 'bg-muted text-foreground dark:bg-muted dark:text-foreground'
      } `}
    >
      <span
        className={`font-bold ${
          isActive ? 'text-white' : 'text-foreground dark:text-foreground'
        } ${isCollapsed && inSideBar ? 'text-sm' : 'text-xl'}`}
      >
        {initials}
      </span>
    </div>
  );
}
