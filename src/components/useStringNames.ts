import { OPEN_STRING_LETTERS } from '../music/guitar';
import { shortNoteLabel } from '../music/notes';
import { useSettings } from '../SettingsContext';

/** Open-string names from string 1 to 6, in the chosen notation (E B G D A E, or Mi Si Sol Ré Lá Mi). */
export function useStringNames(): string[] {
  const { settings } = useSettings();
  return OPEN_STRING_LETTERS.map(letter => shortNoteLabel(letter, settings.notation, settings.language));
}
