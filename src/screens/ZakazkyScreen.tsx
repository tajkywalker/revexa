import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ScrollView
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, getStatusColor, getStatusLabel, getOrderTypeLabel } from '../utils/theme';
import { getAllOrders, getOrdersByDate, getOrderDetail, OrderListItem, OrderDetail } from '../database/database';
import { formatDate, formatDateRelative, todayISO } from '../utils/helpers';
import { useAppStore } from '../store/appStore';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import OrderDetailPanel from '../components/orders/OrderDetailPanel';

export default function ZakazkyScreen() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [filtered, setFiltered] = useState<OrderListItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('vse');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { showNewOrderModal, setShowNewOrderModal } = useAppStore();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [orders, search, filterStatus]);

  async function loadOrders() {
    const data = await getAllOrders();
    setOrders(data);
  }

  function applyFilter() {
    let result = [...orders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.addressCity.toLowerCase().includes(q) ||
        o.addressStreet.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'vse') {
      result = result.filter(o => o.status === filterStatus);
    }
    setFiltered(result);
  }

  async function handleSelectOrder(order: OrderListItem) {
    setLoadingDetail(true);
    const detail = await getOrderDetail(order.id);
    setSelectedOrder(detail);
    setLoadingDetail(false);
  }

  return (
    <View style={styles.container}>
      {/* Levý panel - seznam */}
      <View style={styles.listPanel}>
        {/* Hledání */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Hledat zakázky..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filtry */}
        <View style={styles.filterRow}>
          {['vse', 'planovana', 'probihajici', 'dokoncena'].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterBtn, filterStatus === s && styles.filterBtnActive]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.filterBtnText, filterStatus === s && styles.filterBtnTextActive]}>
                {s === 'vse' ? 'Vše' : getStatusLabel(s)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Počet výsledků */}
        <Text style={styles.countText}>{filtered.length} zakázek</Text>

        {/* Seznam */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <OrderListCard
              order={item}
              isSelected={selectedOrder?.id === item.id}
              onPress={() => handleSelectOrder(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      </View>

      {/* Pravý panel - detail */}
      <View style={styles.detailPanel}>
        {loadingDetail ? (
          <View style={styles.emptyDetail}>
            <Text style={styles.emptyDetailText}>Načítání...</Text>
          </View>
        ) : selectedOrder ? (
          <OrderDetailPanel
            order={selectedOrder}
            onRefresh={() => {
              loadOrders();
              getOrderDetail(selectedOrder.id).then(setSelectedOrder);
            }}
          />
        ) : (
          <View style={styles.emptyDetail}>
            <Text style={styles.emptyDetailIcon}>📋</Text>
            <Text style={styles.emptyDetailText}>Vyberte zakázku ze seznamu</Text>
            <Text style={styles.emptyDetailSub}>nebo vytvořte novou zakázku</Text>
            <TouchableOpacity
              style={styles.emptyNewBtn}
              onPress={() => setShowNewOrderModal(true)}
            >
              <Text style={styles.emptyNewBtnText}>+ Nová zakázka</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------
function OrderListCard({
  order, isSelected, onPress
}: {
  order: OrderListItem;
  isSelected: boolean;
  onPress: () => void;
}) {
  const isToday = order.scheduledDate === todayISO();

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.orderCard, isSelected && styles.orderCardSelected]}>
        {isSelected && <View style={styles.selectedBar} />}
        <View style={styles.orderCardContent}>
          <View style={styles.orderCardTop}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.orderCustomer}>{order.customerName}</Text>
          <Text style={styles.orderAddress}>
            {order.addressStreet}, {order.addressCity}
          </Text>
          <View style={styles.orderCardBottom}>
            <Text style={styles.orderType}>{getOrderTypeLabel(order.orderType)}</Text>
            <View style={styles.orderDateRow}>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayText}>DNES</Text>
                </View>
              )}
              <Text style={styles.orderDate}>
                {formatDateRelative(order.scheduledDate)}
                {order.scheduledTime ? ` ${order.scheduledTime}` : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },

  // Levý panel
  listPanel: {
    width: 320,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
    paddingTop: Spacing.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.base,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    paddingVertical: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  filterBtnTextActive: {
    color: Colors.textPrimary,
  },
  countText: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },

  // Karta zakázky
  orderCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  orderCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  selectedBar: {
    width: 3,
    backgroundColor: Colors.primary,
  },
  orderCardContent: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  orderNumber: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
  },
  orderCustomer: {
    color: Colors.textPrimary,
    fontWeight: Typography.semiBold,
    fontSize: Typography.base,
  },
  orderAddress: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderType: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
  },
  orderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  todayText: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: Typography.bold,
  },
  orderDate: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
  },

  // Pravý panel
  detailPanel: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyDetail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyDetailIcon: { fontSize: 48, opacity: 0.3 },
  emptyDetailText: {
    color: Colors.textSecondary,
    fontSize: Typography.lg,
    fontWeight: Typography.medium,
  },
  emptyDetailSub: {
    color: Colors.textTertiary,
    fontSize: Typography.base,
  },
  emptyNewBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyNewBtnText: {
    color: Colors.textPrimary,
    fontWeight: Typography.semiBold,
    fontSize: Typography.base,
  },
});
