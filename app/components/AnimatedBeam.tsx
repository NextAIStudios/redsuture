'use client';

// Adapted from the Magic UI "Animated Beam" to this codebase: CSS Modules
// instead of Tailwind, and SMIL for the travelling gradient instead of
// framer-motion — so no new dependencies and it fits our stack. The path is
// still measured from live element rects so it tracks the layout.

import { RefObject, useEffect, useId, useState } from 'react';
import styles from './animatedBeam.module.css';

export interface AnimatedBeamProps {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 5,
  delay = 0,
  pathColor = 'rgba(244, 239, 234, 0.1)',
  pathWidth = 2,
  pathOpacity = 1,
  gradientStartColor = '#ff5148',
  gradientStopColor = '#e5383b',
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const id = useId();
  const [pathD, setPathD] = useState('');
  const [svg, setSvg] = useState({ width: 0, height: 0 });
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setAnimate(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return;
      const c = containerRef.current.getBoundingClientRect();
      const a = fromRef.current.getBoundingClientRect();
      const b = toRef.current.getBoundingClientRect();
      setSvg({ width: c.width, height: c.height });
      const sx = a.left - c.left + a.width / 2 + startXOffset;
      const sy = a.top - c.top + a.height / 2 + startYOffset;
      const ex = b.left - c.left + b.width / 2 + endXOffset;
      const ey = b.top - c.top + b.height / 2 + endYOffset;
      const cy = sy - curvature;
      setPathD(`M ${sx},${sy} Q ${(sx + ex) / 2},${cy} ${ex},${ey}`);
    };
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    update();
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  return (
    <svg
      className={styles.beam}
      width={svg.width}
      height={svg.height}
      viewBox={`0 0 ${svg.width} ${svg.height}`}
      fill="none"
      aria-hidden="true"
    >
      <path d={pathD} stroke={pathColor} strokeWidth={pathWidth} strokeOpacity={pathOpacity} strokeLinecap="round" />
      <path d={pathD} stroke={`url(#${id})`} strokeWidth={pathWidth} strokeLinecap="round" />
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0%" x2="0%" y1="0%" y2="0%">
          {animate && (
            <>
              <animate attributeName="x1" dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" values={reverse ? '90%;-10%' : '10%;110%'} />
              <animate attributeName="x2" dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" values={reverse ? '100%;0%' : '0%;100%'} />
            </>
          )}
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
