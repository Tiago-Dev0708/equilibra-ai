import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Ícone para "Adicionar à tela de início" no iOS. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#15803d',
        }}
      >
        <svg width="112" height="112" viewBox="7 7 18 18">
          <path d="M14.8 7.08A9 9 0 0 0 14.8 24.92Z" fill="#ffffff" />
          <path d="M17.2 7.08A9 9 0 0 1 17.2 24.92Z" fill="#ffffff" />
        </svg>
      </div>
    ),
    size
  );
}
