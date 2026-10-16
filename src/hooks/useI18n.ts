import { useSettings } from '../SettingsContext';
import { t } from '../i18n';

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function useI18n() {
  const { settings } = useSettings();
  const translate: Translate = (key, vars) => t(key, settings.language, vars);
  return { lang: settings.language, t: translate };
}
