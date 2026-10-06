import { useMemo } from 'react';
import { useQuizRound, type RoundReview } from '../../hooks/useQuizRound';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { fretsForVexKey } from '../../music/guitar';
import { TREBLE_POSITIONS, pickRandom, shuffle, type StaffPosition } from '../../music/theory';
import { noteLabel } from '../../music/notes';

const ROUNDS = 10;
const CHOICES = 4;

function makeQuestion() {
  const target = pickRandom(TREBLE_POSITIONS);
  const distractors = shuffle(
    TREBLE_POSITIONS.filter(p => !(p.kind === target.kind && p.index === target.index)),
  ).slice(0, CHOICES - 1);
  const choices = shuffle([target, ...distractors]);
  return { target, choices };
}

const keyOf = (p: StaffPosition) => `${p.kind}-${p.index}`;

export function PautaI({ onExit }: { onExit: () => void }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const labelFor = (p: StaffPosition) =>
    `${p.kind === 'line' ? t('common.line') : t('common.space')} ${p.index}`;
  const quiz = useQuizRound<string>('pauta-i', ROUNDS, {
    itemId: (): string => q.target.vexKey,
    review: (picked): RoundReview => ({
      prompt: t('prompts.pauta-i'),
      correct: labelFor(q.target),
      given: picked === undefined ? undefined : labelFor(q.choices.find(c => keyOf(c) === picked)!),
    }),
  });
  const q = useMemo(makeQuestion, [quiz.progress.round]);

  return (
    <GameShell title={t('games.pauta-i')} onExit={onExit} quiz={quiz} feedback={
      <div className="feedback-visual">
        <p className="feedback-caption">{noteLabel(q.target.letter, settings.notation, settings.language)} — {t('common.fretboard')}</p>
        <Fretboard positions={fretsForVexKey(q.target.vexKey).slice(0, 1)} />
      </div>
    }>
      <div className="question">
        <p className="question-prompt">{t('prompts.pauta-i')}</p>
        <div className="question-visual"><Staff noteVexKey={q.target.vexKey} /></div>
        <AnswerBank
          choices={q.choices.map(c => ({ value: keyOf(c), label: labelFor(c) }))}
          onPick={value => quiz.pick(value, value === keyOf(q.target))}
          disabled={quiz.answered}
          lastPick={quiz.picked}
          correctValue={keyOf(q.target)}
          reveal={quiz.expired}
        />
      </div>
    </GameShell>
  );
}
