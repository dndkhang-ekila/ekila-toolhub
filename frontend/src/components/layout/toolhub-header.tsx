import Link from "next/link";
import styles from "./toolhub-header.module.css";

export function ToolHubHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="ToolHub">
        Tool<span>Hub</span>
        <span className={styles.brandDot} />
      </Link>
    </header>
  );
}
