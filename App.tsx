import React, { Component, ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getSetting, initDatabase } from './src/db';
import { palette } from './src/theme';
import {
  AboutScreen,
  BusinessSettingsScreen,
  ClientFormScreen,
  DocumentFormScreen,
  JobFormScreen,
  Onboarding,
  ReportsScreen,
  Route,
  SetupScreen,
  TabsScreen
} from './src/screens';
import { TabKey, topInset } from './src/ui';

type ErrorState = { error: Error | null };

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorState> {
  state: ErrorState = { error: null };
  static getDerivedStateFromError(error: Error): ErrorState { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={[styles.center, { paddingTop: topInset, paddingHorizontal: 26 }]}>
          <Image source={require('./assets/logo-horizontal.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.errorTitle}>Unifill could not open this screen.</Text>
          <Text style={styles.errorBody}>{this.state.error.message || 'An unexpected error occurred.'}</Text>
          <Pressable style={styles.retry} onPress={() => this.setState({ error: null })}><Text style={styles.retryText}>Try Again</Text></Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function UnifillApp() {
  const [boot, setBoot] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bootError, setBootError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [stack, setStack] = useState<Route[]>([{ name: 'tabs', tab: 'home' }]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await initDatabase();
        const complete = await getSetting('onboarding_complete', '0');
        if (!active) return;
        setNeedsSetup(complete !== '1');
        setBoot('ready');
      } catch (error) {
        if (!active) return;
        setBootError(error instanceof Error ? error.message : 'Database initialization failed.');
        setBoot('error');
      }
    })();
    return () => { active = false; };
  }, []);

  const current = stack[stack.length - 1];
  const navigate = (route: Route) => setStack((previous) => [...previous, route]);
  const back = () => setStack((previous) => previous.length > 1 ? previous.slice(0, -1) : [{ name: 'tabs', tab: 'home' }]);
  const switchTab = (tab: TabKey) => setStack([{ name: 'tabs', tab }]);

  if (boot === 'loading') {
    return (
      <View style={[styles.center, { paddingTop: topInset }]}>
        <Image source={require('./assets/logo-horizontal.png')} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loading}>Starting Unifill…</Text>
      </View>
    );
  }

  if (boot === 'error') {
    return (
      <View style={[styles.center, { paddingTop: topInset, paddingHorizontal: 26 }]}>
        <Image source={require('./assets/logo-horizontal.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.errorTitle}>Unifill needs a fresh start.</Text>
        <Text style={styles.errorBody}>{bootError}</Text>
        <Text style={styles.hint}>Close the app, clear its storage once, then open this clean rebuild again.</Text>
      </View>
    );
  }

  if (needsSetup && !showSetup) return <Onboarding onComplete={() => setShowSetup(true)} />;
  if (needsSetup && showSetup) return <SetupScreen onDone={() => { setNeedsSetup(false); setShowSetup(false); setStack([{ name: 'tabs', tab: 'home' }]); }} />;

  if (current.name === 'tabs') return <TabsScreen tab={current.tab} navigate={navigate} switchTab={switchTab} />;
  if (current.name === 'clientForm') return <ClientFormScreen id={current.id} onBack={back} />;
  if (current.name === 'jobForm') return <JobFormScreen id={current.id} onBack={back} />;
  if (current.name === 'documentForm') return <DocumentFormScreen kind={current.kind} onBack={back} />;
  if (current.name === 'businessSettings') return <BusinessSettingsScreen onBack={back} />;
  if (current.name === 'reports') return <ReportsScreen onBack={back} />;
  return <AboutScreen onBack={back} restartSetup={() => { setNeedsSetup(true); setShowSetup(false); setStack([{ name: 'tabs', tab: 'home' }]); }} />;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <StatusBar style="dark" />
      <UnifillApp />
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 18 },
  logo: { width: 190, height: 78 },
  loading: { color: palette.muted, fontWeight: '700' },
  errorTitle: { color: palette.text, fontSize: 22, lineHeight: 28, fontWeight: '900', textAlign: 'center' },
  errorBody: { color: palette.danger, textAlign: 'center', lineHeight: 21 },
  hint: { color: palette.muted, textAlign: 'center', lineHeight: 21 },
  retry: { backgroundColor: palette.primary, borderRadius: 15, paddingHorizontal: 24, paddingVertical: 14 },
  retryText: { color: '#fff', fontWeight: '900' }
});
