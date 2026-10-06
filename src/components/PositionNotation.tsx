import { useI18n } from '../hooks/useI18n';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { writtenVexKey, type FretPosition } from '../music/guitar';
import { GuitarTab } from './GuitarTab';
import { Staff } from './Staff';

// One fretboard position as tablature and as written guitar notation, side by side even on phones.
export function PositionNotation({ position, flat = false }: { position: FretPosition; flat?: boolean }) {
  const { t } = useI18n();
  const width = useMediaQuery('(max-width: 480px)') ? 156 : 200;
  return (
    <div className="notation-pair">
      <figure>
        <GuitarTab positions={[position]} width={width} />
        <figcaption>{t('common.tab')}</figcaption>
      </figure>
      <figure>
        <Staff noteVexKey={writtenVexKey(position, flat ? 'b' : '#')} width={width} height={170} />
        <figcaption>{t('notation.written')}</figcaption>
      </figure>
    </div>
  );
}
