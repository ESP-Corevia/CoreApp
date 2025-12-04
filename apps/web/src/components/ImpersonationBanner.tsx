import { useEffect, useState } from 'react';
import {
  Banner,
  BannerAction,
  BannerClose,
  BannerIcon,
  BannerTitle,
} from '@/components/ui/shadcn-io/banner';
import { CircleAlert } from 'lucide-react';
import { Trans } from 'react-i18next';
import { useRequireAuth } from '@/hooks/use-require-auth';
export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const isPopup = typeof window !== 'undefined' && window.name === 'impersonation-window';
  const { session } = useRequireAuth();
  useEffect(() => {
    if (!isPopup || !session?.impersonatedBy) return;
    setIsImpersonating(true);
  }, [isPopup, session]);

  async function stopImpersonating() {
    window.close();
  }

  if (!isImpersonating) return null;

  return (
    <Banner>
      <BannerIcon icon={CircleAlert} />
      <BannerTitle>
        <Trans i18nKey="impersonationBanner.title">You are currently impersonating a user.</Trans>
      </BannerTitle>
      <BannerAction onClick={stopImpersonating}>
        <Trans i18nKey="impersonationBanner.exit">Exit impersonation</Trans>
      </BannerAction>
      <BannerClose />
    </Banner>
  );
}
