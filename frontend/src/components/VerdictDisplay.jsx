import { useEffect, useRef } from 'react';

export default function VerdictDisplay({ result }) {
  const boxRef = useRef(null);

  // Trigger flash animation on new result
  useEffect(() => {
    if (!result || !boxRef.current) return;
    const el = boxRef.current;
    const cls = result.label === 'MALICIOUS' ? 'verdict-danger-flash' : 'verdict-safe-flash';
    el.classList.remove('verdict-safe-flash', 'verdict-danger-flash');
    void el.offsetWidth; // reflow
    el.classList.add(cls);
  }, [result]);

  if (!result) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-6 text-center opacity-40">
          <p className="text-white/50 text-sm font-mono">Submit a prompt to see the verdict</p>
        </div>
      </div>
    );
  }

  const isMalicious = result.label === 'MALICIOUS';
  const conf       = Math.round(result.confidence * 100);

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div
        ref={boxRef}
        className="glass rounded-2xl p-6 transition-all duration-300"
        style={{
          borderColor: isMalicious ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)',
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Status dot */}
            <span
              className="relative flex h-3 w-3"
            >
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: isMalicious ? '#EF4444' : '#22C55E' }}
              />
              <span
                className="relative inline-flex rounded-full h-3 w-3"
                style={{ background: isMalicious ? '#EF4444' : '#22C55E' }}
              />
            </span>

            {/* Badge */}
            <span
              className="px-3 py-1 rounded-lg text-xs font-bold tracking-widest uppercase"
              style={{
                background: isMalicious ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                color:      isMalicious ? '#EF4444' : '#22C55E',
              }}
            >
              {isMalicious ? '🔴 BLOCKED' : '🟢 PASSED'}
            </span>
          </div>

          {/* Confidence chip */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold"
            style={{
              background: 'rgba(177,158,239,0.1)',
              color: '#B19EEF',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            {conf}% confidence
          </div>
        </div>

        {/* Message */}
        <p className="text-white/80 text-sm mb-4 leading-relaxed">
          {isMalicious
            ? 'Prompt Injection Detected — this prompt attempts to override system instructions or manipulate LLM behavior.'
            : 'Safe Prompt — no injection patterns detected. This prompt can be forwarded to the LLM.'}
        </p>

        {/* Confidence bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/40 font-mono">
            <span>Confidence</span>
            <span>{conf}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${conf}%`,
                background: isMalicious
                  ? 'linear-gradient(90deg, #EF4444, #FF6B6B)'
                  : 'linear-gradient(90deg, #22C55E, #4ADE80)',
              }}
            />
          </div>
        </div>

        {/* Timestamp */}
        <p className="mt-3 text-white/25 text-xs font-mono">
          {new Date(result.timestamp).toLocaleTimeString()} · ID #{result.id}
        </p>
      </div>
    </div>
  );
}
