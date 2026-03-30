import { useEffect, useRef } from 'react';

function StatCard({ label, value, color, icon }) {
  const valRef = useRef(null);
  const prevVal = useRef(value);

  // Animate stat value changes
  useEffect(() => {
    if (valRef.current && prevVal.current !== value) {
      valRef.current.classList.remove('stat-val');
      void valRef.current.offsetWidth;
      valRef.current.classList.add('stat-val');
      prevVal.current = value;
    }
  }, [value]);

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs font-mono uppercase tracking-wider truncate">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <span
        ref={valRef}
        className="text-2xl font-bold tabular-nums"
        style={{ color }}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

export default function StatsBar({ stats }) {
  if (!stats) {
    return (
      <div className="w-full max-w-2xl mx-auto grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 h-20 animate-pulse bg-white/5" />
        ))}
      </div>
    );
  }

  const blockRate = stats.total > 0 ? Math.round(stats.block_rate * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto grid grid-cols-4 gap-3">
      <StatCard label="Total"     value={stats.total}    color="#B19EEF"/>
      <StatCard label="Blocked"   value={stats.malicious} color="#EF4444"/>
      <StatCard label="Passed"    value={stats.safe}      color="#22C55E"/>
      <StatCard label="Block Rate" value={`${blockRate}%`} color="#FF9FFC"/>
    </div>
  );
}

