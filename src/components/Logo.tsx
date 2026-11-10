/**
 * Marca Equilibra: uma bola dividida em duas metades iguais, que representa
 * dois times equilibrados formados a partir do mesmo grupo.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <g fill="var(--accent-fg)">
        <path d="M14.8 7.08A9 9 0 0 0 14.8 24.92Z" />
        <path d="M17.2 7.08A9 9 0 0 1 17.2 24.92Z" />
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={26} />
      <span className="text-[15px] font-semibold tracking-tight text-fg">Equilibra</span>
    </span>
  );
}
