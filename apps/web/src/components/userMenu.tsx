import { Trans } from 'react-i18next';
import { useNavigate, Link } from 'react-router';
import { LogOut } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { useQuery } from '@tanstack/react-query';

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const trpc = useTrpc();
  const { data: user, isLoading } = useQuery({
    ...trpc.user.getMe.queryOptions({}),
    enabled: Boolean(session),
  });

  if (isPending || isLoading) {
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
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: async () => {
              await navigate('/');
            },
          },
        });
      }}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      <Trans i18nKey="userMenu.signOut">Sign Out</Trans>
    </Button>
  );
}
