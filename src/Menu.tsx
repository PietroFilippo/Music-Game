import { useState } from 'react';
import { Icon } from './components/Icon';
import { SettingsSheet } from './components/SettingsSheet';
import { COURSE_MODULES } from './curriculum';
import { useI18n } from './hooks/useI18n';
import { getScore } from './store/scores';
import { readStored, writeStored } from './store/storage';
import type { GameId, ScoreRecord } from './types';

const EXPANSION_KEY = 'musicgame.modules';
const GOOD_ENOUGH = 80;

export type Destination = 'stats' | 'tuner';

interface Props {
  onPlay: (id: GameId) => void;
  onLearn: (id: GameId) => void;
  onNavigate: (to: Destination) => void;
}

const lastPlayed = (rec: ScoreRecord) => rec.history[rec.history.length - 1]?.date ?? '';

/**
 * What to practice next: the most recent topic if it still needs work, then
 * the first topic not yet played, then the topic with the lowest best score.
 */
export function recommendTopic(): { id: GameId; kind: 'continue' | 'next' } {
  const ids = COURSE_MODULES.flatMap(m => m.games);
  const played = ids.map(id => ({ id, rec: getScore(id) })).filter((s): s is { id: GameId; rec: ScoreRecord } => !!s.rec);
  const recent = [...played].sort((a, b) => lastPlayed(b.rec).localeCompare(lastPlayed(a.rec)))[0];
  if (recent && lastPlayed(recent.rec) && recent.rec.last < GOOD_ENOUGH) return { id: recent.id, kind: 'continue' };
  const unplayed = ids.find(id => !getScore(id));
  if (unplayed) return { id: unplayed, kind: 'next' };
  const weakest = [...played].sort((a, b) => a.rec.best - b.rec.best)[0];
  return { id: weakest?.id ?? ids[0], kind: 'continue' };
}

function loadExpanded(): Record<string, boolean> {
  const defaults = Object.fromEntries(COURSE_MODULES.map(module =>
    [module.id, module.games.length > 0 && module.games.some(id => !getScore(id))]));
  const saved = readStored(EXPANSION_KEY);
  if (saved && typeof saved === 'object') {
    for (const [id, value] of Object.entries(saved)) {
      if (id in defaults && typeof value === 'boolean') defaults[id] = value;
    }
  }
  return defaults;
}

export function Menu({ onPlay, onLearn, onNavigate }: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(loadExpanded);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggle = (id: string) => {
    const next = { ...expanded, [id]: !expanded[id] };
    setExpanded(next);
    writeStored(EXPANSION_KEY, next);
  };

  const pick = recommendTopic();
  const pickModule = COURSE_MODULES.find(m => m.games.includes(pick.id))!;
  const pickScore = getScore(pick.id);
  const scoreLine = (rec: ScoreRecord | undefined) =>
    rec ? t('home.bestLast', { best: rec.best, last: rec.last }) : t('home.notPlayed');

  return (
    <div className="page home">
      <header className="topbar">
        <h1 className="wordmark">{t('menu.title')}</h1>
        <button type="button" className="ibtn" aria-label={t('menu.tab.stats')} onClick={() => onNavigate('stats')}><Icon name="stats" /></button>
        <button type="button" className="ibtn" aria-label={t('menu.tab.tuner')} onClick={() => onNavigate('tuner')}><Icon name="tuner" /></button>
        <button type="button" className="ibtn" aria-label={t('settings.title')} onClick={() => setSettingsOpen(true)}><Icon name="settings" /></button>
      </header>
      <main className="page-main home-layout">
        <div className="home-side">
          <p className="muted small">{t('menu.subtitle')}</p>
          <section className="card hero" aria-labelledby="home-pick">
            <p className="eyebrow">{t(pick.kind === 'continue' ? 'home.continue' : 'home.upNext')}</p>
            <h2 id="home-pick">{t(`games.${pick.id}`)}</h2>
            <p className="muted small">{t('home.moduleRounds', { n: pickModule.number })} · {scoreLine(pickScore)}</p>
            <div className="actions" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-primary" onClick={() => onPlay(pick.id)}>
                <Icon name="play" size={18} /> {t('common.practice')}
              </button>
              <button type="button" className="btn btn-secondary" style={{ flex: '0 0 auto' }} onClick={() => onLearn(pick.id)}>
                <Icon name="book" size={18} /> {t('home.lesson')}
              </button>
            </div>
          </section>
        </div>
        <div className="home-modules page-main" style={{ padding: 0 }}>
          {COURSE_MODULES.map(module => {
            const records = module.games.map(id => ({ id, rec: getScore(id) }));
            const played = records.filter(r => r.rec);
            const open = expanded[module.id];
            const contentId = `module-content-${module.id}`;
            const planned = module.games.length === 0;
            const status = planned ? t('home.planned') : module.topicKeys.length ? t('home.inProgress') : '';
            const weakest = [...played].sort((a, b) => a.rec!.best - b.rec!.best)[0];
            const average = played.length
              ? Math.round(played.reduce((sum, r) => sum + r.rec!.best, 0) / played.length) : 0;
            return (
              <section key={module.id} className={`card${planned ? ' planned' : ''}`} aria-labelledby={`module-${module.id}`}>
                <div className="modhead">
                  <div>
                    <p className="eyebrow">{t('course.number', { n: module.number })}{status && ` · ${status}`}</p>
                    <h3 id={`module-${module.id}`}>{t(`course.${module.id}.title`)}</h3>
                  </div>
                  {!planned && <div className="modpct"><b>{played.length}</b>/{module.games.length}</div>}
                </div>
                {!planned && <div className="bar" aria-hidden="true"><span style={{ width: `${(played.length / module.games.length) * 100}%` }} /></div>}
                <p className="muted small">
                  {!planned && played.length === module.games.length
                    ? `${t('home.complete', { avg: average })} · ${t('home.weakest', { topic: t(`games.${weakest.id}`), score: weakest.rec!.best })}`
                    : t(`course.${module.id}.description`)}
                </p>
                <div className="actions" style={{ marginTop: 12 }}>
                  <button type="button" className="btn btn-secondary sm" style={{ flex: '0 0 auto' }}
                    aria-expanded={open} aria-controls={contentId} onClick={() => toggle(module.id)}>
                    {open ? t('home.hideTopics') : planned ? t('home.showPlanned') : t('home.showTopics', { n: module.games.length })}
                    <Icon name="chevronDown" size={16} />
                  </button>
                </div>
                <div id={contentId} hidden={!open}>
                  {!planned && (
                    <div className="topics">
                      {records.map(({ id, rec }) => (
                        <article key={id} className="topic" aria-label={t(`games.${id}`)}>
                          <div>
                            <div className="tname">{t(`games.${id}`)}</div>
                            <div className="tscore">{scoreLine(rec)}</div>
                          </div>
                          <div className="tacts">
                            <button type="button" className="btn btn-ghost sm" onClick={() => onLearn(id)}>
                              <Icon name="book" size={18} /> {t('menu.learn')}
                            </button>
                            <button type="button" className="btn btn-primary sm" onClick={() => onPlay(id)}>
                              {t('common.practice')}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {module.topicKeys.length > 0 && (
                    <>
                      {!planned && <h4 className="eyebrow" style={{ marginTop: 16 }}>{t('course.upcoming')}</h4>}
                      <ul className="coming">
                        {module.topicKeys.map(key => <li key={key}>{t(`course.topics.${key}`)}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
