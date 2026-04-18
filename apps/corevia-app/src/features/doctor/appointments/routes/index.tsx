import { Calendar, CalendarDays, CheckCircle2, Clock3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfiniteList } from '@/components/infinite-list';
import Loader from '@/components/loader';
import { StatCard } from '@/components/stat-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useDoctorMyAppointments } from '@/queries/doctor';
import { AppointmentCard } from '../components/appointment-card';

type TabValue = 'all' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const TABS: { value: TabValue; labelKey: string }[] = [
  { value: 'all', labelKey: 'doctor.appointments.allStatuses' },
  { value: 'PENDING', labelKey: 'patient.appointments.status.PENDING' },
  { value: 'CONFIRMED', labelKey: 'patient.appointments.status.CONFIRMED' },
  { value: 'COMPLETED', labelKey: 'patient.appointments.status.COMPLETED' },
  { value: 'CANCELLED', labelKey: 'patient.appointments.status.CANCELLED' },
];

function getAppointmentTs(a: Record<string, unknown>): number {
  const dateRaw = a.date as string | undefined;
  if (!dateRaw) return Number.POSITIVE_INFINITY;
  if (dateRaw.includes('T')) {
    const d = new Date(dateRaw);
    return Number.isNaN(d.getTime()) ? Number.POSITIVE_INFINITY : d.getTime();
  }
  const timeRaw = (a.time as string | undefined) ?? '00:00:00';
  const d = new Date(`${dateRaw}T${timeRaw}`);
  return Number.isNaN(d.getTime()) ? Number.POSITIVE_INFINITY : d.getTime();
}

function isSameDay(ts: number, ref: Date): boolean {
  const d = new Date(ts);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export default function DoctorAppointments() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();
  const [tab, setTab] = useState<TabValue>('all');

  const query = useDoctorMyAppointments(tab === 'all' ? {} : { status: tab });

  const items = useMemo(
    () =>
      query.data?.pages?.flatMap(
        p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
      ) ?? [],
    [query.data?.pages],
  );

  const { upcoming, past, stats } = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    const withTs = items.map(a => ({ a, ts: getAppointmentTs(a) }));

    const upcomingArr = withTs
      .filter(
        x => x.ts >= nowMs - ONE_HOUR && x.a.status !== 'COMPLETED' && x.a.status !== 'CANCELLED',
      )
      .sort((x, y) => x.ts - y.ts)
      .map(x => x.a);

    const pastArr = withTs
      .filter(
        x => x.ts < nowMs - ONE_HOUR || x.a.status === 'COMPLETED' || x.a.status === 'CANCELLED',
      )
      .sort((x, y) => y.ts - x.ts)
      .map(x => x.a);

    const todayCount = withTs.filter(
      x => isSameDay(x.ts, now) && x.a.status !== 'CANCELLED',
    ).length;
    const pendingCount = items.filter(a => a.status === 'PENDING').length;
    const upcomingCount = upcomingArr.length;

    return {
      upcoming: upcomingArr,
      past: pastArr,
      stats: { today: todayCount, pending: pendingCount, upcoming: upcomingCount },
    };
  }, [items]);

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const renderItem = (item: Record<string, unknown>) => (
    <AppointmentCard
      key={item.id as string}
      appointment={item as Parameters<typeof AppointmentCard>[0]['appointment']}
    />
  );

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard
          label={t('doctor.appointments.statsTodayCount')}
          value={stats.today}
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          label={t('doctor.appointments.statsPendingCount')}
          value={stats.pending}
          icon={Clock3}
          tone="warning"
        />
        <StatCard
          label={t('doctor.appointments.statsUpcomingCount')}
          value={stats.upcoming}
          icon={CheckCircle2}
          tone="accent"
        />
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as TabValue)}>
        <TabsList className="flex h-auto w-full max-w-full justify-start gap-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ value, labelKey }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="shrink-0 px-2.5 py-1 text-xs sm:text-sm"
            >
              {t(labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'all' ? (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section aria-labelledby="doc-appt-upcoming" className="space-y-2">
              <div className="flex items-center justify-between">
                <h2
                  id="doc-appt-upcoming"
                  className="font-medium text-muted-foreground text-xs uppercase tracking-wider"
                >
                  {t('doctor.appointments.upcoming')}
                </h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {upcoming.length}
                </span>
              </div>
              <div className="space-y-2.5">{upcoming.map(renderItem)}</div>
            </section>
          )}

          {past.length > 0 && (
            <section aria-labelledby="doc-appt-past" className="space-y-2">
              <div className="flex items-center justify-between">
                <h2
                  id="doc-appt-past"
                  className="font-medium text-muted-foreground text-xs uppercase tracking-wider"
                >
                  {t('doctor.appointments.past')}
                </h2>
                <span className="text-muted-foreground text-xs tabular-nums">{past.length}</span>
              </div>
              <div className="space-y-2.5">{past.map(renderItem)}</div>
            </section>
          )}

          {items.length === 0 && !query.isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center">
              <Calendar className="size-10 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium text-sm">{t('doctor.appointments.empty')}</p>
              <p className="max-w-xs text-muted-foreground text-xs">
                {t('doctor.appointments.emptyDescription')}
              </p>
            </div>
          )}

          <InfiniteList
            items={[]}
            renderItem={() => null}
            isLoading={query.isLoading && items.length === 0}
            isFetchingNextPage={query.isFetchingNextPage}
            hasNextPage={query.hasNextPage}
            fetchNextPage={query.fetchNextPage}
            emptyIcon={null}
            emptyTitle=""
            emptyDescription=""
          />
        </div>
      ) : (
        <InfiniteList
          items={items}
          renderItem={item => renderItem(item as Record<string, unknown>)}
          isLoading={query.isLoading}
          isFetchingNextPage={query.isFetchingNextPage}
          hasNextPage={query.hasNextPage}
          fetchNextPage={query.fetchNextPage}
          emptyIcon={<Calendar className="size-10" />}
          emptyTitle={t('doctor.appointments.empty')}
          emptyDescription={t('doctor.appointments.emptyDescription')}
        />
      )}
    </div>
  );
}
