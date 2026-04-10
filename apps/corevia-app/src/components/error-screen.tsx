import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function ErrorScreen({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 bg-background p-8 text-foreground">
      <div className="text-center">
        <h1 className="mb-4 font-extrabold text-5xl text-primary tracking-tight sm:text-6xl">
          {code}
        </h1>
        <h2 className="mb-3 font-semibold text-2xl text-foreground">{title}</h2>
        <p className="max-w-prose text-balance text-muted-foreground">{description}</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button asChild>
            <Link to="/">{t('errors.forbidden.goHome')}</Link>
          </Button>
        </div>
        {children && (
          <div className="mt-8 max-w-3xl overflow-auto rounded-lg border border-border bg-muted p-4 text-left text-sm">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
