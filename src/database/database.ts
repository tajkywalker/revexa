import * as SQLite from 'expo-sqlite';
import { Customer, Address, Chimney, Order, InspectionReport, OrderListItem, OrderDetail } from '../types';

const DB_NAME = 'revexa.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
  }
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      companyName TEXT,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      zip TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      zip TEXT NOT NULL,
      objectType TEXT NOT NULL DEFAULT 'rodinny_dum',
      objectNote TEXT,
      applianceType TEXT,
      buildYear INTEGER,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chimneys (
      id TEXT PRIMARY KEY,
      addressId TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'zděný',
      diameter INTEGER NOT NULL DEFAULT 180,
      height REAL NOT NULL DEFAULT 7.0,
      appliancesCount INTEGER NOT NULL DEFAULT 1,
      fuelType TEXT NOT NULL DEFAULT 'tuha_paliva',
      installYear INTEGER,
      note TEXT,
      FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT NOT NULL UNIQUE,
      customerId TEXT NOT NULL,
      addressId TEXT NOT NULL,
      orderType TEXT NOT NULL DEFAULT 'kontrola',
      status TEXT NOT NULL DEFAULT 'planovana',
      scheduledDate TEXT NOT NULL,
      scheduledTime TEXT,
      completedAt TEXT,
      note TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id),
      FOREIGN KEY (addressId) REFERENCES addresses(id)
    );

    CREATE TABLE IF NOT EXISTS inspection_reports (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      chimneyId TEXT NOT NULL,
      reportNumber TEXT NOT NULL,
      inspectionDate TEXT NOT NULL,
      checkItemsJson TEXT NOT NULL DEFAULT '[]',
      overallResult TEXT NOT NULL DEFAULT 'vyhovuje',
      coMeasurement REAL,
      notes TEXT NOT NULL DEFAULT '',
      recommendations TEXT NOT NULL DEFAULT '',
      signatureBase64 TEXT,
      photoUrisJson TEXT NOT NULL DEFAULT '[]',
      pdfUri TEXT,
      emailSentAt TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (chimneyId) REFERENCES chimneys(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(scheduledDate);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
    CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customerId);
  `);

  // Vložíme demo data pokud db je prázdná
  const count = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM customers');
  if (count && count.count === 0) {
    await insertDemoData(database);
  }
}

async function insertDemoData(database: SQLite.SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  // Demo zákazníci
  await database.runAsync(
    `INSERT INTO customers (id, firstName, lastName, phone, email, street, city, zip, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cust-1', 'Tomáš', 'Novák', '+420 777 123 456', 'novak@email.cz', 'Hlavní 123', 'Praha 5', '123 45', now, now]
  );
  await database.runAsync(
    `INSERT INTO customers (id, firstName, lastName, phone, email, street, city, zip, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cust-2', 'Jana', 'Procházková', '+420 602 987 654', 'prochazkova@seznam.cz', 'Náměstí 5', 'Říčany', '251 01', now, now]
  );
  await database.runAsync(
    `INSERT INTO customers (id, firstName, lastName, phone, email, street, city, zip, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cust-3', 'Karel', 'Svoboda', '+420 731 456 789', 'svoboda@gmail.com', 'Lesní 42', 'Brno', '602 00', now, now]
  );

  // Demo adresy
  await database.runAsync(
    `INSERT INTO addresses (id, customerId, street, city, zip, objectType, applianceType, buildYear, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['addr-1', 'cust-1', 'Hlavní 123', 'Praha 5', '123 45', 'rodinny_dum', 'Kondenzační kotel', 2010, now]
  );
  await database.runAsync(
    `INSERT INTO addresses (id, customerId, street, city, zip, objectType, applianceType, buildYear, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['addr-2', 'cust-2', 'Náměstí 5', 'Říčany', '251 01', 'rodinny_dum', 'Krbová vložka', 2005, now]
  );
  await database.runAsync(
    `INSERT INTO addresses (id, customerId, street, city, zip, objectType, applianceType, buildYear, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['addr-3', 'cust-3', 'Lesní 42', 'Brno', '602 00', 'rodinny_dum', 'Kotel na tuhá paliva', 1998, now]
  );

  // Demo komíny
  await database.runAsync(
    `INSERT INTO chimneys (id, addressId, label, type, diameter, height, appliancesCount, fuelType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['chim-1', 'addr-1', 'Komín č. 1', 'zděný', 180, 7.5, 1, 'plyn']
  );
  await database.runAsync(
    `INSERT INTO chimneys (id, addressId, label, type, diameter, height, appliancesCount, fuelType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['chim-2', 'addr-2', 'Komín č. 1', 'zděný', 200, 8.0, 1, 'tuha_paliva']
  );
  await database.runAsync(
    `INSERT INTO chimneys (id, addressId, label, type, diameter, height, appliancesCount, fuelType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['chim-3', 'addr-2', 'Komín č. 2', 'kovový', 150, 6.0, 1, 'tuha_paliva']
  );
  await database.runAsync(
    `INSERT INTO chimneys (id, addressId, label, type, diameter, height, appliancesCount, fuelType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['chim-4', 'addr-3', 'Komín č. 1', 'zděný', 200, 9.0, 1, 'tuha_paliva']
  );

  // Demo zakázky
  await database.runAsync(
    `INSERT INTO orders (id, orderNumber, customerId, addressId, orderType, status, scheduledDate, scheduledTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['order-1', '#2025-0487', 'cust-1', 'addr-1', 'kontrola', 'dokoncena', today, '10:00', now, now]
  );
  await database.runAsync(
    `INSERT INTO orders (id, orderNumber, customerId, addressId, orderType, status, scheduledDate, scheduledTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['order-2', '#2025-0488', 'cust-2', 'addr-2', 'cisteni', 'planovana', today, '12:30', now, now]
  );
  await database.runAsync(
    `INSERT INTO orders (id, orderNumber, customerId, addressId, orderType, status, scheduledDate, scheduledTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['order-3', '#2025-0489', 'cust-3', 'addr-3', 'revize', 'planovana', today, '14:00', now, now]
  );

  // Demo zpráva
  const checkItems = [
    { id: 'ci-1', label: 'Kontrola průchodnosti', result: 'vyhovuje' },
    { id: 'ci-2', label: 'Kontrola spalinotěsnosti', result: 'vyhovuje' },
    { id: 'ci-3', label: 'Kontrola stavu komínového tělesa', result: 'vyhovuje' },
    { id: 'ci-4', label: 'Kontrola sopouchu a dvířek', result: 'vyhovuje' },
    { id: 'ci-5', label: 'Kontrola připojení spotřebiče', result: 'vyhovuje' },
    { id: 'ci-6', label: 'Kontrola tahových poměrů', result: 'nelze_posoudit' },
    { id: 'ci-7', label: 'Měření CO ve spalinách', result: 'vyhovuje', value: '18 ppm' },
    { id: 'ci-8', label: 'Kontrola větrání', result: 'vyhovuje' },
    { id: 'ci-9', label: 'Celkové zhodnocení', result: 'vyhovuje' },
  ];

  await database.runAsync(
    `INSERT INTO inspection_reports (id, orderId, chimneyId, reportNumber, inspectionDate, checkItemsJson, overallResult, coMeasurement, notes, recommendations, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'report-1', 'order-1', 'chim-1', 'ZP-2025-0487', today,
      JSON.stringify(checkItems), 'vyhovuje', 18,
      'Komín v dobrém stavu, drobné znečištění.',
      'Doporučuji další kontrolu za 12 měsíců.',
      now
    ]
  );
}

// ============================================================
// CUSTOMERS
// ============================================================
export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Customer>('SELECT * FROM customers ORDER BY lastName, firstName');
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO customers (id, firstName, lastName, companyName, street, city, zip, phone, email, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [customer.id, customer.firstName, customer.lastName, customer.companyName || null,
     customer.street, customer.city, customer.zip, customer.phone, customer.email,
     customer.note || null, customer.createdAt, customer.updatedAt]
  );
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const db = await getDatabase();
  const q = `%${query}%`;
  return await db.getAllAsync<Customer>(
    'SELECT * FROM customers WHERE firstName LIKE ? OR lastName LIKE ? OR city LIKE ? OR street LIKE ? ORDER BY lastName',
    [q, q, q, q]
  );
}

// ============================================================
// ADDRESSES
// ============================================================
export async function getAddressesByCustomer(customerId: string): Promise<Address[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM addresses WHERE customerId = ?', [customerId]);
  const addresses: Address[] = [];
  for (const row of rows) {
    const chimneys = await db.getAllAsync<Chimney>('SELECT * FROM chimneys WHERE addressId = ?', [row.id]);
    addresses.push({ ...row, chimneys });
  }
  return addresses;
}

export async function getAddressById(id: string): Promise<Address | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM addresses WHERE id = ?', [id]);
  if (!row) return null;
  const chimneys = await db.getAllAsync<Chimney>('SELECT * FROM chimneys WHERE addressId = ?', [id]);
  return { ...row, chimneys };
}

export async function saveAddress(address: Address): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO addresses (id, customerId, street, city, zip, objectType, objectNote, applianceType, buildYear, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [address.id, address.customerId, address.street, address.city, address.zip,
     address.objectType, address.objectNote || null, address.applianceType || null,
     address.buildYear || null, address.createdAt]
  );
  for (const chimney of address.chimneys) {
    await db.runAsync(
      `INSERT OR REPLACE INTO chimneys (id, addressId, label, type, diameter, height, appliancesCount, fuelType, installYear, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [chimney.id, chimney.addressId, chimney.label, chimney.type, chimney.diameter,
       chimney.height, chimney.appliancesCount, chimney.fuelType, chimney.installYear || null, chimney.note || null]
    );
  }
}

// ============================================================
// ORDERS
// ============================================================
export async function getAllOrders(): Promise<OrderListItem[]> {
  const db = await getDatabase();
  return await db.getAllAsync<any>(`
    SELECT o.*, c.firstName || ' ' || c.lastName as customerName,
           a.street as addressStreet, a.city as addressCity
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    JOIN addresses a ON o.addressId = a.id
    ORDER BY o.scheduledDate DESC, o.scheduledTime ASC
  `);
}

export async function getOrdersByDate(date: string): Promise<OrderListItem[]> {
  const db = await getDatabase();
  return await db.getAllAsync<any>(`
    SELECT o.*, c.firstName || ' ' || c.lastName as customerName,
           a.street as addressStreet, a.city as addressCity
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    JOIN addresses a ON o.addressId = a.id
    WHERE o.scheduledDate = ?
    ORDER BY o.scheduledTime ASC
  `, [date]);
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const db = await getDatabase();
  const order = await db.getFirstAsync<Order>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return null;
  const customer = await getCustomerById(order.customerId);
  if (!customer) return null;
  const address = await getAddressById(order.addressId);
  if (!address) return null;
  const reports = await getReportsByOrder(id);
  return { ...order, customer, address, reports };
}

export async function saveOrder(order: Order): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO orders (id, orderNumber, customerId, addressId, orderType, status, scheduledDate, scheduledTime, completedAt, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [order.id, order.orderNumber, order.customerId, order.addressId, order.orderType,
     order.status, order.scheduledDate, order.scheduledTime || null, order.completedAt || null,
     order.note || null, order.createdAt, order.updatedAt]
  );
}

export async function deleteOrder(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM orders WHERE id = ?', [id]);
}

export async function getNextOrderNumber(): Promise<string> {
  const db = await getDatabase();
  const year = new Date().getFullYear();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE orderNumber LIKE ?`,
    [`#${year}-%`]
  );
  const num = ((result?.count || 0) + 1).toString().padStart(4, '0');
  return `#${year}-${num}`;
}

// ============================================================
// INSPECTION REPORTS
// ============================================================
export async function getReportsByOrder(orderId: string): Promise<InspectionReport[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM inspection_reports WHERE orderId = ? ORDER BY createdAt DESC', [orderId]);
  return rows.map(r => ({
    ...r,
    checkItems: JSON.parse(r.checkItemsJson || '[]'),
    photoUris: JSON.parse(r.photoUrisJson || '[]'),
  }));
}

export async function saveInspectionReport(report: InspectionReport): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO inspection_reports (id, orderId, chimneyId, reportNumber, inspectionDate, checkItemsJson, overallResult, coMeasurement, notes, recommendations, signatureBase64, photoUrisJson, pdfUri, emailSentAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [report.id, report.orderId, report.chimneyId, report.reportNumber, report.inspectionDate,
     JSON.stringify(report.checkItems), report.overallResult, report.coMeasurement || null,
     report.notes, report.recommendations, report.signatureBase64 || null,
     JSON.stringify(report.photoUris), report.pdfUri || null, report.emailSentAt || null,
     report.createdAt]
  );
}

export type { OrderListItem, OrderDetail };
