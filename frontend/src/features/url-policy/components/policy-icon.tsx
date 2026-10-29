type IconName =
  "link" | "block" | "close" | "refresh" | "info" | "check" | "arrow";

export function PolicyIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    link: (
      <>
        <path
          d="m10 13 4-4M8 16l-1 1a4.24 4.24 0 0 1-6-6l5-5a4.24 4.24 0 0 1 6 0M16 8l1-1a4.24 4.24 0 0 1 6 6l-5 5a4.24 4.24 0 0 1-6 0"
          transform="translate(0 -1)"
        />
      </>
    ),
    block: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m5.6 5.6 12.8 12.8" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6.1 6a8 8 0 0 1 13.5 4M4.4 14A8 8 0 0 0 17.9 18" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    arrow: <path d="m10 6 6 6-6 6M4 12h12" />,
  };
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
