import { router } from 'expo-router';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { ContinueReading } from '@/features/home/ContinueReading';
import { HomeHeader } from '@/features/home/HomeHeader';
import { NextPrayerHero } from '@/features/home/NextPrayerHero';
import { TodayPrayers } from '@/features/home/TodayPrayers';
import { ToolsGrid } from '@/features/home/ToolsGrid';
import { VerseCard } from '@/features/home/VerseCard';
import { WeekCard } from '@/features/home/WeekCard';

export default function HomeScreen() {
  const sections = [
    <HomeHeader key="header" />,
    <NextPrayerHero key="hero" />,
    <TodayPrayers key="today" />,
    <SectionHeader key="tools-title" title="Tools" action="See all" onAction={() => router.navigate('/explore')} />,
    <ToolsGrid key="tools" />,
    <ContinueReading key="reading" />,
    <VerseCard key="verse" />,
    <WeekCard key="week" />,
  ];
  return (
    <Screen tabs>
      {sections.map((section, i) => (
        <Reveal key={section.key} index={i}>
          {section}
        </Reveal>
      ))}
    </Screen>
  );
}
