import { useSettings } from '../../SettingsContext';
import { FretboardQuiz } from '../fretboard/FretboardQuiz';
import { createQuestionDeck, type ModuleTwoId } from './questions';

export function ModuleTwoGame({ id, onExit }: { id: ModuleTwoId; onExit: () => void }) {
  const { settings } = useSettings();
  return <FretboardQuiz gameId={id} onExit={onExit}
    createDeck={() => createQuestionDeck(id, settings.language, settings.notation)} />;
}
