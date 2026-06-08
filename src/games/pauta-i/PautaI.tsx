import { useMemo, useState } from 'react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { ContinueButton } from '../../components/ContinueButton';
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

const keyOf = (p: StaffPosition) => `${p.kind}-${p.index}` as const;

export function PautaI({ onExit }: { onExit: () => void }) {
  const progress = useGameProgress('pauta-i', ROUNDS);
  const { t } = useI18n();
  const { settings } = useSettings();
  const q = useMemo(makeQuestion, [progress.round]);
  const [picked, setPicked] = useState<StaffPosition | null>(null);

  const finishRound = (answer: StaffPosition) => {
    progress.submit(keyOf(answer) === keyOf(q.target));
    setPicked(null);
  };

  const onPick = (val: string) => {
    if (picked) return;
    const found = q.choices.find(c => keyOf(c) === val);
    if (!found) return;
    setPicked(found);
    if (settings.advanceMode === 'auto') {
      window.setTimeout(() => finishRound(found), 900);
    }
  };

  const labelFor = (p: StaffPosition) =>
    `${p.kind === 'line' ? t('common.line') : t('common.space')} ${p.index}`;

  return (
    <GameShell title={t('games.pauta-i')} onExit={onExit} progress={progress}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-muted)', marginBottom: 14 }}>{t('prompts.pauta-i')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Staff noteVexKey={q.target.vexKey} />
        </div>
        <AnswerBank
          choices={q.choices.map(c => ({ value: keyOf(c), label: labelFor(c) }))}
          onPick={onPick}
          disabled={!!picked}
          lastPick={picked ? keyOf(picked) : undefined}
          correctValue={keyOf(q.target)}
        />
        {picked && (
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
        {picked && settings.advanceMode === 'manual' && (
          <ContinueButton onClick={() => finishRound(picked)} />
        )}
      </div>
    </GameShell>
  );
}
