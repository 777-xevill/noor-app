import type { IconName } from '@/components/Icon';
import type { Key } from '@/i18n/en';
import type { AlertKind } from '@/features/settings/store';

// Tapping a prayer's bell steps through: adhan → sound → silent → off.
export const NEXT_ALERT: Record<AlertKind, AlertKind> = { adhan: 'sound', sound: 'silent', silent: 'off', off: 'adhan' };
export const ALERT_ICON: Record<AlertKind, IconName> = { adhan: 'volume', sound: 'bellRing', silent: 'bell', off: 'bellOff' };
export const ALERT_LABEL: Record<AlertKind, Key> = { adhan: 'alert.adhan', sound: 'alert.sound', silent: 'alert.silent', off: 'alert.off' };
