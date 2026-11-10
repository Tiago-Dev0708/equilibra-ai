import type { ReactNode, SVGProps } from 'react';

/*
 * Ícones das modalidades. Grade de 24px, traço arredondado em currentColor,
 * mesmo estilo dos ícones de interface (./ui.tsx).
 */

const r2 = (n: number) => Math.round(n * 100) / 100;

function polar(cx: number, cy: number, deg: number, radius: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [r2(cx + radius * Math.cos(rad)), r2(cy + radius * Math.sin(rad))];
}

/** Bola de futebol: pentágono central preenchido e costuras radiais. */
function soccerBall(cx: number, cy: number, r: number): ReactNode {
  const inner = r * 0.37;
  const angles = [-90, -18, 54, 126, 198];
  const pentagon = angles.map((a) => polar(cx, cy, a, inner).join(' ')).join('L');
  const seams = angles
    .map((a) => `M${polar(cx, cy, a, inner).join(' ')}L${polar(cx, cy, a, r).join(' ')}`)
    .join('');
  return (
    <>
      <circle cx={cx} cy={cy} r={r} />
      <path d={`M${pentagon}Z`} fill="currentColor" />
      <path d={seams} />
    </>
  );
}

/**
 * Bola de vôlei: três costuras principais em espiral (arcos de raio r
 * centrados na borda) e três costuras secundárias formando os gomos.
 */
function volleyBall(cx: number, cy: number, r: number): ReactNode {
  const seams: string[] = [];
  for (const theta of [-90, 30, 150]) {
    const [qx, qy] = polar(cx, cy, theta + 60, r);
    seams.push(`M${cx} ${cy}A${r} ${r} 0 0 0 ${qx} ${qy}`);

    const [px, py] = polar(cx, cy, theta, r);
    const rr = r * 0.6;
    const a = (rr * rr) / (2 * r);
    const h = Math.sqrt(rr * rr - a * a);
    const ux = (cx - px) / r;
    const uy = (cy - py) / r;
    const mx = px + a * ux;
    const my = py + a * uy;
    seams.push(
      `M${r2(mx - h * uy)} ${r2(my + h * ux)}A${r2(rr)} ${r2(rr)} 0 0 0 ${r2(mx + h * uy)} ${r2(my - h * ux)}`
    );
  }
  return (
    <>
      <circle cx={cx} cy={cy} r={r} />
      {seams.map((d) => (
        <path key={d} d={d} />
      ))}
    </>
  );
}

const GLYPHS: Record<string, ReactNode> = {
  // Bola de futebol
  society: soccerBall(12, 12, 9),

  // Chuteira de futsal (tênis)
  futsal: (
    <>
      <path d="M3 7.5h5.2l1.6 2.6a3 3 0 0 0 1.9 1.3l5.4 1.3A3.5 3.5 0 0 1 20 16v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M3 15h16.8" />
      <path d="M11.4 11.3l1.1-1.7M14.2 12l1.1-1.7" />
    </>
  ),

  // Campo visto de cima
  futebol: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M2.5 9h3v6h-3M21.5 9h-3v6h3" />
    </>
  ),

  // Bola de vôlei sobre a areia
  'volei-dupla': (
    <>
      {volleyBall(12, 9.5, 6.5)}
      <path d="M3 20c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2" />
    </>
  ),

  // Bola de vôlei
  'volei-quarteto': volleyBall(12, 12, 9),

  // Rede de vôlei com bola
  'volei-sexteto': (
    <>
      <path d="M3 21V9M21 21V9" />
      <path d="M3 10h18M3 15h18" />
      <path d="M7.5 10v5M12 10v5M16.5 10v5" />
      <circle cx="12" cy="4.5" r="2.5" />
    </>
  ),

  // Bola de basquete
  basquete: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
      <path d="M5.6 5.7c1.9 1.7 3.1 3.9 3.1 6.3s-1.2 4.6-3.1 6.3M18.4 5.7c-1.9 1.7-3.1 3.9-3.1 6.3s1.2 4.6 3.1 6.3" />
    </>
  ),

  // Tabela e cesta (meia quadra)
  'basquete-3x3': (
    <>
      <rect x="4" y="3" width="16" height="10" rx="1.5" />
      <path d="M9.5 13v-3.5h5V13" />
      <path d="M7 13h10" />
      <path d="M8.2 13l1.6 7.5h4.4l1.6-7.5" />
      <path d="M9.1 16.8h5.8M10.6 13l2.4 7.5M13.4 13L11 20.5" />
    </>
  ),

  // Raquete de beach tennis (furada) e bola
  'beach-tennis': (
    <>
      <ellipse cx="9.6" cy="9.6" rx="5.8" ry="6.8" transform="rotate(-45 9.6 9.6)" />
      <path d="M14.2 14.2l1.6 1.6" />
      <rect x="-1.3" y="0" width="2.6" height="5.6" rx="1.3" transform="translate(16.4 16.4) rotate(-45)" />
      <g fill="currentColor" stroke="none">
        <circle cx="9.6" cy="9.6" r=".8" />
        <circle cx="7.4" cy="7.4" r=".8" />
        <circle cx="11.8" cy="7.4" r=".8" />
        <circle cx="7.4" cy="11.8" r=".8" />
        <circle cx="11.8" cy="11.8" r=".8" />
      </g>
      <circle cx="19.5" cy="4.5" r="2" />
    </>
  ),

  // Jogador arremessando
  handebol: (
    <>
      <circle cx="9" cy="4.5" r="1.8" />
      <circle cx="18.5" cy="3.8" r="2" />
      <path d="M9.6 8l1.4 5.2" />
      <path d="M10 9.2l3.6-1.6 2.8-2.3" />
      <path d="M9.9 9.6l-3.4 2" />
      <path d="M11 13.2l-3.2 3.3.8 4.5M11 13.2l3.4 2.8-.4 5" />
    </>
  ),
};

interface SportIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  sportId: string;
  size?: number;
}

export default function SportIcon({ sportId, size = 20, strokeWidth = 1.6, ...props }: SportIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {GLYPHS[sportId] ?? <circle cx="12" cy="12" r="9" />}
    </svg>
  );
}
