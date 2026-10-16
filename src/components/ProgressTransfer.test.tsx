import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '../SettingsContext';
import { getScore, recordScore } from '../store/scores';
import { buildExport } from '../store/transfer';
import { ProgressTransfer } from './ProgressTransfer';

const flush = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

function choose(text: string) {
  const input = document.querySelector('input[type=file]') as HTMLInputElement;
  const file = new File([text], 'musicgame-progress.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

describe('progress transfer in settings', () => {
  it('imports after confirming, and explains files it cannot use', async () => {
    recordScore('escalas', 70, 'none');
    recordScore('oitavas', 90, 'none');
    const text = JSON.stringify(buildExport('en'));
    localStorage.clear();
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
    render(<SettingsProvider><ProgressTransfer /></SettingsProvider>);

    choose(text);
    await flush();
    const dialog = screen.getByRole('alertdialog', { name: 'Import 2 plays across 2 topics?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Import' }));
    expect(getScore('escalas')).toMatchObject({ best: 70, plays: 1 });
    expect(screen.getByRole('status').textContent).toBe('Progress imported.');

    choose(text);
    await flush();
    expect(screen.getByRole('status').textContent).toBe('This file has nothing new.');
    choose('{"hello": 1}');
    await flush();
    expect(screen.getByRole('status').textContent).toBe('This file is not a musicgame export.');
  });
});
