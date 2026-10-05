/**
 * Ultra-Luxury PDF & Receipt Generator for Varthagam.
 * Uses high-resolution DOM-to-Canvas rendering via html2canvas
 * to ensure 100% pixel-perfect Tamil typography (Anek Tamil),
 * native Indian Rupee symbol (₹), flawless table alignment,
 * dynamic thermal slip height, and executive gold/crimson styling.
 * Every bill starts with the shop code.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { OrderBill, ShopSettings } from '../db/db';
import { paiseToRupees } from './money';
import { generateBillNumber, formatBillDate, formatBillTime } from './billUtils';

export interface PnlReportData {
  period: string;
  salesPaise: number;
  cashPaise: number;
  upiPaise: number;
  cogsPaise: number;
  expensesPaise: number;
  grossProfitPaise: number;
  netProfitPaise: number;
  marginPct: number;
  billsCount: number;
  categoryExpenses: Record<string, number>;
}

/**
 * Generates an Ultra-Luxury Customer Billing Receipt PDF
 * with guaranteed Tamil script rendering, correct ₹ symbols, and zero misalignment.
 */
export async function generateLuxuryReceiptPdf(
  order: OrderBill,
  settings: ShopSettings | null
): Promise<void> {
  const shopName = settings?.name || 'VARTHAGAM';
  const shopCode = settings?.shopCode || 'VT';
  const billNum = order.billNumber || generateBillNumber(shopCode, order.tokenNumber, new Date(order.createdAt));
  const dateStr = formatBillDate(order.createdAt);
  const timeStr = formatBillTime(order.createdAt);

  // Fallback for non-browser/headless environments (e.g. Node tests)
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
    doc.text(`BILL: ${billNum}`, 10, 10);
    doc.text(`SHOP: ${shopCode}`, 10, 20);
    doc.save(`${billNum}.pdf`);
    return;
  }

  // Generate UPI QR Code Data URL if UPI ID is present
  let qrDataUrl = '';
  if (settings?.upiId) {
    try {
      const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(
        shopName
      )}&am=${paiseToRupees(order.totalPaise).toFixed(2)}&cu=INR`;
      qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (e) {
      console.warn('Failed to generate receipt QR code:', e);
    }
  }

  // Create an offscreen DOM slip container styled with luxury theme
  const slipContainer = document.createElement('div');
  slipContainer.style.position = 'fixed';
  slipContainer.style.left = '-9999px';
  slipContainer.style.top = '0';
  slipContainer.style.width = '380px';
  slipContainer.style.backgroundColor = '#fefcf8';
  slipContainer.style.color = '#0f172a';
  slipContainer.style.fontFamily = "'Anek Tamil', 'Mukta Malar', 'Noto Sans Tamil', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  slipContainer.style.boxSizing = 'border-box';
  slipContainer.style.border = '2px solid #d97706';
  slipContainer.style.borderRadius = '16px';
  slipContainer.style.overflow = 'hidden';
  slipContainer.style.padding = '0';
  slipContainer.style.margin = '0';
  slipContainer.style.zIndex = '-9999';

  // Build items rows HTML
  const itemsHtml = order.items
    .map((line, idx) => {
      const displayName = line.nameTa
        ? line.nameTa + (line.nameEn && line.nameEn !== line.nameTa ? ` / ${line.nameEn}` : '')
        : line.nameEn || 'பொருள்';
      const isEven = idx % 2 === 0;
      return `
        <tr style="background-color: ${isEven ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 7px 6px; font-size: 11px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
          <td style="padding: 7px 6px; font-size: 12px; font-weight: 700; color: #0f172a;">${displayName}</td>
          <td style="padding: 7px 6px; font-size: 12px; text-align: center; font-weight: 700; color: #0f172a;">${line.qty}</td>
          <td style="padding: 7px 6px; font-size: 12px; text-align: right; color: #475569;">₹${paiseToRupees(line.pricePaise).toFixed(0)}</td>
          <td style="padding: 7px 6px; font-size: 12.5px; text-align: right; font-weight: 800; color: #0f172a;">₹${paiseToRupees(line.totalPaise).toFixed(0)}</td>
        </tr>
      `;
    })
    .join('');

  // Assemble full slip HTML
  slipContainer.innerHTML = `
    <!-- Top Crimson Header -->
    <div style="background: linear-gradient(135deg, #881337 0%, #9f1239 50%, #4c0519 100%); padding: 18px 16px 14px; text-align: center; border-bottom: 3px solid #d97706;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; line-height: 1.2;">
        ${shopName}
      </h1>
      <div style="margin-top: 6px; display: inline-block; background: rgba(217, 119, 6, 0.3); border: 1px solid #f59e0b; padding: 2px 12px; border-radius: 9999px;">
        <span style="font-size: 11px; font-weight: 800; color: #fef08a; letter-spacing: 1px;">
          SHOP CODE: ${shopCode}
        </span>
      </div>
      <p style="margin: 6px 0 0; font-size: 10px; font-weight: 700; color: #fecdd3; letter-spacing: 1.5px; text-transform: uppercase;">
        அதிகாரப்பூர்வ பில் ரசீது • OFFICIAL BILL RECEIPT
      </p>
    </div>

    <!-- Slip Body -->
    <div style="padding: 16px;">
      <!-- Metadata Grid -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b;">பில் எண் / BILL NO:</span>
          <span style="font-size: 13px; font-weight: 900; color: #0f172a; font-family: monospace;">${billNum}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b;">தேதி & நேரம் / DATE:</span>
          <span style="font-size: 11px; font-weight: 700; color: #334155;">${dateStr} • ${timeStr}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b;">கட்டண முறை / PAYMENT:</span>
          <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; background-color: ${
            order.payMode === 'upi' ? '#eff6ff' : '#ecfdf5'
          }; color: ${
            order.payMode === 'upi' ? '#1d4ed8' : '#047857'
          }; border: 1px solid ${
            order.payMode === 'upi' ? '#bfdbfe' : '#a7f3d0'
          };">
            ${order.payMode === 'upi' ? '📱 UPI / DIGITAL' : '💵 CASH'}
          </span>
        </div>
      </div>

      <!-- Token Badge Box -->
      <div style="background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #d97706; border-radius: 12px; padding: 10px 8px; text-align: center; margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">
          டோக்கன் எண் / TOKEN NUMBER
        </div>
        <div style="font-size: 34px; font-weight: 900; color: #9f1239; font-family: monospace; line-height: 1.1; margin-top: 2px;">
          ${order.tokenNumber}
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px 6px; font-size: 10.5px; font-weight: 800; color: #334155; text-align: center; width: 24px;">#</th>
            <th style="padding: 8px 6px; font-size: 10.5px; font-weight: 800; color: #334155; text-align: left;">பொருள் / Item</th>
            <th style="padding: 8px 6px; font-size: 10.5px; font-weight: 800; color: #334155; text-align: center; width: 36px;">எண்</th>
            <th style="padding: 8px 6px; font-size: 10.5px; font-weight: 800; color: #334155; text-align: right; width: 55px;">விலை</th>
            <th style="padding: 8px 6px; font-size: 10.5px; font-weight: 800; color: #334155; text-align: right; width: 65px;">தொகை</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Grand Total Crimson Box -->
      <div style="background: linear-gradient(135deg, #9f1239 0%, #881337 100%); border: 1.5px solid #d97706; border-radius: 12px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; box-shadow: 0 4px 6px -1px rgba(159, 18, 57, 0.2);">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #fecdd3; text-transform: uppercase;">
            மொத்த தொகை
          </div>
          <div style="font-size: 10px; font-weight: 600; color: #fda4af;">
            TOTAL AMOUNT
          </div>
        </div>
        <div style="font-size: 22px; font-weight: 900; color: #fef08a; letter-spacing: 0.5px;">
          ₹${paiseToRupees(order.totalPaise).toFixed(2)}
        </div>
      </div>

      <!-- UPI QR Code Section (if configured) -->
      ${
        qrDataUrl
          ? `
          <div style="text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
              📲 GPay / PhonePe / Paytm மூலம் செலுத்த ஸ்கேன் செய்யவும்
            </div>
            <img src="${qrDataUrl}" style="width: 120px; height: 120px; display: block; margin: 0 auto; border-radius: 8px; border: 1px solid #cbd5e1;" alt="UPI QR" />
            <div style="font-size: 10px; font-weight: 600; color: #64748b; margin-top: 6px;">
              UPI ID: <span style="color: #0f172a; font-weight: 800;">${settings?.upiId || ''}</span>
            </div>
          </div>
          `
          : ''
      }

      <!-- Footer & Gratitude -->
      <div style="text-align: center; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
        <p style="margin: 0; font-size: 13px; font-weight: 800; color: #9f1239;">
          நன்றி! மீண்டும் வருக!
        </p>
        <p style="margin: 3px 0 0; font-size: 10.5px; font-weight: 700; color: #475569;">
          Thank You! Visit Again!
        </p>
        <div style="margin-top: 8px; display: inline-flex; align-items: center; gap: 4px; font-size: 9.5px; color: #94a3b8; font-weight: 600;">
          <span>Varthagam</span> • <span>இந்தியாவின் நவீன கடை கணக்கு</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(slipContainer);

  try {
    // Wait momentarily for images or web fonts if needed
    const images = slipContainer.querySelectorAll('img');
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map(
          img =>
            new Promise<void>(res => {
              if (img.complete) res();
              else {
                img.onload = () => res();
                img.onerror = () => res();
              }
            })
        )
      );
    }

    // High resolution canvas capture (scale: 2.5 = 300 DPI sharpness)
    const canvas = await html2canvas(slipContainer, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#fefcf8',
      logging: false,
    });

    const pdfWidthMm = 80; // 80mm POS Thermal / Slip width
    const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidthMm, Math.max(pdfHeightMm, 100)],
    });

    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');
    doc.save(`${billNum}.pdf`);
  } catch (err) {
    console.error('Error generating luxury PDF receipt:', err);
    throw err;
  } finally {
    slipContainer.remove();
  }
}

