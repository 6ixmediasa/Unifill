import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardTypeOptions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { palette } from './theme';

export const topInset = Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0;
export const bottomNavInset = Platform.OS === 'android' ? 30 : 18;
export const bottomTabHeight = 62 + bottomNavInset;

let adsInitPromise: Promise<unknown> | null = null;
function initializeTestAds() {
  if (!adsInitPromise) {
    adsInitPromise = mobileAds()
      .setRequestConfiguration({ testDeviceIdentifiers: ['EMULATOR'] })
      .then(() => mobileAds().initialize());
  }
  return adsInitPromise;
}

function TestAdBanner() {
  const [state, setState] = useState<'initializing' | 'loading' | 'loaded' | 'error'>('initializing');
  useEffect(() => {
    let mounted = true;
    initializeTestAds()
      .then(() => { if (mounted) setState('loading'); })
      .catch(() => { if (mounted) setState('error'); });
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.adWrap}>
      <Text style={styles.adLabel}>GOOGLE TEST AD</Text>
      {state === 'initializing' ? <Text style={styles.adStatus}>Initializing Google Mobile Ads…</Text> : null}
      {state === 'error' ? <Text style={styles.adError}>Test ad unavailable — check the network.</Text> : null}
      {state === 'loading' || state === 'loaded' ? (
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => setState('loaded')}
          onAdFailedToLoad={() => setState('error')}
        />
      ) : null}
    </View>
  );
}

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  if (!scroll) {
    return <View style={[styles.screen, { paddingTop: topInset }]}>{children}</View>;
  }
  return (
    <View style={[styles.screen, { paddingTop: topInset }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
    </View>
  );
}

export function BrandHeader({ title, onBack }: { title?: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
      ) : (
        <Image source={require('../assets/logo-horizontal.png')} style={styles.logo} resizeMode="contain" />
      )}
      {title ? <Text style={styles.headerTitle}>{title}</Text> : <View style={{ flex: 1 }} />}
      {onBack ? <View style={styles.headerButton} /> : null}
    </View>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const background = variant === 'primary' ? palette.primary : variant === 'danger' ? '#FDECEC' : palette.surfaceAlt;
  const foreground = variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? palette.danger : palette.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 }
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={foreground} /> : null}
      <Text style={[styles.buttonText, { color: foreground }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType = 'default',
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA6B5"
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && { minHeight: 94, textAlignVertical: 'top' }]}
        {...rest}
      />
    </View>
  );
}

export function EmptyState({ icon, title, body }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 34 }}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={palette.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Muted style={{ textAlign: 'center' }}>{body}</Muted>
    </Card>
  );
}

export type TabKey = 'home' | 'documents' | 'clients' | 'jobs' | 'more';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const tabs: { key: TabKey; label: string; icon: IconName; active: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', active: 'home' },
  { key: 'documents', label: 'Documents', icon: 'document-text-outline', active: 'document-text' },
  { key: 'clients', label: 'Clients', icon: 'people-outline', active: 'people' },
  { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline', active: 'briefcase' },
  { key: 'more', label: 'More', icon: 'ellipsis-horizontal-circle-outline', active: 'ellipsis-horizontal-circle' }
];

export function BottomTabs({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <View style={styles.bottomArea}>
      {active === 'home' ? <TestAdBanner /> : null}
      <View style={[styles.tabBar, { height: bottomTabHeight, paddingBottom: bottomNavInset }]}>
        {tabs.map((tab) => {
          const selected = tab.key === active;
          const color = selected ? palette.primary : '#526176';
          return (
            <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.tabButton}>
              <Ionicons name={selected ? tab.active : tab.icon} size={23} color={color} />
              <Text style={[styles.tabLabel, { color }, selected && { fontWeight: '900' }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function formatMoney(minor: number, currency: string) {
  const amount = Number(minor || 0) / 100;
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: currency || 'ZAR' }).format(amount);
  } catch {
    return `${currency || 'ZAR'} ${amount.toFixed(2)}`;
  }
}

export function Row({
  icon,
  title,
  subtitle,
  onPress,
  trailing
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const body = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={palette.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Muted>{subtitle}</Muted> : null}
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={palette.muted} /> : null)}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 110 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '900', color: palette.text },
  logo: { width: 134, height: 44 },
  h1: { color: palette.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  h2: { color: palette.text, fontSize: 18, fontWeight: '900' },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 18, padding: 16 },
  button: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  buttonText: { fontSize: 15, fontWeight: '900' },
  label: { color: palette.text, fontWeight: '800', fontSize: 13 },
  input: { minHeight: 50, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: palette.text, fontSize: 15 },
  emptyIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: palette.text, fontWeight: '900', fontSize: 17, marginBottom: 4 },
  bottomArea: { backgroundColor: palette.surface },
  adWrap: { minHeight: 72, backgroundColor: '#FAFBFD', borderTopWidth: 1, borderTopColor: palette.border, alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: 6, gap: 2 },
  adLabel: { color: palette.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  adStatus: { color: palette.muted, fontSize: 11, fontWeight: '700', paddingVertical: 12 },
  adError: { color: palette.danger, fontSize: 11, fontWeight: '700', paddingVertical: 12 },
  tabBar: { paddingTop: 8, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border, flexDirection: 'row', alignItems: 'stretch' },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 0 },
  tabLabel: { fontSize: 10, fontWeight: '800' },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: palette.text, fontWeight: '800', fontSize: 15 }
});
