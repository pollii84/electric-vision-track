'use client';

import versionInfo from '../../version.json';

/**
 * A subtle version badge that displays the current app version.
 * Designed to sit at the bottom of the sidebar.
 */
export default function VersionBadge() {
  return (
    <div
      style={{
        padding: '6px 12px',
        fontSize: 'var(--fs-xs, 11px)',
        color: 'var(--clr-text-muted, #888)',
        textAlign: 'center',
        opacity: 0.6,
        userSelect: 'none',
        letterSpacing: '0.02em',
      }}
      title={`Build: ${versionInfo.buildDate}`}
    >
      v{versionInfo.version}
    </div>
  );
}
