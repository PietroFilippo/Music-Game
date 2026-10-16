import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

function Harness({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)}>Reset</button>
    {open && <ConfirmDialog title="Delete progress?" note="This cannot be undone." cancelLabel="Cancel"
      confirmLabel="Delete" onCancel={() => setOpen(false)} onConfirm={onConfirm} />}
  </>;
}

describe('confirm dialog', () => {
  it('is named, starts on Cancel, closes on Escape and returns focus', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    const opener = screen.getByRole('button', { name: 'Reset' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('alertdialog', { name: 'Delete progress?' });
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
