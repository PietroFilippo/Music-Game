import { useSettings } from '../SettingsContext';
import { t } from '../i18n';

export function useI18n() {
  const { settings } = useSettings();
  return {
    lang: settings.language,
    t: (key: string, vars?: Record<string, string | number>) => t(key, settings.language, vars),
  };
}
