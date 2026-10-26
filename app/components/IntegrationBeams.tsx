'use client';

import { useRef } from 'react';
import styles from './integrationBeams.module.css';
import { AnimatedBeam } from './AnimatedBeam';
import { LayersIcon } from './icons';
import { GitHubBrand, GitLabBrand, JiraBrand, SlackBrand, CloudflareBrand, VercelBrand } from './brands';

// RedSuture at the hub; a spread of integrations beaming in. The six nodes are
// a recognizable sample — the full list lives in the logo wall below.
export default function IntegrationBeams() {
  const container = useRef<HTMLDivElement>(null);
  const center = useRef<HTMLDivElement>(null);
  const l1 = useRef<HTMLDivElement>(null);
  const l2 = useRef<HTMLDivElement>(null);
  const l3 = useRef<HTMLDivElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const r3 = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.wrap} ref={container} aria-hidden="true">
      <div className={styles.rows}>
        <div className={styles.row}>
          <div ref={l1} className={styles.node}><GitHubBrand /></div>
          <div ref={r1} className={styles.node}><CloudflareBrand /></div>
        </div>
        <div className={styles.row}>
          <div ref={l2} className={styles.node}><JiraBrand /></div>
          <div ref={center} className={styles.center}><LayersIcon size={30} /></div>
          <div ref={r2} className={styles.node}><VercelBrand /></div>
        </div>
        <div className={styles.row}>
          <div ref={l3} className={styles.node}><SlackBrand /></div>
          <div ref={r3} className={styles.node}><GitLabBrand /></div>
        </div>
      </div>

      <AnimatedBeam containerRef={container} fromRef={l1} toRef={center} curvature={-70} endYOffset={-8} duration={4.5} />
      <AnimatedBeam containerRef={container} fromRef={l2} toRef={center} duration={5} delay={0.4} />
      <AnimatedBeam containerRef={container} fromRef={l3} toRef={center} curvature={70} endYOffset={8} duration={4.5} delay={0.8} />
      <AnimatedBeam containerRef={container} fromRef={r1} toRef={center} curvature={-70} endYOffset={-8} duration={4.5} delay={0.2} reverse />
      <AnimatedBeam containerRef={container} fromRef={r2} toRef={center} duration={5} delay={0.6} reverse />
      <AnimatedBeam containerRef={container} fromRef={r3} toRef={center} curvature={70} endYOffset={8} duration={4.5} delay={1} reverse />
    </div>
  );
}
