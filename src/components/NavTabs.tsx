import { useI18n } from '../hooks/useI18n';

export type Tab = 'games' | 'stats' | 'tuner';

interface Props {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

const TABS: Tab[] = ['games', 'stats', 'tuner'];

export function NavTabs({ active, onNavigate }: Props) {
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
      {TABS.map(tab => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => { if (!isActive) onNavigate(tab); }}
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
            {t(`menu.tab.${tab}`)}
          </button>
        );
      })}
    </div>
  );
}
