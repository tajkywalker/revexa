// ============================================================
// REVEXA - Typy
// ============================================================

export type ObjectType = 'rodinny_dum' | 'bytovy_dum' | 'komercni' | 'prumyslovy' | 'jiny';
export type FuelType = 'tuha_paliva' | 'plyn' | 'olej' | 'biomasa' | 'jiny';
export type ChimneyType = 'zděný' | 'kovový' | 'plastový' | 'prefabrikovaný';
export type OrderStatus = 'planovana' | 'probihajici' | 'dokoncena' | 'zrusena';
export type OrderType = 'kontrola' | 'cisteni' | 'revize' | 'mereni_co' | 'jiny';
export type CheckResult = 'vyhovuje' | 'nevyhovuje' | 'nelze_posoudit' | 'neuvedeno';
export type OverallResult = 'vyhovuje' | 'nevyhovuje' | 'podmínečně_vyhovuje';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  street: string;
  city: string;
  zip: string;
  phone: string;
  email: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chimney {
  id: string;
  addressId: string;
  label: string; // např. "Komín č.1"
  type: ChimneyType;
  diameter: number; // mm
  height: number; // m
  appliancesCount: number;
  fuelType: FuelType;
  installYear?: number;
  note?: string;
}

export interface Address {
  id: string;
  customerId: string;
  street: string;
  city: string;
  zip: string;
  objectType: ObjectType;
  objectNote?: string;
  applianceType?: string; // kondenzační kotel, krbová vložka atd.
  buildYear?: number;
  chimneys: Chimney[];
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // #2025-0487
  customerId: string;
  addressId: string;
  orderType: OrderType;
  status: OrderStatus;
  scheduledDate: string; // ISO date
  scheduledTime?: string; // HH:MM
  completedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckItem {
  id: string;
  label: string;
  result: CheckResult;
  value?: string; // pro měřené hodnoty jako CO v ppm
  note?: string;
}

export interface InspectionReport {
  id: string;
  orderId: string;
  chimneyId: string;
  reportNumber: string;
  inspectionDate: string;
  checkItems: CheckItem[];
  overallResult: OverallResult;
  coMeasurement?: number; // ppm
  notes: string;
  recommendations: string;
  signatureBase64?: string;
  photoUris: string[];
  pdfUri?: string;
  emailSentAt?: string;
  createdAt: string;
}

// Pro zobrazení v seznamu zakázek
export interface OrderListItem extends Order {
  customerName: string;
  addressStreet: string;
  addressCity: string;
  fuelTypes: string[];
}

// Kompletní zakázka s daty
export interface OrderDetail extends Order {
  customer: Customer;
  address: Address;
  reports: InspectionReport[];
}

export const DEFAULT_CHECK_ITEMS: Omit<CheckItem, 'id'>[] = [
  { label: 'Kontrola průchodnosti', result: 'neuvedeno' },
  { label: 'Kontrola spalinotěsnosti', result: 'neuvedeno' },
  { label: 'Kontrola stavu komínového tělesa', result: 'neuvedeno' },
  { label: 'Kontrola sopouchu a dvířek', result: 'neuvedeno' },
  { label: 'Kontrola připojení spotřebiče', result: 'neuvedeno' },
  { label: 'Kontrola tahových poměrů', result: 'neuvedeno' },
  { label: 'Měření CO ve spalinách', result: 'neuvedeno', value: '' },
  { label: 'Kontrola větrání', result: 'neuvedeno' },
  { label: 'Celkové zhodnocení', result: 'neuvedeno' },
];
