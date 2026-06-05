import { Download, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const APK_URL =
  'https://github.com/ESP-Corevia/corevia_mobile/releases/download/v11/app-release.apk';

type DownloadAppDialogProps = {
  /** The element that opens the dialog (e.g. the "Télécharger l'application" button). */
  children: ReactNode;
};

export default function DownloadAppDialog({ children }: DownloadAppDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-hidden p-0">
        {/* Brand gradient strip */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-health-blue-400 to-health-blue-600" />

        <div className="px-7 pt-6 pb-7 text-center">
          <div className="mx-auto mb-4 inline-flex size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-health-blue-600 shadow-lg shadow-primary/20">
            <Smartphone className="size-6 text-white" />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="font-bold font-display text-2xl tracking-tight">
              Téléchargez Corevia
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-xs text-base">
              Scannez le QR code avec votre téléphone pour installer l'application mobile.
            </DialogDescription>
          </DialogHeader>

          {/* QR code */}
          <div className="mx-auto mt-6 mb-2 flex w-fit items-center justify-center rounded-2xl border bg-white p-3.5 shadow-sm">
            <QRCodeSVG
              value={APK_URL}
              size={168}
              level="M"
              marginSize={0}
              bgColor="#ffffff"
              fgColor="#0f172a"
              aria-label="QR code de téléchargement de l'application Corevia"
            />
          </div>

          <Button
            asChild
            size="lg"
            className="mt-5 h-12 w-full rounded-full font-bold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:shadow-xl"
          >
            <a href={APK_URL} download>
              <Download className="size-4" />
              Télécharger directement
            </a>
          </Button>

          <p className="mt-3.5 text-muted-foreground text-xs">
            Vous serez redirigé vers GitHub Releases (fichier .apk)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
