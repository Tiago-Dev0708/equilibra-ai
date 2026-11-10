import { IconCheck } from './icons/ui';

/** Indicador visual de seleção (o elemento interativo é o pai). */
export default function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
        checked ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface'
      }`}
    >
      {checked && <IconCheck size={12} strokeWidth={3} />}
    </span>
  );
}
