export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  uid: string;
  name: string;
  email?: string;
  role: UserRole;
  houseId?: string; // For students
  points?: number; 
}

export interface House {
  id: string; // Phoenix, Pegasus, Centaur, Sphinx
  name: string;
  totalPoints: number;
  rank: number;
  lastUpdated: number;
}

export type PointCategory = 'academic' | 'sport' | 'behavior' | 'participation' | 'other';

export interface PointLog {
  id: string;
  houseId: string;
  points: number;
  reason: string;
  category: PointCategory;
  awardedBy: string; // User name
  awardedByUid: string;
  targetUid?: string;
  targetName?: string;
  role: UserRole;
  timestamp: any;
}

export const HOUSES = [
  { id: 'phoenix', name: 'Phoenix', color: 'bg-red-500', textColor: 'text-red-500' },
  { id: 'pegasus', name: 'Pegasus', color: 'bg-blue-500', textColor: 'text-blue-500' },
  { id: 'centaur', name: 'Centaur', color: 'bg-green-500', textColor: 'text-green-500' },
  { id: 'sphinx', name: 'Sphinx', color: 'bg-purple-500', textColor: 'text-purple-500' },
];

export const POINT_CATEGORIES: { id: PointCategory; label: string }[] = [
  { id: 'academic', label: 'Academic Achievement' },
  { id: 'sport', label: 'Sports & Athletics' },
  { id: 'behavior', label: 'Good Behavior' },
  { id: 'participation', label: 'Participation' },
  { id: 'other', label: 'Other' },
];
