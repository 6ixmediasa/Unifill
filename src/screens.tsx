import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BusinessProfile,
  Client,
  createDocument,
  Dashboard,
  DocumentKind,
  DocumentSummary,
  getBusinessProfile,
  getClient,
  getDashboard,
  getJob,
  getSetting,
  Job,
  listClients,
  listDocuments,
  listJobs,
  resetOnboarding,
  saveBusinessProfile,
  saveClient,
  saveJob,
  setSetting
} from './db';
import {
  BottomTabs,
  BrandHeader,
  Button,
  Card,
  EmptyState,
  Field,
  formatMoney,
  H1,
  H2,
  Muted,
  Row,
  Screen,
  TabKey,
  topInset
} from './ui';
import { palette } from './theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type Route =
  | { name: 'tabs'; tab: TabKey }
  | { name: 'clientForm'; id?: string }
  | { name: 'jobForm'; id?: string }
  | { name: 'documentForm'; kind: DocumentKind }
  | { name: 'businessSettings' }
  | { name: 'reports' }
  | { name: 'about' };

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const slides = [
    { icon: 'briefcase-outline' as IconName, title: 'Run Your Business.\nNot Your Software.', body: 'Professional estimates, invoices, jobs and clients in one simple contractor app.', tag: 'Always free · No subscriptions' },
    { icon: 'infinite-outline' as IconName, title: 'Free Means Free.', body: 'Unlimited estimates, invoices, clients and jobs. No premium feature locks.', tag: 'Core tools stay available' },
    { icon: 'shield-checkmark-outline' as IconName, title: 'Your Business.\nYour Data.', body: 'Unifill is local-first. Your core business records are stored on your device.', tag: 'Built for contractors' },
    { icon: 'cloud-offline-outline' as IconName, title: 'No Signal?\nKeep Working.', body: 'Create clients, jobs, estimates and invoices without depending on an internet connection.', tag: 'Offline-first workflow' }
  ];
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  return (
    <View style={[styles.full, { paddingTop: topInset }]}>
      <View style={styles.onboardingTop}>
        <Image source={require('../assets/logo-horizontal.png')} style={{ width: 138, height: 48 }} resizeMode="contain" />
        <Pressable onPress={onComplete}><Muted>Skip</Muted></Pressable>
      </View>
      <View style={styles.onboardingBody}>
        <View style={styles.illustration}><Ionicons name={slide.icon} size={74} color={palette.primary} /></View>
        <Text style={styles.onboardingTitle}>{slide.title}</Text>
        <Muted style={{ textAlign: 'center', fontSize: 16, lineHeight: 24 }}>{slide.body}</Muted>
        <View style={styles.pill}><Text style={styles.pillText}>{slide.tag}</Text></View>
      </View>
      <View style={styles.onboardingBottom}>
        <View style={styles.dots}>{slides.map((_, i) => <View key={i} style={[styles.dot, i === index && styles.dotActive]} />)}</View>
        <Button title={index === slides.length - 1 ? 'Set Up My Business' : 'Continue'} icon="arrow-forward" onPress={() => index === slides.length - 1 ? onComplete() : setIndex(index + 1)} />
        <Muted>No account needed.</Muted>
      </View>
    </View>
  );
}

