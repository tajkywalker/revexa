import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('revexa.db');
  return db;
}

export function initDb() {
  const d = getDb();

  // Každý CREATE TABLE jako samostatné volání (expo-sqlite to vyžaduje)
  d.execSync(
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      street TEXT,
      city TEXT,
      zip TEXT,
      note TEXT,
      createdAt TEXT NOT NULL
    );`
  );
  d.execSync(
    `CREATE TABLE IF NOT EXISTS chimneys (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT,
      fuel TEXT,
      note TEXT
    );`
  );
  d.execSync(
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      chimneyId TEXT,
      orderNumber TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nova',
      scheduledDate TEXT,
      completedAt TEXT,
      address TEXT,
      note TEXT,
      price REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );`
  );
  d.execSync(
    `CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      chimneyId TEXT,
      reportNumber TEXT,
      inspectionDate TEXT NOT NULL,
      checkItems TEXT NOT NULL,
      overallResult TEXT NOT NULL,
      coMeasurement REAL,
      notes TEXT,
      recommendations TEXT,
      signatureBase64 TEXT,
      createdAt TEXT NOT NULL
    );`
  );

  // Ukázková data – vloží se jen jednou při prvním spuštění
  const count = d.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM customers');
  if (count && count.count === 0) {
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    d.runSync(
      'INSERT INTO customers VALUES (?,?,?,?,?,?,?,?,?,?)',
      ['c1', 'Jan', 'Novák', '603123456', 'jan@email.cz', 'Hlavní 12', 'Praha', '11000', '', now]
    );
    d.runSync(
      'INSERT INTO customers VALUES (?,?,?,?,?,?,?,?,?,?)',
      ['c2', 'Marie', 'Svobodová', '607654321', '', 'Nová 5', 'Brno', '60200', '', now]
    );
    d.runSync(
      'INSERT INTO chimneys VALUES (?,?,?,?,?,?)',
      ['ch1', 'c1', 'Komín č.1', 'průduch', 'dřevo', '']
    );
    d.runSync(
      'INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      ['o1', 'c1', 'ch1', '#0001', 'nova', today, null, 'Hlavní 12, Praha', 'Pravidelná kontrola', 1500, now, now]
    );
    d.runSync(
      'INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      ['o2', 'c2', null, '#0002', 'probihajici', today, null, 'Nová 5, Brno', 'Čištění', 1200, now, now]
    );
  }
}

export interface Customer {
  id: string; firstName: string; lastName: string;
  phone: string; email: string; street: string;
  city: string; zip: string; note: string; createdAt: string;
}
export function getCustomers(): Customer[] {
  return getDb().getAllSync<Customer>('SELECT * FROM customers ORDER BY lastName, firstName');
}
export function getCustomer(id: string): Customer | null {
  return getDb().getFirstSync<Customer>('SELECT * FROM customers WHERE id=?', [id]);
}
export function saveCustomer(c: Customer) {
  getDb().runSync(
    'INSERT OR REPLACE INTO customers VALUES (?,?,?,?,?,?,?,?,?,?)',
    [c.id, c.firstName, c.lastName, c.phone, c.email, c.street, c.city, c.zip, c.note, c.createdAt]
  );
}
export function deleteCustomer(id: string) {
  getDb().runSync('DELETE FROM customers WHERE id=?', [id]);
}

export interface Chimney {
  id: string; customerId: string; label: string; type: string; fuel: string; note: string;
}
export function getChimneys(customerId: string): Chimney[] {
  return getDb().getAllSync<Chimney>('SELECT * FROM chimneys WHERE customerId=?', [customerId]);
}
export function saveChimney(c: Chimney) {
  getDb().runSync(
    'INSERT OR REPLACE INTO chimneys VALUES (?,?,?,?,?,?)',
    [c.id, c.customerId, c.label, c.type, c.fuel, c.note]
  );
}
export function deleteChimney(id: string) {
  getDb().runSync('DELETE FROM chimneys WHERE id=?', [id]);
}

