import { COURSE_MODULES } from '../curriculum';
import { DeckQuiz, type RoundRenderers } from '../games/DeckQuiz';
import { fretboardRound } from '../games/fretboard/FretboardQuiz';
import { readingRound } from '../games/module-one/ModuleOneGame';
import { useI18n } from '../hooks/useI18n';
import { useSettings } from '../SettingsContext';
import { buildReviewDeck } from './session';

// One renderer per registry family; each round of a review uses its own.
const RENDERERS: Required<RoundRenderers> = { reading: readingRound, fretboard: fretboardRound };

/** Up to ten due questions from one module's topics, unscored. */
export function ReviewSession({ moduleId, onExit }: { moduleId: string; onExit: () => void }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const module = COURSE_MODULES.find(m => m.id === moduleId);
  return (
    <DeckQuiz title={t('review.title', { n: module?.number ?? '' })} scoreAs={null} renderers={RENDERERS} showTopic onExit={onExit}
      createDeck={() => buildReviewDeck(module?.games ?? [], settings.language, settings.notation)} />
  );
}
