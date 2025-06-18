import type { Dog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Utensils, ShieldCheck } from 'lucide-react';

interface HealthRecordsDisplayProps {
  dog: Dog;
}

export const HealthRecordsDisplay = ({ dog }: HealthRecordsDisplayProps) => {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-secondary/50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl font-headline">
            <ClipboardList className="h-6 w-6 text-primary" />
            Health Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <p><strong>Last Checkup:</strong> {new Date(dog.healthRecords.lastCheckup).toLocaleDateString()}</p>
          <div>
            <strong>Conditions:</strong>
            {dog.healthRecords.conditions.length > 0 && dog.healthRecords.conditions[0] !== "None" ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {dog.healthRecords.conditions.map((condition, index) => (
                  <Badge key={index} variant="secondary">{condition}</Badge>
                ))}
              </div>
            ) : (
              <span className="ml-1">None</span>
            )}
          </div>
          <p><strong>Notes:</strong> {dog.healthRecords.notes}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="bg-secondary/50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl font-headline">
            <Utensils className="h-6 w-6 text-primary" />
            Feeding Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <p><strong>Food Type:</strong> {dog.feedingSchedule.foodType}</p>
          <p><strong>Times Per Day:</strong> {dog.feedingSchedule.timesPerDay}</p>
          <p><strong>Portion Size:</strong> {dog.feedingSchedule.portionSize}</p>
          <p><strong>Notes:</strong> {dog.feedingSchedule.notes}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="bg-secondary/50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl font-headline">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Vaccination Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {dog.vaccinationRecords.length > 0 ? (
            dog.vaccinationRecords.map((vaccine, index) => (
              <div key={index} className="pb-2 mb-2 border-b border-border last:border-b-0 last:pb-0 last:mb-0">
                <p><strong>Vaccine:</strong> {vaccine.vaccineName}</p>
                <p><strong>Date Administered:</strong> {new Date(vaccine.dateAdministered).toLocaleDateString()}</p>
                {vaccine.nextDueDate && <p><strong>Next Due Date:</strong> {new Date(vaccine.nextDueDate).toLocaleDateString()}</p>}
              </div>
            ))
          ) : (
            <p>No vaccination records available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
