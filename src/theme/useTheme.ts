import { useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { useSettings } from '@/features/settings/store';
import { dark, light, type Palette, type Scheme } from './tokens';

/**
 * On web the host page may stamp `data-theme="light" | "dark"` on <html> (e.g. an embedding viewer).
 * When present it wins over the OS preference while the app is on "system".
 */
function useHostTheme(): Scheme | null {
  const read = (): Scheme | null => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
    const value = document.documentElement.getAttribute('data-theme');
    return value === 'light' || value === 'dark' ? value : null;
  };
  const [hostTheme, setHostTheme] = useState<Scheme | null>(read);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => setHostTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return hostTheme;
}

export function useScheme(): Scheme {
  const mode = useSettings((s) => s.themeMode);
  const os = useColorScheme();
  const host = useHostTheme();
  if (mode !== 'system') return mode;
  return host ?? (os === 'dark' ? 'dark' : 'light');
}

export function useTheme(): Palette {
  return useScheme() === 'dark' ? dark : light;
}
