import { useState } from 'react';
import { useI18n } from './hooks/useI18n';
import { getScore } from './store/scores';
import { readStored, writeStored } from './store/storage';
import { SettingsBar } from './components/SettingsBar';
import { NavTabs, type Tab } from './components/NavTabs';
import type { GameId } from './types';
import { COURSE_MODULES } from './curriculum';

const EXPANSION_KEY = 'musicgame.modules';

function loadExpanded(): Record<string, boolean> {
  const defaults = Object.fromEntries(COURSE_MODULES.map(module => [module.id, module.games.length > 0]));
  const saved = readStored(EXPANSION_KEY);
  if (saved && typeof saved === 'object') {
    for (const [id, value] of Object.entries(saved)) {
      if (id in defaults && typeof value === 'boolean') defaults[id] = value;
    }
  }
  return defaults;
}

interface Props {
  onPlay: (id: GameId) => void;
  onLearn: (id: GameId) => void;
  onNavigate: (tab: Tab) => void;
}

export function Menu({ onPlay, onLearn, onNavigate }: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(loadExpanded);
  const toggle = (id: string) => {
    const next = { ...expanded, [id]: !expanded[id] };
    setExpanded(next);
    writeStored(EXPANSION_KEY, next);
  };
  const status = (games: number, upcoming: number) => {
    if (games === 0) return t('course.planned');
    return t(upcoming > 0 ? 'course.inProgress' : 'course.lessonCount', { n: games });
  };
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 38, letterSpacing: -0.5 }}>{t('menu.title')}</h1>
        <p style={{ color: 'var(--fg-muted)', marginTop: 6 }}>{t('menu.subtitle')}</p>
        <SettingsBar />
      </header>
      <NavTabs active="games" onNavigate={onNavigate} />
      {COURSE_MODULES.map(module => (
      <section key={module.id} className="course-module" aria-labelledby={`module-heading-${module.id}`}>
        <h2 className="module-heading">
          <button type="button" className="module-toggle" id={`module-heading-${module.id}`}
            aria-expanded={expanded[module.id]} aria-controls={`module-content-${module.id}`}
            onClick={() => toggle(module.id)}>
            <span className="module-chevron" aria-hidden="true">{expanded[module.id] ? '▾' : '▸'}</span>
            <span className="module-heading-text">
              <span className="module-number">{t('course.number', { n: module.number })}</span>
              <span>{t(`course.${module.id}.title`)}</span>
            </span>
            <span className={`module-status ${module.games.length ? 'module-available' : ''}`}>
              {status(module.games.length, module.topicKeys.length)}
            </span>
          </button>
        </h2>
        <div id={`module-content-${module.id}`} hidden={!expanded[module.id]} className="module-content">
          <p className="module-description">{t(`course.${module.id}.description`)}</p>
          {module.games.length > 0 && <div className="game-grid">
          {module.games.map(id => {
            const score = getScore(id);
            return (
              <article
                key={id}
                aria-label={t(`games.${id}`)}
                style={{
                  textAlign: 'left',
                  padding: 20,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 17 }}>{t(`games.${id}`)}</div>
                <div style={{ color: 'var(--fg-muted)', fontSize: 12, marginTop: 8 }}>
                  {score
                    ? `${t('common.best')}: ${score.best}% · ${t('common.last')}: ${score.last}% · ${t('common.plays')}: ${score.plays}`
                    : '—'}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    onClick={() => onLearn(id)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'transparent',
                      color: 'var(--fg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  >
                    {t('menu.learn')}
                  </button>
                  <button
                    onClick={() => onPlay(id)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'var(--accent-strong)',
                      color: '#0f0f0f',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {t('common.practice')}
                  </button>
                </div>
              </article>
            );
          })}
          </div>}
          {module.topicKeys.length > 0 && <div className="module-roadmap">
            {module.games.length > 0 && <h3 className="module-upcoming">{t('course.upcoming')}</h3>}
            <ul>{module.topicKeys.map(key => <li key={key}>{t(`course.topics.${key}`)}</li>)}</ul>
            <p>{t('course.plannedNote')}</p>
          </div>}
        </div>
      </section>
      ))}
    </div>
  );
}
