import { NextRequest } from 'next/server';
import {
  AdsbResponse,
  AdsbAircraft,
  buildAdsbUrl,
  calcRiskScore,
  adsbToCategory,
  adsbToSeverity,
} from '@/lib/adsb';
import { PulseEvent } from '@/store/useAppStore';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const POLL_INTERVAL_MS = 15_000;
const MAX_DURATION_MS = 55_000;

function acToPulseEvent(ac: AdsbAircraft): PulseEvent | null {
  if (!ac.lat || !ac.lon) return null;

  const callsign = (ac.flight ?? ac.r ?? ac.hex).trim();
  const riskScore = calcRiskScore(ac);
  const category = adsbToCategory(ac);
  const severity = adsbToSeverity(riskScore);

  const altStr =
    ac.alt_baro === 'ground'
      ? 'GND'
      : typeof ac.alt_baro === 'number'
      ? `${ac.alt_baro.toLocaleString()} ft`
      : '?';

  return {
    id: `adsb-${ac.hex}`,
    category,
    title: callsign || ac.hex,
    summary: [
      ac.t ?? '',
      `Alt: ${altStr}`,
      ac.gs ? `GS: ${Math.round(ac.gs)} kt` : '',
      ac.squawk ? `Squawk: ${ac.squawk}` : '',
    ]
      .filter(Boolean)
      .join(' | '),
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
      heading: String(ac.track ?? ''),
      squawk: ac.squawk ?? '',
      emergency: ac.emergency ?? 'none',
    },
  };
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}

`));
        } catch {
          // client disconnected
        }
      };

      const sendAdsb = async () => {
        try {
          const res = await fetch(buildAdsbUrl(), {
            headers: { 'User-Agent': 'SentinelPulse/1.0' },
          });
          if (!res.ok) return;
          const data: AdsbResponse = await res.json();
          const aircraft = data.ac ?? [];

          const events = aircraft
            .map(acToPulseEvent)
            .filter((e): e is PulseEvent => e !== null)
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 50);

          for (const event of events) {
            send(JSON.stringify(event));
          }
        } catch (err) {
          console.error('[SSE] adsb.lol fetch error:', err);
        }
      };

      await sendAdsb();

      const interval = setInterval(async () => {
        if (Date.now() - startTime >= MAX_DURATION_MS) {
          clearInterval(interval);
          controller.enqueue(encoder.encode(': reconnect

'));
          controller.close();
          return;
        }
        await sendAdsb();
      }, POLL_INTERVAL_MS);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
      }
