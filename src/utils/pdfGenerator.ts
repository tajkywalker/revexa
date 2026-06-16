import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { InspectionReport } from '../types';
import { OrderDetail } from '../database/database';
import { formatDate } from './helpers';

export async function generateReportPDF(
  report: InspectionReport,
  order: OrderDetail
): Promise<string> {
  const customer = order.customer;
  const address = order.address;
  const chimney = address.chimneys.find(c => c.id === report.chimneyId);

  const checkItemsHtml = report.checkItems.map(item => {
    const iconColor = item.result === 'vyhovuje' ? '#30D158'
      : item.result === 'nevyhovuje' ? '#FF453A'
      : item.result === 'nelze_posoudit' ? '#FFD60A'
      : '#666';
    const icon = item.result === 'vyhovuje' ? '✓'
      : item.result === 'nevyhovuje' ? '✗'
      : item.result === 'nelze_posoudit' ? '⚠'
      : '○';
    return `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 13px;">${item.label}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 13px;">
          ${item.value ? `<span style="margin-right: 8px; color: #666;">${item.value}</span>` : ''}
          <span style="color: ${iconColor}; font-weight: bold;">${icon}</span>
        </td>
      </tr>
    `;
  }).join('');

  const overallColor = report.overallResult === 'vyhovuje' ? '#30D158' : '#FF453A';
  const overallLabel = report.overallResult === 'vyhovuje' ? 'VYHOVUJE'
    : report.overallResult === 'nevyhovuje' ? 'NEVYHOVUJE'
    : 'PODMÍNEČNĚ VYHOVUJE';

  const signatureHtml = report.signatureBase64
    ? `<img src="${report.signatureBase64}" style="max-width: 200px; max-height: 80px;" />`
    : '<p style="color: #999; font-style: italic;">Nepodepsáno</p>';

  const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Protokol o kontrole spalinové cesty</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #333; font-size: 13px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #E8651A; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 40px; height: 40px; background: #E8651A; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; }
    .logo-text { font-size: 22px; font-weight: 800; color: #1a1a1a; letter-spacing: 2px; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 16px; font-weight: bold; color: #1a1a1a; }
    .doc-number { color: #E8651A; font-size: 14px; font-weight: bold; margin-top: 4px; }
    .doc-date { color: #666; font-size: 12px; margin-top: 2px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e0e0e0; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .info-label { color: #666; }
    .info-value { font-weight: 500; }
    table { width: 100%; border-collapse: collapse; }
    .result-box { padding: 16px; border-radius: 8px; border: 2px solid ${overallColor}; background: ${overallColor}15; margin: 16px 0; text-align: center; }
    .result-text { font-size: 22px; font-weight: 900; color: ${overallColor}; letter-spacing: 2px; }
    .result-sub { font-size: 13px; color: #666; margin-top: 4px; }
    .notes-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; font-size: 13px; color: #444; line-height: 1.6; }
    .signature-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
    .sig-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .sig-box { text-align: center; }
    .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 6px; font-size: 11px; color: #666; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">R</div>
      <div>
        <div class="logo-text">REVEXA</div>
        <div style="font-size: 11px; color: #666;">Centralizovaná databáze spalinových cest</div>
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-title">PROTOKOL O KONTROLE SPALINOVÉ CESTY</div>
      <div class="doc-number">${report.reportNumber}</div>
      <div class="doc-date">Datum: ${formatDate(report.inspectionDate)}</div>
    </div>
  </div>

  <div class="two-col">
    <div>
      <div class="section">
        <div class="section-title">Zákazník / Objednatel</div>
        <div class="info-row"><span class="info-label">Jméno</span><span class="info-value">${customer.firstName} ${customer.lastName}</span></div>
        ${customer.companyName ? `<div class="info-row"><span class="info-label">Firma</span><span class="info-value">${customer.companyName}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Adresa</span><span class="info-value">${address.street}</span></div>
        <div class="info-row"><span class="info-label">Město</span><span class="info-value">${address.zip} ${address.city}</span></div>
        <div class="info-row"><span class="info-label">Telefon</span><span class="info-value">${customer.phone}</span></div>
        <div class="info-row"><span class="info-label">E-mail</span><span class="info-value">${customer.email}</span></div>
      </div>
    </div>
    <div>
      <div class="section">
        <div class="section-title">Informace o objektu</div>
        <div class="info-row"><span class="info-label">Typ objektu</span><span class="info-value">${address.objectType}</span></div>
        ${address.applianceType ? `<div class="info-row"><span class="info-label">Spotřebič</span><span class="info-value">${address.applianceType}</span></div>` : ''}
        ${address.buildYear ? `<div class="info-row"><span class="info-label">Rok výstavby</span><span class="info-value">${address.buildYear}</span></div>` : ''}
        ${chimney ? `
          <div class="info-row"><span class="info-label">Typ komína</span><span class="info-value">${chimney.type}</span></div>
          <div class="info-row"><span class="info-label">Průměr</span><span class="info-value">${chimney.diameter} mm</span></div>
          <div class="info-row"><span class="info-label">Výška</span><span class="info-value">${chimney.height} m</span></div>
          <div class="info-row"><span class="info-label">Spotřebičů</span><span class="info-value">${chimney.appliancesCount}</span></div>
        ` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Výsledky kontroly spalinové cesty</div>
    <table>
      <tbody>${checkItemsHtml}</tbody>
    </table>
  </div>

  <div class="result-box">
    <div class="result-text">${overallLabel}</div>
    <div class="result-sub">Spalinová cesta je ${report.overallResult === 'vyhovuje' ? 'způsobilá k provozu' : 'nezpůsobilá k provozu'}.</div>
  </div>

  ${report.notes ? `
  <div class="section">
    <div class="section-title">Poznámky a zjištění</div>
    <div class="notes-box">${report.notes}</div>
  </div>
  ` : ''}

  ${report.recommendations ? `
  <div class="section">
    <div class="section-title">Doporučení</div>
    <div class="notes-box">${report.recommendations}</div>
  </div>
  ` : ''}

  <div class="signature-section">
    <div class="sig-boxes">
      <div class="sig-box">
        <div>${signatureHtml}</div>
        <div class="sig-line">Podpis zákazníka / objednatele</div>
      </div>
      <div class="sig-box">
        <div style="height: 60px;"></div>
        <div class="sig-line">Podpis technika / kominíka</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>REVEXA — Centralizovaná databáze spalinových cest</span>
    <span>Zakázka: ${order.orderNumber} | Zpráva: ${report.reportNumber}</span>
  </div>
</body>
</html>
`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function shareReport(pdfUri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Sdílet protokol',
    });
  }
}
