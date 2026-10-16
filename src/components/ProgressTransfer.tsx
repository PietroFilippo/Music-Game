import { useRef, useState, type ChangeEvent } from 'react';
import { useI18n } from '../hooks/useI18n';
import { buildExport, checkImport, exportFileName, lastExport, markExported, type ImportCheck } from '../store/transfer';
import type { Language } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon } from './Icon';

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }> }>;

/** Saves the export with the system's save dialog where available, else as a download. Returns false if cancelled. */
async function saveExport(language: Language): Promise<boolean> {
  const now = new Date();
  const text = JSON.stringify(buildExport(language, now), null, 2);
  const name = exportFileName(now);
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  if (picker) {
    try {
      const file = await picker({ suggestedName: name, types: [{ description: 'musicgame', accept: { 'application/json': ['.json'] } }] });
      const writable = await file.createWritable();
      await writable.write(text);
      await writable.close();
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return false;
      throw error;
    }
  } else {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }
  markExported(now);
  return true;
}

const readText = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsText(file);
});

// Export and import of scores and answer history, in the Settings sheet of
// both builds, so progress can move between the browser and the desktop app.
export function ProgressTransfer() {
  const { t, lang } = useI18n();
  const file = useRef<HTMLInputElement>(null);
  const [exported, setExported] = useState(lastExport);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<Extract<ImportCheck, { ok: true }> | null>(null);
  const count = (n: number, one: string, many: string) => (n === 1 ? t(one) : t(many, { n }));
  const when = (date: Date) => date.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const exportNow = async () => {
    setMessage(null);
    if (await saveExport(lang).catch(() => false)) setExported(lastExport());
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (!chosen) return;
    const check = checkImport(await readText(chosen).catch(() => ''));
    if (!check.ok) return setMessage(t(check.error === 'newer' ? 'transfer.newer' : 'transfer.notExport'));
    if (check.plays === 0 && check.answers === 0) return setMessage(t('transfer.nothingNew'));
    setMessage(null);
    setPending(check);
  };

  return (
    <div className="setting">
      <div className="setting-label">{t('transfer.title')}</div>
      <div className="actions">
        <button type="button" className="btn btn-secondary sm" onClick={exportNow}>
          <Icon name="download" size={18} /> {t('transfer.export')}
        </button>
        <button type="button" className="btn btn-secondary sm" onClick={() => file.current?.click()}>
          <Icon name="upload" size={18} /> {t('transfer.import')}
        </button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={importFile} />
      </div>
      <p className="setting-hint">{t('transfer.hint')}</p>
      {exported && <p className="setting-hint">{t('transfer.lastExport', { date: when(exported) })}</p>}
      {message && <p className="setting-hint" role="status">{message}</p>}
      {pending && (
        <ConfirmDialog
          tone="accent"
          title={pending.plays > 0
            ? t('transfer.confirm', {
              plays: count(pending.plays, 'transfer.playOne', 'transfer.playMany'),
              topics: count(pending.topics, 'transfer.topicOne', 'transfer.topicMany'),
            })
            : t('transfer.confirmHistory')}
          note={t('transfer.note')}
          cancelLabel={t('stats.cancel')}
          confirmLabel={t('transfer.confirmButton')}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            pending.apply();
            setPending(null);
            setMessage(t('transfer.done'));
          }}
        />
      )}
    </div>
  );
}
