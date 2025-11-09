import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Trans } from 'react-i18next';
export function ErrorScreen({
  code,
  title,
  description,
  primaryButton,
  secondaryButton,
  children,
}: {
  code: string;
  title: string;
  description: React.ReactNode;
  primaryButton?: React.ReactNode;
  secondaryButton?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 p-8 transition-colors duration-200 md:gap-12 md:p-16">
      <div className="text-center">
        {/* Code */}
        <h1 className="text-primary mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
          {code}
        </h1>

        {/* Title */}
        <h2 className="text-foreground mb-3 text-2xl font-semibold">{title}</h2>

        {/* Description */}
        <p className="text-muted-foreground max-w-prose text-balance">{description}</p>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
          {primaryButton ? (
            primaryButton
          ) : (
            <Button asChild>
              <Link to="/">
                <Trans key="errorScreen.gobackhome">Go Back Home</Trans>
              </Link>
            </Button>
          )}
          <div>{secondaryButton}</div>
        </div>

        {/* Optional children (stack trace, etc.) */}
        {children ? (
          <div className="border-border bg-muted mt-8 max-w-3xl overflow-auto rounded-lg border p-4 text-left text-sm">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
