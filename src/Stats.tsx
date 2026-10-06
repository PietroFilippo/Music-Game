import { useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Icon } from './components/Icon';
import { COURSE_MODULES } from './curriculum';
import { useI18n } from './hooks/useI18n';
import { resetAttempts } from './store/attempts';
import { getScore, resetAllScores, resetScore } from './store/scores';
import { GAME_IDS, type GameId, type PlayRecord } from './types';

const LOW_SCORE = 60;

function average(history: PlayRecord[]): number | null {
  if (history.length === 0) return null;
  return Math.round(history.reduce((sum, p) => sum + p.percent, 0) / history.length);
}

export function Stats({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [pending, setPending] = useState<GameId | 'all' | null>(null);
  const [, setVersion] = useState(0);

  const scores = GAME_IDS.map(id => ({ id, rec: getScore(id) }));
  const played = scores.filter(s => s.rec);
  const totalPlays = played.reduce((sum, s) => sum + (s.rec?.plays ?? 0), 0);
  const overall = average(played.flatMap(s => s.rec?.history ?? []));
  const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v}%`);

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
    <div className="page">
      <header className="topbar">
        <button type="button" className="ibtn" aria-label={t('common.back')} onClick={onBack}><Icon name="back" /></button>
        <h1 className="topbar-title">{t('menu.tab.stats')}</h1>
      </header>
      <main className="page-main">
        <div className="sumgrid">
          <div><b>{totalPlays}</b><span>{t('stats.plays')}</span></div>
          <div><b>{fmt(overall)}</b><span>{t('stats.overall')}</span></div>
          <div><b>{played.length}/{GAME_IDS.length}</b><span>{t('stats.topicsLabel')}</span></div>
        </div>
        {COURSE_MODULES.filter(m => m.games.length > 0).map(module => (
          <section key={module.id} className="card" aria-labelledby={`stats-${module.id}`}>
            <p className="eyebrow">{t('course.number', { n: module.number })}</p>
            <h3 id={`stats-${module.id}`}>{t(`course.${module.id}.title`)}</h3>
            <div style={{ marginTop: 8 }}>
              {module.games.map(id => {
                const rec = getScore(id);
                const avg = rec ? average(rec.history) : null;
                return (
                  <div key={id} className="srow">
                    <div>
                      <div className="sname">{t(`games.${id}`)}</div>
                      <div className="snums">
                        <span>{t('common.plays')} <b>{rec?.plays ?? 0}</b></span>
                        <span className={avg !== null && avg < LOW_SCORE ? 'low' : ''}>{t('stats.average')} <b>{fmt(avg)}</b></span>
                        <span>{t('common.best')} <b>{fmt(rec?.best)}</b></span>
                        <span className={rec && rec.last < LOW_SCORE ? 'low' : ''}>{t('common.last')} <b>{fmt(rec?.last)}</b></span>
                      </div>
                    </div>
                    <button type="button" className="ibtn" disabled={!rec}
                      aria-label={t('stats.resetTopic', { game: t(`games.${id}`) })} onClick={() => setPending(id)}>
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        <div>
          <button type="button" className="btn btn-danger" disabled={played.length === 0} onClick={() => setPending('all')}>
            {t('stats.resetAll')}
          </button>
          <p className="muted small" style={{ marginTop: 10 }}>{t('stats.resetHint')}</p>
        </div>
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
