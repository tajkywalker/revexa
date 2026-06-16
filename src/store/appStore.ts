import { create } from 'zustand';
import { Customer } from '../types';
import { OrderListItem, OrderDetail } from '../database/database';

interface AppState {
  // Navigace
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Zákazníci
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;

  // Zakázky
  orders: OrderListItem[];
  setOrders: (orders: OrderListItem[]) => void;
  selectedOrder: OrderDetail | null;
  setSelectedOrder: (order: OrderDetail | null) => void;

  // Vybraný datum v kalendáři
  calendarDate: string;
  setCalendarDate: (date: string) => void;

  // Loading stavy
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Modály
  showNewOrderModal: boolean;
  setShowNewOrderModal: (show: boolean) => void;

  showNewReportModal: boolean;
  setShowNewReportModal: (show: boolean) => void;
  reportOrderId: string | null;
  setReportOrderId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'prehled',
  setActiveTab: (tab) => set({ activeTab: tab }),

  customers: [],
  setCustomers: (customers) => set({ customers }),

  orders: [],
  setOrders: (orders) => set({ orders }),

  selectedOrder: null,
  setSelectedOrder: (order) => set({ selectedOrder: order }),

  calendarDate: new Date().toISOString().split('T')[0],
  setCalendarDate: (date) => set({ calendarDate: date }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  showNewOrderModal: false,
  setShowNewOrderModal: (show) => set({ showNewOrderModal: show }),

  showNewReportModal: false,
  setShowNewReportModal: (show) => set({ showNewReportModal: show }),
  reportOrderId: null,
  setReportOrderId: (id) => set({ reportOrderId: id }),
}));
