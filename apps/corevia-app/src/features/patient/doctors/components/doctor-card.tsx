import { CalendarPlus, MapPin, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DoctorCardProps {
  doctor: {
    id: string;
    userId?: string | null;
    specialty?: string;
    city?: string;
    name?: string | null;
    user?: {
      name?: string;
      image?: string;
    };
  };
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const { t } = useTranslation();
  const name = doctor.user?.name ?? doctor.name ?? '—';
  const bookId = doctor.userId ?? doctor.id;

  return (
    <Link
      to={`/patient/doctors/${bookId}/book`}
      state={{ doctor: { name, specialty: doctor.specialty, city: doctor.city } }}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={t('patient.doctors.bookWith', { name })}
    >
      <Card className="group overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4 sm:gap-4">
          <Avatar className="size-12 shrink-0 sm:size-14">
            <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/5 font-semibold text-primary">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-medium text-sm" title={name}>
              {name}
            </p>
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

          <Button
            size="sm"
            variant="outline"
            tabIndex={-1}
            className="hidden shrink-0 group-hover:border-primary/40 group-hover:bg-primary/5 sm:inline-flex"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            {t('patient.doctors.bookCta')}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
