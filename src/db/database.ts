import * as SQLite from 'expo-sqlite';
import {uuid,dateISO} from '@/src/lib/format';
let db:SQLite.SQLiteDatabase|undefined;
export async function getDb(){if(!db){db=await SQLite.openDatabaseAsync('unifill.db');await migrate(db);}return db;}
async function migrate(d:SQLite.SQLiteDatabase){
 await d.execAsync(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT);
 CREATE TABLE IF NOT EXISTS clients(id TEXT PRIMARY KEY,name TEXT NOT NULL,company TEXT,phone TEXT,email TEXT,billing_address TEXT,notes TEXT,archived INTEGER DEFAULT 0,created_at TEXT,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,client_id TEXT,name TEXT NOT NULL,service_address TEXT,status TEXT DEFAULT 'Lead',start_date TEXT,end_date TEXT,notes TEXT,archived INTEGER DEFAULT 0,created_at TEXT,updated_at TEXT,FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL);
 CREATE TABLE IF NOT EXISTS estimates(id TEXT PRIMARY KEY,number TEXT UNIQUE,client_id TEXT,job_id TEXT,issue_date TEXT,expiry_date TEXT,status TEXT DEFAULT 'Draft',discount_minor INTEGER DEFAULT 0,tax_rate REAL DEFAULT 15,markup_rate REAL DEFAULT 0,notes TEXT,terms TEXT,archived INTEGER DEFAULT 0,created_at TEXT,updated_at TEXT,FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL);
 CREATE TABLE IF NOT EXISTS estimate_items(id TEXT PRIMARY KEY,estimate_id TEXT NOT NULL,description TEXT,detail TEXT,quantity REAL DEFAULT 1,unit_price_minor INTEGER DEFAULT 0,taxable INTEGER DEFAULT 1,sort_order INTEGER DEFAULT 0,FOREIGN KEY(estimate_id) REFERENCES estimates(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS invoices(id TEXT PRIMARY KEY,number TEXT UNIQUE,client_id TEXT,job_id TEXT,issue_date TEXT,due_date TEXT,status TEXT DEFAULT 'Draft',discount_minor INTEGER DEFAULT 0,tax_rate REAL DEFAULT 15,notes TEXT,terms TEXT,payment_instructions TEXT,source_estimate_id TEXT,archived INTEGER DEFAULT 0,created_at TEXT,updated_at TEXT,FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL);
 CREATE TABLE IF NOT EXISTS invoice_items(id TEXT PRIMARY KEY,invoice_id TEXT NOT NULL,description TEXT,detail TEXT,quantity REAL DEFAULT 1,unit_price_minor INTEGER DEFAULT 0,taxable INTEGER DEFAULT 1,sort_order INTEGER DEFAULT 0,FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,invoice_id TEXT NOT NULL,amount_minor INTEGER NOT NULL,paid_at TEXT,method TEXT,reference TEXT,notes TEXT,created_at TEXT,updated_at TEXT,FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS expenses(id TEXT PRIMARY KEY,job_id TEXT,amount_minor INTEGER NOT NULL,category TEXT,vendor TEXT,spent_at TEXT,description TEXT,receipt_uri TEXT,created_at TEXT,updated_at TEXT,FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL);
 CREATE TABLE IF NOT EXISTS saved_items(id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT,unit TEXT,cost_minor INTEGER DEFAULT 0,selling_price_minor INTEGER DEFAULT 0,taxable INTEGER DEFAULT 1,category TEXT,archived INTEGER DEFAULT 0,created_at TEXT,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS reminders(id TEXT PRIMARY KEY,title TEXT,body TEXT,scheduled_at TEXT,enabled INTEGER DEFAULT 1,notification_id TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS attachments(id TEXT PRIMARY KEY,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,name TEXT,mime_type TEXT,uri TEXT,created_at TEXT);
 CREATE TABLE IF NOT EXISTS signatures(id TEXT PRIMARY KEY,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,signer_name TEXT,path_data TEXT,created_at TEXT,updated_at TEXT);
 CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name); CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id); CREATE INDEX IF NOT EXISTS idx_inv_client ON invoices(client_id); CREATE INDEX IF NOT EXISTS idx_est_client ON estimates(client_id); CREATE INDEX IF NOT EXISTS idx_pay_invoice ON payments(invoice_id);
 `);
 try{await d.execAsync('ALTER TABLE invoices ADD COLUMN source_estimate_id TEXT');}catch{}
 const now=new Date().toISOString();
 await d.runAsync(`INSERT OR IGNORE INTO settings(key,value) VALUES ('currency','ZAR'),('tax_rate','15'),('invoice_prefix','INV'),('estimate_prefix','EST'),('invoice_seq','1'),('estimate_seq','1'),('invoice_template','clean'),('onboarding_complete','0'),('appearance','system'),('backup_reminder_days','30')`);
 await d.runAsync(`INSERT OR IGNORE INTO meta(key,value) VALUES ('schema_version','1')`);
}
export async function setting(key:string, fallback=''){const d=await getDb();const row=await d.getFirstAsync<{value:string}>('SELECT value FROM settings WHERE key=?',[key]);return row?.value??fallback}
export async function setSetting(key:string,value:string){const d=await getDb();await d.runAsync('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[key,value])}
export async function nextNumber(kind:'invoice'|'estimate'){const prefixKey=kind+'_prefix',seqKey=kind+'_seq';const prefix=await setting(prefixKey,kind==='invoice'?'INV':'EST');const seq=Math.max(1,Number(await setting(seqKey,'1'))||1);await setSetting(seqKey,String(seq+1));return `${prefix}-${String(seq).padStart(4,'0')}`;}
export async function seedDemo(){const d=await getDb();const c=await d.getFirstAsync('SELECT id FROM clients LIMIT 1');if(c)return;try{await d.execAsync('ALTER TABLE invoices ADD COLUMN source_estimate_id TEXT');}catch{}
 const now=new Date().toISOString();const c1=uuid(),j1=uuid();await d.runAsync('INSERT INTO clients VALUES(?,?,?,?,?,?,?,?,?,?)',[c1,'John Dube','John Dube Plumbing','083 123 4567','john@example.com','45 Main Road, Johannesburg','Bathroom and plumbing client',0,now,now]);await d.runAsync('INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?,?,?,?)',[j1,c1,'Kitchen plumbing upgrade','45 Main Road, Johannesburg','In Progress',dateISO(),null,'Replace plumbing and fittings',0,now,now]);}
