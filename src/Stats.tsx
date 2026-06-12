import { useState, type CSSProperties } from 'react';
import { useI18n } from './hooks/useI18n';
import { getScore, resetScore, resetAllScores } from './store/scores';
import { NavTabs } from './components/NavTabs';
import { ConfirmDialog } from './components/ConfirmDialog';
import { GAME_IDS, type GameId, type PlayRecord } from './types';

function average(history: PlayRecord[]): number | null {
  if (history.length === 0) return null;
  return Math.round(history.reduce((sum, p) => sum + p.percent, 0) / history.length);
}

const cellStyle: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid var(--border)',
  textAlign: 'center',
  fontSize: 15,
};

const headStyle: CSSProperties = {
  ...cellStyle,
  color: 'var(--fg-muted)',
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
};

const resetBtnStyle: CSSProperties = {
  padding: '6px 12px',
  background: 'transparent',
  color: 'var(--danger)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 13,
};

export function Stats({ onGames }: { onGames: () => void }) {
  const { t } = useI18n();
  const [pending, setPending] = useState<GameId | 'all' | null>(null);
  const [, setVersion] = useState(0);
  const refresh = () => setVersion(v => v + 1);

  const scores = GAME_IDS.map(id => ({ id, rec: getScore(id) }));
  const played = scores.filter(s => s.rec);
  const totalPlays = played.reduce((sum, s) => sum + (s.rec?.plays ?? 0), 0);
  const overallAvg = average(played.flatMap(s => s.rec?.history ?? []));

  const confirmReset = () => {
    if (pending === 'all') resetAllScores();
    else if (pending) resetScore(pending);
    setPending(null);
    refresh();
  };

  const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v}%`);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 38, letterSpacing: -0.5 }}>{t('menu.title')}</h1>
        <p style={{ color: 'var(--fg-muted)', marginTop: 6 }}>{t('menu.subtitle')}</p>
      </header>
      <NavTabs active="stats" onGames={onGames} onStats={() => {}} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...headStyle, textAlign: 'left' }}>{t('stats.game')}</th>
            <th style={headStyle}>{t('common.plays')}</th>
            <th style={headStyle}>{t('stats.average')}</th>
            <th style={headStyle}>{t('common.best')}</th>
            <th style={headStyle}>{t('common.last')}</th>
            <th style={headStyle} />
          </tr>
        </thead>
        <tbody>
          {scores.map(({ id, rec }) => (
            <tr key={id}>
              <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 600 }}>
                {t(`games.${id}`)}
              </td>
              <td style={cellStyle}>{rec?.plays ?? 0}</td>
              <td style={cellStyle}>{fmt(rec ? average(rec.history) : null)}</td>
              <td style={cellStyle}>{fmt(rec?.best)}</td>
              <td style={cellStyle}>{fmt(rec?.last)}</td>
              <td style={cellStyle}>
                <button
                  onClick={() => setPending(id)}
                  disabled={!rec}
                  style={{ ...resetBtnStyle, opacity: rec ? 1 : 0.4 }}
                >
                  {t('stats.reset')}
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ ...cellStyle, textAlign: 'left', color: 'var(--fg-muted)' }}>
              {t('stats.total')}
            </td>
            <td style={cellStyle}>{totalPlays}</td>
            <td style={cellStyle}>{fmt(overallAvg)}</td>
            <td style={cellStyle} />
            <td style={cellStyle} />
            <td style={cellStyle} />
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 28 }}>
        <button
          onClick={() => setPending('all')}
          disabled={played.length === 0}
          style={{
            padding: '12px 22px',
            background: 'var(--danger)',
            color: '#0f0f0f',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            opacity: played.length === 0 ? 0.4 : 1,
          }}
        >
          {t('stats.resetAll')}
        </button>
        <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginTop: 10 }}>
          {t('stats.resetHint')}
        </p>
      </div>
      {pending && (
        <ConfirmDialog
          title={
            pending === 'all'
              ? t('stats.confirmAll')
              : t('stats.confirmGame', { game: t(`games.${pending}`) })
          }
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
