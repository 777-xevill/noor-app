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
  const z = useZakat();
  const r = computeZakat(z);
  const unitLabel = z.unit === 'tola' ? 'bhori' : 'g';
  const money = (v: number) => `${z.currency} ${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const nisabWeight = z.unit === 'tola' ? `${z.basis === 'gold' ? '7.5' : '52.5'} bhori` : `${NISAB_GRAMS[z.basis].toFixed(2)} g`;

  return (
    <Screen gap={16}>
      <ScreenHeader title="Zakat" subtitle="2.5% of qualifying wealth above nisab" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {CURRENCIES.map((c) => (
          <Press key={c} scaleTo={0.94} onPress={() => z.set({ currency: c })} accessibilityRole="button" accessibilityLabel={c}>
            <Chip variant={z.currency === c ? 'ink' : 'glass'} label={c} />
          </Press>
        ))}
      </ScrollView>

      <Glass radius={26} padding={16} style={{ gap: 12 }}>
        <Txt variant="title">Nisab</Txt>
        <Segmented
          value={z.basis}
          onChange={(basis) => z.set({ basis })}
          options={[
            { value: 'silver', label: 'Silver · 52.5 bhori' },
            { value: 'gold', label: 'Gold · 7.5 bhori' },
          ]}
        />
        <Segmented
          value={z.unit}
          onChange={(unit) => z.set({ unit })}
          options={[
            { value: 'tola', label: 'Bhori / tola' },
            { value: 'gram', label: 'Grams' },
          ]}
        />
        <Txt variant="caption" tone="muted">
          Many scholars advise the silver nisab when your wealth is mostly cash, as it reaches more people in need. 1 bhori (tola) = {GRAMS_PER_TOLA} g.
        </Txt>
        <MoneyRow label="Gold price" hint={`Today’s price per ${unitLabel}`} field="goldPrice" suffix={z.currency} />
        <MoneyRow label="Silver price" hint={`Today’s price per ${unitLabel}`} field="silverPrice" suffix={z.currency} />
      </Glass>

      <Glass radius={26} padding={16} style={{ gap: 4 }}>
        <Txt variant="title" style={{ marginBottom: 4 }}>
          What you own
        </Txt>
        <MoneyRow label="Cash in hand" field="cash" suffix={z.currency} />
        <MoneyRow label="Bank and mobile accounts" hint="Including bKash, Nagad, savings" field="bank" suffix={z.currency} />
        <MoneyRow label="Gold" hint="Weight, including jewellery*" field="goldWeight" suffix={unitLabel} />
        <MoneyRow label="Silver" hint="Weight" field="silverWeight" suffix={unitLabel} />
        <MoneyRow label="Business stock" hint="Goods for sale, at sale value" field="business" suffix={z.currency} />
        <MoneyRow label="Shares and investments" field="investments" suffix={z.currency} />
        <MoneyRow label="Money owed to you" hint="Only if you expect it back" field="receivable" suffix={z.currency} />
        <MoneyRow label="Other savings" field="other" suffix={z.currency} />
      </Glass>

      <Glass radius={26} padding={16} style={{ gap: 4 }}>
        <Txt variant="title" style={{ marginBottom: 4 }}>
          What you owe
        </Txt>
        <MoneyRow label="Debts and bills due now" field="debts" suffix={z.currency} />
      </Glass>

      <Glass strong radius={28} padding={20} style={{ gap: 10 }}>
        {[
          ['Total assets', money(r.assets)],
          ['Less debts', money(r.debts)],
          ['Net wealth', money(r.net)],
          ['Nisab threshold', r.nisab === null ? `Enter ${z.basis} price` : `${money(r.nisab)} (${nisabWeight})`],
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
          Zakat due
        </Txt>
        <Txt variant="h1" tabular>
          {money(r.due)}
        </Txt>
        <Txt variant="caption" tone="soft">
          {r.nisab === null
            ? `Add today’s ${z.basis} price to check your wealth against nisab.`
            : r.net >= r.nisab
              ? 'Your net wealth is above nisab. Zakat is 2.5% of it, once a full Hijri year has passed.'
              : 'Your net wealth is below nisab, so no Zakat is due on it.'}
        </Txt>
        {(r.missingGoldPrice || r.missingSilverPrice) && (
          <Txt variant="caption" tone="soft">
            Add the {r.missingGoldPrice ? 'gold' : 'silver'} price so your {r.missingGoldPrice ? 'gold' : 'silver'} is counted.
          </Txt>
        )}
      </Glass>

      <Glass radius={22} padding={14} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="info" size={18} color={t.textSoft} />
        <Txt variant="caption" tone="soft" style={{ flex: 1 }}>
          Zakat is due when your net wealth stays at or above nisab for one full lunar (Hijri) year. Your home, car, furniture and personal items are not counted.
          {'\n\n'}*Hanafi scholars count gold and silver jewellery; other schools exempt jewellery worn for personal use.
          {'\n\n'}Crops, livestock and business partnerships have separate Zakat rules and aren’t calculated here. For your situation, consult a scholar.
        </Txt>
      </Glass>

      <Press onPress={z.reset} style={{ alignSelf: 'center', padding: 8 }} accessibilityRole="button">
        <Txt variant="caption" tone="soft">
          Clear all amounts
        </Txt>
      </Press>
    </Screen>
  );
}
