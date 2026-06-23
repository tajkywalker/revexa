import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('revexa.db');
  return db;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export function initDb() {
  const d = getDb();
  d.execSync(`CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, firstName TEXT NOT NULL, lastName TEXT NOT NULL, phone TEXT, email TEXT, street TEXT, city TEXT, zip TEXT, note TEXT, createdAt TEXT NOT NULL);`);
  d.execSync(`CREATE TABLE IF NOT EXISTS chimneys (id TEXT PRIMARY KEY, customerId TEXT NOT NULL, label TEXT NOT NULL, type TEXT, fuel TEXT, note TEXT);`);
  d.execSync(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customerId TEXT NOT NULL, chimneyId TEXT, orderNumber TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'nova', scheduledDate TEXT, completedAt TEXT, address TEXT, note TEXT, price REAL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);`);
  d.execSync(`CREATE TABLE IF NOT EXISTS inspections (id TEXT PRIMARY KEY, orderId TEXT NOT NULL, chimneyId TEXT, reportNumber TEXT, inspectionDate TEXT NOT NULL, checkItems TEXT NOT NULL, overallResult TEXT NOT NULL, coMeasurement REAL, notes TEXT, recommendations TEXT, signatureBase64 TEXT, createdAt TEXT NOT NULL);`);
  const count = d.getFirstSync<{count:number}>('SELECT COUNT(*) as count FROM customers');
  if (count && count.count === 0) {
    const now = new Date().toISOString(); const today = new Date().toISOString().split('T')[0];
    d.runSync('INSERT INTO customers VALUES (?,?,?,?,?,?,?,?,?,?)',['c1','Jan','Novák','603123456','jan@email.cz','Hlavní 12','Praha','11000','',now]);
    d.runSync('INSERT INTO customers VALUES (?,?,?,?,?,?,?,?,?,?)',['c2','Marie','Svobodová','607654321','','Nová 5','Brno','60200','',now]);
    d.runSync('INSERT INTO chimneys VALUES (?,?,?,?,?,?)',['ch1','c1','Komín č.1','průduch','dřevo','']);
    d.runSync('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',['o1','c1','ch1','#0001','nova',today,null,'Hlavní 12, Praha','Pravidelná kontrola',1500,now,now]);
    d.runSync('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',['o2','c2',null,'#0002','probihajici',today,null,'Nová 5, Brno','Čištění',1200,now,now]);
  }
}

export function initObjectsTables() {
  const d = getDb();
  try { d.execSync('ALTER TABLE objects ADD COLUMN customerId TEXT'); } catch {}
  d.execSync(`CREATE TABLE IF NOT EXISTS objects (id TEXT PRIMARY KEY, oid TEXT UNIQUE NOT NULL, street TEXT, city TEXT, zip TEXT, ownerFirstName TEXT, ownerLastName TEXT, ownerPhone TEXT, ownerEmail TEXT, ownerStreet TEXT, ownerCity TEXT, ownerZip TEXT, buildingType TEXT, buildingFloors TEXT, heatingSystem TEXT, boilerBrand TEXT, flueType TEXT, flueHeight REAL, flueDiameter INTEGER, numAppliances INTEGER, applianceLocation TEXT, cleaningDoorLocation TEXT, revisionNumber TEXT, notes TEXT, customerId TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);`);
  d.execSync(`CREATE TABLE IF NOT EXISTS object_inspections (id TEXT PRIMARY KEY, objectId TEXT NOT NULL, reportNumber TEXT, inspectionDate TEXT NOT NULL, result TEXT NOT NULL, coMeasurement REAL, notes TEXT, createdAt TEXT NOT NULL);`);
  try { d.execSync('ALTER TABLE object_inspections ADD COLUMN formData TEXT DEFAULT \'{}\''); } catch {}
}

export function initChimneyTables() {
  const d = getDb();
  d.execSync(`CREATE TABLE IF NOT EXISTS object_chimneys (id TEXT PRIMARY KEY, objectId TEXT NOT NULL, label TEXT NOT NULL, type TEXT, manufacturer TEXT, model TEXT, material TEXT, isLined INTEGER DEFAULT 0, liningMaterial TEXT, totalHeight REAL, effectiveHeight REAL, diameter INTEGER, tPieceAngle TEXT, tPieceMaterial TEXT, notes TEXT, sortOrder INTEGER DEFAULT 0, createdAt TEXT NOT NULL);`);
  d.execSync(`CREATE TABLE IF NOT EXISTS object_appliances (id TEXT PRIMARY KEY, objectId TEXT NOT NULL, chimneyId TEXT, label TEXT NOT NULL, name TEXT, type TEXT, power REAL, outletDiameter INTEGER, location TEXT, notes TEXT, sortOrder INTEGER DEFAULT 0, createdAt TEXT NOT NULL);`);
}

// ─── ZÁKAZNÍCI ────────────────────────────────────────────────────────────────
export interface Customer { id:string; firstName:string; lastName:string; phone:string; email:string; street:string; city:string; zip:string; note:string; createdAt:string; }
export function getCustomers(): Customer[] { return getDb().getAllSync<Customer>('SELECT * FROM customers ORDER BY lastName, firstName'); }
export function getCustomer(id:string): Customer|null { return getDb().getFirstSync<Customer>('SELECT * FROM customers WHERE id=?',[id]); }
export function saveCustomer(c:Customer) { getDb().runSync('INSERT OR REPLACE INTO customers VALUES (?,?,?,?,?,?,?,?,?,?)',[c.id,c.firstName,c.lastName,c.phone,c.email,c.street,c.city,c.zip,c.note,c.createdAt]); }
export function deleteCustomer(id:string) { getDb().runSync('DELETE FROM customers WHERE id=?',[id]); }

// ─── KOMÍNY ZÁKAZNÍKŮ ─────────────────────────────────────────────────────────
export interface Chimney { id:string; customerId:string; label:string; type:string; fuel:string; note:string; }
export function getChimneys(customerId:string): Chimney[] { return getDb().getAllSync<Chimney>('SELECT * FROM chimneys WHERE customerId=?',[customerId]); }
export function saveChimney(c:Chimney) { getDb().runSync('INSERT OR REPLACE INTO chimneys VALUES (?,?,?,?,?,?)',[c.id,c.customerId,c.label,c.type,c.fuel,c.note]); }
export function deleteChimney(id:string) { getDb().runSync('DELETE FROM chimneys WHERE id=?',[id]); }

// ─── ZAKÁZKY ──────────────────────────────────────────────────────────────────
export interface Order { id:string; customerId:string; chimneyId:string; orderNumber:string; status:'nova'|'probihajici'|'dokoncena'|'zrusena'; scheduledDate:string; completedAt:string; address:string; note:string; price:number; createdAt:string; updatedAt:string; customerName?:string; }
export function getOrders(filter?:string): Order[] {
  let sql=`SELECT o.*,c.firstName||' '||c.lastName as customerName FROM orders o LEFT JOIN customers c ON o.customerId=c.id`;
  if(filter) sql+=` WHERE o.status='${filter}'`;
  return getDb().getAllSync<Order>(sql+' ORDER BY o.scheduledDate DESC, o.createdAt DESC');
}
export function getOrdersByDate(date:string): Order[] { return getDb().getAllSync<Order>(`SELECT o.*,c.firstName||' '||c.lastName as customerName FROM orders o LEFT JOIN customers c ON o.customerId=c.id WHERE o.scheduledDate=? ORDER BY o.createdAt`,[date]); }
export function getOrdersByCustomer(customerId:string): Order[] { return getDb().getAllSync<Order>(`SELECT o.*,c.firstName||' '||c.lastName as customerName FROM orders o LEFT JOIN customers c ON o.customerId=c.id WHERE o.customerId=? ORDER BY o.scheduledDate DESC`,[customerId]); }
export function getOrder(id:string): Order|null { return getDb().getFirstSync<Order>(`SELECT o.*,c.firstName||' '||c.lastName as customerName FROM orders o LEFT JOIN customers c ON o.customerId=c.id WHERE o.id=?`,[id]); }
export function saveOrder(o:Order) { getDb().runSync('INSERT OR REPLACE INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[o.id,o.customerId,o.chimneyId,o.orderNumber,o.status,o.scheduledDate,o.completedAt,o.address,o.note,o.price,o.createdAt,o.updatedAt]); }
export function deleteOrder(id:string) { getDb().runSync('DELETE FROM orders WHERE id=?',[id]); }

// ─── INSPEKCE ZAKÁZEK ─────────────────────────────────────────────────────────
export interface CheckItem { id:string; label:string; result:'vyhovuje'|'nevyhovuje'|'nelze_posoudit'|'neuvedeno'; }
export const DEFAULT_CHECK_ITEMS: CheckItem[] = [
  {id:'1',label:'Průchodnost průduchu',result:'neuvedeno'},{id:'2',label:'Spalinotěsnost průduchu',result:'neuvedeno'},
  {id:'3',label:'Stav sopouchu',result:'neuvedeno'},{id:'4',label:'Stav krycích dvířek',result:'neuvedeno'},
  {id:'5',label:'Stav vymetacích dvířek',result:'neuvedeno'},{id:'6',label:'Odvod kondenzátu',result:'neuvedeno'},
  {id:'7',label:'Stav komínového tělesa',result:'neuvedeno'},{id:'8',label:'Čistota průduchu',result:'neuvedeno'},
  {id:'9',label:'Měření CO (ppm)',result:'neuvedeno'},{id:'10',label:'Tah komínu',result:'neuvedeno'},
];
export interface Inspection { id:string; orderId:string; chimneyId:string; reportNumber:string; inspectionDate:string; checkItems:CheckItem[]; overallResult:'vyhovuje'|'nevyhovuje'|'podminecne'; coMeasurement?:number; notes:string; recommendations:string; signatureBase64?:string; createdAt:string; }
export function getInspection(orderId:string): Inspection|null {
  const row=getDb().getFirstSync<any>('SELECT * FROM inspections WHERE orderId=? ORDER BY createdAt DESC LIMIT 1',[orderId]);
  if(!row) return null; return {...row,checkItems:JSON.parse(row.checkItems)};
}
export function saveInspection(ins:Inspection) {
  getDb().runSync('INSERT OR REPLACE INTO inspections VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [ins.id,ins.orderId,ins.chimneyId,ins.reportNumber,ins.inspectionDate,JSON.stringify(ins.checkItems),ins.overallResult,ins.coMeasurement??null,ins.notes,ins.recommendations,ins.signatureBase64??null,ins.createdAt]);
}

// ─── STATISTIKY ───────────────────────────────────────────────────────────────
export function getStats() {
  const d=getDb();
  const total=d.getFirstSync<{count:number}>('SELECT COUNT(*) as count FROM orders')?.count??0;
  const done=d.getFirstSync<{count:number}>("SELECT COUNT(*) as count FROM orders WHERE status='dokoncena'")?.count??0;
  const revenue=d.getFirstSync<{sum:number}>("SELECT COALESCE(SUM(price),0) as sum FROM orders WHERE status='dokoncena'")?.sum??0;
  const month=new Date().toISOString().slice(0,7);
  const monthDone=d.getFirstSync<{count:number}>(`SELECT COUNT(*) as count FROM orders WHERE status='dokoncena' AND scheduledDate LIKE '${month}%'`)?.count??0;
  return {total,done,revenue,monthDone};
}

// ─── OBJEKTY ──────────────────────────────────────────────────────────────────
export interface ObjectRecord { id:string; oid:string; street:string; city:string; zip:string; ownerFirstName:string; ownerLastName:string; ownerPhone:string; ownerEmail:string; ownerStreet:string; ownerCity:string; ownerZip:string; buildingType:string; buildingFloors:string; heatingSystem:string; boilerBrand:string; flueType:string; flueHeight:number; flueDiameter:number; numAppliances:number; applianceLocation:string; cleaningDoorLocation:string; revisionNumber:string; notes:string; customerId?:string; createdAt:string; updatedAt:string; }
export function generateOID(): string {
  const existing=getDb().getAllSync<{oid:string}>('SELECT oid FROM objects').map(r=>r.oid);
  let oid:string;
  do { const a=String(Math.floor(Math.random()*900+100)); const b=String(Math.floor(Math.random()*900+100)); oid=`${a}-${b}`; } while(existing.includes(oid));
  return oid;
}
export function getObjects(): ObjectRecord[] { return getDb().getAllSync<ObjectRecord>('SELECT * FROM objects ORDER BY city, street'); }
export function getObject(id:string): ObjectRecord|null { return getDb().getFirstSync<ObjectRecord>('SELECT * FROM objects WHERE id=?',[id]); }
export function getObjectsByCustomer(customerId:string): ObjectRecord[] { return getDb().getAllSync<ObjectRecord>('SELECT * FROM objects WHERE customerId=? ORDER BY city, street',[customerId]); }
export function saveObject(o:ObjectRecord) {
  getDb().runSync('INSERT OR REPLACE INTO objects (id,oid,street,city,zip,ownerFirstName,ownerLastName,ownerPhone,ownerEmail,ownerStreet,ownerCity,ownerZip,buildingType,buildingFloors,heatingSystem,boilerBrand,flueType,flueHeight,flueDiameter,numAppliances,applianceLocation,cleaningDoorLocation,revisionNumber,notes,customerId,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [o.id,o.oid,o.street,o.city,o.zip,o.ownerFirstName,o.ownerLastName,o.ownerPhone,o.ownerEmail,o.ownerStreet,o.ownerCity,o.ownerZip,o.buildingType,o.buildingFloors,o.heatingSystem,o.boilerBrand,o.flueType,o.flueHeight,o.flueDiameter,o.numAppliances,o.applianceLocation,o.cleaningDoorLocation,o.revisionNumber,o.notes,o.customerId??null,o.createdAt,o.updatedAt]);
}
export function deleteObject(id:string) { getDb().runSync('DELETE FROM objects WHERE id=?',[id]); getDb().runSync('DELETE FROM object_inspections WHERE objectId=?',[id]); }

// ─── ZPRÁVY Z KONTROL OBJEKTŮ ─────────────────────────────────────────────────
export type InspResult = 'vyhovuje'|'nevyhovuje'|'podminecne'|'vyhovuje_po_odstraneni';
export type YesNo = 'ano'|'ne'|'';
export interface InspDefect { id:string; type:string; location:string; description:string; }

export interface InspectionFormData {
  // Přehled
  currentTechnicianName:string; revisionReportNumber:string;
  prevReportNumber:string; inspectionDate:string;
  chimneyLabel:string;
  // Komín
  chimneyType:'systemovy'|'individualny'|''; sysManufacturer:string; sysModel:string;
  bodyMaterial:string; isInsulated:boolean; insulationType:string; isLined:boolean; liningMaterial:string;
  totalHeight:string; effectiveHeight:string; flueDiameter:string;
  tPieceAngle:'45'|'90'|''; tPieceMaterial:string;
  // Kouřovod
  kMaterial:string; kLength:string; kDiameter:string;
  kHasReduction:boolean; kReductionWhere:string; kReductionFrom:string; kReductionTo:string;
  kElbowCount:string; kElbowTypes:string; kHasKO:boolean; kKOWhere:string; kInsulated:boolean;
  // Spotřebič
  appName:string; appType:string; appSerialNumber:string; appPower:string;
  appOutletDiameter:string; appOutletInfo:string; appLocation:string;
  // Dodatky
  appRoomLocation:string; koLocation:string; cleaningDoorLocation:string; sweepingDoorLocation:string;
  roofAccess:'vylaz'|'pruchod'|''; hasFoothold:boolean; fluePassesRoom:boolean; fluePassesRoomName:string;
  airSupplyType:'A'|'B'|'C'|''; sealedRoom:boolean;
  // Práce (ANO/NE)
  workCamera:YesNo;
  workVisualCheck:YesNo;
  workService:YesNo;         workServiceDetail:string;
  workCleanChimneyDuct:YesNo; workCleanChimneyDuctLevel:string;
  workCleanFlue:YesNo;        workCleanFlueLevel:string;
  workCleanAppliance:YesNo;
  workRemoveSoot:YesNo;
  workOther:YesNo;            workOtherDetail:string;
  // Závady (strukturované)
  defects:string;       // JSON: InspDefect[]
  defectsFixed:string;
  // Závěr
  customerSignature:string;  // 'signed' nebo prázdné
  conclusion:'vyhovuje'|'vyhovuje_po_odstraneni'|'nevyhovuje'|'';
}
export const DEFAULT_FORM_DATA: InspectionFormData = {
  currentTechnicianName:'',revisionReportNumber:'',
  prevReportNumber:'',inspectionDate:'',chimneyLabel:'',
  chimneyType:'',sysManufacturer:'',sysModel:'',
  bodyMaterial:'',isInsulated:false,insulationType:'',isLined:false,liningMaterial:'',
  totalHeight:'',effectiveHeight:'',flueDiameter:'',tPieceAngle:'',tPieceMaterial:'',
  kMaterial:'',kLength:'',kDiameter:'',kHasReduction:false,kReductionWhere:'',kReductionFrom:'',kReductionTo:'',
  kElbowCount:'',kElbowTypes:'',kHasKO:false,kKOWhere:'',kInsulated:false,
  appName:'',appType:'',appSerialNumber:'',appPower:'',appOutletDiameter:'',appOutletInfo:'',appLocation:'',
  appRoomLocation:'',koLocation:'',cleaningDoorLocation:'',sweepingDoorLocation:'',
  roofAccess:'',hasFoothold:false,fluePassesRoom:false,fluePassesRoomName:'',
  airSupplyType:'',sealedRoom:false,
  workCamera:'',workVisualCheck:'',workService:'',workServiceDetail:'',
  workCleanChimneyDuct:'',workCleanChimneyDuctLevel:'',
  workCleanFlue:'',workCleanFlueLevel:'',
  workCleanAppliance:'',workRemoveSoot:'',workOther:'',workOtherDetail:'',
  defects:'[]',defectsFixed:'',customerSignature:'',conclusion:'',
};
export function generateReportNumber(): string {
  const now=new Date(); const y=now.getFullYear(); const m=String(now.getMonth()+1).padStart(2,'0');
  const prefix=`ZoK-${y}-${m}-`;
  const existing=getDb().getAllSync<{reportNumber:string}>(`SELECT reportNumber FROM object_inspections WHERE reportNumber LIKE '${prefix}%'`);
  const nums=existing.map(r=>parseInt(r.reportNumber.split('-').pop()??'0')||0);
  return `${prefix}${nums.length>0?Math.max(...nums)+1:1}`;
}
export interface ObjectInspection { id:string; objectId:string; reportNumber:string; inspectionDate:string; result:InspResult; coMeasurement?:number; notes:string; createdAt:string; formData?:InspectionFormData; }
export function getObjectInspections(objectId:string): ObjectInspection[] {
  return getDb().getAllSync<any>('SELECT * FROM object_inspections WHERE objectId=? ORDER BY inspectionDate ASC',[objectId])
    .map(r=>({...r,formData:r.formData?JSON.parse(r.formData):undefined}));
}
export function saveObjectInspection(ins:ObjectInspection) {
  getDb().runSync(
    'INSERT OR REPLACE INTO object_inspections (id,objectId,reportNumber,inspectionDate,result,coMeasurement,notes,createdAt,formData) VALUES (?,?,?,?,?,?,?,?,?)',
    [ins.id,ins.objectId,ins.reportNumber,ins.inspectionDate,ins.result,ins.coMeasurement??null,ins.notes,ins.createdAt,ins.formData?JSON.stringify(ins.formData):'{}']
  );
}

// ─── KOMÍNY A SPOTŘEBIČE OBJEKTŮ ─────────────────────────────────────────────
export interface ObjectChimney { id:string; objectId:string; label:string; type:string; manufacturer:string; model:string; material:string; isLined:boolean; liningMaterial:string; totalHeight:number; effectiveHeight:number; diameter:number; tPieceAngle:string; tPieceMaterial:string; notes:string; sortOrder:number; createdAt:string; }
export function getObjectChimneys(objectId:string): ObjectChimney[] {
  return getDb().getAllSync<any>('SELECT * FROM object_chimneys WHERE objectId=? ORDER BY sortOrder,createdAt',[objectId]).map(r=>({...r,isLined:!!r.isLined}));
}
export function saveObjectChimney(c:ObjectChimney) {
  getDb().runSync('INSERT OR REPLACE INTO object_chimneys VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [c.id,c.objectId,c.label,c.type,c.manufacturer,c.model,c.material,c.isLined?1:0,c.liningMaterial,c.totalHeight,c.effectiveHeight,c.diameter,c.tPieceAngle,c.tPieceMaterial,c.notes,c.sortOrder,c.createdAt]);
}
export function deleteObjectChimney(id:string) { getDb().runSync('DELETE FROM object_chimneys WHERE id=?',[id]); getDb().runSync('DELETE FROM object_appliances WHERE chimneyId=?',[id]); }

export interface ObjectAppliance { id:string; objectId:string; chimneyId:string|null; label:string; name:string; type:string; power:number; outletDiameter:number; location:string; notes:string; sortOrder:number; createdAt:string; }
export function getObjectAppliances(objectId:string, chimneyId?:string): ObjectAppliance[] {
  if(chimneyId) return getDb().getAllSync<ObjectAppliance>('SELECT * FROM object_appliances WHERE objectId=? AND chimneyId=? ORDER BY sortOrder',[objectId,chimneyId]);
  return getDb().getAllSync<ObjectAppliance>('SELECT * FROM object_appliances WHERE objectId=? ORDER BY sortOrder',[objectId]);
}
export function saveObjectAppliance(a:ObjectAppliance) {
  getDb().runSync('INSERT OR REPLACE INTO object_appliances VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [a.id,a.objectId,a.chimneyId,a.label,a.name,a.type,a.power,a.outletDiameter,a.location,a.notes,a.sortOrder,a.createdAt]);
}
export function deleteObjectAppliance(id:string) { getDb().runSync('DELETE FROM object_appliances WHERE id=?',[id]); }

// ─── LOG SYSTÉM ───────────────────────────────────────────────────────────────
function _uid(): string { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function _ts(): string {
  const n=new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}/${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
}
export function initLogTable() {
  getDb().execSync(`CREATE TABLE IF NOT EXISTS app_logs (id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, technicianName TEXT, objectId TEXT, objectLabel TEXT, action TEXT NOT NULL, targetId TEXT, targetLabel TEXT, reason TEXT, createdAt TEXT NOT NULL);`);
}
export interface AppLog { id:string; timestamp:string; technicianName:string; objectId:string; objectLabel:string; action:string; targetId:string; targetLabel:string; reason:string; createdAt:string; }
export function addLog(tech:string, objId:string, objLabel:string, action:string, targetId:string, targetLabel:string, reason:string='') {
  try {
    getDb().runSync('INSERT INTO app_logs VALUES (?,?,?,?,?,?,?,?,?,?)',
      [_uid(),_ts(),tech,objId,objLabel,action,targetId,targetLabel,reason,new Date().toISOString()]);
  } catch {}
}
export function getLogs(objectId?:string): AppLog[] {
  if(objectId) return getDb().getAllSync<AppLog>('SELECT * FROM app_logs WHERE objectId=? ORDER BY createdAt DESC',[objectId]);
  return getDb().getAllSync<AppLog>('SELECT * FROM app_logs ORDER BY createdAt DESC LIMIT 1000');
}
// Formatování logu pro zobrazení: 2026-06-25/22:34:56-technik-objekt-akce-cíl-důvod
export function formatLog(log:AppLog): string {
  const parts=[log.timestamp,log.technicianName||'?',log.objectLabel||'?',log.action,log.targetLabel||'',log.reason||''].filter((p,i)=>i<4||p);
  return parts.join('-');
}
export function deleteObjectInspection(id:string) { getDb().runSync('DELETE FROM object_inspections WHERE id=?',[id]); }

// ─── NASTAVENÍ (key-value store) ──────────────────────────────────────────────
export function initSettingsTable() {
  getDb().execSync(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
}
export function getSetting(key: string): string | null {
  return getDb().getFirstSync<{value:string}>('SELECT value FROM settings WHERE key=?',[key])?.value ?? null;
}
export function setSetting(key: string, value: string) {
  getDb().runSync('INSERT OR REPLACE INTO settings VALUES (?,?)',[key,value]);
}
export function getAllSettings(): Record<string,string> {
  const rows = getDb().getAllSync<{key:string;value:string}>('SELECT * FROM settings');
  const result: Record<string,string> = {};
  for (const r of rows) result[r.key] = r.value;
  return result;
}
