import { useSettings } from '../../SettingsContext';
import { FretboardQuiz } from '../fretboard/FretboardQuiz';
import { createQuestionDeck, type ModuleThreeId } from './questions';

export function ModuleThreeGame({ id, onExit }: { id: ModuleThreeId; onExit: () => void }) {
  const { settings } = useSettings();
  return <FretboardQuiz gameId={id} onExit={onExit}
    createDeck={() => createQuestionDeck(id, settings.language, settings.notation)} />;
}
