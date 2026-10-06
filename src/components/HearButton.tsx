import { playNotes } from '../audio/sound';
import { useI18n } from '../hooks/useI18n';

// Plays sounding pitches (MIDI numbers) one after another, e.g. the two notes of an interval.
export function HearButton({ notes, spacing = 0.6, label }: { notes: number[]; spacing?: number; label?: string }) {
  const { t } = useI18n();
  return (
    <button type="button" className="hear-button" onClick={() => playNotes(notes, { spacing })}>
      <span aria-hidden="true">▶</span> {label ?? t('lesson.listen')}
    </button>
  );
}
