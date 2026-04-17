import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { cn } from '@/lib/utils';
import {
  useDoctorPatientIntakeHistory,
  usePatientPillbox,
  usePatientPillboxToday,
} from '@/queries/doctor';
import { type HistoryDay, IntakeHistory } from '../components/intake-history';
import {
  PatientMedicationList,
  TodayScheduleReadOnly,
} from '../components/patient-medication-list';

function getParisYMD(offsetDays = 0): string {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
}

export default function DoctorPatientPillbox() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();

  const patientId = id ?? '';
  const [rangeDays, setRangeDays] = useState<number>(14);

  const pillboxQuery = usePatientPillbox({ patientId });
  const todayQuery = usePatientPillboxToday(patientId);
  const historyQuery = useDoctorPatientIntakeHistory(
    patientId,
    getParisYMD(-(rangeDays - 1)),
    getParisYMD(0),
  );

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const todayIntakes =
    ((todayQuery.data as Record<string, unknown>)?.intakes as Array<Record<string, unknown>>) ?? [];

  const medications =
    pillboxQuery.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  const historyDays = (historyQuery.data as { days?: HistoryDay[] } | undefined)?.days;

  const isFetching =
    todayQuery.isFetching || pillboxQuery.isFetching || historyQuery.isFetching;

  const handleRefresh = () => {
    void queryClient.invalidateQueries({
      predicate: q => {
        const k = q.queryKey;
        if (!Array.isArray(k) || k.length === 0) return false;
        const head = k[0];
        if (Array.isArray(head)) return head[0] === 'doctor' && head[1] === 'pillbox';
        return head === 'doctor' && k[1] === 'pillbox';
      },
    });
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('common.back')}
        </Button>
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

      <div>
        <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
          {t('doctor.patientPillbox.section', { defaultValue: 'Patient records' })}
        </p>
        <h1 className="font-semibold text-lg tracking-tight md:text-xl">
          {t('doctor.patientPillbox.title')}
        </h1>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">
            {t('doctor.patientPillbox.today')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            {t('doctor.patientPillbox.history', { defaultValue: 'History' })}
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex-1">
            {t('doctor.patientPillbox.medications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <TodayScheduleReadOnly
            intakes={todayIntakes as Parameters<typeof TodayScheduleReadOnly>[0]['intakes']}
            isLoading={todayQuery.isLoading}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <IntakeHistory
            days={historyDays}
            isLoading={historyQuery.isLoading}
            rangeDays={rangeDays}
            onRangeChange={setRangeDays}
          />
        </TabsContent>

        <TabsContent value="medications" className="mt-4">
          <PatientMedicationList
            medications={medications as Parameters<typeof PatientMedicationList>[0]['medications']}
            isLoading={pillboxQuery.isLoading}
            isFetchingNextPage={pillboxQuery.isFetchingNextPage}
            hasNextPage={pillboxQuery.hasNextPage}
            fetchNextPage={pillboxQuery.fetchNextPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
