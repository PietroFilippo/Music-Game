import { useMemo } from 'react';
import { useQuizRound } from '../../hooks/useQuizRound';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { ContinueButton } from '../../components/ContinueButton';
import { TimerBar } from '../../components/TimerBar';
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
  const quiz = useQuizRound<string>('pauta-i', ROUNDS, { itemId: (): string => q.target.vexKey });
  const { t } = useI18n();
  const { settings } = useSettings();
  const q = useMemo(makeQuestion, [quiz.progress.round]);

  const labelFor = (p: StaffPosition) =>
    `${p.kind === 'line' ? t('common.line') : t('common.space')} ${p.index}`;

  return (
    <GameShell title={t('games.pauta-i')} onExit={onExit} progress={quiz.progress}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-muted)', marginBottom: 14 }}>{t('prompts.pauta-i')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Staff noteVexKey={q.target.vexKey} />
        </div>
        {quiz.timed && <TimerBar fraction={quiz.timerFraction} />}
        <AnswerBank
          choices={q.choices.map(c => ({ value: keyOf(c), label: labelFor(c) }))}
          onPick={value => quiz.pick(value, value === keyOf(q.target))}
          disabled={quiz.answered}
          lastPick={quiz.picked}
          correctValue={keyOf(q.target)}
          reveal={quiz.expired}
        />
        {quiz.answered && (
          <div style={{ marginTop: 28 }}>
            <div
              style={{
                color: 'var(--fg-muted)',
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {noteLabel(q.target.letter, settings.notation, settings.language)} — {t('common.fretboard')}
            </div>
            <Fretboard positions={fretsForVexKey(q.target.vexKey).slice(0, 1)} />
          </div>
        )}
        {quiz.needsContinue && <ContinueButton onClick={quiz.next} />}
      </div>
    </GameShell>
  );
}
