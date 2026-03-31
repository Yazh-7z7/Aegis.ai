import { useState, useEffect, useCallback } from 'react';
import PromptInput   from './components/PromptInput';
import VerdictDisplay from './components/VerdictDisplay';
import StatsBar      from './components/StatsBar';
import HistoryLog    from './components/HistoryLog';
import { classifyPrompt, getHistory, getStats, getHealth } from './api/client';

// ── Sidebar nav item ────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '9px 12px',
        borderRadius: '10px',
        border: 'none',
        background: active
          ? 'rgba(111, 111, 113, 0.18)'
          : hovered
          ? 'rgba(255,255,255,0.05)'
          : 'transparent',
        color: active ? 'rgba(111, 111, 113, 0.18)' : hovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        transition: 'all 0.18s ease',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function App() {
  const [result,    setResult]    = useState(null);
  const [stats,     setStats]     = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [panel,     setPanel]     = useState(null); // null | 'history' | 'stats'

  // ── Fetch stats + history ──────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([getStats(), getHistory(50)]);
      setStats(s);
      setHistory(h);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    getHealth()
      .then((h) => setApiStatus(h.status))
      .catch(() => setApiStatus('degraded'));
    refresh();
  }, [refresh]);

  // ── Submit ─────────────────────────────────────────────────────────────
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

  const handleNewThread = () => {
    window.open(window.location.href, '_blank');
  };

  const togglePanel = (name) => setPanel(p => p === name ? null : name);

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#0A0A0F',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#E8E8F0',
      }}
    >
      {/* ── Left Sidebar ───────────────────────────────────────────────── */}
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 12px',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(10,10,15,0.95)',
          gap: '4px',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '8px',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L3 8v12l11 6 11-6V8L14 2z" fill="url(#app-shield)" />
            <path d="M14 8l-5 2.8v5.4l5 2.8 5-2.8v-5.4L14 8z" fill="rgba(255,255,255,0.15)" />
            <defs>
              <linearGradient id="app-shield" x1="3" y1="2" x2="25" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f4f3f7ff" />
                <stop offset="1" stopColor="#212021ff" />
              </linearGradient>
            </defs>
          </svg>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e9e4e4ff 0%, rgba(121, 121, 126, 0.9) 60%, #696669ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            Aegis.ai
          </span>
        </div>

        {/* New Thread */}
        <NavItem
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
          label="New Thread"
          active={false}
          onClick={handleNewThread}
        />

        <div style={{ height: '8px' }} />

        {/* History */}
        <NavItem
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          }
          label="History"
          active={panel === 'history'}
          onClick={() => togglePanel('history')}
        />

        {/* Stats */}
        <NavItem
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          label="Stats"
          active={panel === 'stats'}
          onClick={() => togglePanel('stats')}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* API status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            color: apiStatus === 'ok' ? '#22C55E' : apiStatus === 'degraded' ? '#EF4444' : '#B19EEF',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: apiStatus === 'ok' ? '#22C55E' : apiStatus === 'degraded' ? '#EF4444' : '#B19EEF',
              flexShrink: 0,
            }}
          />
          {apiStatus === 'ok' ? 'Online' : apiStatus === 'degraded' ? 'Offline' : 'Connecting…'}
        </div>
      </aside>

      {/* ── Main Area ──────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* ── Panel overlay: History ────────────────────────────────── */}
        {panel === 'history' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: '#0A0A0F',
              overflowY: 'auto',
              padding: '32px 40px',
            }}
          >
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                }}
              >
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  History Log
                </h2>
                <button
                  onClick={() => setPanel(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                >
                  ✕ Close
                </button>
              </div>
              <HistoryLog history={history} />
            </div>
          </div>
        )}

        {/* ── Panel overlay: Stats ──────────────────────────────────── */}
        {panel === 'stats' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: '#0A0A0F',
              overflowY: 'auto',
              padding: '32px 40px',
            }}
          >
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                }}
              >
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Statistics
                </h2>
                <button
                  onClick={() => setPanel(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                >
                  ✕ Close
                </button>
              </div>
              <StatsBar stats={stats} />
              {stats && (
                <div
                  style={{
                    marginTop: '24px',
                    padding: '20px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>AVG CONFIDENCE</p>
                    <p style={{ fontSize: '26px', fontWeight: 700, color: '#eceaf1ff' }}>{Math.round(stats.avg_confidence * 100)}%</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>BLOCK RATE</p>
                    <p style={{ fontSize: '26px', fontWeight: 700, color: '#f4f0f4ff' }}>{Math.round(stats.block_rate * 100)}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main content (prompt interface) ──────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px 32px',
            gap: '28px',
          }}
        >
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.1,
                marginBottom: '8px',
              }}
            >
              Aegis.ai
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              AI Prompt Firewall
            </p>
          </div>

          {/* Prompt input */}
          <div style={{ width: '100%', maxWidth: '680px' }}>
            <PromptInput onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* Verdict */}
          <div style={{ width: '100%', maxWidth: '680px' }}>
            <VerdictDisplay result={result} />
          </div>
        </div>
      </main>
    </div>
  );
}