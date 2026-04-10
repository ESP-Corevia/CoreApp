import { Pill, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfiniteList } from '@/components/infinite-list';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useCreateMedication } from '@/queries/patient/useCreateMedication';
import { useMarkIntakeSkipped } from '@/queries/patient/useMarkIntakeSkipped';
import { useMarkIntakeTaken } from '@/queries/patient/useMarkIntakeTaken';
import { useMyPillbox } from '@/queries/patient/useMyPillbox';
import { usePillboxToday } from '@/queries/patient/usePillboxToday';
import { MedicationCard } from '../components/medication-card';
import { MedicationForm } from '../components/medication-form';
import { TodaySchedule } from '../components/today-schedule';

export default function PatientPillbox() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const [showForm, setShowForm] = useState(false);

  const pillboxToday = usePillboxToday();
  const myPillbox = useMyPillbox();
  const markTaken = useMarkIntakeTaken();
  const markSkipped = useMarkIntakeSkipped();
  const createMed = useCreateMedication();

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const todayIntakes =
    ((pillboxToday.data as Record<string, unknown>)?.intakes as Array<Record<string, unknown>>) ??
    (Array.isArray(pillboxToday.data) ? pillboxToday.data : []);

  const medications =
    myPillbox.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">{t('patient.pillbox.title')}</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          {t('patient.pillbox.addMedication')}
        </Button>
      </div>

      {showForm && (
        <MedicationForm
          onSubmit={data => {
            createMed.mutate(data, { onSuccess: () => setShowForm(false) });
          }}
          isPending={createMed.isPending}
          onCancel={() => setShowForm(false)}
        />
      )}

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">
            {t('patient.pillbox.today')}
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex-1">
            {t('patient.pillbox.myMedications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <TodaySchedule
            intakes={todayIntakes as Parameters<typeof TodaySchedule>[0]['intakes']}
            isLoading={pillboxToday.isLoading}
            onTake={id => markTaken.mutate({ id })}
            onSkip={id => markSkipped.mutate({ id })}
          />
        </TabsContent>

        <TabsContent value="medications">
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
            emptyIcon={<Pill className="h-12 w-12" />}
            emptyTitle={t('patient.pillbox.empty')}
            emptyDescription={t('patient.pillbox.emptyDescription')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
