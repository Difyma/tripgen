import { getSafeAuthSession } from '../lib/supabase';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const withApiBase = (path: string): string => `${API_URL}${path}`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSafeAuthSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
    ...(auth ? await getAuthHeaders() : {}),
  };

  const response = await fetch(withApiBase(path), { ...init, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed: ${response.status}`);
  }

  return data as T;
}

export interface CreatorTourPayload {
  title: string;
  location: string;
  region: string;
  duration: string;
  durationDays: number;
  groupSize: string;
  minGroupSize: number;
  maxGroupSize: number;
  price: string;
  priceValue: number;
  category: string;
  categoryName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  shortDescription: string;
  description: string;
  image: string;
  images: string[];
  highlights: string[];
  activities: string[];
  requirements: string[];
  bestTime: string;
  spotsLeft: number;
  startDate: string;
  endDate: string;
  guideInfo?: {
    name: string;
    experience: string;
    languages: string[];
  };
  paymentMethodTitle: string;
  paymentInstructions: string;
  itinerary: Array<{ day: number; title: string; description: string; meals: string[] }>;
  accommodation: Array<{ name: string; description: string; type: string }>;
  includes: string[];
  excludes: string[];
}

export interface TourBookingPayload {
  tourId?: string;
  sourceTourId?: string;
  creatorId?: string;
  tourName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guests: number;
  preferredDate?: string;
  comments?: string;
  amount: number;
  paymentMethodTitle?: string;
}

export interface TourOrder {
  id: string;
  requestId?: string;
  tourId?: string;
  sourceTourId?: string;
  tourName: string;
  customer: string;
  email: string;
  phone?: string;
  date: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  guests: number;
  comments?: string;
  createdAt?: string;
  paymentMethodTitle?: string;
}

export const tourApi = {
  async getPublishedTours() {
    return request<{ tours: any[] }>('/api/tours');
  },

  async getTour(id: string) {
    return request<{ tour: any }>(`/api/tours/${encodeURIComponent(id)}`);
  },

  async createTour(payload: CreatorTourPayload) {
    return request<{ tour: any }>('/api/tours', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  },

  async getMyTours() {
    return request<{ tours: any[] }>('/api/tours/mine', {}, true);
  },

  async createBooking(payload: TourBookingPayload) {
    return request<{ booking: TourOrder }>('/api/tours/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  },

  async getMyBookings() {
    return request<{ bookings: TourOrder[] }>('/api/tours/bookings/mine', {}, true);
  },
};
