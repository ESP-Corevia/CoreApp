import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { usePatientPillbox, usePatientPillboxToday } from '@/queries/doctor';
import {
  PatientMedicationList,
  TodayScheduleReadOnly,
} from '../components/patient-medication-list';

export default function DoctorPatientPillbox() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();

  const patientId = id ?? '';
  const pillboxQuery = usePatientPillbox({ patientId });
  const todayQuery = usePatientPillboxToday(patientId);

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const todayIntakes =
    ((todayQuery.data as Record<string, unknown>)?.intakes as Array<Record<string, unknown>>) ??
    (Array.isArray(todayQuery.data) ? todayQuery.data : []);

  const medications =
    pillboxQuery.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      <h1 className="font-bold text-2xl">{t('doctor.patientPillbox.title')}</h1>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">
            {t('doctor.patientPillbox.today')}
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex-1">
            {t('doctor.patientPillbox.medications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <TodayScheduleReadOnly
            intakes={todayIntakes as Parameters<typeof TodayScheduleReadOnly>[0]['intakes']}
            isLoading={todayQuery.isLoading}
          />
        </TabsContent>

        <TabsContent value="medications">
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
