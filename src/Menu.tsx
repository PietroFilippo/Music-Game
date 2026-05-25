import { useI18n } from './hooks/useI18n';
import { getScore } from './store/scores';
import { SettingsBar } from './components/SettingsBar';
import type { GameId } from './types';

const GAMES: GameId[] = ['pauta-i', 'pauta-ii', 'claves', 'clave-sol'];

export function Menu({ onPick }: { onPick: (id: GameId) => void }) {
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
              <button
                key={id}
                onClick={() => onPick(id)}
                style={{
                  textAlign: 'left',
                  padding: 20,
                  background: 'var(--bg-card)',
                  color: 'var(--fg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
              >
                <div style={{ fontWeight: 600, fontSize: 17 }}>{t(`games.${id}`)}</div>
                <div style={{ color: 'var(--fg-muted)', fontSize: 12, marginTop: 8 }}>
                  {score
                    ? `${t('common.best')}: ${score.best}% · ${t('common.last')}: ${score.last}% · ${t('common.plays')}: ${score.plays}`
                    : '—'}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
