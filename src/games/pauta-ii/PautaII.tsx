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
  const progress = useGameProgress('pauta-ii', ROUNDS);
  const { t } = useI18n();
  const { settings } = useSettings();
  const q = useMemo(makeQuestion, [progress.round]);
  const [picked, setPicked] = useState<LetterNote | null>(null);

  const finishRound = (answer: LetterNote) => {
    progress.submit(answer === q.target.letter);
    setPicked(null);
  };

  const onPick = (val: LetterNote) => {
    if (picked) return;
    setPicked(val);
    if (settings.advanceMode === 'auto') {
      window.setTimeout(() => finishRound(val), 900);
    }
  };

  const promptKey = q.direction === 'up' ? 'prompts.pauta-ii.up' : 'prompts.pauta-ii.down';

  return (
    <GameShell title={t('games.pauta-ii')} onExit={onExit} progress={progress}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-muted)', marginBottom: 14 }}>
          {t(promptKey, { n: q.offset })}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <Staff noteVexKey={q.start.vexKey} />
        </div>
        <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 22 }}>
          {t('common.round') /* reuse */}:{' '}
          {noteLabel(q.start.letter, settings.notation, settings.language)}
        </p>
        <AnswerBank
          choices={q.choices.map(l => ({
            value: l,
            label: noteLabel(l, settings.notation, settings.language),
          }))}
          onPick={onPick}
          disabled={!!picked}
          lastPick={picked ?? undefined}
          correctValue={q.target.letter}
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
