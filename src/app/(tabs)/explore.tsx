import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { type Tool, TOOL_GROUPS } from '@/features/tools';
import { useTheme } from '@/theme/useTheme';

function ToolCard({ tool }: { tool: Tool }) {
  const t = useTheme();
  return (
    <Press onPress={() => router.push(tool.href)} scaleTo={0.95} style={{ width: '48%', flexGrow: 1 }} accessibilityRole="button" accessibilityLabel={tool.label}>
      <Glass radius={22} padding={14} style={{ gap: 14, minHeight: 112 }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={tool.icon} size={20} color={t.onInk} />
        </View>
        <View style={{ gap: 2 }}>
          <Txt variant="title">{tool.label}</Txt>
          <Txt variant="caption" tone="muted" numberOfLines={2}>
            {tool.blurb}
          </Txt>
        </View>
      </Glass>
    </Press>
  );
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOL_GROUPS;
    return TOOL_GROUPS.map((g) => ({ ...g, tools: g.tools.filter((x) => `${x.label} ${x.blurb}`.toLowerCase().includes(q)) })).filter((g) => g.tools.length);
  }, [query]);

  return (
    <Screen tabs gap={18}>
      <Reveal index={0}>
        <Txt variant="h1" style={{ marginTop: 8 }}>
          Explore
        </Txt>
      </Reveal>
      <Reveal index={1}>
        <Field icon="search" placeholder="Find a tool" value={query} onChangeText={setQuery} autoCorrect={false} />
      </Reveal>
      {groups.map((g, gi) => (
        <Reveal key={g.title} index={gi + 2}>
          <View style={{ gap: 10 }}>
            <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 4 }}>
              {g.title}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {g.tools.map((tool) => (
                <ToolCard key={tool.key} tool={tool} />
              ))}
            </View>
          </View>
        </Reveal>
      ))}
      {groups.length === 0 && (
        <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
          No tool matches “{query}”.
        </Txt>
      )}
    </Screen>
  );
}