export function SetupScreen({ onDone }: { onDone: () => void }) {
  const [profile, setProfile] = useState<BusinessProfile>({ name: '', owner: '', phone: '', email: '', address: '' });
  const [currency, setCurrency] = useState('ZAR');
  const [tax, setTax] = useState('15');
  const [busy, setBusy] = useState(false);
  const save = async (skip = false) => {
    setBusy(true);
    try {
      if (skip) await setSetting('onboarding_complete', '1');
      else await saveBusinessProfile(profile, currency, tax);
      onDone();
    } catch (error) {
      Alert.alert('Could not save setup', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  };
  return (
    <Screen>
      <BrandHeader />
      <View style={{ gap: 5 }}><H1>Set up your business</H1><Muted>Just the essentials. You can change these details later.</Muted></View>
      <Field label="Business name" value={profile.name} onChangeText={(name) => setProfile({ ...profile, name })} placeholder="Your Business Name" />
      <Field label="Owner / contact" value={profile.owner} onChangeText={(owner) => setProfile({ ...profile, owner })} />
      <Field label="Phone" value={profile.phone} onChangeText={(phone) => setProfile({ ...profile, phone })} keyboardType="phone-pad" />
      <Field label="Email" value={profile.email} onChangeText={(email) => setProfile({ ...profile, email })} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Address" value={profile.address} onChangeText={(address) => setProfile({ ...profile, address })} multiline />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Field label="Currency" value={currency} onChangeText={setCurrency} autoCapitalize="characters" /></View>
        <View style={{ flex: 1 }}><Field label="Tax %" value={tax} onChangeText={setTax} keyboardType="decimal-pad" /></View>
      </View>
      <Button title="Set Up My Business" onPress={() => save(false)} disabled={busy} />
      <Button title="Skip for now" variant="secondary" onPress={() => save(true)} disabled={busy} />
    </Screen>
  );
}

export function TabsScreen({ tab, navigate, switchTab }: { tab: TabKey; navigate: (route: Route) => void; switchTab: (tab: TabKey) => void }) {
  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' ? <HomeScreen navigate={navigate} /> : null}
      {tab === 'documents' ? <DocumentsScreen navigate={navigate} /> : null}
      {tab === 'clients' ? <ClientsScreen navigate={navigate} /> : null}
      {tab === 'jobs' ? <JobsScreen navigate={navigate} /> : null}
      {tab === 'more' ? <MoreScreen navigate={navigate} /> : null}
      <BottomTabs active={tab} onChange={switchTab} />
    </View>
  );
}

function HomeScreen({ navigate }: { navigate: (route: Route) => void }) {
  const [data, setData] = useState<Dashboard>({ invoiced: 0, paid: 0, outstanding: 0, overdue: 0, activeJobs: 0, openEstimates: 0 });
  const [currency, setCurrency] = useState('ZAR');
  const [recent, setRecent] = useState<DocumentSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    const [metrics, curr, docs] = await Promise.all([getDashboard(), getSetting('currency', 'ZAR'), listDocuments()]);
    setData(metrics); setCurrency(curr); setRecent(docs.filter((doc) => doc.kind === 'invoice').slice(0, 4));
  }, []);
  useEffect(() => { load().catch(() => undefined); }, [load]);
  const refresh = async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } };
  const metric = (icon: IconName, label: string, value: number, color: string) => (
    <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon} size={19} color={color} /></View><View style={{ flex: 1 }}><Muted>{label}</Muted><Text style={styles.metricValue}>{formatMoney(value, currency)}</Text></View></View>
  );
  const quick = (icon: IconName, label: string, route: Route) => (
    <Pressable key={label} onPress={() => navigate(route)} style={styles.quick}><Ionicons name={icon} size={23} color={palette.primary} /><Text style={styles.quickText}>{label}</Text></Pressable>
  );
  return (
    <View style={[styles.full, { paddingTop: topInset }]}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} contentContainerStyle={styles.tabContent}>
        <BrandHeader />
        <View><H1>Overview</H1><Muted>Your business at a glance.</Muted></View>
        <Card>{metric('cash-outline', 'Invoiced', data.invoiced, palette.info)}{metric('checkmark-circle-outline', 'Paid', data.paid, palette.success)}{metric('time-outline', 'Outstanding', data.outstanding, palette.warning)}{metric('alert-circle-outline', 'Overdue', data.overdue, palette.danger)}</Card>
        <View style={{ gap: 9 }}><H2>Quick Actions</H2><View style={styles.quickRow}>{quick('document-text-outline', 'New Estimate', { name: 'documentForm', kind: 'estimate' })}{quick('receipt-outline', 'New Invoice', { name: 'documentForm', kind: 'invoice' })}{quick('person-add-outline', 'New Client', { name: 'clientForm' })}{quick('briefcase-outline', 'New Job', { name: 'jobForm' })}</View></View>
        <View style={{ flexDirection: 'row', gap: 12 }}><Card style={{ flex: 1 }}><Muted>Active Jobs</Muted><Text style={styles.bigNumber}>{data.activeJobs}</Text></Card><Card style={{ flex: 1 }}><Muted>Open Estimates</Muted><Text style={styles.bigNumber}>{data.openEstimates}</Text></Card></View>
        <View style={{ gap: 9 }}><H2>Recent invoices</H2>{recent.length === 0 ? <EmptyState icon="receipt-outline" title="No invoices yet" body="Create your first invoice from Quick Actions." /> : recent.map((doc) => <Card key={doc.id} style={{ paddingVertical: 10 }}><Row icon="receipt-outline" title={doc.number} subtitle={`${doc.client_name || 'No client'} · ${formatMoney(doc.total_minor, currency)}`} /></Card>)}</View>
      </ScrollView>
    </View>
  );
}

