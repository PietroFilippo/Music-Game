import { useSettings } from '../../SettingsContext';
import { FretboardQuiz } from '../fretboard/FretboardQuiz';
import { createQuestionDeck, type ModuleFourId } from './questions';

export function ModuleFourGame({ id, onExit }: { id: ModuleFourId; onExit: () => void }) {
  const { settings } = useSettings();
  return <FretboardQuiz gameId={id} onExit={onExit}
    createDeck={() => createQuestionDeck(id, settings.language, settings.notation)} />;
}
