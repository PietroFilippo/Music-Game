import { useMemo } from 'react';
import { useQuizRound, type RoundReview } from '../../hooks/useQuizRound';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { PositionNotation } from '../../components/PositionNotation';
import { fretsForVexKey } from '../../music/guitar';
import { TREBLE_POSITIONS, pickRandom, shuffle } from '../../music/theory';
import { noteLabel, type LetterNote } from '../../music/notes';

const ROUNDS = 10;

const GAB_POSITIONS = TREBLE_POSITIONS.filter(p =>
  ['g/4', 'a/4', 'b/4'].includes(p.vexKey),
);
const GAB_LETTERS: LetterNote[] = ['G', 'A', 'B'];

function makeQuestion() {
  const target = pickRandom(GAB_POSITIONS);
  const choices = shuffle(GAB_LETTERS);
  return { target, choices };
}

export function ClaveSol({ onExit }: { onExit: () => void }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const name = (l: LetterNote) => noteLabel(l, settings.notation, settings.language);
  const quiz = useQuizRound<LetterNote>('clave-sol', ROUNDS, {
    itemId: (): string => q.target.vexKey,
    review: (picked): RoundReview => ({ prompt: t('prompts.clave-sol'), correct: name(q.target.letter), given: picked && name(picked) }),
  });
  const q = useMemo(makeQuestion, [quiz.progress.round]);
  const position = fretsForVexKey(q.target.vexKey)[0];

  return (
    <GameShell title={t('games.clave-sol')} onExit={onExit} quiz={quiz} feedback={
      <div className="feedback-visual">
        <p className="feedback-caption">{name(q.target.letter)} — {t('common.fretboard')}</p>
        <Fretboard positions={[position]} />
        <PositionNotation position={position} />
      </div>
    }>
      <div className="question">
        <p className="question-prompt">{t('prompts.clave-sol')}</p>
        <div className="question-visual"><Staff noteVexKey={q.target.vexKey} /></div>
        <AnswerBank
          choices={q.choices.map(l => ({ value: l, label: name(l) }))}
          onPick={value => quiz.pick(value, value === q.target.letter)}
          disabled={quiz.answered}
          lastPick={quiz.picked}
          correctValue={q.target.letter}
          reveal={quiz.expired}
        />
      </div>
    </GameShell>
  );
}
