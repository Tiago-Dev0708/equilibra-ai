'use client';

import { POSITION_LABEL, VOLLEY_POSITIONS, VolleyPosition } from '@/lib/positions';

interface PositionSelectProps {
  value: VolleyPosition | undefined;
  onChange: (position: VolleyPosition | undefined) => void;
  id?: string;
  label?: string;
  className?: string;
}

export default function PositionSelect({ value, onChange, id, label, className = '' }: PositionSelectProps) {
  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || undefined) as VolleyPosition | undefined)}
      aria-label={label}
      className={`select ${value ? 'text-fg' : 'text-faint'} ${className}`}
    >
      <option value="">Sem posição</option>
      {VOLLEY_POSITIONS.map((p) => (
        <option key={p} value={p}>
          {POSITION_LABEL[p]}
        </option>
      ))}
    </select>
  );
}
