import { ArrowLeft, Calendar, Clock, Pill, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useAddSchedule } from '@/queries/patient/useAddSchedule';
import { useDeleteMedication } from '@/queries/patient/useDeleteMedication';
import { useDeleteSchedule } from '@/queries/patient/useDeleteSchedule';
import { usePillboxDetail } from '@/queries/patient/usePillboxDetail';

export default function PatientPillboxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const { data, isLoading } = usePillboxDetail(id ?? '');
  const deleteMed = useDeleteMedication();
  const deleteSchedule = useDeleteSchedule(id ?? '');
  const addSchedule = useAddSchedule();

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newTime, setNewTime] = useState('08:00');

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const med = data as Record<string, unknown> | undefined;

  const handleDelete = () => {
    if (!id) return;
    deleteMed.mutate({ id }, { onSuccess: () => navigate('/patient/pillbox') });
  };

  const handleAddSchedule = () => {
    if (!id) return;
    addSchedule.mutate(
      { patientMedicationId: id, intakeTime: newTime },
      { onSuccess: () => setShowAddSchedule(false) },
    );
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    deleteSchedule.mutate({ id: scheduleId });
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/patient/pillbox')}>
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !med ? (
        <p className="text-muted-foreground">{t('common.error')}</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{(med.medicationName as string) ?? '—'}</CardTitle>
                </div>
                <Badge variant={(med.active as boolean) !== false ? 'default' : 'secondary'}>
                  {(med.active as boolean) !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {med.dosageLabel && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Dosage: </span>
                  {med.dosageLabel as string}
                </div>
              )}
              {med.instructions && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Instructions: </span>
                  {med.instructions as string}
                </div>
              )}
              {med.startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(med.startDate as string).toLocaleDateString()}
                    {med.endDate && ` — ${new Date(med.endDate as string).toLocaleDateString()}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Schedules</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowAddSchedule(true)}>
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {showAddSchedule && (
                <div className="flex items-end gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-1">
                    <Label>Time</Label>
                    <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
                  </div>
                  <Button size="sm" onClick={handleAddSchedule} disabled={addSchedule.isPending}>
                    {t('common.save')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddSchedule(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              )}

              {Array.isArray((med as Record<string, unknown>).schedules) ? (
                ((med as Record<string, unknown>).schedules as Array<Record<string, unknown>>).map(
                  schedule => (
                    <div
                      key={schedule.id as string}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{schedule.intakeTime as string}</span>
                        {schedule.intakeMoment && (
                          <Badge variant="outline" className="text-xs">
                            {schedule.intakeMoment as string}
                          </Badge>
                        )}
                        {schedule.quantity && (
                          <span className="text-muted-foreground text-xs">
                            {schedule.quantity as string}
                            {schedule.unit ? ` ${schedule.unit as string}` : ''}
                          </span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSchedule(schedule.id as string)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ),
                )
              ) : (
                <p className="text-muted-foreground text-sm">No schedules yet</p>
              )}
            </CardContent>
          </Card>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={deleteMed.isPending}
          >
            <Trash2 className="h-4 w-4" />
            {t('common.delete')}
          </Button>
        </>
      )}
    </div>
  );
}
