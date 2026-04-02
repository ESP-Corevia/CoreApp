import { Activity, Bell, Heart, Thermometer } from 'lucide-react';

/**
 * Pure CSS/Tailwind dashboard mockup showing Corevia's app interface.
 * Glassmorphism container with 3D perspective transform and float animation.
 * Hidden on mobile — desktop only.
 */
export default function HeroDashboardMockup() {
  return (
    <div className="relative hidden lg:block">
      {/* Main mockup container */}
      <div
        className="glassmorphism w-[340px] overflow-hidden xl:w-[380px]"
        style={{
          transform: 'perspective(1000px) rotateY(-5deg) rotateX(3deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* App header */}
        <div className="flex items-center justify-between border-white/20 border-b bg-gradient-to-r from-health-blue-500 to-primary px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-white/20">
              <Heart className="size-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">Corevia</span>
          </div>
          <div className="size-7 rounded-full bg-white/20" />
        </div>

        {/* Dashboard content */}
        <div className="space-y-4 p-5">
          {/* Health score */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-medium text-muted-foreground text-xs">Sante globale</span>
              <span className="font-bold text-primary text-xs">85%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/60">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-health-blue-500 to-primary transition-all" />
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={Heart}
              label="Pouls"
              value="72"
              unit="bpm"
              color="text-rose-500"
              bgColor="bg-rose-50"
            />
            <MetricCard
              icon={Activity}
              label="Tension"
              value="120/80"
              unit="mmHg"
              color="text-health-blue-500"
              bgColor="bg-health-blue-50"
            />
            <MetricCard
              icon={Thermometer}
              label="Temperature"
              value="36.6"
              unit="°C"
              color="text-amber-500"
              bgColor="bg-amber-50"
            />
            <MetricCard
              icon={Activity}
              label="SpO2"
              value="98"
              unit="%"
              color="text-primary"
              bgColor="bg-health-green-50"
            />
          </div>

          {/* Heart rate graph (SVG) */}
          <div className="rounded-xl bg-muted/30 p-3">
            <span className="mb-2 block font-medium text-muted-foreground text-xs">
              Frequence cardiaque
            </span>
            <svg viewBox="0 0 200 40" className="h-10 w-full" preserveAspectRatio="none">
              <title>Heart rate frequency graph</title>
              <path
                d="M0,20 L20,20 L25,8 L30,32 L35,12 L40,28 L45,20 L65,20 L70,8 L75,32 L80,12 L85,28 L90,20 L110,20 L115,8 L120,32 L125,12 L130,28 L135,20 L155,20 L160,8 L165,32 L170,12 L175,28 L180,20 L200,20"
                fill="none"
                stroke="url(#heartGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#16A34A" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Medication reminder */}
          <div className="flex items-center gap-3 rounded-xl bg-health-blue-50 px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-health-blue-500/10">
              <Bell className="size-4 text-health-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-xs">Prochain rappel : 14h30</p>
              <p className="text-[11px] text-muted-foreground">Doliprane 1000mg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  bgColor,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  unit: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl border border-white/30 bg-white/50 p-3 dark:bg-white/5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className={`size-5 rounded-md ${bgColor} flex items-center justify-center`}>
          <Icon className={`size-3 ${color}`} />
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-bold text-foreground text-lg">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
