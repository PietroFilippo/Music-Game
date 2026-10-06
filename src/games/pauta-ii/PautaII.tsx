import { useMemo } from 'react';
import { useQuizRound, type RoundReview } from '../../hooks/useQuizRound';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { fretsForVexKey } from '../../music/guitar';
import { TREBLE_POSITIONS, pickRandom, shuffle } from '../../music/theory';
import { noteLabel, LETTERS, type LetterNote } from '../../music/notes';

const ROUNDS = 10;
const CHOICES = 4;

function makeQuestion() {
  const offset = 1 + Math.floor(Math.random() * 4);
  const direction = Math.random() < 0.5 ? 'up' : ('down' as const);
  const valid = TREBLE_POSITIONS.map((_, i) => i).filter(i => {
    const tgt = direction === 'up' ? i + offset : i - offset;
    return tgt >= 0 && tgt < TREBLE_POSITIONS.length;
  });
  const startIdx = pickRandom(valid);
  const targetIdx = direction === 'up' ? startIdx + offset : startIdx - offset;
  const start = TREBLE_POSITIONS[startIdx];
  const target = TREBLE_POSITIONS[targetIdx];
  const distractors = shuffle(LETTERS.filter(l => l !== target.letter)).slice(0, CHOICES - 1);
  const choices = shuffle([target.letter, ...distractors]);
  return { start, target, offset, direction, choices };
}

export function PautaII({ onExit }: { onExit: () => void }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const name = (l: LetterNote) => noteLabel(l, settings.notation, settings.language);
  const ask = (): string => t(q.direction === 'up' ? 'prompts.pauta-ii.up' : 'prompts.pauta-ii.down', { n: q.offset });
  const quiz = useQuizRound<LetterNote>('pauta-ii', ROUNDS, {
    itemId: (): string => `${q.start.vexKey}:${q.direction}${q.offset}`,
    review: (picked): RoundReview => ({
      prompt: `${ask()} ${t('common.startNote')}: ${name(q.start.letter)}`,
      correct: name(q.target.letter),
      given: picked && name(picked),
    }),
  });
  const q = useMemo(makeQuestion, [quiz.progress.round]);

  return (
    <GameShell title={t('games.pauta-ii')} onExit={onExit} quiz={quiz} feedback={
      <div className="feedback-visual">
        <p className="feedback-caption">{name(q.target.letter)} — {t('common.fretboard')}</p>
        <Fretboard positions={fretsForVexKey(q.target.vexKey).slice(0, 1)} />
      </div>
    }>
      <div className="question">
        <p className="question-prompt">{ask()}</p>
        <div className="question-visual"><Staff noteVexKey={q.start.vexKey} /></div>
        <p className="question-hint">{t('common.startNote')}: <b>{name(q.start.letter)}</b></p>
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
