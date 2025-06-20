export interface HealthRecord {
  lastCheckup: string; // Date string
  conditions: string[];
  notes: string;
}

export interface FeedingSchedule {
  foodType: string;
  timesPerDay: number;
  portionSize: string;
  notes: string;
}

export interface VaccinationRecord {
  vaccineName:string;
  dateAdministered: string; // Date string
  nextDueDate?: string; // Date string
}

export interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number; // in years
  gender: 'Male' | 'Female' | 'Unknown';
  photos: string[]; // URLs
  description: string;
  healthRecords: HealthRecord;
  feedingSchedule: FeedingSchedule;
  vaccinationRecords: VaccinationRecord[];
  liveStreamUrl?: string; // Optional
  status: 'Available' | 'Pending' | 'Adopted';
  location: string; // e.g., Shelter name or city
  personalityTraits: string[]; // e.g., ['Friendly', 'Playful', 'Calm']
}

export type UserRole = 'adopter' | 'caregiver';

export interface Profile {
  id: string; // Corresponds to Supabase auth user ID
  role: UserRole;
  fullName?: string | null;
  avatarUrl?: string | null;
  updatedAt?: string | null;
}
