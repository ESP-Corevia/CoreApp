import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
  const [formEmail, setFormEmail] = useState(email);

  // Doctor fields
  const [formSpecialty, setFormSpecialty] = useState(doctorProfile?.specialty ?? '');
  const [formDoctorAddress, setFormDoctorAddress] = useState(doctorProfile?.address ?? '');
  const [formCity, setFormCity] = useState(doctorProfile?.city ?? '');

  // Patient fields
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
            bloodType:
              (formBloodType as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-') || null,
            allergies: formAllergies || null,
            emergencyContactName: formEmergencyName || null,
            emergencyContactPhone: formEmergencyPhone || null,
          },
        }),
      });
      void queryClient.invalidateQueries({ queryKey: [['user', 'getMe']] });
      toast.success(t('shared.profile.save'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('shared.profile.personalInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formName} onChange={e => setFormName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={role} disabled className="capitalize" />
          </div>

          {role === 'doctor' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={formSpecialty}
                  onChange={e => setFormSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology"
                  autoComplete="organization-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorAddress">Address</Label>
                <Input
                  id="doctorAddress"
                  value={formDoctorAddress}
                  onChange={e => setFormDoctorAddress(e.target.value)}
                  placeholder="123 Main St"
                  autoComplete="street-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formCity}
                  onChange={e => setFormCity(e.target.value)}
                  placeholder="e.g. Paris"
                  autoComplete="address-level2"
                />
              </div>
            </>
          )}

          {role === 'patient' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formDob}
                  onChange={e => setFormDob(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="123 Main St, City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select value={formBloodType} onValueChange={setFormBloodType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                      <SelectItem key={bt} value={bt}>
                        {bt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  value={formAllergies}
                  onChange={e => setFormAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                <Input
                  id="emergencyName"
                  value={formEmergencyName}
                  onChange={e => setFormEmergencyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={formEmergencyPhone}
                  onChange={e => setFormEmergencyPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? t('shared.profile.saving') : t('shared.profile.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
