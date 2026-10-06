import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { naturalAt, pitchClassAt, STRING_COUNT, type FretPosition } from '../music/guitar';
import { pitchClassLabel, shortPitchClassLabel } from '../music/notes';
import { useSettings } from '../SettingsContext';
import { Fretboard, type FretMarker } from './Fretboard';
import { PositionNotation } from './PositionNotation';

const FRETS = 12;

function allPositions(): FretPosition[] {
  return Array.from({ length: STRING_COUNT }, (_, string) =>
    Array.from({ length: FRETS + 1 }, (_, fret) => ({ string, fret }))).flat();
}

// Free exploration: select any position to see its name, tab and written note,
// optionally with every natural note or every repeat of the selected note.
export function FretboardExplorer({ initial }: { initial?: FretPosition }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const [selected, setSelected] = useState<FretPosition | null>(initial ?? null);
  const [showNaturals, setShowNaturals] = useState(false);
  const [showSame, setShowSame] = useState(false);
  const short = (p: FretPosition) => shortPitchClassLabel(pitchClassAt(p), settings.notation, settings.language);

  const markers: FretMarker[] = [];
  if (showNaturals) {
    for (const p of allPositions()) {
      if (naturalAt(p)) markers.push({ ...p, label: short(p), tone: 'plain' });
    }
  }
  if (showSame && selected) {
    for (const p of allPositions()) {
      if (pitchClassAt(p) === pitchClassAt(selected)) markers.push({ ...p, label: short(p), tone: 'root' });
    }
  }
  if (selected) markers.push({ ...selected, label: short(selected), tone: 'accent' });

  const toggle = (label: string, pressed: boolean, onClick: () => void) => (
    <button type="button" className="toggle-chip" aria-pressed={pressed} onClick={onClick}>{label}</button>
  );

  return (
    <div className="explorer">
      <div className="explorer-toggles">
        {toggle(t('explorer.naturals'), showNaturals, () => setShowNaturals(v => !v))}
        {toggle(t('explorer.same'), showSame, () => setShowSame(v => !v))}
      </div>
      <Fretboard
        frets={FRETS}
        markers={markers}
        stringLabels="both"
        showFretNumbers
        onSelect={setSelected}
      />
      <div className="explorer-readout" aria-live="polite">
        {selected ? (
          <>
            <strong>{pitchClassLabel(pitchClassAt(selected), settings.notation, settings.language)}</strong>
            {selected.fret === 0
              ? t('explorer.openPosition', { string: selected.string + 1 })
              : t('explorer.position', { string: selected.string + 1, fret: selected.fret })}
            {!naturalAt(selected) && <> · {t('explorer.accidental')}</>}
          </>
        ) : <p className="explorer-hint">{t('explorer.hint')}</p>}
      </div>
      {selected && <PositionNotation position={selected} />}
    </div>
  );
}
