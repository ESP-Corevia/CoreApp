import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type LoaderDialogProps = {
  open?: boolean;
  label?: string;
  description?: string;
};

export default function LoaderDialog({
  open = true,
  label = 'Loading',
  description = 'Please wait while we process your request.',
}: LoaderDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* prevent closing */
      }}
    >
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
        onInteractOutside={e => e.preventDefault()}
        className="border-border bg-card text-card-foreground w-[90vw] max-w-sm sm:max-w-md md:max-w-lg"
      >
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-4 p-6">
          <div className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600 200"
              className="text-foreground h-full w-full"
              aria-hidden="true"
            >
              <style>
                {`
    .trace {
      fill: none;
      stroke: currentColor;
      stroke-width: 6;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 2px currentColor);
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
      animation: draw 2.2s linear infinite;
    }
    .dot {
      fill: currentColor;
      filter: drop-shadow(0 0 6px currentColor);
      animation: blink 2.2s linear infinite;
    }


    @keyframes draw {
      0%   { stroke-dashoffset: 1000; }
      78%  { stroke-dashoffset: 0; }   
      92%  { stroke-dashoffset: 0; }   
      100% { stroke-dashoffset: 1000; }
    }

   
    @keyframes blink {
      0%, 60%, 100% { opacity: 0.35; }
      70%, 76%      { opacity: 1; }
    }
    `}
              </style>

              <path
                id="beat"
                className="trace"
                pathLength="1000"
                d="
      M 0,110
      C 40,110 60,110 80,110
      C 95,100 105,100 120,110       
      C 145,110 160,110 170,120      
      L 182,140                       
      L 195,40                        
      L 210,150                       
      L 235,110                       
      C 270,110 300,110 330,110       
      C 355,95 365,95 390,110         
      C 430,110 465,110 600,110       
    "
              />

              <circle r="5" className="dot">
                <animateMotion dur="2.2s" repeatCount="indefinite">
                  <mpath xlinkHref="#beat" />
                </animateMotion>
              </circle>
            </svg>
          </div>

          <p className="text-muted-foreground text-sm">{label}…</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
