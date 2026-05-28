import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

export function formatYards(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${Math.round(n)} yds`;
}

export function formatMPH(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(1)} mph`;
}

export function formatRPM(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${Math.round(n)} rpm`;
}

export function formatDegrees(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(decimals)}°`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function scoreToColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function scoreToBgColor(score: number): string {
  if (score >= 85) return 'bg-green-100 text-green-800';
  if (score >= 70) return 'bg-blue-100 text-blue-800';
  if (score >= 55) return 'bg-yellow-100 text-yellow-800';
  if (score >= 40) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

export function priorityToColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'monitor': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function clubCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    driver: 'Driver',
    fairway_wood: 'Fairway Wood',
    hybrid: 'Hybrid',
    long_iron: 'Long Iron',
    mid_iron: 'Mid Iron',
    short_iron: 'Short Iron',
    wedge: 'Wedge',
    putter: 'Putter',
  };
  return labels[category] ?? category;
}
