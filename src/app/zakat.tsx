import { ScrollView, TextInput, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { computeZakat, GRAMS_PER_TOLA, NISAB_GRAMS, useZakat, type ZakatInputs } from '@/features/zakat/store';
import { fonts } from '@/theme/fonts';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

const CURRENCIES = ['BDT', 'USD', 'GBP', 'EUR', 'SAR', 'AED', 'INR', 'PKR', 'MYR'];

function MoneyRow({ label, hint, field, suffix }: { label: string; hint?: string; field: keyof ZakatInputs; suffix: string }) {
  const t = useTheme();
  const value = useZakat((s) => s.inputs[field]);
  const setInput = useZakat((s) => s.setInput);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.line }}>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{label}</Txt>
        {hint ? (
          <Txt variant="caption" tone="muted">
            {hint}
          </Txt>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: 138, paddingHorizontal: 12, height: 42, borderRadius: 14, backgroundColor: t.pill }}>
        <TextInput
          value={value}
          onChangeText={(v) => setInput(field, v.replace(/[^0-9.,]/g, ''))}
          placeholder="0"
          placeholderTextColor={t.textMuted}
          keyboardType="decimal-pad"
          accessibilityLabel={label}
          style={{ flex: 1, minWidth: 0, width: '100%', textAlign: 'right', fontFamily: fonts.medium, fontSize: 15, color: t.text, fontVariant: ['tabular-nums'] }}
        />
        <Txt variant="micro" tone="muted">
          {suffix}
        </Txt>
      </View>
    </View>
  );
}

export default function ZakatScreen() {
  const t = useTheme();
  const L = useT();
  const z = useZakat();
  const r = computeZakat(z);
  const unitLabel = L.t(z.unit === 'tola' ? 'zakat.unit.tola' : 'zakat.unit.gram');
  const metal = L.t(z.basis === 'gold' ? 'zakat.metal.gold' : 'zakat.metal.silver');
  const money = (v: number) => `${z.currency} ${L.num(v.toLocaleString('en-US', { maximumFractionDigits: 2 }))}`;
  const nisabWeight = `${L.num(z.unit === 'tola' ? (z.basis === 'gold' ? '7.5' : '52.5') : NISAB_GRAMS[z.basis].toFixed(2))} ${unitLabel}`;

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('zakat.title')} subtitle={L.t('zakat.subtitle')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {CURRENCIES.map((c) => (
          <Press key={c} scaleTo={0.94} onPress={() => z.set({ currency: c })} accessibilityRole="button" accessibilityLabel={c}>
            <Chip variant={z.currency === c ? 'ink' : 'glass'} label={c} />
          </Press>
        ))}
      </ScrollView>

      <Glass radius={26} padding={16} style={{ gap: 12 }}>
        <Txt variant="title">{L.t('zakat.nisab')}</Txt>
        <Segmented
          value={z.basis}
          onChange={(basis) => z.set({ basis })}
          options={[
            { value: 'silver', label: L.t('zakat.silver') },
            { value: 'gold', label: L.t('zakat.gold') },
          ]}
        />
        <Segmented
          value={z.unit}
          onChange={(unit) => z.set({ unit })}
          options={[
            { value: 'tola', label: L.t('zakat.unitTola') },
            { value: 'gram', label: L.t('zakat.unitGram') },
          ]}
        />
        <Txt variant="caption" tone="muted">
          {L.t('zakat.silverAdvice', { g: GRAMS_PER_TOLA })}
        </Txt>
        <MoneyRow label={L.t('zakat.goldPrice')} hint={L.t('zakat.pricePer', { unit: unitLabel })} field="goldPrice" suffix={z.currency} />
        <MoneyRow label={L.t('zakat.silverPrice')} hint={L.t('zakat.pricePer', { unit: unitLabel })} field="silverPrice" suffix={z.currency} />
      </Glass>

      <Glass radius={26} padding={16} style={{ gap: 4 }}>
        <Txt variant="title" style={{ marginBottom: 4 }}>
          {L.t('zakat.own')}
        </Txt>
        <MoneyRow label={L.t('zakat.cash')} field="cash" suffix={z.currency} />
        <MoneyRow label={L.t('zakat.bank')} hint={L.t('zakat.bankHint')} field="bank" suffix={z.currency} />
        <MoneyRow label={L.t('zakat.goldW')} hint={L.t('zakat.goldHint')} field="goldWeight" suffix={unitLabel} />
        <MoneyRow label={L.t('zakat.silverW')} hint={L.t('zakat.silverHint')} field="silverWeight" suffix={unitLabel} />
        <MoneyRow label={L.t('zakat.business')} hint={L.t('zakat.businessHint')} field="business" suffix={z.currency} />
        <MoneyRow label={L.t('zakat.investments')} field="investments" suffix={z.currency} />
        <MoneyRow label={L.t('zakat.receivable')} hint={L.t('zakat.receivableHint')} field="receivable" suffix={z.currency} />
        <MoneyRow label={L.t('zakat.other')} field="other" suffix={z.currency} />
      </Glass>

      <Glass radius={26} padding={16} style={{ gap: 4 }}>
        <Txt variant="title" style={{ marginBottom: 4 }}>
          {L.t('zakat.owe')}
        </Txt>
        <MoneyRow label={L.t('zakat.debts')} field="debts" suffix={z.currency} />
      </Glass>

      <Glass strong radius={28} padding={20} style={{ gap: 10 }}>
        {[
          [L.t('zakat.totalAssets'), money(r.assets)],
          [L.t('zakat.lessDebts'), money(r.debts)],
          [L.t('zakat.net'), money(r.net)],
          [L.t('zakat.threshold'), r.nisab === null ? L.t('zakat.enterPrice', { metal }) : `${money(r.nisab)} (${nisabWeight})`],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Txt variant="body" tone="soft">
              {k}
            </Txt>
            <Txt variant="bodyStrong" tabular style={{ flexShrink: 1, textAlign: 'right' }}>
              {v}
            </Txt>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: t.line, marginVertical: 4 }} />
        <Txt variant="eyebrow" tone="muted">
          {L.t('zakat.due')}
        </Txt>
        <Txt variant="h1" tabular>
          {money(r.due)}
        </Txt>
        <Txt variant="caption" tone="soft">
          {r.nisab === null
            ? L.t('zakat.addPrice', { metal })
            : r.net >= r.nisab
              ? L.t('zakat.above')
              : L.t('zakat.below')}
        </Txt>
        {(r.missingGoldPrice || r.missingSilverPrice) && (
          <Txt variant="caption" tone="soft">
            {L.t('zakat.missingPrice', { metal: L.t(r.missingGoldPrice ? 'zakat.metal.gold' : 'zakat.metal.silver') })}
          </Txt>
        )}
      </Glass>

      <Glass radius={22} padding={14} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="info" size={18} color={t.textSoft} />
        <Txt variant="caption" tone="soft" style={{ flex: 1 }}>
          {L.t('zakat.notes')}
        </Txt>
      </Glass>

      <Press onPress={z.reset} style={{ alignSelf: 'center', padding: 8 }} accessibilityRole="button">
        <Txt variant="caption" tone="soft">
          {L.t('zakat.clear')}
        </Txt>
      </Press>
    </Screen>
  );
}