function ClientsScreen({ navigate }: { navigate: (route: Route) => void }) {
  const [rows, setRows] = useState<Client[]>([]); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => setRows(await listClients()), []);
  useEffect(() => { load().catch(() => undefined); }, [load]);
  const refresh = async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } };
  return (
    <View style={[styles.full, { paddingTop: topInset }]}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} contentContainerStyle={styles.tabContent}>
      <BrandHeader /><View style={styles.titleRow}><View style={{ flex: 1 }}><H1>Clients</H1><Muted>People and businesses you work with.</Muted></View><Pressable style={styles.addButton} onPress={() => navigate({ name: 'clientForm' })}><Ionicons name="add" size={25} color="#fff" /></Pressable></View>
      {rows.length === 0 ? <EmptyState icon="people-outline" title="No clients yet" body="Add a client to start creating jobs, estimates and invoices." /> : rows.map((client) => <Card key={client.id} style={{ paddingVertical: 8 }}><Row icon="person-outline" title={client.name} subtitle={client.company || client.phone || client.email || 'Client'} onPress={() => navigate({ name: 'clientForm', id: client.id })} /></Card>)}
    </ScrollView></View>
  );
}

function JobsScreen({ navigate }: { navigate: (route: Route) => void }) {
  const [rows, setRows] = useState<Job[]>([]); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => setRows(await listJobs()), []);
  useEffect(() => { load().catch(() => undefined); }, [load]);
  const refresh = async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } };
  return (
    <View style={[styles.full, { paddingTop: topInset }]}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} contentContainerStyle={styles.tabContent}>
      <BrandHeader /><View style={styles.titleRow}><View style={{ flex: 1 }}><H1>Jobs</H1><Muted>Track work from lead to completion.</Muted></View><Pressable style={styles.addButton} onPress={() => navigate({ name: 'jobForm' })}><Ionicons name="add" size={25} color="#fff" /></Pressable></View>
      {rows.length === 0 ? <EmptyState icon="briefcase-outline" title="No jobs yet" body="Create a job and connect it to a client." /> : rows.map((job) => <Card key={job.id} style={{ paddingVertical: 8 }}><Row icon="briefcase-outline" title={job.name} subtitle={`${job.status}${job.client_name ? ` · ${job.client_name}` : ''}`} onPress={() => navigate({ name: 'jobForm', id: job.id })} /></Card>)}
    </ScrollView></View>
  );
}

function DocumentsScreen({ navigate }: { navigate: (route: Route) => void }) {
  const [rows, setRows] = useState<DocumentSummary[]>([]); const [currency, setCurrency] = useState('ZAR'); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { const [docs, curr] = await Promise.all([listDocuments(), getSetting('currency', 'ZAR')]); setRows(docs); setCurrency(curr); }, []);
  useEffect(() => { load().catch(() => undefined); }, [load]);
  const refresh = async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } };
  return (
    <View style={[styles.full, { paddingTop: topInset }]}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} contentContainerStyle={styles.tabContent}>
      <BrandHeader /><View><H1>Documents</H1><Muted>Estimates and invoices in one place.</Muted></View>
      <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title="Estimate" icon="document-text-outline" onPress={() => navigate({ name: 'documentForm', kind: 'estimate' })} /></View><View style={{ flex: 1 }}><Button title="Invoice" icon="receipt-outline" onPress={() => navigate({ name: 'documentForm', kind: 'invoice' })} /></View></View>
      {rows.length === 0 ? <EmptyState icon="documents-outline" title="No documents yet" body="Create an estimate or invoice to get started." /> : rows.map((doc) => <Card key={`${doc.kind}-${doc.id}`} style={{ paddingVertical: 8 }}><Row icon={doc.kind === 'invoice' ? 'receipt-outline' : 'document-text-outline'} title={doc.number} subtitle={`${doc.kind === 'invoice' ? 'Invoice' : 'Estimate'} · ${doc.client_name || 'No client'} · ${doc.status}`} trailing={<Text style={styles.amountText}>{formatMoney(doc.total_minor, currency)}</Text>} /></Card>)}
    </ScrollView></View>
  );
}

