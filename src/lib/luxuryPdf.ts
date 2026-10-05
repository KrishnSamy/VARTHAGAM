/**
 * Ultra-Luxury PDF Generator for Varthagam.
 * Generates executive-level Profit & Loss reports and
 * premium customer billing receipts with gold & crimson styling.
 * Every bill starts with the shop code.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import { OrderBill, ShopSettings } from '../db/db';
import { formatPaise, paiseToRupees } from './money';
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
 * Generates an Ultra-Luxury Customer Billing Receipt PDF.
 */
export async function generateLuxuryReceiptPdf(
  order: OrderBill,
  settings: ShopSettings | null
): Promise<void> {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200], // 80mm POS Thermal / Luxury Slip width
  });

  const shopName = settings?.name || 'VARTHAGAM';
  const shopCode = settings?.shopCode || 'VT';
  const billNum = order.billNumber || generateBillNumber(shopCode, order.tokenNumber, new Date(order.createdAt));
  const dateStr = formatBillDate(order.createdAt);
  const timeStr = formatBillTime(order.createdAt);

  // Background tint
  doc.setFillColor(254, 252, 248);
  doc.rect(0, 0, 80, 200, 'F');

  // Top Crimson Header Bar
  doc.setFillColor(159, 18, 57); // crimson
  doc.rect(0, 0, 80, 22, 'F');

  // Gold accent line
  doc.setFillColor(217, 119, 6); // amber/gold
  doc.rect(0, 21.5, 80, 1, 'F');

  // Shop Name & Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(shopName.toUpperCase(), 40, 9, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(254, 240, 138); // light gold
  doc.text(`SHOP CODE: ${shopCode}`, 40, 14, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL BILL RECEIPT', 40, 18.5, { align: 'center' });

  // Bill Metadata Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`BILL NO:`, 6, 28);
  doc.setFont('helvetica', 'normal');
  doc.text(billNum, 24, 28);

  doc.setFont('helvetica', 'bold');
  doc.text(`DATE:`, 6, 33);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateStr} ${timeStr}`, 24, 33);

  doc.setFont('helvetica', 'bold');
  doc.text(`PAYMENT:`, 6, 38);
  doc.setTextColor(order.payMode === 'upi' ? 79 : 16, order.payMode === 'upi' ? 70 : 185, order.payMode === 'upi' ? 229 : 129);
  doc.text(order.payMode.toUpperCase(), 24, 38);

  // Large Luxury Token Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.roundedRect(6, 42, 68, 14, 2, 2, 'FD');

  doc.setTextColor(159, 18, 57);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('TOKEN NUMBER', 40, 46, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(String(order.tokenNumber), 40, 52.5, { align: 'center' });

  // Itemized Table
  const tableRows = order.items.map((line, idx) => [
    `${idx + 1}`,
    line.nameEn || line.nameTa,
    `${line.qty}`,
    `₹${paiseToRupees(line.pricePaise).toFixed(0)}`,
    `₹${paiseToRupees(line.totalPaise).toFixed(0)}`,
  ]);

  (doc as any).autoTable({
    startY: 59,
    head: [['#', 'Item', 'Qty', 'Rate', 'Total']],
    body: tableRows,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [71, 85, 105],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 5, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 8, halign: 'center' },
      3: { cellWidth: 10, halign: 'right' },
      4: { cellWidth: 13, halign: 'right' },
    },
    margin: { left: 6, right: 6 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 3;

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(6, finalY, 74, finalY);

  // Grand Total Box
  doc.setFillColor(159, 18, 57);
  doc.roundedRect(6, finalY + 2, 68, 11, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT:', 10, finalY + 8.5);

  doc.setFontSize(11);
  doc.setTextColor(254, 240, 138); // gold
  doc.text(`₹${paiseToRupees(order.totalPaise).toFixed(2)}`, 70, finalY + 8.5, {
    align: 'right',
  });

  // Generate UPI QR Code if UPI ID is configured
  let qrEndY = finalY + 16;
  if (settings?.upiId) {
    try {
      const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(
        shopName
      )}&am=${paiseToRupees(order.totalPaise).toFixed(2)}&cu=INR`;
      const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 100,
        margin: 1,
      });

      doc.addImage(qrDataUrl, 'PNG', 26, qrEndY, 28, 28);
      qrEndY += 31;
    } catch (e) {
      qrEndY += 4;
    }
  }

  // Footer Note
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Varthagam • நன்றி! மீண்டும் வருக!', 40, qrEndY + 4, {
    align: 'center',
  });

  doc.save(`${billNum}.pdf`);
}

/**
 * Generates an Executive Luxury Profit & Loss Statement PDF.
 */
