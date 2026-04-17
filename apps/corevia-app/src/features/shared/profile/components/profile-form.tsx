import { useQueryClient } from '@tanstack/react-query';
import { Briefcase, HeartPulse, LifeBuoy, Mail, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { trpcClient } from '@/providers/trpc';

interface DoctorProfile {
  specialty?: string | null;
  address?: string | null;
  city?: string | null;
  verified?: boolean;
}

interface PatientProfile {
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

interface ProfileFormProps {
  name: string;
  email: string;
  role: string;
  doctorProfile?: DoctorProfile;
  patientProfile?: PatientProfile;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
type BloodType = (typeof BLOOD_TYPES)[number];

interface SectionProps {
  title: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5 md:p-6">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-medium text-sm">{title}</h2>
        </div>
        <div className="space-y-4">{children}</div>
      </CardContent>
    </Card>
  );
}

export function ProfileForm({
  name,
  email,
  role,
  doctorProfile,
  patientProfile,
}: ProfileFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [formName, setFormName] = useState(name);

  const [formSpecialty, setFormSpecialty] = useState(doctorProfile?.specialty ?? '');
  const [formDoctorAddress, setFormDoctorAddress] = useState(doctorProfile?.address ?? '');
  const [formCity, setFormCity] = useState(doctorProfile?.city ?? '');

  const [formPhone, setFormPhone] = useState(patientProfile?.phone ?? '');
  const [formDob, setFormDob] = useState(patientProfile?.dateOfBirth ?? '');
  const [formGender, setFormGender] = useState(patientProfile?.gender ?? '');
  const [formAddress, setFormAddress] = useState(patientProfile?.address ?? '');
  const [formBloodType, setFormBloodType] = useState(patientProfile?.bloodType ?? '');
  const [formAllergies, setFormAllergies] = useState(patientProfile?.allergies ?? '');
  const [formEmergencyName, setFormEmergencyName] = useState(
    patientProfile?.emergencyContactName ?? '',
  );
  const [formEmergencyPhone, setFormEmergencyPhone] = useState(
    patientProfile?.emergencyContactPhone ?? '',
  );

  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(() => {
    if (formName !== name) return true;
    if (role === 'doctor') {
      return (
        formSpecialty !== (doctorProfile?.specialty ?? '') ||
        formDoctorAddress !== (doctorProfile?.address ?? '') ||
        formCity !== (doctorProfile?.city ?? '')
      );
    }
    if (role === 'patient') {
      return (
        formPhone !== (patientProfile?.phone ?? '') ||
        formDob !== (patientProfile?.dateOfBirth ?? '') ||
        formGender !== (patientProfile?.gender ?? '') ||
        formAddress !== (patientProfile?.address ?? '') ||
        formBloodType !== (patientProfile?.bloodType ?? '') ||
        formAllergies !== (patientProfile?.allergies ?? '') ||
        formEmergencyName !== (patientProfile?.emergencyContactName ?? '') ||
        formEmergencyPhone !== (patientProfile?.emergencyContactPhone ?? '')
      );
    }
    return false;
  }, [
    formName,
    name,
    role,
    formSpecialty,
    formDoctorAddress,
    formCity,
    doctorProfile?.specialty,
    doctorProfile?.address,
    doctorProfile?.city,
    formPhone,
    formDob,
    formGender,
    formAddress,
    formBloodType,
    formAllergies,
    formEmergencyName,
    formEmergencyPhone,
    patientProfile?.phone,
    patientProfile?.dateOfBirth,
    patientProfile?.gender,
    patientProfile?.address,
    patientProfile?.bloodType,
    patientProfile?.allergies,
    patientProfile?.emergencyContactName,
    patientProfile?.emergencyContactPhone,
  ]);

  const discard = () => {
    setFormName(name);
    setFormSpecialty(doctorProfile?.specialty ?? '');
    setFormDoctorAddress(doctorProfile?.address ?? '');
    setFormCity(doctorProfile?.city ?? '');
    setFormPhone(patientProfile?.phone ?? '');
    setFormDob(patientProfile?.dateOfBirth ?? '');
    setFormGender(patientProfile?.gender ?? '');
    setFormAddress(patientProfile?.address ?? '');
    setFormBloodType(patientProfile?.bloodType ?? '');
    setFormAllergies(patientProfile?.allergies ?? '');
    setFormEmergencyName(patientProfile?.emergencyContactName ?? '');
    setFormEmergencyPhone(patientProfile?.emergencyContactPhone ?? '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    setIsSaving(true);
    try {
      await trpcClient.user.updateProfile.mutate({
        name: formName !== name ? formName : undefined,
        ...(role === 'doctor' && {
          doctorProfile: {
            specialty: formSpecialty || undefined,
            address: formDoctorAddress || undefined,
            city: formCity || undefined,
          },
        }),
        ...(role === 'patient' && {
          patientProfile: {
            dateOfBirth: formDob || undefined,
            gender: (formGender as 'MALE' | 'FEMALE') || undefined,
            phone: formPhone || null,
            address: formAddress || null,
            bloodType: (formBloodType as BloodType) || null,
            allergies: formAllergies || null,
            emergencyContactName: formEmergencyName || null,
            emergencyContactPhone: formEmergencyPhone || null,
          },
        }),
      });
      void queryClient.invalidateQueries({ queryKey: [['user', 'getMe']] });
      toast.success(t('shared.profile.saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
      <Section title={t('shared.profile.personalInfo')} icon={UserRound}>
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('shared.profile.fields.name')}</Label>
          <Input
            id="name"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="size-3 text-muted-foreground" aria-hidden="true" />
              {t('shared.profile.fields.email')}
            </Label>
            <Input id="email" type="email" value={email} disabled readOnly autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">{t('shared.profile.fields.role')}</Label>
            <Input id="role" value={role} disabled readOnly className="capitalize" />
          </div>
        </div>
      </Section>

      {role === 'doctor' && (
        <Section title={t('shared.profile.doctorInfo')} icon={Briefcase}>
          <div className="space-y-1.5">
            <Label htmlFor="specialty">{t('shared.profile.fields.specialty')}</Label>
            <Input
              id="specialty"
              value={formSpecialty}
              onChange={e => setFormSpecialty(e.target.value)}
              placeholder={t('shared.profile.fields.specialtyPlaceholder')}
              autoComplete="organization-title"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doctorAddress">{t('shared.profile.fields.address')}</Label>
            <Input
              id="doctorAddress"
              value={formDoctorAddress}
              onChange={e => setFormDoctorAddress(e.target.value)}
              placeholder={t('shared.profile.fields.addressPlaceholder')}
              autoComplete="street-address"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">{t('shared.profile.fields.city')}</Label>
            <Input
              id="city"
              value={formCity}
              onChange={e => setFormCity(e.target.value)}
              placeholder={t('shared.profile.fields.cityPlaceholder')}
              autoComplete="address-level2"
            />
          </div>
        </Section>
      )}

      {role === 'patient' && (
        <>
          <Section title={t('shared.profile.healthInfo')} icon={HeartPulse}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dob">{t('shared.profile.fields.dateOfBirth')}</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formDob}
                  onChange={e => setFormDob(e.target.value)}
                  autoComplete="bday"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">{t('shared.profile.fields.gender')}</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder={t('shared.profile.fields.genderSelect')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">{t('shared.profile.fields.genderMale')}</SelectItem>
                    <SelectItem value="FEMALE">
                      {t('shared.profile.fields.genderFemale')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t('shared.profile.fields.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder={t('shared.profile.fields.phonePlaceholder')}
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bloodType">{t('shared.profile.fields.bloodType')}</Label>
                <Select value={formBloodType} onValueChange={setFormBloodType}>
                  <SelectTrigger id="bloodType">
                    <SelectValue placeholder={t('shared.profile.fields.bloodTypeSelect')} />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map(bt => (
                      <SelectItem key={bt} value={bt}>
                        {bt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">{t('shared.profile.fields.addressFull')}</Label>
              <Input
                id="address"
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder={t('shared.profile.fields.addressPlaceholder')}
                autoComplete="street-address"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allergies">{t('shared.profile.fields.allergies')}</Label>
              <Input
                id="allergies"
                value={formAllergies}
                onChange={e => setFormAllergies(e.target.value)}
                placeholder={t('shared.profile.fields.allergiesPlaceholder')}
              />
            </div>
          </Section>

          <Section title={t('shared.profile.emergencyContact')} icon={LifeBuoy}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="emergencyName">{t('shared.profile.fields.emergencyName')}</Label>
                <Input
                  id="emergencyName"
                  value={formEmergencyName}
                  onChange={e => setFormEmergencyName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergencyPhone">{t('shared.profile.fields.emergencyPhone')}</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={formEmergencyPhone}
                  onChange={e => setFormEmergencyPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>
          </Section>
        </>
      )}

      <div
        className={cn(
          'sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur transition-all duration-200',
          isDirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
        aria-live="polite"
      >
        <span className="truncate font-medium text-muted-foreground text-xs">
          {t('shared.profile.unsavedChanges')}
        </span>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={discard} disabled={isSaving}>
            {t('shared.profile.discard')}
          </Button>
          <Button type="submit" size="sm" disabled={isSaving || !isDirty}>
            {isSaving ? t('shared.profile.saving') : t('shared.profile.save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