function MoreScreen({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <View style={[styles.full, { paddingTop: topInset }]}><ScrollView contentContainerStyle={styles.tabContent}>
      <BrandHeader /><View><H1>More</H1><Muted>Settings and business tools.</Muted></View>
      <Card style={{ paddingVertical: 4 }}><Row icon="business-outline" title="Business settings" subtitle="Name, contact, currency and tax" onPress={() => navigate({ name: 'businessSettings' })} /><View style={styles.separator} /><Row icon="bar-chart-outline" title="Reports" subtitle="Business totals and activity" onPress={() => navigate({ name: 'reports' })} /><View style={styles.separator} /><Row icon="information-circle-outline" title="About Unifill" subtitle="Version and product promise" onPress={() => navigate({ name: 'about' })} /></Card>
      <Card><Text style={styles.freeTitle}>Always Free</Text><Muted>No subscriptions. No premium locks. Unlimited clients, jobs, estimates and invoices.</Muted></Card>
    </ScrollView></View>
  );
}

export function ClientFormScreen({ id, onBack }: { id?: string; onBack: () => void }) {
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', billing_address: '', notes: '' }); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!id) return; getClient(id).then((client) => client && setForm({ name: client.name, company: client.company || '', phone: client.phone || '', email: client.email || '', billing_address: client.billing_address || '', notes: client.notes || '' })).catch(() => undefined); }, [id]);
  const submit = async () => { if (!form.name.trim()) { Alert.alert('Client name required', 'Enter a client name before saving.'); return; } setBusy(true); try { await saveClient({ id, ...form, name: form.name }); onBack(); } catch (error) { Alert.alert('Could not save client', error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); } };
  return <Screen><BrandHeader title={id ? 'Edit Client' : 'New Client'} onBack={onBack} /><Field label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Client name" /><Field label="Company" value={form.company} onChangeText={(company) => setForm({ ...form, company })} /><Field label="Phone" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} keyboardType="phone-pad" /><Field label="Email" value={form.email} onChangeText={(email) => setForm({ ...form, email })} keyboardType="email-address" autoCapitalize="none" /><Field label="Billing address" value={form.billing_address} onChangeText={(billing_address) => setForm({ ...form, billing_address })} multiline /><Field label="Notes" value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} multiline /><Button title={id ? 'Save Changes' : 'Add Client'} onPress={submit} disabled={busy} /></Screen>;
}

export function JobFormScreen({ id, onBack }: { id?: string; onBack: () => void }) {
  const [clients, setClients] = useState<Client[]>([]); const [form, setForm] = useState({ name: '', client_id: '', service_address: '', status: 'Lead', notes: '' }); const [busy, setBusy] = useState(false);
  useEffect(() => { listClients().then(setClients).catch(() => undefined); if (id) getJob(id).then((job) => job && setForm({ name: job.name, client_id: job.client_id || '', service_address: job.service_address || '', status: job.status || 'Lead', notes: job.notes || '' })).catch(() => undefined); }, [id]);
  const submit = async () => { if (!form.name.trim()) { Alert.alert('Job name required', 'Enter a job name before saving.'); return; } setBusy(true); try { await saveJob({ id, ...form, client_id: form.client_id || null, name: form.name, status: form.status }); onBack(); } catch (error) { Alert.alert('Could not save job', error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); } };
  return (
    <Screen><BrandHeader title={id ? 'Edit Job' : 'New Job'} onBack={onBack} /><Field label="Job name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="e.g. Bathroom renovation" />
      <Text style={styles.fieldLabel}>Client</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}><Pressable onPress={() => setForm({ ...form, client_id: '' })} style={[styles.choice, !form.client_id && styles.choiceActive]}><Text style={[styles.choiceText, !form.client_id && styles.choiceTextActive]}>No client</Text></Pressable>{clients.map((client) => <Pressable key={client.id} onPress={() => setForm({ ...form, client_id: client.id })} style={[styles.choice, form.client_id === client.id && styles.choiceActive]}><Text style={[styles.choiceText, form.client_id === client.id && styles.choiceTextActive]}>{client.name}</Text></Pressable>)}</ScrollView>
      <Field label="Service address" value={form.service_address} onChangeText={(service_address) => setForm({ ...form, service_address })} multiline /><Text style={styles.fieldLabel}>Status</Text><View style={styles.statusWrap}>{['Lead', 'Scheduled', 'In Progress', 'Complete'].map((status) => <Pressable key={status} onPress={() => setForm({ ...form, status })} style={[styles.choice, form.status === status && styles.choiceActive]}><Text style={[styles.choiceText, form.status === status && styles.choiceTextActive]}>{status}</Text></Pressable>)}</View><Field label="Notes" value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} multiline /><Button title={id ? 'Save Changes' : 'Create Job'} onPress={submit} disabled={busy} />
    </Screen>
  );
}

