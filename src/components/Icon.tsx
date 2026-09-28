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
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import Plus from 'lucide-react-native/icons/plus';
import Minus from 'lucide-react-native/icons/minus';
import Play from 'lucide-react-native/icons/play';
import Pause from 'lucide-react-native/icons/pause';
import Settings2 from 'lucide-react-native/icons/settings-2';
import LocateFixed from 'lucide-react-native/icons/locate-fixed';
import Globe from 'lucide-react-native/icons/globe';
import Volume2 from 'lucide-react-native/icons/volume-2';
import VolumeX from 'lucide-react-native/icons/volume-x';
import BellOff from 'lucide-react-native/icons/bell-off';
import BellRing from 'lucide-react-native/icons/bell-ring';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Info from 'lucide-react-native/icons/info';
import Pencil from 'lucide-react-native/icons/pencil';
import Trash from 'lucide-react-native/icons/trash';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import ALargeSmall from 'lucide-react-native/icons/a-large-small';
import Languages from 'lucide-react-native/icons/languages';
import Heart from 'lucide-react-native/icons/heart';
import List from 'lucide-react-native/icons/list';
import Clock from 'lucide-react-native/icons/clock';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Target from 'lucide-react-native/icons/target';
import Flame from 'lucide-react-native/icons/flame';
import SunMoon from 'lucide-react-native/icons/sun-moon';
import MapIcon from 'lucide-react-native/icons/map';
import Navigation from 'lucide-react-native/icons/navigation';
import Copy from 'lucide-react-native/icons/copy';
import Shield from 'lucide-react-native/icons/shield';
import BookHeart from 'lucide-react-native/icons/book-heart';
import Library from 'lucide-react-native/icons/library';
import ScrollText from 'lucide-react-native/icons/scroll-text';
import Repeat from 'lucide-react-native/icons/repeat';
import Coins from 'lucide-react-native/icons/coins';
import HandCoins from 'lucide-react-native/icons/hand-coins';
import Wallet from 'lucide-react-native/icons/wallet';
import Briefcase from 'lucide-react-native/icons/briefcase';
import Landmark from 'lucide-react-native/icons/landmark';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Receipt from 'lucide-react-native/icons/receipt';
import Scale from 'lucide-react-native/icons/scale';
import Star from 'lucide-react-native/icons/star';
import Table2 from 'lucide-react-native/icons/table-2';
import CalendarRange from 'lucide-react-native/icons/calendar-range';
import Quote from 'lucide-react-native/icons/quote';
import Hourglass from 'lucide-react-native/icons/hourglass';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import Crosshair from 'lucide-react-native/icons/crosshair';
import Gem from 'lucide-react-native/icons/gem';
import Award from 'lucide-react-native/icons/award';

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

function Kaaba({ size = 24, color, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 8l8-4 8 4v10l-8 3-8-3z" />
      <Path d="M4 8l8 3 8-3" />
      <Path d="M12 11v10" />
      <Path d="M4 11.5l8 3 8-3" />
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
  chevronLeft: lucide(ChevronLeft),
  chevronDown: lucide(ChevronDown),
  search: lucide(Search),
  close: lucide(X),
  plus: lucide(Plus),
  minus: lucide(Minus),
  play: lucide(Play),
  pause: lucide(Pause),
  settings: lucide(Settings2),
  locate: lucide(LocateFixed),
  globe: lucide(Globe),
  volume: lucide(Volume2),
  volumeOff: lucide(VolumeX),
  bellOff: lucide(BellOff),
  bellRing: lucide(BellRing),
  reset: lucide(RotateCcw),
  info: lucide(Info),
  pencil: lucide(Pencil),
  trash: lucide(Trash),
  sliders: lucide(SlidersHorizontal),
  textSize: lucide(ALargeSmall),
  languages: lucide(Languages),
  heart: lucide(Heart),
  list: lucide(List),
  clock: lucide(Clock),
  circleCheck: lucide(CircleCheck),
  target: lucide(Target),
  flame: lucide(Flame),
  sunMoon: lucide(SunMoon),
  map: lucide(MapIcon),
  navigation: lucide(Navigation),
  copy: lucide(Copy),
  shield: lucide(Shield),
  bookHeart: lucide(BookHeart),
  library: lucide(Library),
  scroll: lucide(ScrollText),
  repeat: lucide(Repeat),
  coins: lucide(Coins),
  handCoins: lucide(HandCoins),
  wallet: lucide(Wallet),
  briefcase: lucide(Briefcase),
  landmark: lucide(Landmark),
  trendingUp: lucide(TrendingUp),
  receipt: lucide(Receipt),
  scale: lucide(Scale),
  star: lucide(Star),
  table: lucide(Table2),
  calendarRange: lucide(CalendarRange),
  quote: lucide(Quote),
  hourglass: lucide(Hourglass),
  help: lucide(CircleQuestionMark),
  crosshair: lucide(Crosshair),
  gem: lucide(Gem),
  award: lucide(Award),
  kaaba: Kaaba,
} satisfies Record<string, ComponentType<IconProps>>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Glyph = ICONS[name];
  return <Glyph {...props} />;
}
