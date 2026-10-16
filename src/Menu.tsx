import { useState } from 'react';
import { Icon } from './components/Icon';
import { SettingsSheet } from './components/SettingsSheet';
import { COURSE_MODULES } from './curriculum';
import { useI18n } from './hooks/useI18n';
import { TWO_PANE, useMediaQuery } from './hooks/useMediaQuery';
import { calendarDaysUntil, nextDueAt, weakItems } from './store/attempts';
import { getScore } from './store/scores';
import { readStored, writeStored } from './store/storage';
import type { GameId, ScoreRecord } from './types';

const EXPANSION_KEY = 'musicgame.modules';
const GOOD_ENOUGH = 80;

export type Destination = 'stats' | 'tuner';

interface Props {
  onPlay: (id: GameId) => void;
  onLearn: (id: GameId) => void;
  /** Opens the Review weak spots session of a module. */
  onReview: (moduleId: string) => void;
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

// Below the two-pane width, modules with unplayed topics start open and the
// others collapsed; the learner's own choices are remembered.
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

const RING = { size: 44, stroke: 4 };

/** Topics played out of the module's total, as a ring with the count inside. */
function ProgressRing({ done, total, label }: { done: number; total: number; label: string }) {
  const center = RING.size / 2;
  const r = (RING.size - RING.stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <span className="home-ring" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${RING.size} ${RING.size}`} width={RING.size} height={RING.size} aria-hidden="true">
        <circle className="home-ring-track" cx={center} cy={center} r={r} />
        {done > 0 && (
          <circle className="home-ring-fill" cx={center} cy={center} r={r} strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - done / total)} transform={`rotate(-90 ${center} ${center})`} />
        )}
      </svg>
      <b className="readout" aria-hidden="true">{done}/{total}</b>
    </span>
  );
}

export function Menu({ onPlay, onLearn, onReview, onNavigate }: Props) {
  const { t } = useI18n();
  // At two-pane widths every module is open: the grid absorbs the length.
  const wide = useMediaQuery(TWO_PANE);
  const [expanded, setExpanded] = useState(loadExpanded);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggle = (id: string) => {
    const next = { ...expanded, [id]: !expanded[id] };
    setExpanded(next);
    writeStored(EXPANSION_KEY, next);
  };

  const now = Date.now();
  const pick = recommendTopic();
  const pickModule = COURSE_MODULES.find(m => m.games.includes(pick.id))!;
  const pickScore = getScore(pick.id);
  const scoreLine = (rec: ScoreRecord | undefined) =>
    rec ? t('home.scoreLine', { best: rec.best, last: rec.last }) : t('home.notPlayed');
  const nextReview = (gameIds: readonly GameId[]) => {
    const at = nextDueAt(gameIds);
    const days = at === null ? 0 : calendarDaysUntil(at, now);
    if (days < 1) return null;
    return days === 1 ? t('home.nextReview.tomorrow') : t('home.nextReview.days', { n: days });
  };

  return (
    <div className="page home">
      <header className="topbar" data-tauri-drag-region="deep">
        <h1 className="wordmark">{t('menu.title')}</h1>
        <button type="button" className="ibtn" aria-label={t('menu.tab.stats')} onClick={() => onNavigate('stats')}><Icon name="stats" /></button>
        <button type="button" className="ibtn" aria-label={t('menu.tab.tuner')} onClick={() => onNavigate('tuner')}><Icon name="tuner" /></button>
        <button type="button" className="ibtn" aria-label={t('settings.title')} onClick={() => setSettingsOpen(true)}><Icon name="settings" /></button>
      </header>
      <main className="page-main home-main">
        <section className="home-hero" aria-labelledby="home-pick">
          <div className="home-hero-text">
            <p className="label">{t(pick.kind === 'continue' ? 'home.continue' : 'home.upNext')}</p>
            <h2 id="home-pick">{t(`games.${pick.id}`)}</h2>
            <p className="home-meta">
              <span>{t('home.moduleRounds', { n: pickModule.number })}</span>
              <span className="home-sep" aria-hidden="true" />
              <span>{scoreLine(pickScore)}</span>
            </p>
          </div>
          <div className="home-hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => onPlay(pick.id)}>
              <Icon name="play" size={18} /> {t('common.practice')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onLearn(pick.id)}>
              <Icon name="book" size={18} /> {t('home.lesson')}
            </button>
          </div>
        </section>
        <div className="home-modules">
          {COURSE_MODULES.map(module => {
            const records = module.games.map(id => ({ id, rec: getScore(id) }));
            const played = records.filter(r => r.rec).length;
            const open = wide || expanded[module.id];
            const contentId = `module-content-${module.id}`;
            const planned = module.games.length === 0;
            const status = planned ? t('home.planned') : module.topicKeys.length ? t('home.inProgress') : '';
            // Review appears once a module has answer history; until something is due it says when it will be.
            const history = weakItems(module.games, now);
            const due = history.filter(c => c.due).length;
            const next = history.length > 0 && due === 0 ? nextReview(module.games) : null;
            return (
              <section key={module.id} className={`card home-mod${planned ? ' planned' : ''}`} aria-labelledby={`module-${module.id}`}>
                <div className="home-mod-head">
                  <div className="home-mod-title">
                    <p className="label home-mod-label">
                      <span>{t('course.number', { n: module.number })}{status && ` · ${status}`}</span>
                      {due > 0 && <span className="home-due readout">{t('home.dueBadge', { n: due })}</span>}
                    </p>
                    <h3 id={`module-${module.id}`}>{t(`course.${module.id}.title`)}</h3>
                  </div>
                  {!planned && <ProgressRing done={played} total={module.games.length}
                    label={t('home.progress', { done: played, total: module.games.length })} />}
                </div>
                {!planned && (
                  <div className="home-bar" aria-hidden="true">
                    <span style={{ width: `${(played / module.games.length) * 100}%` }} />
                  </div>
                )}
                {due > 0 ? (
                  <button type="button" className="btn btn-secondary sm home-review" onClick={() => onReview(module.id)}>
                    <Icon name="retry" size={16} /> {t('review.openCount', { n: due })}
                  </button>
                ) : history.length > 0 ? (
                  <p className="home-note">
                    <span>{t('review.caughtUp')}</span>
                    {next && <><span className="home-sep" aria-hidden="true" /><span>{next}</span></>}
                  </p>
                ) : (
                  <p className="home-note">{t(`course.${module.id}.description`)}</p>
                )}
                {!wide && (
                  // Quiet while open, so the topics and Review lead; a full button while collapsed.
                  <button type="button" className={`btn ${open ? 'btn-ghost' : 'btn-secondary'} sm home-toggle`}
                    aria-expanded={open} aria-controls={contentId} onClick={() => toggle(module.id)}>
                    {open ? t('home.hideTopics') : planned ? t('home.showPlanned') : t('home.showTopics', { n: module.games.length })}
                    <Icon name="chevronDown" size={16} />
                  </button>
                )}
                <div id={contentId} className="home-topics" hidden={!open}>
                  {records.map(({ id, rec }) => (
                    <article key={id} className="home-topic" aria-label={t(`games.${id}`)}>
                      <div className="home-topic-text">
                        <div className="home-topic-name">{t(`games.${id}`)}</div>
                        <div className="home-topic-score">{scoreLine(rec)}</div>
                      </div>
                      <button type="button" className="btn btn-ghost sm home-learn" onClick={() => onLearn(id)}>
                        <Icon name="book" size={18} /> <span className="home-learn-text">{t('menu.learn')}</span>
                      </button>
                      <button type="button" className="btn btn-primary sm home-practice" onClick={() => onPlay(id)}>
                        {t('common.practice')}
                      </button>
                    </article>
                  ))}
                  {module.topicKeys.length > 0 && (
                    <>
                      {!planned && <h4 className="label home-upcoming">{t('course.upcoming')}</h4>}
                      <ul className="home-coming">
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
