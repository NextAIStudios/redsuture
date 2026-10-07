import { LayersIcon } from './icons';
import styles from './logo.module.css';

export default function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <span className={styles.logo}>
      <span className={styles.mark}>
        <LayersIcon size={18} />
      </span>
      {showText && <span className={styles.text}>RedSuture</span>}
    </span>
  );
}
