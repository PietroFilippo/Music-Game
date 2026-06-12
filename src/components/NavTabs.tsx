import { useI18n } from '../hooks/useI18n';

interface Props {
  active: 'games' | 'stats';
  onGames: () => void;
  onStats: () => void;
}

export function NavTabs({ active, onGames, onStats }: Props) {
  const { t } = useI18n();
  const tabs = [
    { id: 'games' as const, label: t('menu.tab.games'), onClick: onGames },
    { id: 'stats' as const, label: t('menu.tab.stats'), onClick: onStats },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={tab.onClick}
            aria-pressed={isActive}
            style={{
              padding: '9px 18px',
              background: isActive ? 'var(--accent-strong)' : 'var(--bg-card)',
              color: isActive ? '#0f0f0f' : 'var(--fg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
