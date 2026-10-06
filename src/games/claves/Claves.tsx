import { useMemo } from 'react';
import { useQuizRound, type RoundReview } from '../../hooks/useQuizRound';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { CLEFS, pickRandom, shuffle } from '../../music/theory';
import { noteLabel, type LetterNote } from '../../music/notes';

const ROUNDS = 10;

function makeQuestion() {
  const target = pickRandom(CLEFS);
  const others = CLEFS.filter(c => c.anchorLetter !== target.anchorLetter).map(c => c.anchorLetter);
  const choices = shuffle([target.anchorLetter, ...others]);
  return { clef: target, choices };
}

export function Claves({ onExit }: { onExit: () => void }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const name = (l: LetterNote) => noteLabel(l, settings.notation, settings.language);
  const quiz = useQuizRound<LetterNote>('claves', ROUNDS, {
    itemId: (): string => q.clef.id,
    review: (picked): RoundReview => ({
      prompt: `${t('prompts.claves')} (${t(`clef.${q.clef.id}`)})`,
      correct: name(q.clef.anchorLetter),
      given: picked && name(picked),
    }),
  });
  const q = useMemo(makeQuestion, [quiz.progress.round]);

  return (
    <GameShell title={t('games.claves')} onExit={onExit} quiz={quiz}
      feedback={<p className="feedback-explanation">{t(`clef.${q.clef.id}.anchor`)}</p>}>
      <div className="question">
        <p className="question-prompt">{t('prompts.claves')}</p>
        <div className="question-visual"><Staff clef={q.clef.vexClef} /></div>
        <AnswerBank
          choices={q.choices.map(l => ({ value: l, label: name(l) }))}
          onPick={value => quiz.pick(value, value === q.clef.anchorLetter)}
          disabled={quiz.answered}
          lastPick={quiz.picked}
          correctValue={q.clef.anchorLetter}
          reveal={quiz.expired}
        />
      </div>
    </GameShell>
  );
}
