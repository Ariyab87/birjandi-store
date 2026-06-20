import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateOrderId(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const RETAIL_CATEGORIES = [
  { key: 'kitchen', icon: '🍳' },
  { key: 'laundry', icon: '👕' },
  { key: 'cooling', icon: '❄️' },
  { key: 'heating', icon: '🌡️' },
  { key: 'air', icon: '💨' },
  { key: 'cleaning', icon: '🧹' },
  { key: 'small', icon: '☕' },
  { key: 'accessories', icon: '🔌' },
] as const;

export const WHOLESALE_BUSINESS_TYPES = [
  { key: 'cafe', icon: '☕', color: 'from-amber-600 to-amber-800' },
  { key: 'restaurant', icon: '🍽️', color: 'from-red-600 to-red-800' },
  { key: 'gym', icon: '🏋️', color: 'from-green-600 to-green-800' },
  { key: 'hotel', icon: '🏨', color: 'from-purple-600 to-purple-800' },
  { key: 'office', icon: '🏢', color: 'from-blue-600 to-blue-800' },
] as const;
