'use client';

import { useRef } from 'react';
import styles from './integrationBeams.module.css';
import { AnimatedBeam } from './AnimatedBeam';
import { LayersIcon } from './icons';
import {
  GitHubBrand, GitLabBrand, BitbucketBrand, SlackBrand, TeamsBrand, JiraBrand,
  LinearBrand, AwsBrand, VercelBrand, SupabaseBrand, CloudflareBrand, GoogleCloudBrand, RailwayBrand,
} from './brands';

// Every integration, as a faded grid in the background (masked to fade toward
// the middle) — and six brought forward as nodes on an animated-beam diagram
// with RedSuture at the hub. "We connect to all of this, and it all flows here."
const ALL = [
  { name: 'GitHub', Brand: GitHubBrand }, { name: 'GitLab', Brand: GitLabBrand }, { name: 'Bitbucket', Brand: BitbucketBrand },
  { name: 'Jira', Brand: JiraBrand }, { name: 'Linear', Brand: LinearBrand },
  { name: 'Slack', Brand: SlackBrand }, { name: 'Microsoft Teams', Brand: TeamsBrand },
  { name: 'AWS', Brand: AwsBrand }, { name: 'Vercel', Brand: VercelBrand }, { name: 'Supabase', Brand: SupabaseBrand },
  { name: 'Cloudflare', Brand: CloudflareBrand }, { name: 'Google Cloud', Brand: GoogleCloudBrand }, { name: 'Railway', Brand: RailwayBrand },
];

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
      <div className={styles.grid}>
        {ALL.map(({ name, Brand }) => (
          <div key={name} className={styles.gridCell}>
            <span className={styles.gridMark}><Brand /></span>
            <span className={styles.gridName}>{name}</span>
          </div>
        ))}
      </div>
      <div className={styles.vignette} />

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
          <div ref={r3} className={styles.node}><LinearBrand /></div>
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
