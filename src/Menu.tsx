import { useI18n } from './hooks/useI18n';
import { getScore } from './store/scores';
import { SettingsBar } from './components/SettingsBar';
import { hasLesson } from './lessons';
import type { GameId } from './types';

const GAMES: GameId[] = ['pauta-i', 'pauta-ii', 'claves', 'clave-sol'];

interface Props {
  onPlay: (id: GameId) => void;
  onLearn: (id: GameId) => void;
}

export function Menu({ onPlay, onLearn }: Props) {
  const { t } = useI18n();
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: 36 }}>
        <h1 style={{ margin: 0, fontSize: 38, letterSpacing: -0.5 }}>{t('menu.title')}</h1>
        <p style={{ color: 'var(--fg-muted)', marginTop: 6 }}>{t('menu.subtitle')}</p>
        <SettingsBar />
      </header>
      <section>
        <h2
          style={{
            color: 'var(--fg-muted)',
            fontSize: 12,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          {t('menu.module')}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {GAMES.map(id => {
            const score = getScore(id);
            return (
              <div
                key={id}
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
                    disabled={!hasLesson(id)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'transparent',
                      color: hasLesson(id) ? 'var(--fg)' : 'var(--fg-muted)',
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
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
