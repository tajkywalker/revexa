import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, getOrderTypeLabel, getObjectTypeLabel, getFuelTypeLabel } from '../../utils/theme';
import { OrderDetail } from '../../database/database';
import { formatDate } from '../../utils/helpers';
import { saveOrder } from '../../database/database';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import InspectionReportModal from '../reports/InspectionReportModal';

type TabKey = 'kontrola' | 'dokumenty' | 'fotky' | 'poznamky';

interface Props {
  order: OrderDetail;
  onRefresh: () => void;
}

export default function OrderDetailPanel({ order, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('kontrola');
  const [showReportModal, setShowReportModal] = useState(false);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'kontrola', label: 'Kontrola' },
    { key: 'dokumenty', label: 'Dokumenty' },
    { key: 'fotky', label: 'Fotky' },
    { key: 'poznamky', label: 'Poznámky' },
  ];

  const report = order.reports[0] || null;
  const chimney = order.address.chimneys[0] || null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.breadcrumb}>Zakázka</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{order.orderNumber}</Text>
            <StatusBadge status={order.status} />
          </View>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => {}}>
          <Text style={styles.editBtnText}>UPRAVIT ZAKÁZKU</Text>
        </TouchableOpacity>
      </View>

      {/* Záložky */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Obsah */}
      <View style={styles.body}>
        {activeTab === 'kontrola' && (
          <KontrolaTab order={order} report={report} chimney={chimney} onNewReport={() => setShowReportModal(true)} />
        )}
        {activeTab === 'dokumenty' && (
          <DokumentyTab report={report} />
        )}
        {activeTab === 'fotky' && (
          <FotkyTab report={report} />
        )}
        {activeTab === 'poznamky' && (
          <PoznamkyTab order={order} />
        )}
      </View>

      {/* Modal pro novou zprávu */}
      {showReportModal && (
        <InspectionReportModal
          order={order}
          chimney={chimney}
          existingReport={report}
          onClose={() => setShowReportModal(false)}
          onSaved={() => {
            setShowReportModal(false);
            onRefresh();
          }}
        />
      )}
    </View>
  );
}

