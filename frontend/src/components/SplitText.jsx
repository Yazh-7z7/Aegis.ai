import { useEffect, useRef, useState } from 'react';

/**
 * SplitText — pure React/CSS animated text (no GSAP required).
 * Splits text into individual characters and animates them in
 * with a staggered upward reveal.
 *
 * Props:
 *   text          – string to animate
 *   tag           – wrapper HTML tag (default 'p')
 *   className     – class on wrapper
 *   style         – style on wrapper element
 *   charStyle     – style applied to EACH character span (use for gradient text etc.)
 *   delay         – stagger delay per character in ms (default 40)
 *   duration      – animation duration in ms (default 900)
 *   staggerStart  – initial delay before first char animates (default 200)
 */
export default function SplitText({
  text = '',
  className = '',
  delay = 70,
  duration =3000,
  staggerStart = 200,
  tag: Tag = 'p',
  style = {},
  charStyle = {},
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chars = text.split('');

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ display: 'inline-block', ...style }}
      aria-label={text}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            whiteSpace: char === ' ' ? 'pre' : undefined,
            transform: visible ? 'translateY(0)' : 'translateY(36px)',
            opacity: visible ? 1 : 0,
            transition: `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${staggerStart + i * delay}ms, opacity ${Math.round(duration * 0.7)}ms ease ${staggerStart + i * delay}ms`,
            ...charStyle,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Tag>
  );
}