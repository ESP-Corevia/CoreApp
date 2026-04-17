import { Calendar, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { InfiniteList } from '@/components/infinite-list';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useMyAppointments } from '@/queries/patient/useMyAppointments';
import { AppointmentCard } from '../components/appointment-card';

type TabValue = 'all' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const TABS: { value: TabValue; labelKey: string }[] = [
  { value: 'all', labelKey: 'patient.appointments.allStatuses' },
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

export default function PatientAppointments() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();
  const [tab, setTab] = useState<TabValue>('all');

  const query = useMyAppointments(tab === 'all' ? {} : { status: tab });

  const items = useMemo(
    () =>
      query.data?.pages?.flatMap(
        p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
      ) ?? [],
    [query.data?.pages],
  );

  const { upcoming, past } = useMemo(() => {
    const nowMs = Date.now();
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
    return { upcoming: upcomingArr, past: pastArr };
  }, [items]);

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const renderItem = (item: Record<string, unknown>) => (
    <AppointmentCard
      key={item.id as string}
      appointment={item as Parameters<typeof AppointmentCard>[0]['appointment']}
    />
  );

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center gap-2 md:gap-3">
        <Tabs value={tab} onValueChange={v => setTab(v as TabValue)} className="min-w-0 flex-1">
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
        <Button size="sm" asChild className="shrink-0">
          <Link to="/patient/doctors" aria-label={t('patient.appointments.book')}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('patient.appointments.book')}</span>
          </Link>
        </Button>
      </div>

      {tab === 'all' ? (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section aria-labelledby="appt-upcoming" className="space-y-2">
              <div className="flex items-center justify-between">
                <h2
                  id="appt-upcoming"
                  className="font-medium text-muted-foreground text-xs uppercase tracking-wider"
                >
                  {t('patient.appointments.upcoming')}
                </h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {upcoming.length}
                </span>
              </div>
              <div className="space-y-2.5">{upcoming.map(renderItem)}</div>
            </section>
          )}

          {past.length > 0 && (
            <section aria-labelledby="appt-past" className="space-y-2">
              <div className="flex items-center justify-between">
                <h2
                  id="appt-past"
                  className="font-medium text-muted-foreground text-xs uppercase tracking-wider"
                >
                  {t('patient.appointments.past')}
                </h2>
                <span className="text-muted-foreground text-xs tabular-nums">{past.length}</span>
              </div>
              <div className="space-y-2.5">{past.map(renderItem)}</div>
            </section>
          )}

          {items.length === 0 && !query.isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center">
              <Calendar className="size-10 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium text-sm">{t('patient.appointments.empty')}</p>
              <p className="max-w-xs text-muted-foreground text-xs">
                {t('patient.appointments.emptyDescription')}
              </p>
              <Button size="sm" asChild className="mt-2">
                <Link to="/patient/doctors">{t('patient.appointments.book')}</Link>
              </Button>
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
          emptyTitle={t('patient.appointments.empty')}
          emptyDescription={t('patient.appointments.emptyDescription')}
        />
      )}
    </div>
  );
}