// -----------------------------------------------------------------------
function KontrolaTab({ order, report, chimney, onNewReport }: any) {
  return (
    <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
      <View style={styles.twoCol}>
        {/* Levý sloupec - zákazník + info */}
        <View style={styles.leftCol}>
          {/* Zákazník */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ZÁKAZNÍK</Text>
            <View style={styles.customerRow}>
              <Text style={styles.customerIcon}>👤</Text>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                  {order.customer.firstName} {order.customer.lastName}
                  {order.customer.companyName ? ` (${order.customer.companyName})` : ''}
                </Text>
                <Text style={styles.customerAddr}>{order.address.street}</Text>
                <Text style={styles.customerAddr}>{order.address.zip} {order.address.city}</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Kontakt */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>KONTAKT</Text>
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>{order.customer.phone}</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>✉</Text>
              <Text style={styles.contactText}>{order.customer.email}</Text>
            </View>
          </View>

          {/* Informace o objektu */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INFORMACE O OBJEKTU</Text>
            <Text style={styles.infoText}>{getObjectTypeLabel(order.address.objectType)}</Text>
            {order.address.applianceType && (
              <Text style={styles.infoText}>{order.address.applianceType}</Text>
            )}
            {order.address.buildYear && (
              <Text style={styles.infoText}>Rok výstavby: {order.address.buildYear}</Text>
            )}
          </View>

          {/* Spalinová cesta */}
          {chimney && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SPALINOVÁ CESTA</Text>
              <InfoRow label="Typ" value={chimney.type} />
              <InfoRow label="Průměr" value={`${chimney.diameter} mm`} />
              <InfoRow label="Výška" value={`${chimney.height} m`} />
              <InfoRow label="Počet spotřebičů" value={chimney.appliancesCount.toString()} />
            </View>
          )}

          {/* Tlačítko upravit */}
          <TouchableOpacity style={styles.editOrderBtn}>
            <Text style={styles.editOrderBtnText}>UPRAVIT ZAKÁZKU</Text>
          </TouchableOpacity>
        </View>

        {/* Pravý sloupec - kontrola */}
        <View style={styles.rightCol}>
          {report ? (
            <>
              {/* Výsledky kontrol */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>KONTROLA SPALINOVÉ CESTY</Text>
                {report.checkItems.map((item: any) => (
                  <CheckItemRow key={item.id} item={item} />
                ))}
              </View>

              {/* Výsledek */}
              <View style={styles.resultCard}>
                <View style={[
                  styles.resultIcon,
                  { backgroundColor: report.overallResult === 'vyhovuje' ? Colors.success + '30' : Colors.error + '30' }
                ]}>
                  <Text style={{ fontSize: 20 }}>
                    {report.overallResult === 'vyhovuje' ? '✓' : '✗'}
                  </Text>
                </View>
                <View>
                  <Text style={[
                    styles.resultText,
                    { color: report.overallResult === 'vyhovuje' ? Colors.success : Colors.error }
                  ]}>
                    {report.overallResult === 'vyhovuje' ? 'VYHOVUJE' : 'NEVYHOVUJE'}
                  </Text>
                  <Text style={styles.resultSub}>
                    Spalinová cesta je způsobilá k provozu.
                  </Text>
                </View>
              </View>

              {/* Poznámky */}
              {report.notes ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>POZNÁMKY</Text>
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>{report.notes}</Text>
                  </View>
                </View>
              ) : null}

              {/* Navigace */}
              <View style={styles.navBtns}>
                <TouchableOpacity style={styles.navBtnBack}>
                  <Text style={styles.navBtnBackText}>ZPĚT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBtnNext} onPress={onNewReport}>
                  <Text style={styles.navBtnNextText}>NOVÁ ZPRÁVA</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.noReport}>
              <Text style={styles.noReportText}>Zatím žádná zpráva z kontroly</Text>
              <TouchableOpacity style={styles.newReportBtn} onPress={onNewReport}>
                <Text style={styles.newReportBtnText}>+ Vytvořit zprávu z kontroly</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Krajní pravý sloupec - fotky + podpis + akce */}
        {report && (
          <View style={styles.actionCol}>
            <FotkySection uris={report.photoUris} />
            <SignatureSection sig={report.signatureBase64} />
            <DokumentSection report={report} />
            <AkceSection report={report} order={order} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function CheckItemRow({ item }: { item: any }) {
  const icons: Record<string, string> = {
    vyhovuje: '✓',
    nevyhovuje: '✗',
    nelze_posoudit: '⚠',
    neuvedeno: '○',
  };
  const colors: Record<string, string> = {
    vyhovuje: Colors.success,
    nevyhovuje: Colors.error,
    nelze_posoudit: Colors.warning,
    neuvedeno: Colors.textTertiary,
  };

  return (
    <View style={styles.checkRow}>
      <Text style={styles.checkLabel}>{item.label}</Text>
      <View style={styles.checkRight}>
        {item.value ? <Text style={styles.checkValue}>{item.value}</Text> : null}
        <View style={[styles.checkIcon, { borderColor: colors[item.result] }]}>
          <Text style={{ color: colors[item.result], fontSize: 12 }}>{icons[item.result]}</Text>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function FotkySection({ uris }: { uris: string[] }) {
  return (
    <View style={styles.actionSection}>
      <Text style={styles.actionSectionTitle}>FOTKY Z KONTROLY</Text>
      <View style={styles.photosRow}>
        {uris.slice(0, 3).map((uri, i) => (
          <View key={i} style={styles.photoThumb}>
            <Text style={{ fontSize: 20 }}>🏠</Text>
          </View>
        ))}
        <TouchableOpacity style={[styles.photoThumb, styles.addPhoto]}>
          <Text style={styles.addPhotoText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SignatureSection({ sig }: { sig?: string }) {
  return (
    <View style={styles.actionSection}>
      <Text style={styles.actionSectionTitle}>PODPIS ZÁKAZNÍKA</Text>
      <View style={styles.signatureBox}>
        {sig ? (
          <Text style={styles.signaturePlaceholder}>✍ Podpis uložen</Text>
        ) : (
          <Text style={styles.signaturePlaceholder}>Podpis zde</Text>
        )}
        <TouchableOpacity style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>VYMAZAT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DokumentSection({ report }: { report: any }) {
  return (
    <View style={styles.actionSection}>
      <Text style={styles.actionSectionTitle}>DOKUMENT</Text>
      <View style={styles.docRow}>
        <View>
          <Text style={styles.docName}>Protokol o kontrole</Text>
          <Text style={styles.docType}>PDF</Text>
        </View>
        <TouchableOpacity style={styles.previewBtn}>
          <Text style={styles.previewBtnText}>👁 NÁHLED</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AkceSection({ report, order }: { report: any; order: OrderDetail }) {
  return (
    <View style={styles.actionSection}>
      <Text style={styles.actionSectionTitle}>AKCE</Text>
      <TouchableOpacity style={styles.printBtn}>
        <Text style={styles.printBtnText}>🖨 VYTISKNOUT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>✓ ULOŽIT A UZAVŘÍT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.emailBtn}>
        <Text style={styles.emailBtnText}>✉ ODESLAT E-MAILEM</Text>
      </TouchableOpacity>
    </View>
  );
}

function DokumentyTab({ report }: any) {
  return (
    <View style={styles.tabContent}>
      {report ? (
        <Card>
          <Text style={styles.infoText}>📄 Protokol o kontrole</Text>
          <Text style={styles.infoText}>PDF dokument</Text>
        </Card>
      ) : (
        <Text style={styles.noReportText}>Žádné dokumenty</Text>
      )}
    </View>
  );
}

function FotkyTab({ report }: any) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.noReportText}>
        {report?.photoUris?.length > 0
          ? `${report.photoUris.length} fotek`
          : 'Žádné fotky'}
      </Text>
    </View>
  );
}

function PoznamkyTab({ order }: any) {
  return (
    <View style={styles.tabContent}>
      <Card>
        <Text style={styles.infoText}>{order.note || 'Žádné poznámky'}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerLeft: { gap: 4 },
  breadcrumb: { color: Colors.textSecondary, fontSize: Typography.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold },
  editBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editBtnText: { color: Colors.primary, fontWeight: Typography.semiBold, fontSize: Typography.sm },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  tab: { paddingVertical: 10, paddingHorizontal: 16, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: Typography.base },
  tabTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },

  body: { flex: 1 },
  scrollBody: { flex: 1 },
  scrollContent: { padding: Spacing.base },

  twoCol: { flexDirection: 'row', gap: Spacing.base, alignItems: 'flex-start' },
  leftCol: { width: 260, gap: Spacing.sm },
  rightCol: { flex: 1, gap: Spacing.sm },
  actionCol: { width: 240, gap: Spacing.sm },

  section: { gap: Spacing.xs },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  customerIcon: { fontSize: 20, opacity: 0.7 },
  customerInfo: { flex: 1 },
  customerName: { color: Colors.textPrimary, fontWeight: Typography.semiBold, fontSize: Typography.base },
  customerAddr: { color: Colors.textSecondary, fontSize: Typography.sm },
  arrowIcon: { color: Colors.textSecondary, fontSize: 20 },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  contactIcon: { fontSize: 14, width: 20 },
  contactText: { color: Colors.textPrimary, fontSize: Typography.base },

  infoText: { color: Colors.textSecondary, fontSize: Typography.base },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  infoLabel: { color: Colors.textSecondary, fontSize: Typography.sm },
  infoValue: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },

  editOrderBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  editOrderBtnText: { color: Colors.primary, fontWeight: Typography.semiBold, fontSize: Typography.sm },

  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  checkLabel: { color: Colors.textPrimary, fontSize: Typography.sm, flex: 1 },
  checkRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkValue: { color: Colors.textSecondary, fontSize: Typography.sm },
  checkIcon: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success + '50',
  },
  resultIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  resultText: { fontSize: Typography.lg, fontWeight: Typography.bold },
  resultSub: { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 2 },

  noteBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  noteText: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 20 },

  navBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  navBtnBack: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  navBtnBackText: { color: Colors.textSecondary, fontWeight: Typography.semiBold },
  navBtnNext: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  navBtnNextText: { color: Colors.textPrimary, fontWeight: Typography.semiBold },

  noReport: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl },
  noReportText: { color: Colors.textSecondary, fontSize: Typography.base, textAlign: 'center' },
  newReportBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  newReportBtnText: { color: Colors.textPrimary, fontWeight: Typography.semiBold },

  // Akce panel
  actionSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  actionSectionTitle: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.8,
  },
  photosRow: { flexDirection: 'row', gap: 6 },
  photoThumb: {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  addPhoto: { borderStyle: 'dashed' },
  addPhotoText: { color: Colors.textSecondary, fontSize: 20 },

  signatureBox: {
    height: 80,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  signaturePlaceholder: { color: Colors.textTertiary, fontStyle: 'italic' },
  clearBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  clearBtnText: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semiBold },

  docRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  docName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
  docType: { color: Colors.textTertiary, fontSize: Typography.xs },
  previewBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  previewBtnText: { color: Colors.textSecondary, fontSize: Typography.xs },

  printBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 10, alignItems: 'center',
  },
  printBtnText: { color: Colors.textPrimary, fontWeight: Typography.semiBold },
  saveBtn: {
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md, paddingVertical: 10, alignItems: 'center',
  },
  saveBtnText: { color: Colors.textPrimary, fontSize: Typography.sm },
  emailBtn: {
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md, paddingVertical: 10, alignItems: 'center',
  },
  emailBtnText: { color: Colors.textPrimary, fontSize: Typography.sm },

  tabContent: { flex: 1, padding: Spacing.base },
});
