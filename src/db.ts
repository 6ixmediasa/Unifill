import * as SQLite from 'expo-sqlite';

export type Client = {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  billing_address?: string | null;
  notes?: string | null;
  archived: number;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  client_id?: string | null;
  client_name?: string | null;
  name: string;
  service_address?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  archived: number;
  created_at: string;
  updated_at: string;
};

export type BusinessProfile = {
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
};

export type DocumentKind = 'invoice' | 'estimate';

export type DocumentSummary = {
  id: string;
  kind: DocumentKind;
  number: string;
  client_id?: string | null;
  client_name?: string | null;
  issue_date: string;
  due_date?: string | null;
  status: string;
  total_minor: number;
};

export type Dashboard = {
  invoiced: number;
  paid: number;
  outstanding: number;
  overdue: number;
  activeJobs: number;
  openEstimates: number;
};

let database: SQLite.SQLiteDatabase | null = null;

const nowIso = () => new Date().toISOString();
const dateOnly = () => new Date().toISOString().slice(0, 10);
const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function initDatabase() {
  if (database) return database;
  const db = await SQLite.openDatabaseAsync('unifill.db');
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS clients(
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      billing_address TEXT,
      notes TEXT,
      archived INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS jobs(
      id TEXT PRIMARY KEY,
      client_id TEXT,
      name TEXT NOT NULL,
      service_address TEXT,
      status TEXT DEFAULT 'Lead',
      start_date TEXT,
      end_date TEXT,
      notes TEXT,
      archived INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS estimates(
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      client_id TEXT,
      job_id TEXT,
      issue_date TEXT,
      expiry_date TEXT,
      status TEXT DEFAULT 'Draft',
      discount_minor INTEGER DEFAULT 0,
      tax_rate REAL DEFAULT 15,
      markup_rate REAL DEFAULT 0,
      notes TEXT,
      terms TEXT,
      archived INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS estimate_items(
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      description TEXT,
      detail TEXT,
      quantity REAL DEFAULT 1,
      unit_price_minor INTEGER DEFAULT 0,
      taxable INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS invoices(
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      client_id TEXT,
      job_id TEXT,
      issue_date TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'Draft',
      discount_minor INTEGER DEFAULT 0,
      tax_rate REAL DEFAULT 15,
      notes TEXT,
      terms TEXT,
      payment_instructions TEXT,
      source_estimate_id TEXT,
      archived INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS invoice_items(
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT,
      detail TEXT,
      quantity REAL DEFAULT 1,
      unit_price_minor INTEGER DEFAULT 0,
      taxable INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS payments(
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      amount_minor INTEGER NOT NULL,
      paid_at TEXT,
      method TEXT,
      reference TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS expenses(
      id TEXT PRIMARY KEY,
      job_id TEXT,
      amount_minor INTEGER NOT NULL,
      category TEXT,
      vendor TEXT,
      spent_at TEXT,
      description TEXT,
      receipt_uri TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
    CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_estimates_client ON estimates(client_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
  `);

  try { await db.execAsync('ALTER TABLE invoices ADD COLUMN source_estimate_id TEXT'); } catch {}

  await db.runAsync(
    `INSERT OR IGNORE INTO settings(key,value) VALUES
      ('currency','ZAR'),
      ('tax_rate','15'),
      ('invoice_prefix','INV'),
      ('estimate_prefix','EST'),
      ('invoice_seq','1'),
      ('estimate_seq','1'),
      ('onboarding_complete','0')`
  );
  await db.runAsync(`INSERT OR IGNORE INTO meta(key,value) VALUES ('schema_version','2')`);
  database = db;
  return db;
}

export async function getSetting(key: string, fallback = '') {
  const db = await initDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key=?', [key]);
  return row?.value ?? fallback;
}

export async function setSetting(key: string, value: string) {
  const db = await initDatabase();
  await db.runAsync(
    'INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    [key, value]
  );
}

export async function getBusinessProfile(): Promise<BusinessProfile> {
  const raw = await getSetting('business_profile', '');
  if (!raw) return { name: '', owner: '', phone: '', email: '', address: '' };
  try {
    const parsed = JSON.parse(raw) as Partial<BusinessProfile>;
    return {
      name: parsed.name ?? '',
      owner: parsed.owner ?? '',
      phone: parsed.phone ?? '',
      email: parsed.email ?? '',
      address: parsed.address ?? ''
    };
  } catch {
    return { name: '', owner: '', phone: '', email: '', address: '' };
  }
}

export async function saveBusinessProfile(profile: BusinessProfile, currency: string, taxRate: string) {
  await setSetting('business_profile', JSON.stringify(profile));
  await setSetting('currency', currency.trim() || 'ZAR');
  await setSetting('tax_rate', taxRate.trim() || '0');
  await setSetting('onboarding_complete', '1');
}

export async function listClients(): Promise<Client[]> {
  const db = await initDatabase();
  return db.getAllAsync<Client>('SELECT * FROM clients WHERE archived=0 ORDER BY name COLLATE NOCASE');
}

export async function getClient(clientId: string): Promise<Client | null> {
  const db = await initDatabase();
  return db.getFirstAsync<Client>('SELECT * FROM clients WHERE id=?', [clientId]);
}

export async function saveClient(input: Partial<Client> & { name: string }) {
  const db = await initDatabase();
  const stamp = nowIso();
  if (input.id) {
    await db.runAsync(
      `UPDATE clients SET name=?,company=?,phone=?,email=?,billing_address=?,notes=?,updated_at=? WHERE id=?`,
      [input.name.trim(), input.company ?? '', input.phone ?? '', input.email ?? '', input.billing_address ?? '', input.notes ?? '', stamp, input.id]
    );
    return input.id;
  }
  const clientId = id();
  await db.runAsync(
    `INSERT INTO clients(id,name,company,phone,email,billing_address,notes,archived,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    [clientId, input.name.trim(), input.company ?? '', input.phone ?? '', input.email ?? '', input.billing_address ?? '', input.notes ?? '', 0, stamp, stamp]
  );
  return clientId;
}

export async function listJobs(): Promise<Job[]> {
  const db = await initDatabase();
  return db.getAllAsync<Job>(
    `SELECT j.*, c.name AS client_name FROM jobs j LEFT JOIN clients c ON c.id=j.client_id WHERE j.archived=0 ORDER BY j.updated_at DESC`
  );
}

export async function getJob(jobId: string): Promise<Job | null> {
  const db = await initDatabase();
  return db.getFirstAsync<Job>('SELECT * FROM jobs WHERE id=?', [jobId]);
}

export async function saveJob(input: Partial<Job> & { name: string; status: string }) {
  const db = await initDatabase();
  const stamp = nowIso();
  if (input.id) {
    await db.runAsync(
      `UPDATE jobs SET client_id=?,name=?,service_address=?,status=?,start_date=?,end_date=?,notes=?,updated_at=? WHERE id=?`,
      [input.client_id ?? null, input.name.trim(), input.service_address ?? '', input.status, input.start_date ?? '', input.end_date ?? '', input.notes ?? '', stamp, input.id]
    );
    return input.id;
  }
  const jobId = id();
  await db.runAsync(
    `INSERT INTO jobs(id,client_id,name,service_address,status,start_date,end_date,notes,archived,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    [jobId, input.client_id ?? null, input.name.trim(), input.service_address ?? '', input.status, input.start_date ?? dateOnly(), input.end_date ?? '', input.notes ?? '', 0, stamp, stamp]
  );
  return jobId;
}

async function nextNumber(kind: DocumentKind) {
  const prefixKey = `${kind}_prefix`;
  const seqKey = `${kind}_seq`;
  const defaultPrefix = kind === 'invoice' ? 'INV' : 'EST';
  const prefix = await getSetting(prefixKey, defaultPrefix);
  const seq = Math.max(1, Number(await getSetting(seqKey, '1')) || 1);
  await setSetting(seqKey, String(seq + 1));
  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

export async function createDocument(input: {
  kind: DocumentKind;
  client_id?: string | null;
  description: string;
  amount_minor: number;
}) {
  const db = await initDatabase();
  const documentId = id();
  const itemId = id();
  const number = await nextNumber(input.kind);
  const stamp = nowIso();
  const issue = dateOnly();
  const tax = Number(await getSetting('tax_rate', '15')) || 0;

  if (input.kind === 'invoice') {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO invoices(id,number,client_id,job_id,issue_date,due_date,status,discount_minor,tax_rate,notes,terms,payment_instructions,source_estimate_id,archived,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [documentId, number, input.client_id ?? null, null, issue, issue, 'Draft', 0, tax, '', '', '', null, 0, stamp, stamp]
      );
      await db.runAsync(
        `INSERT INTO invoice_items(id,invoice_id,description,detail,quantity,unit_price_minor,taxable,sort_order) VALUES(?,?,?,?,?,?,?,?)`,
        [itemId, documentId, input.description.trim() || 'Services', '', 1, input.amount_minor, 1, 0]
      );
    });
  } else {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO estimates(id,number,client_id,job_id,issue_date,expiry_date,status,discount_minor,tax_rate,markup_rate,notes,terms,archived,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [documentId, number, input.client_id ?? null, null, issue, issue, 'Draft', 0, tax, 0, '', '', 0, stamp, stamp]
      );
      await db.runAsync(
        `INSERT INTO estimate_items(id,estimate_id,description,detail,quantity,unit_price_minor,taxable,sort_order) VALUES(?,?,?,?,?,?,?,?)`,
        [itemId, documentId, input.description.trim() || 'Services', '', 1, input.amount_minor, 1, 0]
      );
    });
  }
  return documentId;
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const db = await initDatabase();
  const invoices = await db.getAllAsync<any>(
    `SELECT i.id,i.number,i.client_id,c.name AS client_name,i.issue_date,i.due_date,i.status,i.tax_rate, COALESCE(SUM(ii.quantity * ii.unit_price_minor),0) AS subtotal FROM invoices i LEFT JOIN clients c ON c.id=i.client_id LEFT JOIN invoice_items ii ON ii.invoice_id=i.id WHERE i.archived=0 GROUP BY i.id ORDER BY i.created_at DESC`
  );
  const estimates = await db.getAllAsync<any>(
    `SELECT e.id,e.number,e.client_id,c.name AS client_name,e.issue_date,e.expiry_date AS due_date,e.status,e.tax_rate, COALESCE(SUM(ei.quantity * ei.unit_price_minor),0) AS subtotal FROM estimates e LEFT JOIN clients c ON c.id=e.client_id LEFT JOIN estimate_items ei ON ei.estimate_id=e.id WHERE e.archived=0 GROUP BY e.id ORDER BY e.created_at DESC`
  );
  const normalize = (row: any, kind: DocumentKind): DocumentSummary => {
    const subtotal = Number(row.subtotal || 0);
    const total = Math.round(subtotal * (1 + Number(row.tax_rate || 0) / 100));
    return { id: row.id, kind, number: row.number, client_id: row.client_id, client_name: row.client_name, issue_date: row.issue_date, due_date: row.due_date, status: row.status, total_minor: total };
  };
  return [...invoices.map((row) => normalize(row, 'invoice')), ...estimates.map((row) => normalize(row, 'estimate'))].sort((a, b) => b.issue_date.localeCompare(a.issue_date));
}

export async function getDashboard(): Promise<Dashboard> {
  const db = await initDatabase();
  const invoiceRows = await db.getAllAsync<any>(
    `SELECT i.id,i.status,i.due_date,i.tax_rate, COALESCE(SUM(ii.quantity * ii.unit_price_minor),0) AS subtotal, COALESCE((SELECT SUM(p.amount_minor) FROM payments p WHERE p.invoice_id=i.id),0) AS paid FROM invoices i LEFT JOIN invoice_items ii ON ii.invoice_id=i.id WHERE i.archived=0 GROUP BY i.id`
  );
  let invoiced = 0;
  let paid = 0;
  let outstanding = 0;
  let overdue = 0;
  const today = dateOnly();
  for (const row of invoiceRows) {
    const total = Math.round(Number(row.subtotal || 0) * (1 + Number(row.tax_rate || 0) / 100));
    const received = Number(row.paid || 0);
    invoiced += total;
    paid += received;
    const due = Math.max(0, total - received);
    outstanding += due;
    if (due > 0 && row.due_date && row.due_date < today) overdue += due;
  }
  const activeRow = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM jobs WHERE archived=0 AND status NOT IN ('Complete','Cancelled')`);
  const estimateRow = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM estimates WHERE archived=0 AND status IN ('Draft','Sent')`);
  return { invoiced, paid, outstanding, overdue, activeJobs: Number(activeRow?.count || 0), openEstimates: Number(estimateRow?.count || 0) };
}

export async function resetOnboarding() {
  await setSetting('onboarding_complete', '0');
}
