import { useMemo, useState } from 'react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useI18n } from '../../hooks/useI18n';
import { useSettings } from '../../SettingsContext';
import { GameShell } from '../../components/GameShell';
import { Staff } from '../../components/Staff';
import { AnswerBank } from '../../components/AnswerBank';
import { ContinueButton } from '../../components/ContinueButton';
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
  const progress = useGameProgress('claves', ROUNDS);
  const { t } = useI18n();
  const { settings } = useSettings();
  const q = useMemo(makeQuestion, [progress.round]);
  const [picked, setPicked] = useState<LetterNote | null>(null);

  const finishRound = (answer: LetterNote) => {
    progress.submit(answer === q.clef.anchorLetter);
    setPicked(null);
  };

  const onPick = (val: LetterNote) => {
    if (picked) return;
    setPicked(val);
    if (settings.advanceMode === 'auto') {
      window.setTimeout(() => finishRound(val), 900);
    }
  };

  return (
    <GameShell title={t('games.claves')} onExit={onExit} progress={progress}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-muted)', marginBottom: 14 }}>{t('prompts.claves')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Staff clef={q.clef.vexClef} />
        </div>
        <AnswerBank
          choices={q.choices.map(l => ({
            value: l,
            label: noteLabel(l, settings.notation, settings.language),
          }))}
          onPick={onPick}
          disabled={!!picked}
          lastPick={picked ?? undefined}
          correctValue={q.clef.anchorLetter}
        />
        {picked && settings.advanceMode === 'manual' && (
          <ContinueButton onClick={() => finishRound(picked)} />
        )}
      </div>
    </GameShell>
  );
}
