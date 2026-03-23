/* v8 ignore file -- @preserve */
import { Moon, Sun } from 'lucide-react';
import { Trans } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/providers/theme';

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">
            <Trans i18nKey="modeToggle.toggleTheme">Toggle theme</Trans>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Trans i18nKey="modeToggle.light">Light</Trans>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Trans i18nKey="modeToggle.dark">Dark</Trans>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Trans i18nKey="modeToggle.system">System</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
