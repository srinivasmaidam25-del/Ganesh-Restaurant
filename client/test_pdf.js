const PDFDocument = require('pdfkit');
const fs = require('fs');

const mockOrder = {
  id: 'e29d7fa1-3211-477b-8919-450f63d274ff',
  created_at: new Date().toISOString(),
  table_number: '5',
  customer_name: 'John Doe',
  items: [
    { name: 'Paneer Butter Masala', quantity: 2, price: 280.00 },
    { name: 'Butter Naan', quantity: 4, price: 40.00 },
    { name: 'Jeera Rice', quantity: 1, price: 120.00 },
    { name: 'Mango Lassi', quantity: 3, price: 80.00 }
  ],
  sub_total: 960.00,
  tax: 48.00,
  service_charge: 19.20,
  discount: 100.00,
  total: 927.20,
  payment_status: 'paid',
  payment_method: 'upi'
};

const buildPdf = () => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(__dirname + '/invoice_test.pdf');
      doc.pipe(stream);

      const restName = 'LA PIAZZA RESTAURANT';
      const restAddress = '12, Connaught Place, New Delhi, India';
      const restPhone = '+91 98765 43210';
      const restEmail = 'info@lapiazza.com';
      const restGST = '27AAAAA1111A1Z1';
      const currency = '₹';
      const primaryColor = '#EA580C';

      // --- PAGE BORDER ---
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(1).strokeColor('#E5E7EB').stroke();

      // --- 1. RECEIPT TITLE & LOGO ---
      doc.font('Helvetica-Bold').fontSize(22).fillColor(primaryColor).text('Restaurant Receipt', { align: 'center' });
      doc.moveDown(0.5);

      const centerX = doc.page.width / 2;
      const logoY = doc.y;
      
      // Draw chef hat
      doc.fillColor(primaryColor);
      doc.circle(centerX, logoY + 12, 10).fill();
      doc.circle(centerX - 10, logoY + 15, 8).fill();
      doc.circle(centerX + 10, logoY + 15, 8).fill();
      doc.rect(centerX - 12, logoY + 20, 24, 8).fill();
      doc.moveDown(2);

      // --- 2. RESTAURANT DETAILS ---
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1F2937').text(`"${restName}"`, { align: 'center' });
      doc.font('Helvetica').fontSize(8).fillColor('#4B5563');
      doc.text(restAddress, { align: 'center' });
      doc.text(`Phone: ${restPhone}`, { align: 'center' });
      doc.text(`Email: ${restEmail} | GSTIN: ${restGST}`, { align: 'center' });
      doc.moveDown(0.8);

      doc.font('Helvetica-BoldOblique').fontSize(11).fillColor('#374151').text('Authentic Indian Cuisine At its Finest!', { align: 'center' });
      doc.moveDown(1.2);

      // --- 3. METADATA ROW ---
      const metaY = doc.y;
      doc.rect(50, metaY, 495, 24).fill('#FFF7ED');
      
      const dateObj = new Date(mockOrder.created_at);
      const dateStr = dateObj.toLocaleDateString('en-IN');
      const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#EA580C');
      doc.text('Receipt No: ', 60, metaY + 8, { continued: true });
      doc.fillColor('#1F2937').text(`REC_${mockOrder.id.substring(0, 8).toUpperCase()}`, { continued: true });
      
      doc.fillColor('#EA580C').text('          Date: ', { continued: true });
      doc.fillColor('#1F2937').text(dateStr, { continued: true });

      doc.fillColor('#EA580C').text('          Time: ', { continued: true });
      doc.fillColor('#1F2937').text(timeStr, { continued: true });

      doc.fillColor('#EA580C').text('          Table No: ', { continued: true });
      doc.fillColor('#1F2937').text(mockOrder.table_number);
      
      doc.y = metaY + 35;

      // --- 4. ITEMS TABLE ---
      const tableTop = doc.y;
      const colX = {
        item: 50,
        qty: 280,
        cost: 360,
        amount: 450
      };
      const colWidth = {
        item: 230,
        qty: 80,
        cost: 90,
        amount: 95
      };

      // Header Fill
      doc.rect(50, tableTop, 495, 22).fill(primaryColor);
      
      // Header Text
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
      doc.text('List of Items', colX.item + 10, tableTop + 6, { width: colWidth.item });
      doc.text('Quantity', colX.qty, tableTop + 6, { width: colWidth.qty, align: 'center' });
      doc.text('Unit Cost', colX.cost, tableTop + 6, { width: colWidth.cost, align: 'right' });
      doc.text('Amount', colX.amount, tableTop + 6, { width: colWidth.amount - 10, align: 'right' });

      doc.y = tableTop + 22;

      // Table Rows
      doc.font('Helvetica').fontSize(9);
      mockOrder.items.forEach((item, idx) => {
        const rowY = doc.y;
        const bgFill = idx % 2 === 0 ? '#FFFFFF' : '#FFF7ED'; // Zebra striping
        
        doc.rect(50, rowY, 495, 20).fill(bgFill);
        
        doc.fillColor('#374151');
        doc.text(item.name, colX.item + 10, rowY + 5, { width: colWidth.item });
        doc.text(item.quantity.toString(), colX.qty, rowY + 5, { width: colWidth.qty, align: 'center' });
        doc.text(`${currency}${item.price.toFixed(2)}`, colX.cost, rowY + 5, { width: colWidth.cost, align: 'right' });
        doc.text(`${currency}${(item.price * item.quantity).toFixed(2)}`, colX.amount, rowY + 5, { width: colWidth.amount - 10, align: 'right' });
        
        doc.lineWidth(0.5).strokeColor('#E5E7EB')
           .moveTo(50, rowY + 20).lineTo(545, rowY + 20).stroke();

        doc.y = rowY + 20;
      });

      doc.moveDown(0.8);

      // --- 5. CALCULATIONS SUMMARY BLOCK ---
      let summaryY = doc.y;
      
      const summaryColX = {
        label: 340,
        value: 450
      };
      const summaryColWidth = {
        label: 110,
        value: 95
      };

      const drawSummaryRow = (label, value, isBold = false) => {
        const rowY = summaryY;
        doc.rect(summaryColX.label, rowY, summaryColWidth.label, 18).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
        doc.rect(summaryColX.value, rowY, summaryColWidth.value, 18).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
        doc.rect(summaryColX.value + 0.25, rowY + 0.25, summaryColWidth.value - 0.5, 17.5).fill('#FFF7ED');

        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
        doc.fillColor(isBold ? primaryColor : '#4B5563');
        doc.text(label, summaryColX.label, rowY + 5, { width: summaryColWidth.label - 10, align: 'right' });
        doc.text(value, summaryColX.value, rowY + 5, { width: summaryColWidth.value - 10, align: 'right' });

        summaryY += 18;
      };

      drawSummaryRow('Subtotal:', `${currency}${mockOrder.sub_total.toFixed(2)}`);
      
      if (mockOrder.discount > 0) {
        drawSummaryRow('Discount:', `-${currency}${mockOrder.discount.toFixed(2)}`);
      }
      
      if (mockOrder.tax > 0) {
        drawSummaryRow('GST:', `${currency}${mockOrder.tax.toFixed(2)}`);
      }
      
      if (mockOrder.service_charge > 0) {
        drawSummaryRow('Service Charge:', `${currency}${mockOrder.service_charge.toFixed(2)}`);
      }

      drawSummaryRow('Grand Total:', `${currency}${mockOrder.total.toFixed(2)}`, true);

      // --- 6. FOOTER SLOGANS (Explicitly centered with A4 width bounding box) ---
      doc.font('Helvetica-BoldOblique').fontSize(12).fillColor(primaryColor).text('Eat As much As You Like!', 50, 715, { width: 495, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor).text('Thank You! Please Visit Us Again.', 50, 735, { width: 495, align: 'center' });

      doc.end();

      stream.on('finish', () => {
        console.log('PDF generated successfully as invoice_test.pdf');
        resolve();
      });
      stream.on('error', (err) => reject(err));
    } catch (e) {
      reject(e);
    }
  });
};

buildPdf().catch(console.error);
