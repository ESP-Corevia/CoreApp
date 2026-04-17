import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { GreetingBanner } from '@/components/greeting-banner';
import Loader from '@/components/loader';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useDoctorAppointmentsRange } from '@/queries/doctor';
import { TodaysAppointments } from '../components/todays-appointments';

function getParisYMD(offsetDays = 0): string {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
}

type Appt = {
  id: string;
  date: string;
  time: string;
  status: string;
  reason?: string | null;
  patient?: { name?: string | null };
};

function timeUntil(dateYMD: string, timeHM: string): string | null {
  const [h, m] = timeHM.split(':').map(Number);
  const [y, mo, d] = dateYMD.split('-').map(Number);
  const target = new Date(y, mo - 1, d, h, m);
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return null;
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function DoctorHome() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();
  const { data: session } = authClient.useSession();

  const today = getParisYMD(0);
  const weekEnd = getParisYMD(7);

  const todayQuery = useDoctorAppointmentsRange({
    from: today,
    to: today,
    sort: 'dateAsc',
    limit: 100,
  });

  const pendingQuery = useDoctorAppointmentsRange({
    status: 'PENDING',
    from: today,
    to: weekEnd,
    sort: 'dateAsc',
    limit: 100,
  });

  const { todaysAppointments, completedToday, nextUp } = useMemo(() => {
    const items = ((todayQuery.data?.items ?? []) as Appt[]).slice().sort((a, b) => {
      const ta = a.time ?? '99:99';
      const tb = b.time ?? '99:99';
      return ta.localeCompare(tb);
    });
    const completed = items.filter(a => a.status === 'COMPLETED').length;
    const next = items.find(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
    return { todaysAppointments: items, completedToday: completed, nextUp: next };
  }, [todayQuery.data]);

  const pendingCount = (pendingQuery.data?.items ?? []).length;

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const sessionAny = session as unknown as Record<string, unknown> | null;
  const user = sessionAny?.user as Record<string, unknown> | undefined;
  const userName = user?.name as string | undefined;

  const isFetching = todayQuery.isFetching || pendingQuery.isFetching;
  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] });
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <GreetingBanner
        name={userName}
        audience="doctor"
        stat={{ label: t('doctor.home.statsToday'), value: todaysAppointments.length }}
      />

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base md:text-lg">
          {t('doctor.home.overview', { defaultValue: 'Overview' })}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          aria-label={t('common.refresh', { defaultValue: 'Refresh' })}
          className="gap-2 text-muted-foreground"
        >
          <RefreshCw
            className={cn('size-4 transition-transform', isFetching && 'animate-spin')}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            {isFetching
              ? t('common.refreshing', { defaultValue: 'Refreshing…' })
              : t('common.refresh', { defaultValue: 'Refresh' })}
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          label={t('doctor.home.statsToday')}
          value={todayQuery.isLoading ? '…' : todaysAppointments.length}
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          label={t('doctor.home.statsPending')}
          value={pendingQuery.isLoading ? '…' : pendingCount}
          icon={Clock3}
          tone="warning"
        />
        <StatCard
          label={t('doctor.home.statsCompleted')}
          value={todayQuery.isLoading ? '…' : completedToday}
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label={t('doctor.home.statsUpcoming', { defaultValue: 'This week' })}
          value={pendingQuery.isLoading ? '…' : pendingCount}
          icon={CalendarClock}
          tone="primary"
        />
      </div>

      {nextUp && (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/0 to-transparent">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
              >
                <Sparkles className="size-5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-[11px] text-primary uppercase tracking-[0.08em]">
                  {t('doctor.home.nextUp', { defaultValue: 'Next up' })}
                </p>
                <p className="truncate font-semibold text-sm">
                  {nextUp.patient?.name ?? t('doctor.home.unknownPatient', { defaultValue: '—' })}
                </p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {nextUp.time}
                  {timeUntil(nextUp.date, nextUp.time) && (
                    <>
                      {' · '}
                      {t('doctor.home.inTime', {
                        defaultValue: 'in {{t}}',
                        t: timeUntil(nextUp.date, nextUp.time),
                      })}
                    </>
                  )}
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link to={`/doctor/appointments/${nextUp.id}`}>
                {t('common.view', { defaultValue: 'View' })}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="todays-appointments-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="todays-appointments-heading" className="font-semibold text-base md:text-lg">
            {t('doctor.home.todaysAppointments')}
          </h2>
          {todayQuery.dataUpdatedAt > 0 && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {new Date(todayQuery.dataUpdatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <TodaysAppointments
          appointments={todaysAppointments}
          isLoading={todayQuery.isLoading}
        />
      </section>
    </div>
  );
}
