'use client';

import { useAppStore } from '@/store/useAppStore';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { Activity, AlertTriangle, Globe, Wifi, WifiOff } from 'lucide-react';

export default function StatsBar() {
  const { events } = useLiveEvents();
  const isConnected = useAppStore((s) => s.isConnected);

  const counts = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const critical = events.filter(
    (e) => e.severity === 'critical' || e.riskScore > 75
  ).length;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-white/10 text-xs text-white/70">
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Stat icon={<Activity className="w-3 h-3" />} label="Total" value={events.length} />
        <Stat icon={<AlertTriangle className="w-3 h-3 text-red-400" />} label="Critical" value={critical} color="text-red-400" />
        <Stat icon={<Globe className="w-3 h-3 text-blue-400" />} label="News" value={counts.NEWS ?? 0} />
        <Stat icon={<Globe className="w-3 h-3 text-yellow-400" />} label="Aviation" value={counts.FLIGHT ?? 0} />
        <Stat icon={<Globe className="w-3 h-3 text-purple-400" />} label="Cyber" value={counts.CYBER ?? 0} />
      </div>
      <div className="text-white/30">SentinelPulse v0.1.0</div>
    </div>
  );
}

function Stat({
  icon, label, value, color = 'text-white/70',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-white/40">{label}:</span>
      <span className={color}>{value}</span>
    </div>
  );
}
