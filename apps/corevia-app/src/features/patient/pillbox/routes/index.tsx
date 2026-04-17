import { PillBottle, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { InfiniteList } from '@/components/infinite-list';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { cn } from '@/lib/utils';
import { useMarkIntakeSkipped } from '@/queries/patient/useMarkIntakeSkipped';
import { useMarkIntakeTaken } from '@/queries/patient/useMarkIntakeTaken';
import { useMyPillbox } from '@/queries/patient/useMyPillbox';
import { usePillboxToday } from '@/queries/patient/usePillboxToday';
import { MedicationCard } from '../components/medication-card';
import { TodaySchedule } from '../components/today-schedule';

export default function PatientPillbox() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const pillboxToday = usePillboxToday();
  const myPillbox = useMyPillbox();
  const markTaken = useMarkIntakeTaken();
  const markSkipped = useMarkIntakeSkipped();

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const todayIntakes =
    ((pillboxToday.data as Record<string, unknown>)?.intakes as Array<Record<string, unknown>>) ??
    (Array.isArray(pillboxToday.data) ? pillboxToday.data : []);

  const medications =
    myPillbox.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  const takenCount = todayIntakes.filter(i => i.status === 'TAKEN').length;
  const total = todayIntakes.length;
  const progressPct = total === 0 ? 0 : Math.round((takenCount / total) * 100);
  const allDone = total > 0 && takenCount === total;

  return (
    <div className="space-y-4 md:space-y-5">
      <Card className="overflow-hidden">
        <div
          className={cn(
            'h-1 w-full transition-colors',
            allDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-primary/40',
          )}
          aria-hidden="true"
        />
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="min-w-0 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-2xl tabular-nums md:text-3xl">{takenCount}</span>
              <span className="text-muted-foreground text-sm">/ {total}</span>
              <span className="text-muted-foreground text-sm">
                {allDone
                  ? t('patient.pillbox.allTaken')
                  : t('patient.pillbox.progressLabel', { taken: takenCount, total })}
              </span>
            </div>
            <div
              className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('patient.pillbox.progressLabel', { taken: takenCount, total })}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  allDone ? 'bg-emerald-500' : 'bg-primary',
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <Button asChild size="default" className="shrink-0 self-start md:self-auto">
            <Link to="/patient/medications">
              <Plus className="size-4" aria-hidden="true" />
              {t('patient.pillbox.addMedication')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">{t('patient.pillbox.today')}</TabsTrigger>
          <TabsTrigger value="medications">{t('patient.pillbox.myMedications')}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <TodaySchedule
            intakes={todayIntakes as unknown as Parameters<typeof TodaySchedule>[0]['intakes']}
            isLoading={pillboxToday.isLoading}
            onTake={id => markTaken.mutate({ id })}
            onSkip={id => markSkipped.mutate({ id })}
          />
        </TabsContent>

        <TabsContent value="medications" className="mt-4">
          <InfiniteList
            items={medications}
            renderItem={item => (
              <MedicationCard
                key={(item as Record<string, unknown>).id as string}
                medication={item as Parameters<typeof MedicationCard>[0]['medication']}
              />
            )}
            isLoading={myPillbox.isLoading}
            isFetchingNextPage={myPillbox.isFetchingNextPage}
            hasNextPage={myPillbox.hasNextPage}
            fetchNextPage={myPillbox.fetchNextPage}
            emptyIcon={<PillBottle className="h-12 w-12" />}
            emptyTitle={t('patient.pillbox.empty')}
            emptyDescription={t('patient.pillbox.emptyDescription')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
