import { useMemo, useState } from 'react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { GuitarTab } from '../../components/GuitarTab';
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
  const progress = useGameProgress('clave-sol', ROUNDS);
  const { t } = useI18n();
  const { settings } = useSettings();
  const q = useMemo(makeQuestion, [progress.round]);
  const [picked, setPicked] = useState<LetterNote | null>(null);

  const onPick = (val: LetterNote) => {
    if (picked) return;
    setPicked(val);
    window.setTimeout(() => {
      progress.submit(val === q.target.letter);
      setPicked(null);
    }, 900);
  };

  const frets = fretsForVexKey(q.target.vexKey);

  return (
    <GameShell title={t('games.clave-sol')} onExit={onExit} progress={progress}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-muted)', marginBottom: 14 }}>{t('prompts.clave-sol')}</p>
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            alignItems: 'flex-start',
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          <Staff noteVexKey={q.target.vexKey} />
          {picked && frets.length > 0 && <GuitarTab positions={frets.slice(0, 1)} />}
        </div>
        <AnswerBank
          choices={q.choices.map(l => ({ value: l, label: noteLabel(l, settings.notation) }))}
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
              {noteLabel(q.target.letter, settings.notation)} — {t('common.fretboard')}
            </div>
            <Fretboard positions={frets.slice(0, 1)} />
          </div>
        )}
      </div>
    </GameShell>
  );
}
