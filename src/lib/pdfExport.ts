import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction } from './types';

interface ExportOptions {
  transactions: Transaction[];
  warehouseName: string;
  dateFrom: string;
  dateTo: string;
}

export function exportTransactionsPDF({ transactions, warehouseName, dateFrom, dateTo }: ExportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Report', 14, 16);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Warehouse: ${warehouseName}`, 14, 24);

  const fromDisplay = formatDateDisplay(dateFrom);
  const toDisplay = formatDateDisplay(dateTo);
  doc.text(`Period: ${fromDisplay} — ${toDisplay}`, 14, 30);

  // Generation time (right aligned)
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  doc.setFontSize(8);
  doc.text(`Generated: ${now}`, pageWidth - 14, 30, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Flatten transaction items into rows
  const rows: (string | number)[][] = [];
  let totalIn = 0;
  let totalOut = 0;

  transactions.forEach(txn => {
    const items = txn.transaction_items || [];
    items.forEach(item => {
      const productName = item.products?.name || 'Unknown';
      const unit = item.products?.unit || '';
      const isIn = txn.type === 'inward';

      if (isIn) totalIn += item.quantity;
      else totalOut += item.quantity;

      rows.push([
        formatDateDisplay(txn.transaction_date),
        isIn ? 'IN' : 'OUT',
        productName,
        `${isIn ? '+' : '-'}${item.quantity} ${unit}`,
        `${item.stock_before} → ${item.stock_after}`,
        txn.remark || '—',
      ]);
    });
  });

  // Table
  autoTable(doc, {
    startY: 44,
    head: [['Date', 'Type', 'Product', 'Qty', 'Stock Change', 'Remark']],
    body: rows,
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    bodyStyles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 16, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'center', fontSize: 8 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = data.cell.raw as string;
        if (val === 'IN') {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Summary footer
  const finalY = (doc as any).lastAutoTable?.finalY || 180;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY + 8, pageWidth - 28, 24, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Summary', 20, finalY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Transactions: ${transactions.length}`, 60, finalY + 18);

  doc.setTextColor(34, 197, 94);
  doc.text(`Total In: ${totalIn}`, 110, finalY + 18);

  doc.setTextColor(239, 68, 68);
  doc.text(`Total Out: ${totalOut}`, 150, finalY + 18);

  // Save
  const filename = `transactions_${dateFrom}_to_${dateTo}.pdf`;
  doc.save(filename);
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
