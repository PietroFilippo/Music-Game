import { LETTERS, noteLabel, type LetterNote } from '../music/notes';
import type { Language, Notation } from '../types';

interface Props {
  highlighted?: LetterNote;
  showLabels?: boolean;
  language: Language;
  notation: Notation;
}

export function Keyboard({ highlighted, showLabels = false, language, notation }: Props) {
  const label = language === 'pt' ? 'Teclado: grupos de duas e três teclas pretas' : 'Keyboard: groups of two and three black keys';
  return (
    <svg viewBox="0 0 420 190" role="img" aria-label={label} style={{ width: '100%', maxWidth: 480 }}>
      {LETTERS.map((letter, i) => (
        <g key={letter}>
          <rect x={i * 60 + 1} y={1} width={58} height={180} rx={4}
            fill={highlighted === letter ? 'var(--accent)' : '#fafafa'} stroke="#555" />
          {highlighted === letter && <circle cx={i * 60 + 30} cy={130} r={8} fill="#14532d" />}
          {showLabels && <text x={i * 60 + 30} y={164} textAnchor="middle" fill="#222" fontSize={notation === 'both' ? 11 : 16}>
            {noteLabel(letter, notation, language)}
          </text>}
        </g>
      ))}
      {[1, 2, 4, 5, 6].map(boundary => (
        <rect key={boundary} x={boundary * 60 - 18} y={1} width={36} height={106} rx={3} fill="#242424" stroke="#111" />
      ))}
    </svg>
  );
}
