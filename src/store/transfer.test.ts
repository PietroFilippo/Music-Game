import { describe, expect, it } from 'vitest';
import { getAttempts, recordAttempt } from './attempts';
import { getScore, recordScore } from './scores';
import { buildExport, checkImport, exportFileName } from './transfer';

const exportText = () => JSON.stringify(buildExport('en'));

describe('progress transfer', () => {
  it('exports scores and answer history under a dated file name', () => {
    recordScore('intervalos', 80, 'none');
    recordAttempt('intervalos', 'spell-C-3', 'correct', 1200);
    const file = buildExport('pt', new Date(2026, 9, 14, 21, 12));
    expect(file).toMatchObject({ app: 'musicgame', version: 1, language: 'pt' });
    expect(file.scores).toMatchObject({ intervalos: { best: 80, plays: 1 } });
    expect(file.attempts).toMatchObject({ intervalos: { 'spell-C-3': { seen: 1 } } });
    expect(exportFileName(new Date(2026, 9, 4))).toBe('musicgame-progress-2026-10-04.json');
    expect(JSON.stringify(file)).not.toContain('musicgame.settings');
  });

  it('merges an import, and importing the same file again adds nothing', () => {
    recordScore('escalas', 60, 'easy');
    recordAttempt('escalas', 'which-C-major', 'wrong', 900);
    const text = exportText();
    localStorage.clear();
    recordScore('escalas', 90, 'hard');
    recordScore('oitavas', 70, 'none');

    const check = checkImport(text);
    if (!check.ok) throw new Error('expected a valid export');
    expect(check).toMatchObject({ plays: 1, topics: 1, answers: 1 });
    check.apply();
    expect(getScore('escalas')).toMatchObject({ best: 90, plays: 2 });
    expect(getScore('escalas')!.history.map(p => p.percent).sort()).toEqual([60, 90]);
    expect(getScore('oitavas')).toMatchObject({ plays: 1 });
    expect(getAttempts('escalas')['which-C-major']).toMatchObject({ last: 'wrong' });

    const again = checkImport(text);
    if (!again.ok) throw new Error('expected a valid export');
    expect(again).toMatchObject({ plays: 0, topics: 0, answers: 0 });
    again.apply();
    expect(getScore('escalas')!.plays).toBe(2);
  });

  it('keeps the more recent answer record for a question answered in both places', () => {
    recordAttempt('intervalos', 'q', 'wrong', 500, Date.parse('2026-10-01T10:00:00Z'));
    const older = exportText();
    recordAttempt('intervalos', 'q', 'correct', 500, Date.parse('2026-10-02T10:00:00Z'));
    const check = checkImport(older);
    if (!check.ok) throw new Error('expected a valid export');
    expect(check.answers).toBe(0);
    check.apply();
    expect(getAttempts('intervalos').q).toMatchObject({ seen: 2, last: 'correct' });
  });

  it('names what is wrong with a file it cannot import', () => {
    expect(checkImport('not json')).toEqual({ ok: false, error: 'notExport' });
    expect(checkImport(JSON.stringify({ scores: {} }))).toEqual({ ok: false, error: 'notExport' });
    expect(checkImport(JSON.stringify({ app: 'musicgame', version: 99 }))).toEqual({ ok: false, error: 'newer' });
  });
});
