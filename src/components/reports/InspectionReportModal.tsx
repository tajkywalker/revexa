import React, { useState, useRef } from 'react';
import {
  View, Text, Modal, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Spacing, BorderRadius } from '../../utils/theme';
import { OrderDetail } from '../../database/database';
import { InspectionReport, CheckItem, DEFAULT_CHECK_ITEMS, Chimney, OverallResult } from '../../types';
import { generateId, nowISO, todayISO } from '../../utils/helpers';
import { saveInspectionReport, saveOrder } from '../../database/database';
import { generateReportPDF } from '../../utils/pdfGenerator';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';

type Step = 'kontrola' | 'podpis' | 'dokonceni';

interface Props {
  order: OrderDetail;
  chimney: Chimney | null;
  existingReport: InspectionReport | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function InspectionReportModal({ order, chimney, existingReport, onClose, onSaved }: Props) {
  const [step, setStep] = useState<Step>('kontrola');
  const [saving, setSaving] = useState(false);

  // Data zprávy
  const [checkItems, setCheckItems] = useState<CheckItem[]>(
    existingReport?.checkItems || DEFAULT_CHECK_ITEMS.map((ci, i) => ({ ...ci, id: `ci-${i}` }))
  );
  const [notes, setNotes] = useState(existingReport?.notes || '');
  const [recommendations, setRecommendations] = useState(existingReport?.recommendations || '');
  const [overallResult, setOverallResult] = useState<OverallResult>(
    existingReport?.overallResult || 'vyhovuje'
  );
  const [coValue, setCoValue] = useState(existingReport?.coMeasurement?.toString() || '');
  const [signatureBase64, setSignatureBase64] = useState<string | undefined>(existingReport?.signatureBase64);
  const webviewRef = useRef<WebView>(null);

  function updateCheckItem(id: string, result: CheckItem['result'], value?: string) {
    setCheckItems(prev =>
      prev.map(ci => ci.id === id ? { ...ci, result, value: value !== undefined ? value : ci.value } : ci)
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const reportId = existingReport?.id || generateId();
      const reportNumber = existingReport?.reportNumber || `ZP-${order.orderNumber.replace('#', '')}`;

      const report: InspectionReport = {
        id: reportId,
        orderId: order.id,
        chimneyId: chimney?.id || '',
        reportNumber,
        inspectionDate: todayISO(),
        checkItems,
        overallResult,
        coMeasurement: coValue ? parseFloat(coValue) : undefined,
        notes,
        recommendations,
        signatureBase64,
        photoUris: existingReport?.photoUris || [],
        createdAt: existingReport?.createdAt || nowISO(),
      };

      await saveInspectionReport(report);

      // Aktualizovat status zakázky
      await saveOrder({
        ...order,
        status: 'dokoncena',
        completedAt: nowISO(),
        updatedAt: nowISO(),
      });

      onSaved();
    } catch (error) {
      Alert.alert('Chyba', 'Nepodařilo se uložit zprávu.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendEmail() {
    if (!order.customer.email) {
      Alert.alert('Chyba', 'Zákazník nemá zadaný e-mail.');
      return;
    }

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Chyba', 'E-mail není na tomto zařízení dostupný.');
      return;
    }

    await MailComposer.composeAsync({
      recipients: [order.customer.email],
      subject: `Protokol o kontrole spalinové cesty - ${order.orderNumber}`,
      body: `Vážený/á ${order.customer.firstName} ${order.customer.lastName},\n\nv příloze naleznete protokol o kontrole spalinové cesty na adrese ${order.address.street}, ${order.address.city}.\n\nS pozdravem,\nkominická firma`,
    });
  }

  const SIGNATURE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #252528; display: flex; flex-direction: column; height: 100vh; }
    canvas { touch-action: none; cursor: crosshair; display: block; width: 100%; flex: 1; }
    .toolbar { padding: 8px; display: flex; gap: 8px; background: #1c1c1e; }
    button {
      padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;
      font-size: 14px; font-weight: 600;
    }
    .clear { background: #3a3a3c; color: #fff; }
    .save { background: #E8651A; color: #fff; flex: 1; }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <div class="toolbar">
    <button class="clear" onclick="clear_()">Vymazat</button>
    <button class="save" onclick="save_()">Uložit podpis</button>
  </div>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let paths = [];
    let currentPath = [];

    function resize() {
      const old = canvas.toDataURL();
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = old;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    window.addEventListener('resize', resize);
    resize();

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - rect.left) * (canvas.width / rect.width), y: (t.clientY - rect.top) * (canvas.height / rect.height) };
    }

    canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); currentPath = [p]; }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); currentPath.push(p); }, { passive: false });
    canvas.addEventListener('touchend', e => { e.preventDefault(); drawing = false; paths.push([...currentPath]); }, { passive: false });
    canvas.addEventListener('mousedown', e => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); currentPath = [p]; });
    canvas.addEventListener('mousemove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); currentPath.push(p); });
    canvas.addEventListener('mouseup', e => { drawing = false; paths.push([...currentPath]); });

    function clear_() { ctx.clearRect(0, 0, canvas.width, canvas.height); paths = []; window.ReactNativeWebView.postMessage(JSON.stringify({type: 'cleared'})); }
    function save_() {
      if (paths.length === 0) { window.ReactNativeWebView.postMessage(JSON.stringify({type: 'empty'})); return; }
      const data = canvas.toDataURL('image/png');
      window.ReactNativeWebView.postMessage(JSON.stringify({type: 'signature', data}));
    }
  </script>
</body>
</html>
`;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>← Zpět</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {step === 'kontrola' && 'Zpráva z kontroly spalinové cesty'}
            {step === 'podpis' && 'Podpis zákazníka'}
            {step === 'dokonceni' && 'Dokončení'}
          </Text>
          <View style={styles.steps}>
            {(['kontrola', 'podpis', 'dokonceni'] as Step[]).map((s, i) => (
              <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive,
                (step === 'podpis' && i === 0) || (step === 'dokonceni' && i <= 1) ? styles.stepDotDone : null
              ]} />
            ))}
          </View>
        </View>

        {/* KROK 1 - Kontrola */}
        {step === 'kontrola' && (
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <View style={styles.twoCol}>
              {/* Levý sloupec - checklist */}
              <View style={styles.col}>
                <Text style={styles.colTitle}>KONTROLA SPALINOVÉ CESTY</Text>
                <Text style={styles.colSubtitle}>
                  {order.address.street}, {order.address.city}
                  {chimney ? ` — ${chimney.label}` : ''}
                </Text>

                {checkItems.map((item) => (
                  <CheckRow
                    key={item.id}
                    item={item}
                    onChange={(result, value) => updateCheckItem(item.id, result, value)}
                  />
                ))}

                {/* Celkový výsledek */}
                <View style={styles.overallSection}>
                  <Text style={styles.sectionLabel}>CELKOVÝ VÝSLEDEK</Text>
                  <View style={styles.resultBtns}>
                    {(['vyhovuje', 'nevyhovuje', 'podmínečně_vyhovuje'] as OverallResult[]).map(r => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.resultBtn,
                          overallResult === r && styles.resultBtnActive,
                          overallResult === r && r === 'vyhovuje' && styles.resultBtnGreen,
                          overallResult === r && r === 'nevyhovuje' && styles.resultBtnRed,
                          overallResult === r && r === 'podmínečně_vyhovuje' && styles.resultBtnYellow,
                        ]}
                        onPress={() => setOverallResult(r)}
                      >
                        <Text style={[styles.resultBtnText, overallResult === r && styles.resultBtnTextActive]}>
                          {r === 'vyhovuje' ? 'VYHOVUJE' : r === 'nevyhovuje' ? 'NEVYHOVUJE' : 'PODMÍNEČNĚ VYHOVUJE'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Pravý sloupec - poznámky + měření */}
              <View style={styles.col}>
                <Text style={styles.colTitle}>DOPLŇUJÍCÍ INFORMACE</Text>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Měření CO (ppm)</Text>
                  <TextInput
                    style={styles.input}
                    value={coValue}
                    onChangeText={setCoValue}
                    placeholder="např. 18"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Poznámky</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Popis stavu komína, zjištěné závady..."
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Doporučení</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={recommendations}
                    onChangeText={setRecommendations}
                    placeholder="Doporučení pro zákazníka..."
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* KROK 2 - Podpis */}
        {step === 'podpis' && (
          <View style={styles.signatureStep}>
            <Text style={styles.signaturePrompt}>
              Požádejte zákazníka o podpis na obrazovce
            </Text>
            {signatureBase64 ? (
              <View style={styles.signatureDone}>
                <Text style={styles.signatureDoneText}>✓ Podpis uložen</Text>
                <TouchableOpacity
                  style={styles.clearSignatureBtn}
                  onPress={() => setSignatureBase64(undefined)}
                >
                  <Text style={styles.clearSignatureBtnText}>Vymazat a podepsat znovu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.signatureCanvas}>
                <WebView
                  ref={webviewRef}
                  source={{ html: SIGNATURE_HTML }}
                  style={styles.webview}
                  onMessage={(event) => {
                    try {
                      const msg = JSON.parse(event.nativeEvent.data);
                      if (msg.type === 'signature') {
                        setSignatureBase64(msg.data);
                      } else if (msg.type === 'empty') {
                        Alert.alert('Upozornění', 'Podpis je prázdný.');
                      }
                    } catch {}
                  }}
                  scrollEnabled={false}
                  bounces={false}
                />
              </View>
            )}
          </View>
        )}

        {/* KROK 3 - Dokončení */}
        {step === 'dokonceni' && (
          <View style={styles.dokonceniStep}>
            <View style={styles.summaryCard}>
              <View style={[
                styles.summaryIcon,
                { backgroundColor: overallResult === 'vyhovuje' ? Colors.success + '30' : Colors.error + '30' }
              ]}>
                <Text style={{ fontSize: 40 }}>
                  {overallResult === 'vyhovuje' ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={[
                styles.summaryResult,
                { color: overallResult === 'vyhovuje' ? Colors.success : Colors.error }
              ]}>
                {overallResult === 'vyhovuje' ? 'VYHOVUJE' : 'NEVYHOVUJE'}
              </Text>
              <Text style={styles.summaryCustomer}>
                {order.customer.firstName} {order.customer.lastName}
              </Text>
              <Text style={styles.summaryAddress}>
                {order.address.street}, {order.address.city}
              </Text>
              {signatureBase64 ? (
                <Text style={styles.signedText}>✓ Zákazník podepsal</Text>
              ) : (
                <Text style={styles.unsignedText}>⚠ Zákazník nepodepsal</Text>
              )}
            </View>

            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.saveActionBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <Text style={styles.saveActionBtnText}>✓ ULOŽIT ZPRÁVU</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.emailActionBtn} onPress={handleSendEmail}>
                <Text style={styles.emailActionBtnText}>✉ ODESLAT E-MAILEM</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer navigace */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerBack}
            onPress={() => {
              if (step === 'kontrola') onClose();
              else if (step === 'podpis') setStep('kontrola');
              else setStep('podpis');
            }}
          >
            <Text style={styles.footerBackText}>ZPĚT</Text>
          </TouchableOpacity>

          {step !== 'dokonceni' ? (
            <TouchableOpacity
              style={styles.footerNext}
              onPress={() => {
                if (step === 'kontrola') setStep('podpis');
                else setStep('dokonceni');
              }}
            >
              <Text style={styles.footerNextText}>DALŠÍ →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.footerNext} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={styles.footerNextText}>ULOŽIT</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// -----------------------------------------------------------------------
function CheckRow({ item, onChange }: {
  item: CheckItem;
  onChange: (result: CheckItem['result'], value?: string) => void;
}) {
  const RESULTS: { key: CheckItem['result']; label: string; color: string }[] = [
    { key: 'vyhovuje', label: '✓', color: Colors.success },
    { key: 'nevyhovuje', label: '✗', color: Colors.error },
    { key: 'nelze_posoudit', label: '⚠', color: Colors.warning },
    { key: 'neuvedeno', label: '○', color: Colors.textTertiary },
  ];

  const isCO = item.label.includes('CO');

  return (
    <View style={cr.row}>
      <Text style={cr.label}>{item.label}</Text>
      {isCO && (
        <TextInput
          style={cr.coInput}
          placeholder="ppm"
          placeholderTextColor={Colors.textTertiary}
          value={item.value || ''}
          onChangeText={(val) => onChange(item.result, val)}
          keyboardType="numeric"
        />
      )}
      <View style={cr.btnGroup}>
        {RESULTS.map(r => (
          <TouchableOpacity
            key={r.key}
            style={[cr.btn, item.result === r.key && { backgroundColor: r.color + '30', borderColor: r.color }]}
            onPress={() => onChange(r.key)}
          >
            <Text style={[cr.btnText, item.result === r.key && { color: r.color }]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const cr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: 8,
  },
  label: { flex: 1, color: Colors.textPrimary, fontSize: Typography.base },
  coInput: {
    width: 70,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    color: Colors.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: Typography.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  btnGroup: { flexDirection: 'row', gap: 4 },
  btn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  btnText: { color: Colors.textTertiary, fontSize: 14, fontWeight: Typography.semiBold },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: Spacing.base,
    backgroundColor: Colors.surface,
  },
  closeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  closeBtnText: { color: Colors.textSecondary, fontSize: Typography.base },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  steps: { flexDirection: 'row', gap: 6 },
  stepDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.surfaceBorder,
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotDone: { backgroundColor: Colors.success },

  body: { flex: 1 },
  bodyContent: { padding: Spacing.base },

  twoCol: { flexDirection: 'row', gap: Spacing.lg, flex: 1 },
  col: { flex: 1, gap: Spacing.md },
  colTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  colSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },

  overallSection: { marginTop: Spacing.md },
  resultBtns: { flexDirection: 'row', gap: Spacing.sm },
  resultBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  resultBtnActive: { borderWidth: 2 },
  resultBtnGreen: { borderColor: Colors.success, backgroundColor: Colors.success + '20' },
  resultBtnRed: { borderColor: Colors.error, backgroundColor: Colors.error + '20' },
  resultBtnYellow: { borderColor: Colors.warning, backgroundColor: Colors.warning + '20' },
  resultBtnText: { color: Colors.textSecondary, fontWeight: Typography.semiBold, fontSize: Typography.xs },
  resultBtnTextActive: { color: Colors.textPrimary },

  inputSection: { gap: 4 },
  inputLabel: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  textArea: { minHeight: 100, paddingTop: Spacing.sm },

  // Podpis
  signatureStep: {
    flex: 1,
    padding: Spacing.base,
    gap: Spacing.base,
    alignItems: 'center',
  },
  signaturePrompt: {
    color: Colors.textSecondary,
    fontSize: Typography.lg,
    textAlign: 'center',
  },
  signatureCanvas: {
    width: '100%',
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  webview: { flex: 1, backgroundColor: Colors.surfaceElevated },
  signatureDone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  signatureDoneText: {
    color: Colors.success,
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
  },
  clearSignatureBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  clearSignatureBtnText: { color: Colors.textSecondary },

  // Dokončení
  dokonceniStep: {
    flex: 1,
    padding: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    width: '60%',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  summaryIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryResult: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.extraBold,
    letterSpacing: 2,
  },
  summaryCustomer: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.semiBold,
  },
  summaryAddress: { color: Colors.textSecondary, fontSize: Typography.base },
  signedText: { color: Colors.success, fontWeight: Typography.medium },
  unsignedText: { color: Colors.warning, fontWeight: Typography.medium },

  actionBtns: { gap: Spacing.sm, width: '60%' },
  saveActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveActionBtnText: { color: Colors.textPrimary, fontWeight: Typography.bold, fontSize: Typography.md },
  emailActionBtn: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  emailActionBtnText: { color: Colors.textPrimary, fontSize: Typography.base },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: Spacing.base,
    backgroundColor: Colors.surface,
  },
  footerBack: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  footerBackText: { color: Colors.textSecondary, fontWeight: Typography.semiBold, fontSize: Typography.base },
  footerNext: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  footerNextText: { color: Colors.textPrimary, fontWeight: Typography.bold, fontSize: Typography.md },
});
