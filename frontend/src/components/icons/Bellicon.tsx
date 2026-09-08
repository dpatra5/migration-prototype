// Based on JJ_Icon_Bell_RGB.svg, recolored to use currentColor for theming.
export function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 32 32"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.04,19v-5.47c0-3.6-2.39-6.64-5.68-7.65V5.35C18.36,4.05,17.31,3,16,3s-2.36,1.05-2.36,2.35v0.53
	c-3.29,1-5.68,4.05-5.68,7.65V19c0,0-3.5,2-3.96,5.98L5.02,26h7.96c0,1.66,1.35,3,3.02,3s3.02-1.34,3.02-3h7.96L28,24.98
	C27.54,21,24.04,19,24.04,19z M24.56,24.03c-0.02,0-17.09,0-17.11,0c-0.81,0-0.94-0.52-0.63-1.18c0.52-1.11,3.12-2.86,3.12-2.86
	v-6.46c0-3.33,2.72-6.03,6.06-6.03c0,0,0,0,0,0c0,0,0,0,0,0c3.34,0,6.06,2.71,6.06,6.03v6.46c0,0,2.6,1.76,3.12,2.86
	C25.5,23.5,25.36,24.03,24.56,24.03z"
      />
    </svg>
  );
}
