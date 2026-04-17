import { ArrowLeft, MapPin, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { cn } from '@/lib/utils';
import { useAvailableSlots } from '@/queries/patient/useAvailableSlots';
import { useCreateAppointment } from '@/queries/patient/useCreateAppointment';
import { BookingForm } from '../components/booking-form';
import { SlotPicker } from '../components/slot-picker';

interface NavDoctor {
  name?: string;
  specialty?: string;
  city?: string;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function BookDoctor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const slotsQuery = useAvailableSlots({ doctorId: id ?? '', date }, !!date);
  const createAppointment = useCreateAppointment();

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const navState = (location.state as { doctor?: NavDoctor } | null) ?? null;
  const doctor = navState?.doctor ?? {};
  const doctorName = doctor.name ?? '';

  const slotsData = slotsQuery.data as Record<string, unknown> | undefined;
  const slots = (
    Array.isArray(slotsData) ? slotsData : ((slotsData?.slots as string[]) ?? [])
  ) as string[];

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setSelectedSlot('');
  };

  const handleBooking = (reason?: string) => {
    if (!id || !date || !selectedSlot) return;
    createAppointment.mutate(
      { doctorId: id, date, time: selectedSlot, reason },
      { onSuccess: () => navigate('/patient/appointments') },
    );
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/patient/doctors')}
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('common.back')}
      </Button>

      <Card className="overflow-hidden">
        <div
          className="h-1 w-full bg-gradient-to-r from-primary to-primary/40"
          aria-hidden="true"
        />
        <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5 md:p-6">
          <Avatar className="size-12 shrink-0 sm:size-14">
            <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/5 font-semibold text-primary">
              {getInitials(doctorName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t('patient.doctors.bookWith', { name: '' }).trim()}
            </p>
            <h1 className="truncate font-semibold text-base tracking-tight md:text-lg">
              {doctorName || '—'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
              {doctor.specialty && (
                <span className="inline-flex items-center gap-1">
                  <Stethoscope className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{doctor.specialty}</span>
                </span>
              )}
              {doctor.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{doctor.city}</span>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-4 sm:p-5 md:p-6">
          <SlotPicker
            date={date}
            onDateChange={handleDateChange}
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            isLoading={slotsQuery.isLoading}
          />
        </CardContent>
      </Card>

      <div
        className={cn(
          'transition-all duration-200',
          selectedSlot ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden opacity-0',
        )}
        aria-hidden={!selectedSlot}
      >
        {selectedSlot && (
          <BookingForm
            doctorName={doctorName}
            date={date}
            time={selectedSlot}
            onSubmit={handleBooking}
            isPending={createAppointment.isPending}
          />
        )}
      </div>
    </div>
  );
}
