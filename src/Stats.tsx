import { useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Icon } from './components/Icon';
import { COURSE_MODULES } from './curriculum';
import { useI18n } from './hooks/useI18n';
import { dueItems, hasAttempts, resetAttempts } from './store/attempts';
import { getScore, resetAllScores, resetScore } from './store/scores';
import { GAME_IDS, type GameId, type PlayRecord } from './types';

const LOW_SCORE = 60;

function average(history: PlayRecord[]): number | null {
  if (history.length === 0) return null;
  return Math.round(history.reduce((sum, p) => sum + p.percent, 0) / history.length);
}

interface Props {
  onBack: () => void;
  /** Opens the course's first topic from the empty state; without it, that button goes back to Home. */
  onStart?: (id: GameId) => void;
}

export function Stats({ onBack, onStart }: Props) {
  const { t } = useI18n();
  const [pending, setPending] = useState<GameId | 'all' | null>(null);
  const [, setVersion] = useState(0);

  const scores = GAME_IDS.map(id => ({ id, rec: getScore(id) }));
  const played = scores.filter(s => s.rec);
  const totalPlays = played.reduce((sum, s) => sum + (s.rec?.plays ?? 0), 0);
  const overall = average(played.flatMap(s => s.rec?.history ?? []));
  // Answers are recorded before a quiz ends, so history can exist without a score; resets must reach it.
  const anyHistory = played.length > 0 || hasAttempts(GAME_IDS);
  const due = Object.fromEntries(COURSE_MODULES.map(m => [m.id, dueItems(m.games).length]));
  const totalDue = Object.values(due).reduce((sum, n) => sum + n, 0);
  const firstTopic = COURSE_MODULES[0].games[0];

  // A score in the readout face; "—" where there is none, and "low" under scores below 60 %.
  const num = (value: number | null | undefined, { percent = true, low = false } = {}) =>
    value === null || value === undefined
      ? <span className="stats-dash">—</span>
      : (
        <span className={`stats-num readout${low ? ' low' : ''}`}>
          {value}{percent && '%'}
          {low && <small className="stats-low">{t('stats.low')}</small>}
        </span>
      );

  const confirmReset = () => {
    if (pending === 'all') {
      resetAllScores();
      resetAttempts();
    } else if (pending) {
      resetScore(pending);
      resetAttempts(pending);
    }
    setPending(null);
    setVersion(v => v + 1);
  };

  return (
    <div className="page stats">
      <header className="topbar" data-tauri-drag-region="deep">
        <button type="button" className="ibtn" aria-label={t('common.back')} onClick={onBack}><Icon name="back" /></button>
        <h1 className="topbar-title">{t('menu.tab.stats')}</h1>
      </header>
      <main className="page-main stats-main">
        {!anyHistory ? (
          <section className="card stats-empty">
            <p>{t('stats.empty')}</p>
            <button type="button" className="btn btn-primary" onClick={() => (onStart ? onStart(firstTopic) : onBack())}>
              {t('stats.start')} <Icon name="arrowRight" size={18} />
            </button>
          </section>
        ) : (
          <>
            <div className="stats-tiles">
              <div className="stats-tile"><b className="readout">{totalPlays}</b><span>{t('stats.plays')}</span></div>
              <div className="stats-tile"><b className="readout">{overall === null ? '—' : `${overall}%`}</b><span>{t('stats.overall')}</span></div>
              <div className="stats-tile"><b className="readout">{played.length}/{GAME_IDS.length}</b><span>{t('stats.topicsLabel')}</span></div>
              <div className="stats-tile"><b className="readout">{totalDue}</b><span>{t('stats.dueLabel')}</span></div>
            </div>
            <div className="stats-modules">
              {COURSE_MODULES.filter(m => m.games.length > 0).map(module => (
                <section key={module.id} className="card stats-mod" aria-labelledby={`stats-${module.id}`}>
                  <p className="label">{t('course.number', { n: module.number })}</p>
                  <h3 id={`stats-${module.id}`}>{t(`course.${module.id}.title`)}</h3>
                  {due[module.id] > 0 && <p className="stats-due">{t('stats.due', { n: due[module.id] })}</p>}
                  <div className="stats-table" role="table" aria-labelledby={`stats-${module.id}`}>
                    <div className="stats-row stats-head" role="row">
                      <span className="stats-name" role="columnheader">{t('stats.topic')}</span>
                      <span className="stats-plays" role="columnheader">{t('common.plays')}</span>
                      <span className="stats-avg" role="columnheader">{t('stats.avg')}</span>
                      <span className="stats-best" role="columnheader">{t('common.best')}</span>
                      <span className="stats-last" role="columnheader">{t('common.last')}</span>
                      <span className="stats-reset" role="columnheader"><span className="stats-hidden">{t('stats.reset')}</span></span>
                    </div>
                    {module.games.map(id => {
                      const rec = getScore(id);
                      const avg = rec ? average(rec.history) : null;
                      const hasData = !!rec || hasAttempts([id]);
                      return (
                        <div key={id} className="stats-row" role="row">
                          <span className="stats-name" role="rowheader">{t(`games.${id}`)}</span>
                          <span className="stats-plays" role="cell">{num(rec?.plays, { percent: false })}</span>
                          <span className="stats-avg" role="cell">{num(avg, { low: avg !== null && avg < LOW_SCORE })}</span>
                          <span className="stats-best" role="cell">{num(rec?.best)}</span>
                          <span className="stats-last" role="cell">{num(rec?.last, { low: !!rec && rec.last < LOW_SCORE })}</span>
                          <span className="stats-reset" role="cell">
                            {hasData && (
                              <button type="button" className="ibtn" aria-label={t('stats.resetTopic', { game: t(`games.${id}`) })}
                                onClick={() => setPending(id)}>
                                <Icon name="trash" size={18} />
                              </button>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="stats-reset-all">
              <button type="button" className="btn btn-danger" onClick={() => setPending('all')}>{t('stats.resetAll')}</button>
              <p>{t('stats.resetHint')}</p>
            </div>
          </>
        )}
      </main>
      {pending && (
        <ConfirmDialog
          title={pending === 'all' ? t('stats.confirmAll') : t('stats.confirmGame', { game: t(`games.${pending}`) })}
          note={t('stats.confirmNote')}
          cancelLabel={t('stats.cancel')}
          confirmLabel={t('stats.delete')}
          onCancel={() => setPending(null)}
          onConfirm={confirmReset}
        />
      )}
    </div>
  );
}
