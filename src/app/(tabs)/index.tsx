import { router } from 'expo-router';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { AskCard } from '@/features/home/AskCard';
import { ContinueReading } from '@/features/home/ContinueReading';
import { HomeHeader } from '@/features/home/HomeHeader';
import { MilestoneCard } from '@/features/home/MilestoneCard';
import { NextPrayerHero } from '@/features/home/NextPrayerHero';
import { RamadanCard } from '@/features/home/RamadanCard';
import { TodayPrayers } from '@/features/home/TodayPrayers';
import { ToolsGrid } from '@/features/home/ToolsGrid';
import { VerseCard } from '@/features/home/VerseCard';
import { WeekCard } from '@/features/home/WeekCard';
import { useT } from '@/i18n';
import { useProgressive } from '@/lib/useProgressive';
import { useMilestones } from '@/features/rewards/useMilestones';

export default function HomeScreen() {
  const L = useT();
  // Keeps milestones up to date as prayers are marked here.
  const { unseen } = useMilestones();
  const sections = [
    <HomeHeader key="header" />,
    <NextPrayerHero key="hero" />,
    <RamadanCard key="ramadan" />,
    <TodayPrayers key="today" />,
    <AskCard key="ask" />,
    unseen.length > 0 && <MilestoneCard key="milestone" ids={unseen} />,
    <SectionHeader key="tools-title" title={L.t('home.tools')} action={L.t('common.seeAll')} onAction={() => router.navigate('/explore')} />,
    <ToolsGrid key="tools" />,
    <ContinueReading key="reading" />,
    <VerseCard key="verse" />,
    <WeekCard key="week" />,
  ];
  // Draw what's on screen first (header, next prayer, today's prayers), then the rest a moment later,
  // so opening Home doesn't block a slow phone for the whole page at once.
  const visible = sections.filter((s) => !!s);
  const shown = useProgressive(visible.length, 4, 2);
  return (
    <Screen tabs>
      {visible.slice(0, shown).map((section, i) => (
        <Reveal key={section.key} index={i}>
          {section}
        </Reveal>
      ))}
    </Screen>
  );
}
