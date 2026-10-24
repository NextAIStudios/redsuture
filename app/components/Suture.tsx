'use client';
import { useEffect, useRef } from 'react';
import styles from './suture.module.css';

// The brand motif: a red thread that draws itself, crossed by stitches.
// Draws once when it first scrolls into view; static under reduced motion
// or without scripting (see suture.module.css).
export default function Suture({ className = '', stitches = 9 }: { className?: string; stitches?: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const draw = () => el.setAttribute('data-drawn', '');
    if (!('IntersectionObserver' in window)) {
      draw();
      return;
    }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        draw();
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const w = 600;
  const step = w / stitches;
  const d = `M0 14 ${Array.from({ length: stitches }, (_, i) =>
    `Q ${step * i + step / 2} ${i % 2 ? 22 : 6} ${step * (i + 1)} 14`).join(' ')}`;

  return (
    <svg ref={ref} className={`${styles.suture} ${className}`} viewBox={`0 0 ${w} 28`} preserveAspectRatio="none" aria-hidden="true">
      <path className={styles.thread} pathLength={1} d={d} />
      {Array.from({ length: stitches }, (_, i) => {
        const x = step * i + step / 2;
        return (
          <g key={i} className={styles.stitch} style={{ '--i': i } as React.CSSProperties}>
            <line x1={x - 5} y1={6} x2={x + 5} y2={22} />
            <line x1={x + 5} y1={6} x2={x - 5} y2={22} />
          </g>
        );
      })}
    </svg>
  );
}
