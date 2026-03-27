import { useEffect, useRef } from 'react';

function truncate(str, n = 60) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function HistoryLog({ history }) {
  const listRef = useRef(null);
  const prevLen = useRef(0);

  // Scroll to top on new item
  useEffect(() => {
    if (!listRef.current) return;
    if (history && history.length > prevLen.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevLen.current = history?.length ?? 0;
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto glass rounded-2xl p-6 text-center">
        <p className="text-white/30 text-sm font-mono">No classifications yet. Submit a prompt above.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-lavender" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <span className="text-white/60 text-sm font-semibold">History Log</span>
        </div>
        <span className="text-white/30 text-xs font-mono">{history.length} entries</span>
      </div>

      {/* Rows */}
      <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '280px' }}>
        {history.map((item, i) => {
          const isMalicious = item.label === 'MALICIOUS';
          const conf = Math.round(item.confidence * 100);
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
              style={{
                animation: i === 0 ? 'fadeIn 0.3s ease' : undefined,
              }}
            >
              {/* Label dot */}
              <span
                className="flex-shrink-0 w-2 h-2 rounded-full"
                style={{ background: isMalicious ? '#EF4444' : '#22C55E' }}
              />

              {/* Prompt preview */}
              <span className="flex-1 text-white/70 text-xs font-mono truncate min-w-0">
                {truncate(item.prompt)}
              </span>

              {/* Badge */}
              <span
                className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
                style={{
                  background: isMalicious ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                  color:      isMalicious ? '#EF4444' : '#22C55E',
                }}
              >
                {item.label}
              </span>

              {/* Confidence */}
              <span className="flex-shrink-0 text-white/30 text-[10px] font-mono w-10 text-right">
                {conf}%
              </span>

              {/* Time */}
              <span className="flex-shrink-0 text-white/20 text-[10px] font-mono w-16 text-right">
                {formatTime(item.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
