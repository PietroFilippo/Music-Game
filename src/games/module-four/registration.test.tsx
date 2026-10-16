import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../App';
import { COURSE_MODULES } from '../../curriculum';
import { t } from '../../i18n';
import { MODULE_FOUR_IDS } from './questions';

describe('module 4 registration', () => {
  it.each(['pt', 'en'] as const)('shows four translated playable topics without previews [%s]', language => {
    localStorage.setItem('musicgame.settings', JSON.stringify({ language }));
    render(<App />);
    const module = within(screen.getByRole('region', { name: t('course.sevenths.title', language) }));
    expect(COURSE_MODULES.find(m => m.id === 'sevenths')).toMatchObject({ games: MODULE_FOUR_IDS, topicKeys: [] });
    for (const id of MODULE_FOUR_IDS) {
      const title = t(`games.${id}`, language);
      expect(title).not.toBe(`games.${id}`);
      const topic = within(module.getByRole('article', { name: title }));
      expect(topic.getByRole('button', { name: t('menu.learn', language) })).toBeDefined();
      expect(topic.getByRole('button', { name: t('common.practice', language) })).toBeDefined();
    }
    expect(module.queryByText(t('home.planned', language))).toBeNull();
    expect(module.queryByText(t('course.upcoming', language))).toBeNull();
    fireEvent.click(module.getByRole('button', { name: t('home.hideTopics', language) }));
    expect(document.getElementById('module-content-sevenths')!.hidden).toBe(true);
  });
});
