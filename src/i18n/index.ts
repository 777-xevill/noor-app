import { useMemo } from 'react';
import { useSettings } from '@/features/settings/store';
import { type I18n, makeI18n } from './core';

export { type I18n, makeI18n, translate } from './core';
export { deviceLang } from './device';
export type { Lang } from './langs';
export { LANGS, localDigits } from './langs';

/** Everything a screen needs to speak the user's language. */
export function useT(): I18n {
  const lang = useSettings((s) => s.language);
  return useMemo(() => makeI18n(lang), [lang]);
}
