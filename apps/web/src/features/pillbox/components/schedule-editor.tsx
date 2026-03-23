import { useState } from 'react';

import { Clock, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getIntakeMomentLabel, INTAKE_MOMENT_KEYS } from '@/features/pillbox/lib/moment-label';
import { cn } from '@/lib/utils';
import { useAddSchedule, useUpdateSchedule, useDeleteSchedule } from '@/queries';

interface Schedule {
  id: string;
  weekday?: number | null;
  intakeTime: string;
  intakeMoment: string;
  quantity: string;
  unit: string | null;
  notes?: string | null;
}

interface ScheduleEditorProps {
  medicationId: string;
  schedules: Schedule[];
}

const MOMENT_COLORS: Record<string, string> = {
  MORNING: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  NOON: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
  EVENING: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  BEDTIME: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  CUSTOM: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const DEFAULT_TIMES: Record<string, string> = {
  MORNING: '08:00',
  NOON: '12:00',
  EVENING: '19:00',
  BEDTIME: '22:00',
  CUSTOM: '12:00',
};

interface ScheduleForm {
  intakeTime: string;
  intakeMoment: string;
  quantity: string;
  unit: string;
}

function createEmptyForm(): ScheduleForm {
  return {
    intakeTime: '08:00',
    intakeMoment: 'MORNING',
    quantity: '1',
    unit: 'comprim\u00e9',
  };
}

export default function ScheduleEditor({ medicationId, schedules }: ScheduleEditorProps) {
  const { t } = useTranslation();
  const addMutation = useAddSchedule();
  const updateMutation = useUpdateSchedule();
  const deleteMutation = useDeleteSchedule();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ScheduleForm>(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ScheduleForm>(createEmptyForm());

  const handleAdd = () => {
    addMutation.mutate(
      {
        patientMedicationId: medicationId,
        intakeTime: addForm.intakeTime,
        intakeMoment: addForm.intakeMoment as 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM',
        quantity: addForm.quantity || undefined,
        unit: addForm.unit || undefined,
      },
      {
        onSuccess: () => {
          setShowAddForm(false);
          setAddForm(createEmptyForm());
        },
      }
    );
  };

  const handleStartEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setEditForm({
      intakeTime: schedule.intakeTime,
      intakeMoment: schedule.intakeMoment,
      quantity: schedule.quantity,
      unit: schedule.unit ?? '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate(
      {
        id: editingId,
        intakeTime: editForm.intakeTime,
        intakeMoment: editForm.intakeMoment as
          | 'MORNING'
          | 'NOON'
          | 'EVENING'
          | 'BEDTIME'
          | 'CUSTOM',
        quantity: editForm.quantity || undefined,
        unit: editForm.unit || undefined,
      },
      {
        onSuccess: () => {
          setEditingId(null);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleFormChange = (
    setter: React.Dispatch<React.SetStateAction<ScheduleForm>>,
    field: keyof ScheduleForm,
    value: string
  ) => {
    setter(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'intakeMoment' && value in DEFAULT_TIMES) {
        updated.intakeTime = DEFAULT_TIMES[value]!;
      }
      return updated;
    });
  };

  const renderFormFields = (
    form: ScheduleForm,
    setter: React.Dispatch<React.SetStateAction<ScheduleForm>>
  ) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t('pillbox.intakeMoment', 'Moment')}</Label>
        <Select
          value={form.intakeMoment}
          onValueChange={v => handleFormChange(setter, 'intakeMoment', v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTAKE_MOMENT_KEYS.map(key => (
              <SelectItem key={key} value={key}>
                {getIntakeMomentLabel(t, key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t('pillbox.intakeTime', 'Heure')}</Label>
        <Input
          type="time"
          value={form.intakeTime}
          onChange={e => handleFormChange(setter, 'intakeTime', e.target.value)}
          className="h-9"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t('pillbox.quantity', 'Quantit\u00e9')}</Label>
        <Input
          value={form.quantity}
          onChange={e => handleFormChange(setter, 'quantity', e.target.value)}
          placeholder="1"
          className="h-9"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t('pillbox.unit', 'Unit\u00e9')}</Label>
        <Input
          value={form.unit}
          onChange={e => handleFormChange(setter, 'unit', e.target.value)}
          placeholder="comprim\u00e9"
          className="h-9"
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            {t('pillbox.schedules', 'Rappels de prise')}
            {schedules.length > 0 && (
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-normal">
                {schedules.length}
              </span>
            )}
          </CardTitle>
          {!showAddForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('pillbox.addSchedule', 'Ajouter')}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Add new schedule form */}
        {showAddForm && (
          <div className="border-primary/20 bg-primary/5 space-y-3 rounded-lg border-2 border-dashed p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{t('pillbox.newSchedule', 'Nouveau rappel')}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setShowAddForm(false);
                  setAddForm(createEmptyForm());
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {renderFormFields(addForm, setAddForm)}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setAddForm(createEmptyForm());
                }}
                disabled={addMutation.isPending}
              >
                {t('common.cancel', 'Annuler')}
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t('common.save', 'Enregistrer')}
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {schedules.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Clock className="text-muted-foreground/50 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              {t('pillbox.noSchedules', 'Aucun rappel configur\u00e9')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="mt-1"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t('pillbox.addFirstSchedule', 'Configurer un rappel')}
            </Button>
          </div>
        )}

        {/* Existing schedules */}
        {schedules.map((schedule, idx) => (
          <div key={schedule.id}>
            {idx > 0 && <Separator className="mb-3" />}
            <div className="bg-card rounded-lg border p-3">
              {editingId === schedule.id ? (
                <div className="space-y-3">
                  {renderFormFields(editForm, setEditForm)}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      disabled={updateMutation.isPending}
                    >
                      {t('common.cancel', 'Annuler')}
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                      {updateMutation.isPending && (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      {t('common.save', 'Enregistrer')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Moment badge */}
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-semibold',
                      MOMENT_COLORS[schedule.intakeMoment] ?? MOMENT_COLORS.CUSTOM
                    )}
                  >
                    {getIntakeMomentLabel(t, schedule.intakeMoment)}
                  </span>

                  {/* Time */}
                  <span className="text-sm font-medium tabular-nums">{schedule.intakeTime}</span>

                  {/* Quantity + unit */}
                  {schedule.quantity && (
                    <span className="text-muted-foreground text-sm">
                      {schedule.quantity}
                      {schedule.unit ? ` ${schedule.unit}` : ''}
                    </span>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Actions */}
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleStartEdit(schedule)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t('pillbox.deleteScheduleTitle', 'Supprimer ce rappel ?')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t(
                              'pillbox.deleteScheduleDescription',
                              'Ce rappel sera d\u00e9finitivement supprim\u00e9.'
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel', 'Annuler')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(schedule.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('pillbox.confirmDelete', 'Supprimer')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
