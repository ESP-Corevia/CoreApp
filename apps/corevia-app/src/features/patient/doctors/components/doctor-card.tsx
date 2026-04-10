import { MapPin, Stethoscope, User } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';

interface DoctorCardProps {
  doctor: {
    id: string;
    specialty?: string;
    city?: string;
    user?: {
      name?: string;
      image?: string;
    };
  };
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const name = doctor.user?.name ?? '—';

  return (
    <Link to={`/patient/doctors/${doctor.id}/book`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-medium text-sm">{name}</p>
            {doctor.specialty && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Stethoscope className="h-3 w-3" />
                <span>{doctor.specialty}</span>
              </div>
            )}
            {doctor.city && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin className="h-3 w-3" />
                <span>{doctor.city}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
