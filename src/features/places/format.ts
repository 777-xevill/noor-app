import type { I18n } from '@/i18n';
import type { Place } from './overpass';

/** The name to show, in the app's language where the map has one. */
export function placeName(L: I18n, p: Place) {
  const name = L.lang === 'bn' ? (p.nameBn ?? p.name ?? p.nameEn) : (p.nameEn ?? p.name ?? p.nameBn);
  return name ?? L.t(p.kind === 'mosque' ? 'places.unnamedMosque' : 'places.unnamedFood');
}

export function distanceLabel(L: I18n, km: number) {
  return km < 1 ? L.t('places.m', { n: Math.max(10, Math.round((km * 1000) / 10) * 10) }) : L.t('places.km', { n: L.num(km.toFixed(1)) });
}
