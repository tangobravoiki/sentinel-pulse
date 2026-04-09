import { NextRequest, NextResponse } from 'next/server';
import { AdsbResponse, AdsbAircraft, buildAdsbUrl, calcRiskScore, adsbToCategory, adsbToSeverity } from '@/lib/adsb';
import { PulseEvent } from '@/store/useAppStore';

export const runtime = 'edge';
export const revalidate = 0;

function acToPulseEvent(ac: AdsbAircraft): PulseEvent | null {
  if (!ac.lat || !ac.lon) return null;
  const callsign = (ac.flight ?? ac.r ?? ac.hex).trim();
  const riskScore = calcRiskScore(ac);
  const category = adsbToCategory(ac);
  const severity = adsbToSeverity(riskScore);
  const altStr = ac.alt_baro === 'ground' ? 'GND' : typeof ac.alt_baro === 'number' ? `${ac.alt_baro.toLocaleString()} ft` : '?';
  const title = callsign || ac.hex;
  const summary = [ac.t ?? '', `Alt: ${altStr}`, ac.gs ? `GS: ${Math.round(ac.gs)} kt` : '', ac.squawk ? `Squawk: ${ac.squawk}` : ''].filter(Boolean).join(' | ');
  const description = [ac.r ? `Reg: ${ac.r}` : '', ac.t ? `Type: ${ac.t}` : '', `Alt: ${altStr}`, ac.gs ? `Speed: ${Math.round(ac.gs)} kt` : '', ac.track ? `Track: ${Math.round(ac.track)}deg` : '', ac.squawk ? `Squawk: ${ac.squawk}` : '', ac.emergency && ac.emergency !== 'none' ? `Emergency: ${ac.emergency}` : ''].filter(Boolean).join(', ');
  return {
    id: `adsb-${ac.hex}`,
    category,
    title,
    summary,
    description,
    riskScore,
    lat: ac.lat,
    lon: ac.lon,
    timestamp: new Date().toISOString(),
    severity,
    metadata: {
      hex: ac.hex,
      callsign,
      registration: ac.r ?? '',
      aircraftType: ac.t ?? '',
      altitude: String(ac.alt_baro ?? ''),
      groundSpeed: String(ac.gs ?? ''),
      heading: String(ac.track ?? ac.nav_heading ?? ''),
      squawk: ac.squawk ?? '',
      emergency: ac.emergency ?? 'none',
      distanceNm: String(ac.dst ?? ''),
    },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  try {
    const url = buildAdsbUrl();
    const res = await fetch(url, { headers: { 'User-Agent': 'SentinelPulse/1.0' }, next: { revalidate: 0 } });
    if (!res.ok) return NextResponse.json({ error: `adsb.lol returned ${res.status}` }, { status: 502 });
    const data: AdsbResponse = await res.json();
    const aircraft = data.ac ?? [];
    let events: PulseEvent[] = aircraft.map(acToPulseEvent).filter((e): e is PulseEvent => e !== null).sort((a, b) => b.riskScore - a.riskScore);
    if (category && category !== 'FLIGHT') events = events.filter((e) => e.category === category);
    return NextResponse.json({ events, total: events.length, source: 'adsb.lol', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[/api/v1/events]', err);
    return NextResponse.json({ error: 'Failed to fetch ADSB data' }, { status: 500 });
  }
}