export interface Order {
  id: string; customerId: string; chimneyId: string; orderNumber: string;
  status: 'nova' | 'probihajici' | 'dokoncena' | 'zrusena';
  scheduledDate: string; completedAt: string; address: string;
  note: string; price: number; createdAt: string; updatedAt: string;
  customerName?: string;
}
export function getOrders(filter?: string): Order[] {
  let sql = `SELECT o.*, c.firstName||' '||c.lastName as customerName
             FROM orders o LEFT JOIN customers c ON o.customerId=c.id`;
  if (filter) sql += ` WHERE o.status='${filter}'`;
  sql += ' ORDER BY o.scheduledDate DESC, o.createdAt DESC';
  return getDb().getAllSync<Order>(sql);
}
export function getOrdersByDate(date: string): Order[] {
  return getDb().getAllSync<Order>(
    `SELECT o.*, c.firstName||' '||c.lastName as customerName
     FROM orders o LEFT JOIN customers c ON o.customerId=c.id
     WHERE o.scheduledDate=? ORDER BY o.createdAt`,
    [date]
  );
}
export function getOrdersByCustomer(customerId: string): Order[] {
  return getDb().getAllSync<Order>(
    `SELECT o.*, c.firstName||' '||c.lastName as customerName
     FROM orders o LEFT JOIN customers c ON o.customerId=c.id
     WHERE o.customerId=? ORDER BY o.scheduledDate DESC`,
    [customerId]
  );
}
export function getOrder(id: string): Order | null {
  return getDb().getFirstSync<Order>(
    `SELECT o.*, c.firstName||' '||c.lastName as customerName
     FROM orders o LEFT JOIN customers c ON o.customerId=c.id WHERE o.id=?`,
    [id]
  );
}
export function saveOrder(o: Order) {
  getDb().runSync(
    'INSERT OR REPLACE INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [o.id, o.customerId, o.chimneyId, o.orderNumber, o.status,
     o.scheduledDate, o.completedAt, o.address, o.note, o.price,
     o.createdAt, o.updatedAt]
  );
}
export function deleteOrder(id: string) {
  getDb().runSync('DELETE FROM orders WHERE id=?', [id]);
}

export interface CheckItem {
  id: string; label: string;
  result: 'vyhovuje' | 'nevyhovuje' | 'nelze_posoudit' | 'neuvedeno';
}
export const DEFAULT_CHECK_ITEMS: CheckItem[] = [
  { id: '1',  label: 'Průchodnost průduchu',       result: 'neuvedeno' },
  { id: '2',  label: 'Spalinotěsnost průduchu',     result: 'neuvedeno' },
  { id: '3',  label: 'Stav sopouchu',               result: 'neuvedeno' },
  { id: '4',  label: 'Stav krycích dvířek',         result: 'neuvedeno' },
  { id: '5',  label: 'Stav vymetacích dvířek',      result: 'neuvedeno' },
  { id: '6',  label: 'Odvod kondenzátu',            result: 'neuvedeno' },
  { id: '7',  label: 'Stav komínového tělesa',      result: 'neuvedeno' },
  { id: '8',  label: 'Čistota průduchu',            result: 'neuvedeno' },
  { id: '9',  label: 'Měření CO (ppm)',             result: 'neuvedeno' },
  { id: '10', label: 'Tah komínu',                  result: 'neuvedeno' },
];

export interface Inspection {
  id: string; orderId: string; chimneyId: string; reportNumber: string;
  inspectionDate: string; checkItems: CheckItem[];
  overallResult: 'vyhovuje' | 'nevyhovuje' | 'podminecne';
  coMeasurement?: number; notes: string; recommendations: string;
  signatureBase64?: string; createdAt: string;
}
export function getInspection(orderId: string): Inspection | null {
  const row = getDb().getFirstSync<any>(
    'SELECT * FROM inspections WHERE orderId=? ORDER BY createdAt DESC LIMIT 1',
    [orderId]
  );
  if (!row) return null;
  return { ...row, checkItems: JSON.parse(row.checkItems) };
}
export function saveInspection(ins: Inspection) {
  getDb().runSync(
    'INSERT OR REPLACE INTO inspections VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [ins.id, ins.orderId, ins.chimneyId, ins.reportNumber, ins.inspectionDate,
     JSON.stringify(ins.checkItems), ins.overallResult,
     ins.coMeasurement ?? null, ins.notes, ins.recommendations,
     ins.signatureBase64 ?? null, ins.createdAt]
  );
}

export function getStats() {
  const d = getDb();
  const total    = d.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM orders')?.count ?? 0;
  const done     = d.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM orders WHERE status='dokoncena'")?.count ?? 0;
  const revenue  = d.getFirstSync<{ sum: number }>("SELECT COALESCE(SUM(price),0) as sum FROM orders WHERE status='dokoncena'")?.sum ?? 0;
  const month    = new Date().toISOString().slice(0, 7);
  const monthDone = d.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE status='dokoncena' AND scheduledDate LIKE '${month}%'`
  )?.count ?? 0;
  return { total, done, revenue, monthDone };
}
