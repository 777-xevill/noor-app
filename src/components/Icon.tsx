import type { ComponentType } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { LucideProps } from 'lucide-react-native';
// Per-icon imports keep the bundle small (the package index pulls in all ~1,900 icons).
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import Bell from 'lucide-react-native/icons/bell';
import BookOpen from 'lucide-react-native/icons/book-open';
import Bookmark from 'lucide-react-native/icons/bookmark';
import Calculator from 'lucide-react-native/icons/calculator';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CloudSun from 'lucide-react-native/icons/cloud-sun';
import Compass from 'lucide-react-native/icons/compass';
import HandHeart from 'lucide-react-native/icons/hand-heart';
import House from 'lucide-react-native/icons/house';
import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import MapPin from 'lucide-react-native/icons/map-pin';
import Moon from 'lucide-react-native/icons/moon';
import MoonStar from 'lucide-react-native/icons/moon-star';
import NotebookPen from 'lucide-react-native/icons/notebook-pen';
import Share2 from 'lucide-react-native/icons/share-2';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Sun from 'lucide-react-native/icons/sun';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Sunset from 'lucide-react-native/icons/sunset';
import UserRound from 'lucide-react-native/icons/user-round';

type IconProps = { size?: number; color: string; strokeWidth?: number; fill?: string };

// Custom glyphs lucide doesn't have, drawn on the same 24px grid and stroke style.
function Mosque({ size = 24, color, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 21h18" />
      <Path d="M4.5 21v-6.5a5.5 5.5 0 0 1 11 0V21" />
      <Path d="M10 9V6.5" />
      <Path d="M8.5 21v-3a1.5 1.5 0 0 1 3 0v3" />
      <Path d="M19.5 21V10" />
      <Path d="M18 10h3" />
      <Path d="M19.5 10V7" />
    </Svg>
  );
}

function Beads({ size = 24, color, strokeWidth = 1.75 }: IconProps) {
  const beads = Array.from({ length: 9 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 10 - Math.PI / 2 + Math.PI / 10;
    return { cx: 12 + 6.2 * Math.cos(a), cy: 9.5 + 6.2 * Math.sin(a) };
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {beads.map((b, i) => (
        <Circle key={i} cx={b.cx} cy={b.cy} r={1.25} />
      ))}
      <Path d="M12 16.2V19.5" />
      <Path d="M10.5 22l1.5-2.5 1.5 2.5" />
    </Svg>
  );
}

const lucide = (C: ComponentType<LucideProps>) =>
  function LucideGlyph({ size = 24, color, strokeWidth = 1.75, fill = 'none' }: IconProps) {
    return <C size={size} color={color} strokeWidth={strokeWidth} fill={fill} />;
  };

const ICONS = {
  arrowUpRight: lucide(ArrowUpRight),
  bell: lucide(Bell),
  book: lucide(BookOpen),
  bookmark: lucide(Bookmark),
  calculator: lucide(Calculator),
  calendar: lucide(CalendarDays),
  check: lucide(Check),
  chevronRight: lucide(ChevronRight),
  cloudSun: lucide(CloudSun),
  compass: lucide(Compass),
  dua: lucide(HandHeart),
  grid: lucide(LayoutGrid),
  home: lucide(House),
  journal: lucide(NotebookPen),
  mapPin: lucide(MapPin),
  moon: lucide(Moon),
  moonStar: lucide(MoonStar),
  mosque: Mosque,
  names: lucide(Sparkles),
  share: lucide(Share2),
  sun: lucide(Sun),
  sunrise: lucide(Sunrise),
  sunset: lucide(Sunset),
  tasbih: Beads,
  user: lucide(UserRound),
} satisfies Record<string, ComponentType<IconProps>>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Glyph = ICONS[name];
  return <Glyph {...props} />;
}
