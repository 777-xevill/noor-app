import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Txt } from '@/components/Txt';
import { useQuranProgress } from '@/features/quran/progress';
import { useTheme } from '@/theme/useTheme';

export function ContinueReading() {
  const t = useTheme();
  const lastRead = useQuranProgress((s) => s.lastRead);
  const progress = lastRead ? lastRead.ayah / lastRead.totalAyahs : 0;

  return (
    <Press
      onPress={() =>
        router.push({
          pathname: '/quran/[surah]',
          params: lastRead ? { surah: String(lastRead.surahNumber), ayah: String(lastRead.ayah) } : { surah: '1' },
        })
      }
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel="Continue reading the Quran"
    >
      <Glass radius={26} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="book" size={24} color={t.onInk} />
        </View>
        <View style={{ flex: 1, gap: 7 }}>
          <View>
            <Txt variant="eyebrow" tone="muted">
              {lastRead ? 'Continue reading' : 'Start reading'}
            </Txt>
            <Txt variant="title" numberOfLines={1}>
              {lastRead ? `${lastRead.surah}` : 'Al-Fatiha'}
              <Txt variant="title" tone="muted">
                {lastRead ? `  ·  ${lastRead.surahMeaning}` : '  ·  The Opening'}
              </Txt>
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: t.track, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', borderRadius: 2, backgroundColor: t.ink }} />
            </View>
            <Txt variant="micro" tone="muted" tabular>
              {lastRead ? `Ayah ${lastRead.ayah}/${lastRead.totalAyahs}` : '7 ayahs'}
            </Txt>
          </View>
        </View>
        <Icon name="chevronRight" size={20} color={t.textMuted} />
      </Glass>
    </Press>
  );
}
