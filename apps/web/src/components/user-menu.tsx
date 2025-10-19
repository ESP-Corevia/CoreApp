import { Trans } from 'react-i18next';
import { useNavigate, Link } from 'react-router';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';

import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Button variant="outline" asChild>
        <Link to="/login">
          <Trans i18nKey="userMenu.signIn">Sign In</Trans>
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{session.userId}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuLabel>
          <Trans i18nKey="userMenu.myAccount">My Account</Trans>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{session.userId}</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="destructive"
            className="w-full"
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: async () => {
                    await navigate('/');
                  },
                },
              });
            }}
          >
            <Trans i18nKey="userMenu.signOut">Sign Out</Trans>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
