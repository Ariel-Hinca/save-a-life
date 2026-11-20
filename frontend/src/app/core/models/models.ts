export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  campus: string;
  programme: string;
  availability: string;
  donorLevel: number;
  xp: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Donation {
  id: string;
  donationDate: string;
  donationType: string;
  location: string;
  volume: number;
  donationReference: string;
  status: string;
  createdAt: string;
}

export interface BloodResult {
  id: string;
  resultDate: string;
  hemoglobin?: number | null;
  ferritin?: number | null;
  bloodPressure?: string | null;
  weight?: number | null;
}

export interface OcrScanResponse {
  donationId: string;
  donationDate: string;
  donationType: string;
  center: string;
  confidence: number;
}

export interface AchievementProgress {
  code: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string | null;
  progressPercent: number;
}

export interface StatsSummary {
  donorLevel: number;
  xp: number;
  totalDonations: number;
  totalLivesHelped: number;
  totalBloodVolumeLiters: number;
  nextEligibleDonationDate?: string | null;
  nextEligibleType?: string | null;
  donationsPerYear: { year: number; count: number }[];
  donationTypes: { type: string; count: number }[];
  volumeOverTime: { label: string; cumulativeLiters: number }[];
  achievements: AchievementProgress[];
}
