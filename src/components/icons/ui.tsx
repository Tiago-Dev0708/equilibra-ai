import type { ReactNode, SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number };

function icon(children: ReactNode, displayName: string) {
  function Icon({ size = 16, strokeWidth = 1.75, ...props }: IconProps) {
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
        {children}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const IconSearch = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
  'IconSearch'
);

export const IconPlus = icon(<path d="M12 5v14M5 12h14" />, 'IconPlus');

export const IconPencil = icon(
  <>
    <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" />
    <path d="m13.5 6.5 3 3" />
  </>,
  'IconPencil'
);

export const IconTrash = icon(
  <>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M5.5 7l.9 12.1A2 2 0 0 0 8.4 21h7.2a2 2 0 0 0 2-1.9L18.5 7" />
    <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
  </>,
  'IconTrash'
);

export const IconCheck = icon(<path d="m5 12.5 4.5 4.5L19 7.5" />, 'IconCheck');

export const IconX = icon(<path d="M18 6 6 18M6 6l12 12" />, 'IconX');

export const IconChevronDown = icon(<path d="m6 9 6 6 6-6" />, 'IconChevronDown');

export const IconCopy = icon(
  <>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
  </>,
  'IconCopy'
);

export const IconShuffle = icon(
  <>
    <path d="M16 3.5h4.5V8" />
    <path d="M3.5 20 20.5 3.5" />
    <path d="M20.5 16v4.5H16" />
    <path d="m14.5 14.5 6 6" />
    <path d="M3.5 4l5 5" />
  </>,
  'IconShuffle'
);

export const IconClipboard = icon(
  <>
    <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
    <path d="M9 3h6v3H9z" />
    <path d="M9 11h6M9 15h4" />
  </>,
  'IconClipboard'
);

export const IconUpload = icon(
  <>
    <path d="M12 15V4" />
    <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
    <path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />
  </>,
  'IconUpload'
);

export const IconDownload = icon(
  <>
    <path d="M12 4v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />
  </>,
  'IconDownload'
);

export const IconArrowsRightLeft = icon(
  <>
    <path d="m16 3.5 4 4-4 4" />
    <path d="M20 7.5H4" />
    <path d="m8 20.5-4-4 4-4" />
    <path d="M4 16.5h16" />
  </>,
  'IconArrowsRightLeft'
);

export const IconUsers = icon(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6" />
    <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </>,
  'IconUsers'
);