export async function generateLuxuryPnlPdf(
  data: PnlReportData,
  settings: ShopSettings | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const shopName = settings?.name || 'VARTHAGAM';
  const shopCode = settings?.shopCode || 'VT';
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Premium Header Banner
  doc.setFillColor(159, 18, 57); // Deep Crimson
  doc.rect(0, 0, 210, 36, 'F');

  // Gold accent bar
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 35, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(shopName.toUpperCase(), 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(254, 240, 138); // light gold
  doc.text(
    `SHOP CODE: ${shopCode}  •  EXECUTIVE FINANCIAL & P&L STATEMENT`,
    14,
    24
  );

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `REPORT PERIOD: ${data.period.toUpperCase()}   |   GENERATED ON: ${currentDate}`,
    14,
    30
  );

  // 4 Executive KPI Cards Row
  const cards = [
    {
      title: 'TOTAL REVENUE',
      amt: formatPaise(data.salesPaise),
      sub: `${data.billsCount} Bills`,
      bg: [248, 250, 252],
      border: [203, 213, 225],
      color: [15, 23, 42],
    },
    {
      title: 'COST OF GOODS',
      amt: formatPaise(data.cogsPaise),
      sub: 'Raw Materials',
      bg: [255, 241, 242],
      border: [254, 205, 211],
      color: [225, 29, 72],
    },
    {
      title: 'GROSS PROFIT',
      amt: formatPaise(data.grossProfitPaise),
      sub: `${data.marginPct}% Margin`,
      bg: [254, 252, 232],
      border: [254, 240, 138],
      color: [161, 98, 7],
    },
    {
      title: 'NET PROFIT',
      amt: formatPaise(data.netProfitPaise),
      sub: data.netProfitPaise >= 0 ? 'Surplus' : 'Deficit',
      bg: data.netProfitPaise >= 0 ? [240, 253, 244] : [255, 241, 242],
      border: data.netProfitPaise >= 0 ? [187, 247, 208] : [254, 205, 211],
      color: data.netProfitPaise >= 0 ? [22, 101, 52] : [190, 18, 60],
    },
  ];

  const cardW = 43;
  const cardH = 22;
  const startX = 14;
  const startY = 44;

  cards.forEach((c, idx) => {
    const x = startX + idx * (cardW + 5);
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 3, startY + 6);

    doc.setFontSize(11);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.amt, x + 3, startY + 13);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, x + 3, startY + 18);
  });

  // Table 1: Financial Performance Summary
  const tableData1 = [
    ['Total Sales (Gross Revenue)', formatPaise(data.salesPaise), '100%'],
    [
      '  - Cash Collections',
      formatPaise(data.cashPaise),
      `${data.salesPaise ? Math.round((data.cashPaise / data.salesPaise) * 100) : 0}%`,
    ],
    [
      '  - Digital / UPI Collections',
      formatPaise(data.upiPaise),
      `${data.salesPaise ? Math.round((data.upiPaise / data.salesPaise) * 100) : 0}%`,
    ],
    ['Cost of Goods Sold (COGS)', formatPaise(data.cogsPaise), `${data.salesPaise ? Math.round((data.cogsPaise / data.salesPaise) * 100) : 0}%`],
    ['Gross Operating Profit', formatPaise(data.grossProfitPaise), `${data.marginPct}%`],
    [
      'Operating Expenses (Rent, Gas, Power, Wages)',
      formatPaise(data.expensesPaise - data.cogsPaise),
      `${data.salesPaise ? Math.round(((data.expensesPaise - data.cogsPaise) / data.salesPaise) * 100) : 0}%`,
    ],
    [
      'NET TAKE-HOME PROFIT / (LOSS)',
      formatPaise(data.netProfitPaise),
      `${data.salesPaise ? Math.round((data.netProfitPaise / data.salesPaise) * 100) : 0}%`,
    ],
  ];

  (doc as any).autoTable({
    startY: 72,
    head: [['Financial Component', 'Amount (INR)', '% of Revenue']],
    body: tableData1,
    theme: 'grid',
    headStyles: {
      fillColor: [159, 18, 57],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'center' },
    },
    didParseCell: (data: any) => {
      if (data.row.index === 6) {
        data.cell.styles.fillColor = [254, 240, 138];
        data.cell.styles.textColor = [15, 23, 42];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Table 2: Expense Category Breakdown
  const expenseEntries = Object.entries(data.categoryExpenses);
  if (expenseEntries.length > 0) {
    const tableData2 = expenseEntries.map(([cat, amt]) => [
      cat.replace(/_/g, ' ').toUpperCase(),
      formatPaise(amt),
      `${data.expensesPaise ? Math.round((amt / data.expensesPaise) * 100) : 0}%`,
    ]);

    const y2 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('EXPENSE CATEGORY DISTRIBUTION', 14, y2);

    (doc as any).autoTable({
      startY: y2 + 2,
      head: [['Expense Category', 'Amount (INR)', '% of Total Expenses']],
      body: tableData2,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { cellWidth: 105 },
        1: { cellWidth: 45, halign: 'right' },
        2: { cellWidth: 32, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer & Compliance Note
  const lastY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Varthagam Financial Advisor • Confidential internal business document for shop: ${shopName} (${shopCode})`,
    14,
    lastY
  );

  doc.save(`Varthagam_PNL_${shopCode}_${data.period}_${Date.now()}.pdf`);
}