/**
 * Generates an Executive Luxury Profit & Loss Statement PDF
 * with guaranteed Tamil and ₹ character support via high-res rendering.
 */
export async function generateLuxuryPnlPdf(
  data: PnlReportData,
  settings: ShopSettings | null
): Promise<void> {
  const shopName = settings?.name || 'VARTHAGAM';
  const shopCode = settings?.shopCode || 'VT';
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.text(`PNL REPORT: ${shopCode}`, 10, 10);
    doc.save(`Varthagam_PNL_${shopCode}_${data.period}_${Date.now()}.pdf`);
    return;
  }

  const pnlContainer = document.createElement('div');
  pnlContainer.style.position = 'fixed';
  pnlContainer.style.left = '-9999px';
  pnlContainer.style.top = '0';
  pnlContainer.style.width = '800px';
  pnlContainer.style.backgroundColor = '#ffffff';
  pnlContainer.style.color = '#0f172a';
  pnlContainer.style.fontFamily = "'Anek Tamil', 'Mukta Malar', 'Noto Sans Tamil', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  pnlContainer.style.boxSizing = 'border-box';
  pnlContainer.style.padding = '24px';
  pnlContainer.style.zIndex = '-9999';

  const formatInr = (paise: number) => {
    const isNeg = paise < 0;
    const absRs = Math.abs(paise) / 100;
    return `${isNeg ? '-' : ''}₹${absRs.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const expenseRowsHtml = Object.entries(data.categoryExpenses)
    .map(([cat, amt]) => {
      const pct = data.expensesPaise ? Math.round((amt / data.expensesPaise) * 100) : 0;
      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 12px; font-weight: 700; color: #334155; text-transform: uppercase;">${cat.replace(/_/g, ' ')}</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: 800; color: #0f172a;">${formatInr(amt)}</td>
          <td style="padding: 8px 12px; text-align: center; font-weight: 700; color: #64748b;">${pct}%</td>
        </tr>
      `;
    })
    .join('');

  pnlContainer.innerHTML = `
    <!-- Top Executive Banner -->
    <div style="background: linear-gradient(135deg, #9f1239 0%, #881337 100%); border-radius: 12px; padding: 22px 24px; border-bottom: 4px solid #d97706; color: #ffffff; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 0.5px;">${shopName}</h1>
          <p style="margin: 4px 0 0; font-size: 12px; font-weight: 800; color: #fef08a; letter-spacing: 1px;">
            SHOP CODE: ${shopCode} • EXECUTIVE FINANCIAL & P&L STATEMENT
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 700; color: #fecdd3;">காலம் / PERIOD: <span style="color: #ffffff; font-weight: 900;">${data.period.toUpperCase()}</span></div>
          <div style="font-size: 11px; font-weight: 600; color: #fecdd3; margin-top: 3px;">தேதி: ${currentDate}</div>
        </div>
      </div>
    </div>

    <!-- 4 KPI Cards -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px;">
      <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 14px;">
        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">மொத்த வருமானம் / REVENUE</div>
        <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">${formatInr(data.salesPaise)}</div>
        <div style="font-size: 10px; font-weight: 700; color: #94a3b8; margin-top: 2px;">${data.billsCount} Bills</div>
      </div>

      <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 10px; padding: 12px 14px;">
        <div style="font-size: 10px; font-weight: 800; color: #be123c; text-transform: uppercase;">மூலப்பொருள் செலவு / COGS</div>
        <div style="font-size: 18px; font-weight: 900; color: #e11d48; margin-top: 4px;">${formatInr(data.cogsPaise)}</div>
        <div style="font-size: 10px; font-weight: 700; color: #f43f5e; margin-top: 2px;">Raw Materials</div>
      </div>

      <div style="background: #fefce8; border: 1.5px solid #fef08a; border-radius: 10px; padding: 12px 14px;">
        <div style="font-size: 10px; font-weight: 800; color: #a16207; text-transform: uppercase;">மொத்த லாபம் / GROSS PROFIT</div>
        <div style="font-size: 18px; font-weight: 900; color: #b45309; margin-top: 4px;">${formatInr(data.grossProfitPaise)}</div>
        <div style="font-size: 10px; font-weight: 700; color: #d97706; margin-top: 2px;">${data.marginPct}% Margin</div>
      </div>

      <div style="background: ${data.netProfitPaise >= 0 ? '#f0fdf4' : '#fff1f2'}; border: 1.5px solid ${data.netProfitPaise >= 0 ? '#bbf7d0' : '#fecdd3'}; border-radius: 10px; padding: 12px 14px;">
        <div style="font-size: 10px; font-weight: 800; color: ${data.netProfitPaise >= 0 ? '#15803d' : '#be123c'}; text-transform: uppercase;">நிகர லாபம் / NET PROFIT</div>
        <div style="font-size: 18px; font-weight: 900; color: ${data.netProfitPaise >= 0 ? '#166534' : '#9f1239'}; margin-top: 4px;">${formatInr(data.netProfitPaise)}</div>
        <div style="font-size: 10px; font-weight: 700; color: ${data.netProfitPaise >= 0 ? '#16a34a' : '#e11d48'}; margin-top: 2px;">${data.netProfitPaise >= 0 ? 'Surplus' : 'Deficit'}</div>
      </div>
    </div>

    <!-- Financial Performance Summary Table -->
    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 10px;">
      நிதியறிக்கை சுருக்கம் / FINANCIAL PERFORMANCE SUMMARY
    </h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #9f1239; color: #ffffff;">
          <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 800;">நிதிக் கூறு / Component</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 800; width: 140px;">தொகை (INR)</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 800; width: 100px;">வருமான விகிதம் (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 12px; font-weight: 700; color: #0f172a;">மொத்த விற்பனை (Gross Revenue)</td>
          <td style="padding: 9px 12px; text-align: right; font-weight: 800; color: #0f172a;">${formatInr(data.salesPaise)}</td>
          <td style="padding: 9px 12px; text-align: center; font-weight: 700; color: #475569;">100%</td>
        </tr>
        <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 12px; color: #475569; padding-left: 24px;">• ரொக்க வசூல் (Cash Collections)</td>
          <td style="padding: 9px 12px; text-align: right; font-weight: 700; color: #334155;">${formatInr(data.cashPaise)}</td>
          <td style="padding: 9px 12px; text-align: center; color: #64748b;">${data.salesPaise ? Math.round((data.cashPaise / data.salesPaise) * 100) : 0}%</td>
        </tr>
        <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 12px; color: #475569; padding-left: 24px;">• டிஜிட்டல் / UPI வசூல் (UPI Collections)</td>
          <td style="padding: 9px 12px; text-align: right; font-weight: 700; color: #334155;">${formatInr(data.upiPaise)}</td>
          <td style="padding: 9px 12px; text-align: center; color: #64748b;">${data.salesPaise ? Math.round((data.upiPaise / data.salesPaise) * 100) : 0}%</td>
        </tr>
        <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 12px; font-weight: 700; color: #be123c;">மூலப்பொருள் செலவு (COGS)</td>
          <td style="padding: 9px 12px; text-align: right; font-weight: 800; color: #be123c;">${formatInr(data.cogsPaise)}</td>
          <td style="padding: 9px 12px; text-align: center; font-weight: 700; color: #be123c;">${data.salesPaise ? Math.round((data.cogsPaise / data.salesPaise) * 100) : 0}%</td>
        </tr>
        <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 12px; font-weight: 700; color: #b45309;">மொத்த இயக்க லாபம் (Gross Profit)</td>
          <td style="padding: 9px 12px; text-align: right; font-weight: 800; color: #b45309;">${formatInr(data.grossProfitPaise)}</td>
          <td style="padding: 9px 12px; text-align: center; font-weight: 700; color: #b45309;">${data.marginPct}%</td>
        </tr>
        <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 12px; font-weight: 700; color: #475569;">இயக்கச் செலவுகள் (வாடகை, கூலி, மின்சாரம்)</td>
          <td style="padding: 9px 12px; text-align: right; font-weight: 700; color: #334155;">${formatInr(data.expensesPaise - data.cogsPaise)}</td>
          <td style="padding: 9px 12px; text-align: center; color: #64748b;">${data.salesPaise ? Math.round(((data.expensesPaise - data.cogsPaise) / data.salesPaise) * 100) : 0}%</td>
        </tr>
        <tr style="background: #fef08a; border-top: 2px solid #d97706;">
          <td style="padding: 10px 12px; font-weight: 900; color: #0f172a; font-size: 13px;">நிகர லாபம் / NET PROFIT</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 900; color: #0f172a; font-size: 14px;">${formatInr(data.netProfitPaise)}</td>
          <td style="padding: 10px 12px; text-align: center; font-weight: 900; color: #0f172a;">${data.salesPaise ? Math.round((data.netProfitPaise / data.salesPaise) * 100) : 0}%</td>
        </tr>
      </tbody>
    </table>

    <!-- Expense Category Distribution -->
    ${
      expenseRowsHtml
        ? `
        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 10px;">
          செலவுகள் வகைப்பாடு / EXPENSE CATEGORY DISTRIBUTION
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #1e293b; color: #ffffff;">
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 800;">செலவு வகை / Category</th>
              <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 800; width: 140px;">தொகை (INR)</th>
              <th style="padding: 8px 12px; text-align: center; font-size: 11px; font-weight: 800; width: 100px;">பங்கு (%)</th>
            </tr>
          </thead>
          <tbody>
            ${expenseRowsHtml}
          </tbody>
        </table>
        `
        : ''
    }

    <!-- Confidential Footer -->
    <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-weight: 600;">
      <span>Varthagam Financial Advisor • Confidential internal business report</span>
      <span>Shop: ${shopName} (${shopCode})</span>
    </div>
  `;

  document.body.appendChild(pnlContainer);

  try {
    const canvas = await html2canvas(pnlContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfW = 210;
    const pdfH = (canvas.height * pdfW) / canvas.width;
    doc.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    doc.save(`Varthagam_PNL_${shopCode}_${data.period}_${Date.now()}.pdf`);
  } catch (err) {
    console.error('Error generating luxury P&L PDF:', err);
    throw err;
  } finally {
    pnlContainer.remove();
  }
}
