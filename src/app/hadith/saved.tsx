import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { HadithCard } from '@/features/hadith/HadithCard';
import { useHadithSaved } from '@/features/hadith/store';

export default function SavedHadith() {
  const L = useT();
  const saved = useHadithSaved((s) => s.saved);
  const list = Object.values(saved).sort((a, b) => b.savedOn - a.savedOn);

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('hadith.saved')} />
      {list.length === 0 ? (
        <Txt variant="body" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('hadith.savedEmpty')}
        </Txt>
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((h) => (
            <HadithCard key={h.id} book={h.book} item={h} />
          ))}
        </View>
      )}
    </Screen>
  );
}
