import { useState } from 'react';
import PixelSnow from './PixelSnow';
import SplitText from './SplitText';

export default function HomePage({ onEnter }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#171615',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* PixelSnow background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <PixelSnow
          color="#f7f7f7ff"
          flakeSize={0.008}
          minFlakeSize={1.1}
          pixelResolution={150}
          speed={0.7}
          depthFade={10}
          farPlane={22}
          brightness={1.2}
          gamma={0.45}
          density={0.28}
          variant="snowflake"
          direction={110}
        />
      </div>

      {/* Subtle vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10,10,15,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        {/* Shield icon */}
        <div
          style={{
            opacity: 0,
            animation: 'fadeSlideDown 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s forwards',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L3 8v12l11 6 11-6V8L14 2z" fill="url(#hp-shield-grad)" />
            <path d="M14 8l-5 2.8v5.4l5 2.8 5-2.8v-5.4L14 8z" fill="rgba(255,255,255,0.18)" />
            <defs>
              <linearGradient id="hp-shield-grad" x1="3" y1="2" x2="25" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f4f3f7ff" />
                <stop offset="1" stopColor="#212021ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Main heading */}
        <div style={{ overflow: 'hidden' }}>
          <SplitText
            text="Aegis.ai"
            tag="h1"
            delay={55}
            duration={1100}
            staggerStart={300}
            style={{
              fontSize: 'clamp(64px, 12vw, 112px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
            charStyle={{
              background: 'linear-gradient(135deg, #e9e4e4ff 0%, rgba(121, 121, 126, 0.9) 50%, #696669ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: 'clamp(64px, 12vw, 112px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          />
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 'clamp(14px, 2vw, 17px)',
            color: 'rgba(255,255,255,0.38)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 500,
            fontFamily: "'JetBrains Mono', monospace",
            opacity: 0,
            animation: 'fadeSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) 1.1s forwards',
          }}
        >
          Real-Time AI Prompt Firewall
        </p>

        {/* Get Started button */}
        <button
          onClick={onEnter}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            marginTop: '8px',
            padding: '14px 40px',
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: hovered
              ? 'rgba(91, 89, 102, 0.25)'
              : 'rgba(255,255,255,0.06)',
            color: hovered ? '#fff' : 'rgba(255,255,255,0.7)',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.25s ease',
            boxShadow: hovered ? '0 0 40px rgba(255, 39, 39, 0.35), 0 0 0 1px rgba(80, 74, 74, 0.5)' : 'none',
            opacity: 0,
            animation: 'fadeSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) 1.4s forwards',
          }}
        >
          Get Started →
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}