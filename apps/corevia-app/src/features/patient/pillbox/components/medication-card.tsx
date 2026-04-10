import { Pill } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface MedicationCardProps {
  medication: {
    id: string;
    medicationName?: string;
    dosageLabel?: string;
    active?: boolean;
  };
}

export function MedicationCard({ medication }: MedicationCardProps) {
  return (
    <Link to={`/patient/pillbox/${medication.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Pill className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{medication.medicationName ?? '—'}</p>
              {medication.dosageLabel && (
                <p className="text-muted-foreground text-xs">{medication.dosageLabel}</p>
              )}
            </div>
          </div>
          <Badge variant={medication.active !== false ? 'default' : 'secondary'}>
            {medication.active !== false ? 'Active' : 'Inactive'}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
