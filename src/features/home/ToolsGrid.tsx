import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Txt } from '@/components/Txt';
import { CORE_TOOLS, type Tool } from '@/features/tools';
import { useTheme } from '@/theme/useTheme';

function ToolTile({ tool }: { tool: Tool }) {
  const t = useTheme();
  return (
    <Press
      style={{ flex: 1 }}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityLabel={tool.label}
      onPress={() => router.push(tool.href)}
    >
      <Glass radius={22} padding={0} style={{ height: 92, alignItems: 'center', justifyContent: 'center', gap: 9 }}>
        <Icon name={tool.icon} size={24} color={t.text} />
        <Txt variant="caption" tone="soft" numberOfLines={1}>
          {tool.label}
        </Txt>
      </Glass>
    </Press>
  );
}

export function ToolsGrid({ tools = CORE_TOOLS }: { tools?: Tool[] }) {
  const rows: Tool[][] = [];
  for (let i = 0; i < tools.length; i += 4) rows.push(tools.slice(i, i + 4));
  return (
    <View style={{ gap: 10 }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((tool) => (
            <ToolTile key={tool.key} tool={tool} />
          ))}
          {Array.from({ length: 4 - row.length }, (_, j) => (
            <View key={`pad${j}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}
