import { useI18n } from '../hooks/useI18n';
import { writtenVexKey, type FretPosition } from '../music/guitar';
import { GuitarTab } from './GuitarTab';
import { Staff } from './Staff';

// One fretboard position as tablature and as written guitar notation.
export function PositionNotation({ position }: { position: FretPosition }) {
  const { t } = useI18n();
  return (
    <div className="notation-pair">
      <figure>
        <GuitarTab positions={[position]} width={200} />
        <figcaption>{t('common.tab')}</figcaption>
      </figure>
      <figure>
        <Staff noteVexKey={writtenVexKey(position)} width={200} height={170} />
        <figcaption>{t('notation.written')}</figcaption>
      </figure>
    </div>
  );
}
