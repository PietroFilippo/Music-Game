import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MODULE_FOUR_IDS } from '../games/module-four/questions';
import { SettingsProvider } from '../SettingsContext';
import { ModuleFourLesson } from './module-four';

vi.mock('../components/StaffDiagram', () => ({ StaffDiagram: () => <div>Staff diagram</div> }));

describe('module 4 lessons', () => {
  it.each(MODULE_FOUR_IDS)('%s has six bilingual steps and opens practice', id => {
    for (const language of ['pt', 'en']) {
      localStorage.setItem('musicgame.settings', JSON.stringify({ language, notation: 'both' }));
      const onPractice = vi.fn();
      const onExit = vi.fn();
      const { unmount } = render(<SettingsProvider><ModuleFourLesson id={id} onExit={onExit} onPractice={onPractice} /></SettingsProvider>);
      expect(screen.getAllByRole('button', { name: language === 'pt' ? 'Ouvir' : 'Listen' }).length).toBeGreaterThan(0);
      for (let i = 1; i <= 6; i++) {
        expect(screen.getByText(`${i} / 6`)).toBeDefined();
        expect(screen.getAllByRole('heading').length).toBe(2);
        if (i < 6) fireEvent.click(screen.getByRole('button', { name: language === 'pt' ? 'Próxima' : 'Next' }));
      }
      fireEvent.click(screen.getByRole('button', { name: language === 'pt' ? 'Praticar' : 'Practice' }));
      expect(onPractice).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole('button', { name: language === 'pt' ? 'Voltar' : 'Back' }));
      expect(onExit).toHaveBeenCalledOnce();
      unmount();
    }
  });
});