export function DocumentFormScreen({ kind, onBack }: { kind: DocumentKind; onBack: () => void }) {
  const [clients, setClients] = useState<Client[]>([]); const [clientId, setClientId] = useState(''); const [description, setDescription] = useState('Services'); const [amount, setAmount] = useState('0.00'); const [busy, setBusy] = useState(false);
  useEffect(() => { listClients().then(setClients).catch(() => undefined); }, []);
  const submit = async () => { const amountMinor = Math.round((Number(amount.replace(/,/g, '')) || 0) * 100); if (amountMinor < 0) { Alert.alert('Invalid amount', 'Enter a valid amount.'); return; } setBusy(true); try { await createDocument({ kind, client_id: clientId || null, description, amount_minor: amountMinor }); onBack(); } catch (error) { Alert.alert(`Could not create ${kind}`, error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); } };
  return (
    <Screen><BrandHeader title={kind === 'invoice' ? 'New Invoice' : 'New Estimate'} onBack={onBack} /><Text style={styles.fieldLabel}>Client</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}><Pressable onPress={() => setClientId('')} style={[styles.choice, !clientId && styles.choiceActive]}><Text style={[styles.choiceText, !clientId && styles.choiceTextActive]}>No client</Text></Pressable>{clients.map((client) => <Pressable key={client.id} onPress={() => setClientId(client.id)} style={[styles.choice, clientId === client.id && styles.choiceActive]}><Text style={[styles.choiceText, clientId === client.id && styles.choiceTextActive]}>{client.name}</Text></Pressable>)}</ScrollView><Field label="Description" value={description} onChangeText={setDescription} placeholder="Labour and materials" /><Field label="Amount before tax" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" /><Card><Muted>Create a stable draft first. Full line-item editing and PDF sharing will sit on top of this clean runtime without reintroducing the crash-prone animation stack.</Muted></Card><Button title={kind === 'invoice' ? 'Create Invoice' : 'Create Estimate'} onPress={submit} disabled={busy} /></Screen>
  );
}

export function BusinessSettingsScreen({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState<BusinessProfile>({ name: '', owner: '', phone: '', email: '', address: '' }); const [currency, setCurrency] = useState('ZAR'); const [tax, setTax] = useState('15'); const [busy, setBusy] = useState(false);
  useEffect(() => { Promise.all([getBusinessProfile(), getSetting('currency', 'ZAR'), getSetting('tax_rate', '15')]).then(([p, c, t]) => { setProfile(p); setCurrency(c); setTax(t); }).catch(() => undefined); }, []);
  const submit = async () => { setBusy(true); try { await saveBusinessProfile(profile, currency, tax); Alert.alert('Saved', 'Business settings updated.'); } catch (error) { Alert.alert('Could not save settings', error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); } };
  return <Screen><BrandHeader title="Business Settings" onBack={onBack} /><Field label="Business name" value={profile.name} onChangeText={(name) => setProfile({ ...profile, name })} /><Field label="Owner / contact" value={profile.owner} onChangeText={(owner) => setProfile({ ...profile, owner })} /><Field label="Phone" value={profile.phone} onChangeText={(phone) => setProfile({ ...profile, phone })} keyboardType="phone-pad" /><Field label="Email" value={profile.email} onChangeText={(email) => setProfile({ ...profile, email })} keyboardType="email-address" autoCapitalize="none" /><Field label="Address" value={profile.address} onChangeText={(address) => setProfile({ ...profile, address })} multiline /><View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1 }}><Field label="Currency" value={currency} onChangeText={setCurrency} /></View><View style={{ flex: 1 }}><Field label="Tax %" value={tax} onChangeText={setTax} keyboardType="decimal-pad" /></View></View><Button title="Save Settings" onPress={submit} disabled={busy} /></Screen>;
}

