export function uid(): string { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
export function nowISO(): string { return new Date().toISOString(); }
export function todayISO(): string { return new Date().toISOString().split('T')[0]; }
export function formatDate(iso: string): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('cs-CZ'); } catch { return iso; }
}
export function formatCurrency(n: number): string { return n.toLocaleString('cs-CZ') + ' Kč'; }
export const STATUS_LABELS: Record<string,string> = { nova:'Nová', probihajici:'Probíhající', dokoncena:'Dokončená', zrusena:'Zrušená' };
export const STATUS_COLORS: Record<string,string> = { nova:'#007AFF', probihajici:'#FF9F0A', dokoncena:'#34C759', zrusena:'#FF453A' };
