import type { SVGProps } from "react";

export function AuthIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & {
  name:
    | "lock"
    | "mail"
    | "check"
    | "clock"
    | "shield"
    | "arrow"
    | "eye"
    | "eye-off";
}) {
  const paths = {
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 4-5 8-8 9-3-1-8-5-8-9V6l8-3Z" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </>
    ),
    arrow: <path d="m10 6-6 6 6 6M4 12h16" />,
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    "eye-off": (
      <>
        <path d="m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.8M6.1 6.1A20 20 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5-1.1M10 10a3 3 0 0 0 4 4" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
