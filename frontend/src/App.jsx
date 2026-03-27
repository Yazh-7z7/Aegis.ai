import { useState, useEffect, useCallback } from 'react';
import LiquidEther   from './components/LiquidEther';
import PromptInput   from './components/PromptInput';
import VerdictDisplay from './components/VerdictDisplay';
import StatsBar      from './components/StatsBar';
import HistoryLog    from './components/HistoryLog';
import { classifyPrompt, getHistory, getStats, getHealth } from './api/client';

export default function App() {
  const [result,  setResult]  = useState(null);
  const [stats,   setStats]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking'); // 'ok' | 'degraded' | 'checking'

  // ── Fetch stats + history ────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([getStats(), getHistory(20)]);
      setStats(s);
      setHistory(h);
    } catch { /* silently fail */ }
  }, []);

  // ── Health check on mount ────────────────────────────────────────────────
  useEffect(() => {
    getHealth()
      .then((h) => setApiStatus(h.status))
      .catch(() => setApiStatus('degraded'));
    refresh();
  }, [refresh]);

  // ── Submit prompt ────────────────────────────────────────────────────────
  const handleSubmit = async (prompt) => {
    setLoading(true);
    try {
      const data = await classifyPrompt(prompt);
      setResult(data);
      await refresh();
    } catch (err) {
      console.error('Classify error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#0A0A0F' }}>

      {/* ── Liquid Ether background (full-screen) ─────────────────────── */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          autoDemo={true}
          autoSpeed={0.45}
          autoIntensity={2.0}
          resolution={0.5}
        />
      </div>

      {/* ── Dark overlay to keep text readable ───────────────────────── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.55) 0%, rgba(10,10,15,0.35) 40%, rgba(10,10,15,0.80) 100%)' }}
      />

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="relative z-20 h-full overflow-y-auto flex flex-col">
        <div className="flex flex-col items-center gap-6 px-4 pb-10 pt-14 min-h-full">

          {/* API status pill */}
          <div className="fixed top-4 right-4 z-30">
            <div
              className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs font-mono"
              style={{ color: apiStatus === 'ok' ? '#22C55E' : apiStatus === 'degraded' ? '#EF4444' : '#B19EEF' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: apiStatus === 'ok' ? '#22C55E' : apiStatus === 'degraded' ? '#EF4444' : '#B19EEF' }}
              />
              {apiStatus === 'ok' ? 'API Online' : apiStatus === 'degraded' ? 'API Degraded' : 'Connecting…'}
            </div>
          </div>

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <div className="text-center max-w-xl space-y-3 mt-2">
            {/* Wordmark */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L3 8v12l11 6 11-6V8L14 2z" fill="url(#shield-grad)" />
                <path d="M14 8l-5 2.8v5.4l5 2.8 5-2.8v-5.4L14 8z" fill="rgba(255,255,255,0.15)" />
                <defs>
                  <linearGradient id="shield-grad" x1="3" y1="2" x2="25" y2="26" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5227FF"/>
                    <stop offset="1" stopColor="#FF9FFC"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="gradient-text text-2xl font-bold tracking-tight">Aegis.ai</span>
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Protect Your AI.<br />
              <span className="gradient-text">In Real Time.</span>
            </h1>
            <p className="text-white/45 text-sm leading-relaxed max-w-sm mx-auto">
              AI-powered prompt injection firewall — classifies every prompt as{' '}
              <span className="text-safe font-semibold">SAFE</span> or{' '}
              <span className="text-danger font-semibold">MALICIOUS</span> in under 200ms.
            </p>
          </div>

          {/* ── Stats bar ─────────────────────────────────────────────── */}
          <StatsBar stats={stats} />

          {/* ── Prompt input ──────────────────────────────────────────── */}
          <PromptInput onSubmit={handleSubmit} loading={loading} />

          {/* ── Verdict ───────────────────────────────────────────────── */}
          <VerdictDisplay result={result} />

          {/* ── History log ───────────────────────────────────────────── */}
          <HistoryLog history={history} />

          {/* Footer */}
          <p className="text-white/15 text-xs font-mono mt-auto pt-4">
            Aegis.ai v1.0 · LinearSVC + TF-IDF · 91.7% malicious recall
          </p>
        </div>
      </div>
    </div>
  );
}
