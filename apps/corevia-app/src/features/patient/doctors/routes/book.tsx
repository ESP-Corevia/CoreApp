import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useAvailableSlots } from '@/queries/patient/useAvailableSlots';
import { useCreateAppointment } from '@/queries/patient/useCreateAppointment';
import { BookingForm } from '../components/booking-form';
import { SlotPicker } from '../components/slot-picker';

export default function BookDoctor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const slotsQuery = useAvailableSlots({ doctorId: id ?? '', date }, !!date);
  const createAppointment = useCreateAppointment();

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

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
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/patient/doctors')}>
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('patient.doctors.bookWith', { name: '' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SlotPicker
            date={date}
            onDateChange={handleDateChange}
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            isLoading={slotsQuery.isLoading}
          />

          {selectedSlot && (
            <BookingForm
              doctorName=""
              date={date}
              time={selectedSlot}
              onSubmit={handleBooking}
              isPending={createAppointment.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
