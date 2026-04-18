import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Pencil,
  PillBottle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { cn } from '@/lib/utils';
import { useAddSchedule } from '@/queries/patient/useAddSchedule';
import { useDeleteMedication } from '@/queries/patient/useDeleteMedication';
import { useDeleteSchedule } from '@/queries/patient/useDeleteSchedule';
import { usePillboxDetail } from '@/queries/patient/usePillboxDetail';
import { useUpdateSchedule } from '@/queries/patient/useUpdateSchedule';
import { type Moment, ScheduleForm, type ScheduleFormValue } from '../components/schedule-form';

interface Schedule {
  id: string;
  weekday?: number | null;
  intakeTime: string;
  intakeMoment?: string | null;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
}

function formatTime(raw?: string): string {
  if (!raw) return '';
  const match = raw.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : raw;
}

export default function PatientPillboxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const { data, isLoading } = usePillboxDetail(id ?? '');
  const deleteMed = useDeleteMedication();
  const deleteSchedule = useDeleteSchedule(id ?? '');
  const addSchedule = useAddSchedule();
  const updateSchedule = useUpdateSchedule(id ?? '');

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const med = data as Record<string, unknown> | undefined;

  const handleDelete = () => {
    if (!id) return;
    deleteMed.mutate(
      { id },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          navigate('/patient/pillbox');
        },
      },
    );
  };

  const handleAddSchedule = (value: ScheduleFormValue) => {
    if (!id) return;
    addSchedule.mutate(
      {
        patientMedicationId: id,
        intakeTime: value.intakeTime,
        intakeMoment: value.intakeMoment,
        quantity: value.quantity,
        unit: value.unit || null,
        notes: value.notes || null,
      },
      {
        onSuccess: () => setShowAddSchedule(false),
      },
    );
  };

  const handleEditSchedule = (value: ScheduleFormValue) => {
    if (!editing) return;
    updateSchedule.mutate(
      {
        id: editing.id,
        intakeTime: value.intakeTime,
        intakeMoment: value.intakeMoment,
        quantity: value.quantity,
        unit: value.unit || null,
        notes: value.notes || null,
      },
      {
        onSuccess: () => setEditing(null),
      },
    );
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    deleteSchedule.mutate({ id: scheduleId });
  };

  const schedules = Array.isArray(med?.schedules) ? (med.schedules as Schedule[]) : [];
  const sortedSchedules = [...schedules].sort((a, b) =>
    formatTime(a.intakeTime).localeCompare(formatTime(b.intakeTime)),
  );

  const medName = (med?.medicationName as string) ?? '—';
  const isActive = (med?.isActive as boolean | undefined) !== false;
  const dosageLabel = med?.dosageLabel as string | undefined;
  const medForm = med?.medicationForm as string | undefined;
  const dosage = [dosageLabel, medForm].filter(Boolean).join(' · ');
  const instructions = med?.instructions as string | undefined;
  const startDate = med?.startDate as string | undefined;
  const endDate = med?.endDate as string | undefined;

  const dateFmt = (iso?: string) =>
    iso
      ? new Intl.DateTimeFormat(i18n.language, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date(iso))
      : '';

  return (
    <div className="space-y-4 md:space-y-5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/patient/pillbox')}
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('common.back')}
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !med ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <PillBottle className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium">{t('patient.pillbox.detail.notFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div
              className={cn(
                'h-1 w-full',
                isActive ? 'bg-gradient-to-r from-primary to-primary/40' : 'bg-muted',
              )}
              aria-hidden="true"
            />
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-xl',
                      isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                    aria-hidden="true"
                  >
                    <PillBottle className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate font-semibold text-lg tracking-tight md:text-xl">
                      {medName}
                    </h1>
                    {dosage && <p className="truncate text-muted-foreground text-sm">{dosage}</p>}
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[11px] uppercase tracking-wide',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      isActive ? 'bg-emerald-500' : 'bg-muted-foreground/60',
                    )}
                    aria-hidden="true"
                  />
                  {isActive ? t('patient.pillbox.active') : t('patient.pillbox.inactive')}
                </span>
              </div>

              <dl className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2">
                {dosageLabel && (
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                      {t('patient.pillbox.detail.dosage')}
                    </dt>
                    <dd className="mt-0.5 font-medium text-sm">{dosageLabel}</dd>
                  </div>
                )}
                {instructions && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                      {t('patient.pillbox.detail.instructions')}
                    </dt>
                    <dd className="mt-0.5 text-sm italic">{instructions}</dd>
                  </div>
                )}
                {startDate && (
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                      {t('patient.pillbox.detail.period')}
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-sm">
                      <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      <span>
                        {dateFmt(startDate)}
                        {endDate && ` — ${dateFmt(endDate)}`}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-semibold text-base">
                {t('patient.pillbox.detail.schedules')}
              </CardTitle>
              <Button
                size="sm"
                variant={showAddSchedule ? 'ghost' : 'outline'}
                onClick={() => setShowAddSchedule(v => !v)}
                aria-expanded={showAddSchedule}
              >
                <Plus
                  className={cn('size-4 transition-transform', showAddSchedule && 'rotate-45')}
                  aria-hidden="true"
                />
                {showAddSchedule ? t('common.cancel') : t('patient.pillbox.detail.addSchedule')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddSchedule && (
                <div className="rounded-xl border bg-muted/30 p-3">
                  <ScheduleForm
                    isPending={addSchedule.isPending}
                    submitLabel={t('common.save')}
                    onSubmit={handleAddSchedule}
                    onCancel={() => setShowAddSchedule(false)}
                    idPrefix="add"
                  />
                </div>
              )}

              {sortedSchedules.length === 0 && !showAddSchedule ? (
                <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed p-6 text-center">
                  <p className="font-medium text-sm">{t('patient.pillbox.detail.noSchedules')}</p>
                  <p className="max-w-xs text-muted-foreground text-xs">
                    {t('patient.pillbox.detail.noSchedulesDescription')}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {sortedSchedules.map(schedule => {
                    const moment =
                      schedule.intakeMoment && schedule.intakeMoment !== 'CUSTOM'
                        ? t(`patient.pillbox.moment.${schedule.intakeMoment}`)
                        : '';
                    const qtyUnit = [schedule.quantity, schedule.unit].filter(Boolean).join(' ');

                    return (
                      <li
                        key={schedule.id}
                        className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/30"
                      >
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                          aria-hidden="true"
                        >
                          <Clock className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm tabular-nums">
                              {formatTime(schedule.intakeTime)}
                            </span>
                            {moment && (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide">
                                {moment}
                              </span>
                            )}
                          </div>
                          {qtyUnit && <p className="text-muted-foreground text-xs">{qtyUnit}</p>}
                          {schedule.notes && (
                            <p
                              className="mt-0.5 truncate text-muted-foreground/80 text-xs italic"
                              title={schedule.notes}
                            >
                              {schedule.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditing(schedule)}
                            aria-label={t('patient.pillbox.detail.editSchedule')}
                            title={t('patient.pillbox.detail.editSchedule')}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            disabled={deleteSchedule.isPending}
                            aria-label={t('common.delete')}
                            title={t('common.delete')}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/[0.02]">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                  aria-hidden="true"
                >
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t('patient.pillbox.detail.dangerZone')}</p>
                  <p className="text-muted-foreground text-xs">
                    {t('patient.pillbox.detail.deleteDescription', { name: medName })}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                className="shrink-0"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {t('patient.pillbox.detail.deleteMedication')}
              </Button>
            </CardContent>
          </Card>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('patient.pillbox.detail.deleteTitle')}</DialogTitle>
                <DialogDescription>
                  {t('patient.pillbox.detail.deleteDescription', { name: medName })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleteMed.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteMed.isPending}>
                  {deleteMed.isPending
                    ? t('common.loading')
                    : t('patient.pillbox.detail.deleteConfirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('patient.pillbox.detail.editSchedule')}</DialogTitle>
              </DialogHeader>
              {editing && (
                <ScheduleForm
                  initial={{
                    intakeTime: formatTime(editing.intakeTime) || '08:00',
                    intakeMoment: (editing.intakeMoment as Moment | null | undefined) ?? 'MORNING',
                    quantity: editing.quantity ?? '1',
                    unit: editing.unit ?? '',
                    notes: editing.notes ?? '',
                  }}
                  isPending={updateSchedule.isPending}
                  submitLabel={t('common.save')}
                  onSubmit={handleEditSchedule}
                  onCancel={() => setEditing(null)}
                  idPrefix="edit"
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