export function ReportsScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Dashboard>({ invoiced: 0, paid: 0, outstanding: 0, overdue: 0, activeJobs: 0, openEstimates: 0 }); const [currency, setCurrency] = useState('ZAR');
  useEffect(() => { Promise.all([getDashboard(), getSetting('currency', 'ZAR')]).then(([d, c]) => { setData(d); setCurrency(c); }).catch(() => undefined); }, []);
  return <Screen><BrandHeader title="Reports" onBack={onBack} /><H1>Business report</H1><Muted>Current totals from records stored on this device.</Muted><Card><Row icon="cash-outline" title="Invoiced" trailing={<Text style={styles.amountText}>{formatMoney(data.invoiced, currency)}</Text>} /><View style={styles.separator} /><Row icon="checkmark-circle-outline" title="Paid" trailing={<Text style={styles.amountText}>{formatMoney(data.paid, currency)}</Text>} /><View style={styles.separator} /><Row icon="time-outline" title="Outstanding" trailing={<Text style={styles.amountText}>{formatMoney(data.outstanding, currency)}</Text>} /><View style={styles.separator} /><Row icon="alert-circle-outline" title="Overdue" trailing={<Text style={styles.amountText}>{formatMoney(data.overdue, currency)}</Text>} /></Card><View style={{ flexDirection: 'row', gap: 12 }}><Card style={{ flex: 1 }}><Muted>Active jobs</Muted><Text style={styles.bigNumber}>{data.activeJobs}</Text></Card><Card style={{ flex: 1 }}><Muted>Open estimates</Muted><Text style={styles.bigNumber}>{data.openEstimates}</Text></Card></View></Screen>;
}

export function AboutScreen({ onBack, restartSetup }: { onBack: () => void; restartSetup: () => void }) {
  const redo = () => Alert.alert('Show setup again?', 'This does not delete your business records.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: async () => { await resetOnboarding(); restartSetup(); } }]);
  return <Screen><BrandHeader title="About" onBack={onBack} /><Card style={{ alignItems: 'center', paddingVertical: 28 }}><Image source={require('../assets/logo-horizontal.png')} style={{ width: 180, height: 70 }} resizeMode="contain" /><Text style={styles.version}>Version 1.1.0 · Clean Rebuild</Text></Card><H2>Built for contractors</H2><Muted>Unifill keeps core estimating, invoicing, client and job management simple and available without subscriptions or premium feature locks.</Muted><Card><Row icon="infinite-outline" title="Always Free" subtitle="No subscriptions" /><View style={styles.separator} /><Row icon="phone-portrait-outline" title="Local-first" subtitle="Core records stay on your device" /><View style={styles.separator} /><Row icon="construct-outline" title="Clean runtime" subtitle="Rebuilt without the unstable animation stack" /></Card><Button title="Show Onboarding Again" variant="secondary" onPress={redo} /></Screen>;
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: palette.bg }, tabContent: { padding: 18, gap: 16, paddingBottom: 110 }, onboardingTop: { minHeight: 70, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, onboardingBody: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', gap: 18 }, illustration: { width: 156, height: 156, borderRadius: 42, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }, onboardingTitle: { color: palette.text, fontSize: 31, lineHeight: 36, fontWeight: '900', textAlign: 'center', letterSpacing: -1 }, pill: { backgroundColor: palette.primarySoft, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 9 }, pillText: { color: palette.primary, fontWeight: '800' }, onboardingBottom: { padding: 22, gap: 15, alignItems: 'center' }, dots: { flexDirection: 'row', gap: 7 }, dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: palette.border }, dotActive: { width: 24, backgroundColor: palette.primary }, metric: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }, metricIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, metricValue: { color: palette.text, fontSize: 18, fontWeight: '900' }, quickRow: { flexDirection: 'row', gap: 8 }, quick: { flex: 1, minHeight: 82, borderWidth: 1, borderColor: palette.border, borderRadius: 15, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 4 }, quickText: { color: palette.text, fontSize: 11, fontWeight: '800', textAlign: 'center' }, bigNumber: { color: palette.text, fontSize: 28, fontWeight: '900', marginTop: 4 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, addButton: { width: 48, height: 48, borderRadius: 15, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }, amountText: { color: palette.text, fontWeight: '900', fontSize: 13 }, separator: { height: 1, backgroundColor: palette.border }, freeTitle: { color: palette.primary, fontWeight: '900', fontSize: 17, marginBottom: 4 }, fieldLabel: { color: palette.text, fontWeight: '800', fontSize: 13, marginBottom: -8 }, choice: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 }, choiceActive: { borderColor: palette.primary, backgroundColor: palette.primarySoft }, choiceText: { color: palette.muted, fontWeight: '700' }, choiceTextActive: { color: palette.primary }, statusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, version: { color: palette.muted, fontWeight: '700', marginTop: 8 }
});
