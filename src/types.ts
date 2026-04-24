import React from 'react';

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

export interface PointReason {
  id: string;
  label: string;
  points: number;
  category: PointCategory;
}

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
  { id: 'phoenix', name: 'Phoenix', color: 'bg-phoenix', textColor: 'text-phoenix' },
  { id: 'pegasus', name: 'Pegasus', color: 'bg-pegasus', textColor: 'text-pegasus' },
  { id: 'centaur', name: 'Centaur', color: 'bg-centaur', textColor: 'text-centaur' },
  { id: 'sphinx', name: 'Sphinx', color: 'bg-sphinx', textColor: 'text-sphinx' },
];

export const POINT_CATEGORIES: { id: PointCategory; label: string }[] = [
  { id: 'academic', label: 'Academic Achievement' },
  { id: 'sport', label: 'Sports & Athletics' },
  { id: 'behavior', label: 'Good Behavior' },
  { id: 'participation', label: 'Participation' },
  { id: 'other', label: 'Other' },
];

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': any;
    }
  }
}
