import { useState } from 'react';

import { useForm } from '@tanstack/react-form';

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Loader2,
  Pencil,
  Pill,
  Trash2,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';

import Loader from '@/components/loader';
import MedicationFormIcon from '@/components/medication-form-icon';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { cn } from '@/lib/utils';
import { usePillboxDetail, useAdminUpdateMedication, useAdminDeleteMedication } from '@/queries';

import ScheduleEditor from '../components/schedule-editor';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function FieldError({ errors }: { errors: Array<string | { message: string } | undefined> }) {
  if (errors.length === 0) return null;
  return (
    <>
      {errors.map(error => (
        <p key={String(error)} className="text-destructive text-xs">
          {typeof error === 'object' ? error.message : String(error)}
        </p>
      ))}
    </>
  );
}

export default function PillboxDetailRoute() {
  const { session, isLoading: authLoading } = useRequireAuth();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: medication,
    isLoading,
    error,
  } = usePillboxDetail(id ?? '', !!session?.isAuthenticated);

  const updateMutation = useAdminUpdateMedication();
  const deleteMutation = useAdminDeleteMedication();

  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    defaultValues: {
      dosageLabel: '',
      instructions: '',
      startDate: '',
      endDate: '',
      isActive: true,
    },
    onSubmit: async ({ value }) => {
      if (!medication) return;
      await updateMutation.mutateAsync({
        id: medication.id,
        dosageLabel: value.dosageLabel || null,
        instructions: value.instructions || null,
        startDate: value.startDate || undefined,
        endDate: value.endDate || null,
        isActive: value.isActive,
      });
      setIsEditing(false);
    },
  });

  if (authLoading) {
    return <Loader open />;
  }

  if (!session?.isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-destructive/10 rounded-full p-4">
          <AlertTriangle className="text-destructive h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="font-medium">
            {t('pillbox.detailError', 'Erreur lors du chargement du traitement')}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('pillbox.detailErrorHint', 'Vérifiez votre connexion et réessayez')}
          </p>
        </div>
        <Button variant="outline" onClick={() => void navigate('/pillbox')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('pillbox.backToList', 'Retour au pilulier')}
        </Button>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-muted rounded-full p-4">
          <Pill className="text-muted-foreground h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="font-medium">{t('pillbox.notFound', 'Traitement introuvable')}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('pillbox.notFoundHint', "Ce traitement n'existe pas ou a été supprimé")}
          </p>
        </div>
        <Button variant="outline" onClick={() => void navigate('/pillbox')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('pillbox.backToList', 'Retour au pilulier')}
        </Button>
      </div>
    );
  }

  const handleStartEdit = () => {
    form.reset();
    form.setFieldValue('dosageLabel', medication.dosageLabel ?? '');
    form.setFieldValue('instructions', medication.instructions ?? '');
    form.setFieldValue('startDate', medication.startDate);
    form.setFieldValue('endDate', medication.endDate ?? '');
    form.setFieldValue('isActive', medication.isActive);
    setIsEditing(true);
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: medication.id },
      {
        onSuccess: () => {
          void navigate('/pillbox');
        },
      }
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const med = medication as any;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void navigate('/pillbox')}
          className="mt-0.5 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <MedicationFormIcon
              iconKey={(medication as { iconKey?: string }).iconKey}
              withBackground
              size="lg"
            />
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {medication.medicationName}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 rounded-full px-3 py-0.5 text-xs font-medium',
                medication.isActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
              )}
            >
              {medication.isActive
                ? t('pillbox.active', 'Actif')
                : t('pillbox.inactive', 'Inactif')}
            </Badge>
          </div>
          {medication.medicationForm && (
            <p className="text-muted-foreground mt-0.5 text-sm">{medication.medicationForm}</p>
          )}
        </div>
      </div>

      {/* Admin: patient info card */}
      {med.patientName && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials(med.patientName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{med.patientName}</p>
              {med.patientEmail && (
                <p className="text-muted-foreground truncate text-xs">{med.patientEmail}</p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0 text-xs">
              <User className="mr-1 h-3 w-3" />
              Patient
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Medication details */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="h-4 w-4" />
              {t('pillbox.details', 'Détails du traitement')}
            </CardTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  {t('pillbox.edit', 'Modifier')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={form.state.isSubmitting}
                  >
                    {t('common.cancel', 'Annuler')}
                  </Button>
                  <Button
                    size="sm"
                    disabled={form.state.isSubmitting}
                    onClick={() => void form.handleSubmit()}
                  >
                    {form.state.isSubmitting && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    {t('common.save', 'Enregistrer')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="dosageLabel">
                {field => (
                  <div className="space-y-2">
                    <Label className="text-sm">{t('pillbox.dosageLabel', 'Posologie')}</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      placeholder="ex: 500mg"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="instructions">
                {field => (
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm">{t('pillbox.instructions', 'Instructions')}</Label>
                    <Textarea
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      placeholder="ex: Prendre au cours du repas"
                      rows={3}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="startDate"
                validators={{
                  onSubmit: ({ value }) =>
                    !value
                      ? t('pillbox.startDateRequired', 'La date de début est requise')
                      : undefined,
                }}
              >
                {field => (
                  <div className="space-y-2">
                    <Label className="text-sm">{t('pillbox.startDate', 'Date de début')}</Label>
                    <Input
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="endDate"
                validators={{
                  onSubmit: ({ value, fieldApi }) => {
                    if (!value) return undefined;
                    const start = fieldApi.form.getFieldValue('startDate');
                    return start && value < start
                      ? t(
                          'pillbox.endDateBeforeStart',
                          'La date de fin doit être après la date de début'
                        )
                      : undefined;
                  },
                }}
              >
                {field => (
                  <div className="space-y-2">
                    <Label className="text-sm">{t('pillbox.endDate', 'Date de fin')}</Label>
                    <Input
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>

              {/* isActive toggle */}
              <form.Field name="isActive">
                {field => (
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:col-span-2">
                    <div>
                      <Label className="text-sm font-medium">
                        {t('pillbox.isActiveLabel', 'Traitement actif')}
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {t(
                          'pillbox.isActiveHint',
                          'Désactivez pour archiver ce traitement sans le supprimer'
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked: boolean) => field.handleChange(checked)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dosage */}
              {medication.dosageLabel && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    {t('pillbox.dosageLabel', 'Posologie')}
                  </p>
                  <p className="mt-1 text-sm font-medium">{medication.dosageLabel}</p>
                </div>
              )}

              {/* Instructions */}
              {medication.instructions && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      {t('pillbox.instructions', 'Instructions')}
                    </p>
                    <p className="mt-1 text-sm">{medication.instructions}</p>
                  </div>
                </>
              )}

              {/* Dates */}
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      {t('pillbox.startDate', 'Date de début')}
                    </p>
                    <p className="mt-0.5 text-sm font-medium">{formatDate(medication.startDate)}</p>
                  </div>
                </div>
                {medication.endDate && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        {t('pillbox.endDate', 'Date de fin')}
                      </p>
                      <p className="mt-0.5 text-sm font-medium">{formatDate(medication.endDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule editor */}
      <ScheduleEditor medicationId={medication.id} schedules={medication.schedules} />

      {/* Delete zone */}
      <Card className="border-destructive/20">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">{t('pillbox.dangerZone', 'Zone de danger')}</p>
            <p className="text-muted-foreground text-xs">
              {t('pillbox.deleteHint', 'Supprimer définitivement ce traitement et ses rappels')}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                {t('pillbox.delete', 'Supprimer')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('pillbox.deleteConfirmTitle', 'Supprimer ce traitement ?')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    'pillbox.deleteConfirmDescription',
                    'Cette action est irréversible. Le traitement et tous ses rappels seront supprimés.'
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel', 'Annuler')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  {t('pillbox.confirmDelete', 'Supprimer')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
