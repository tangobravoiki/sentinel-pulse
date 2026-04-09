// adsb.lol API entegrasyonu
// Docs: https://api.adsb.lol/docs

export interface AdsbAircraft {
  hex: string;
  type?: string;
  flight?: string;
  r?: string;
  t?: string;
  alt_baro?: number | string;
  alt_geom?: number;
  gs?: number;
  track?: number;
  baro_rate?: number;
  squawk?: string;
  emergency?: string;
  category?: string;
  lat?: number;
  lon?: number;
  seen?: number;
  dst?: number;
  dir?: number;
  nav_heading?: number;
  true_heading?: number;
  mag_heading?: number;
  ias?: number;
  tas?: number;
  mach?: number;
  messages?: number;
  rssi?: number;
  alert?: number;
  spi?: number;
}

export interface AdsbResponse {
  ac: AdsbAircraft[];
  msg: string;
  now: number;
  total: number;
  ctime: number;
  ptime: number;
}

const DEFAULT_LAT = 39.0;
const DEFAULT_LON = 35.0;
const DEFAULT_DIST = 500;

export const ADSB_BASE = 'https://api.adsb.lol/v2';

export function buildAdsbUrl(
  lat = DEFAULT_LAT,
  lon = DEFAULT_LON,
  dist = DEFAULT_DIST
): string {
  return `${ADSB_BASE}/lat/${lat}/lon/${lon}/dist/${dist}`;
}

export function calcRiskScore(ac: AdsbAircraft): number {
  const sq = ac.squawk ?? '';
  if (sq === '7700' || sq === '7500') return 100;
  if (sq === '7600') return 90;
  if (ac.emergency && ac.emergency !== 'none') return 95;
  if (ac.alert === 1) return 85;

  let score = 20;
  const alt = typeof ac.alt_baro === 'number' ? ac.alt_baro : 0;
  const gs = ac.gs ?? 0;

  if (alt < 3000 && gs > 300) score += 30;
  else if (alt < 5000 && gs > 350) score += 20;
  if (gs > 550) score += 15;
  if (ac.spi === 1) score += 25;

  return Math.min(score, 99);
}

export function adsbToCategory(ac: AdsbAircraft): string {
  const sq = ac.squawk ?? '';
  if (['7700', '7600', '7500'].includes(sq)) return 'EMERGENCY';
  if (ac.emergency && ac.emergency !== 'none') return 'EMERGENCY';
  return 'FLIGHT';
}

export function adsbToSeverity(score: number): string {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
