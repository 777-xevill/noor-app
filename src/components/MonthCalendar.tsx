import type { ReactNode } from 'react';
import { View } from 'react-native';
import { type DayParts, daysInMonth, MONTHS, sameDay, weekdayMon0 } from '@/lib/dates';
import { HIJRI_MONTHS, toHijri } from '@/lib/hijri';
import { useTheme } from '@/theme/useTheme';
import { Glass } from './Glass';
import { IconButton } from './IconButton';
import { Press } from './Press';
import { Txt } from './Txt';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  year: number;
  month: number;
  today: DayParts;
  selected?: DayParts;
  hijriOffset: number;
  onSelect: (day: DayParts) => void;
  onMonthChange: (delta: number) => void;
  /** Small marker under the day number (ring, dot…). */
  renderMark?: (day: DayParts) => ReactNode;
};

/** Gregorian month grid with the Hijri months it spans; today outlined, selection inverted. */
export function MonthCalendar({ year, month, today, selected, hijriOffset, onSelect, onMonthChange, renderMark }: Props) {
  const t = useTheme();
  const count = daysInMonth(year, month);
  const first = { y: year, m: month, d: 1 };
  const lead = weekdayMon0(first);
  const h1 = toHijri(first, hijriOffset);
  const h2 = toHijri({ y: year, m: month, d: count }, hijriOffset);
  const hijriSpan = h1.month === h2.month ? `${HIJRI_MONTHS[h1.month]} ${h1.year}` : `${HIJRI_MONTHS[h1.month]} – ${HIJRI_MONTHS[h2.month]} ${h2.year}`;

  const cells: (DayParts | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: count }, (_, i) => ({ y: year, m: month, d: i + 1 }))];
  while (cells.length % 7) cells.push(null);

  return (
    <Glass radius={26} padding={14} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconButton icon="chevronLeft" label="Previous month" size={38} onPress={() => onMonthChange(-1)} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt variant="title">
            {MONTHS[month]} {year}
          </Txt>
          <Txt variant="caption" tone="muted">
            {hijriSpan} AH
          </Txt>
        </View>
        <IconButton icon="chevronRight" label="Next month" size={38} onPress={() => onMonthChange(1)} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEK.map((w, i) => (
          <Txt key={i} variant="micro" tone="muted" style={{ width: `${100 / 7}%`, textAlign: 'center' }}>
            {w}
          </Txt>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
        {cells.map((day, i) => {
          if (!day) return <View key={i} style={{ width: `${100 / 7}%` }} />;
          const isToday = sameDay(day, today);
          const isSelected = !!selected && sameDay(day, selected);
          return (
            <Press
              key={i}
              scaleTo={0.9}
              onPress={() => onSelect(day)}
              accessibilityRole="button"
              accessibilityLabel={`${day.d} ${MONTHS[month]}`}
              accessibilityState={{ selected: isSelected }}
              style={{ width: `${100 / 7}%`, alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected ? t.ink : 'transparent',
                  borderWidth: isToday && !isSelected ? 1.5 : 0,
                  borderColor: t.ink,
                }}
              >
                <Txt variant="bodyStrong" tone={isSelected ? 'onInk' : 'default'} tabular style={{ fontSize: 14 }}>
                  {day.d}
                </Txt>
              </View>
              <View style={{ height: 18, alignItems: 'center', justifyContent: 'center' }}>{renderMark?.(day)}</View>
            </Press>
          );
        })}
      </View>
    </Glass>
  );
}
