/* v8 ignore file -- @preserve */

import { Trans } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
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
    <div className="mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 bg-background p-8 text-foreground transition-colors duration-200 md:gap-12 md:p-16">
      <div className="text-center">
        {/* Code */}
        <h1 className="mb-4 font-extrabold text-5xl text-primary tracking-tight sm:text-6xl">
          {code}
        </h1>

        {/* Title */}
        <h2 className="mb-3 font-semibold text-2xl text-foreground">{title}</h2>

        {/* Description */}
        <p className="max-w-prose text-balance text-muted-foreground">{description}</p>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
          {primaryButton ? (
            primaryButton
          ) : (
            <Button asChild>
              <Link to="/">
                <Trans i18nKey="forbidden.goBackHome">Go Back Home</Trans>
              </Link>
            </Button>
          )}
          <div>{secondaryButton}</div>
        </div>

        {/* Optional children (stack trace, etc.) */}
        {children ? (
          <div className="mt-8 max-w-3xl overflow-auto rounded-lg border border-border bg-muted p-4 text-left text-sm">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
