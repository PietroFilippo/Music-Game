import { useMemo } from 'react';
import { useQuizRound } from '../../hooks/useQuizRound';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { ContinueButton } from '../../components/ContinueButton';
import { TimerBar } from '../../components/TimerBar';
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
  const quiz = useQuizRound<LetterNote>('claves', ROUNDS, { itemId: (): string => q.clef.id });
  const { t } = useI18n();
  const { settings } = useSettings();
  const q = useMemo(makeQuestion, [quiz.progress.round]);

  return (
    <GameShell title={t('games.claves')} onExit={onExit} progress={quiz.progress}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-muted)', marginBottom: 14 }}>{t('prompts.claves')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Staff clef={q.clef.vexClef} />
        </div>
        {quiz.timed && <TimerBar fraction={quiz.timerFraction} />}
        <AnswerBank
          choices={q.choices.map(l => ({
            value: l,
            label: noteLabel(l, settings.notation, settings.language),
          }))}
          onPick={value => quiz.pick(value, value === q.clef.anchorLetter)}
          disabled={quiz.answered}
          lastPick={quiz.picked}
          correctValue={q.clef.anchorLetter}
          reveal={quiz.expired}
        />
        {quiz.needsContinue && <ContinueButton onClick={quiz.next} />}
      </div>
    </GameShell>
  );
}
