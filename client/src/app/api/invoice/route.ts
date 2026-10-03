import { NextRequest } from 'next/server';
import PDFDocument from 'pdfkit';
import { isDemoMode, supabase } from '@/utils/supabaseClient';
import { mockDb } from '@/utils/mockDb';
import fs from 'fs';
import path from 'path';

let regularFontBuffer: Buffer | null = null;
let boldFontBuffer: Buffer | null = null;

async function loadFonts() {
  if (regularFontBuffer && boldFontBuffer) return;
  try {
    const regularPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    const boldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
    
    if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
      regularFontBuffer = fs.readFileSync(regularPath);
      boldFontBuffer = fs.readFileSync(boldPath);
      return;
    }
  } catch (e) {
    console.error('Failed to read local font files:', e);
  }

  try {
    const [regRes, boldRes] = await Promise.all([
      fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf'),
      fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf')
    ]);
    if (regRes.ok && boldRes.ok) {
      regularFontBuffer = Buffer.from(await regRes.arrayBuffer());
      boldFontBuffer = Buffer.from(await boldRes.arrayBuffer());
    }
  } catch (e) {
    console.error('Failed to load custom fonts:', e);
  }
}

const buildPdfBuffer = (doc: PDFKit.PDFDocument): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));
  });
};

const fetchImageBuffer = async (url: string): Promise<Buffer | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error('Error fetching image:', e);
    return null;
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing orderId' }), { status: 400 });
    }

    let order: any = null;

    if (isDemoMode) {
      order = mockDb.getOrderById(orderId);
    } else {
      // In live mode: query Supabase orders database
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (orderErr || !orderData) {
        return new Response(JSON.stringify({ success: false, message: orderErr?.message || 'Order not found in database' }), { status: 404 });
      }
      order = orderData;

      // Query restaurant details separately to bypass join schema errors
      if (order.restaurant_id) {
        const { data: restData } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', order.restaurant_id)
          .single();
        if (restData) {
          order.restaurants = restData;
        }
      }
    }

    if (!order) {
      return new Response(JSON.stringify({ success: false, message: 'Order not found' }), { status: 404 });
    }

    const paymentStatus = (order.payment_status || order.paymentStatus || 'pending').toLowerCase();
    if (paymentStatus !== 'paid') {
      return new Response(JSON.stringify({ success: false, message: 'Invoice is only available for paid orders.' }), { status: 400 });
    }

    // Resolve restaurant details
    const restName = order.restaurants?.name || 'Ganesh restaurant';
    const restAddress = order.restaurants?.address || 'Near Old Bus Stand, Jagtial';
    const restPhone = order.restaurants?.contact_phone || '9121085544';
    const restEmail = order.restaurants?.contact_email || 'ganeshrestaurant@gmail.com';
    const restGST = order.restaurants?.gst_number || '27AAAAA1111A1Z1';
    let currency = order.restaurants?.currency || '₹';
    if (currency === '₹') {
      currency = 'Rs.';
    }
    const primaryColor = '#F26A0A';

    await loadFonts();

    // Estimate table rows height dynamically for exact page size calculation
    let totalRowsHeight = 0;
    const colWidth = {
      item: 220,
      qty: 70,
      cost: 80,
      amount: 95
    };
    
    const estimateTextHeight = (text: string, width: number, fontSize: number): number => {
      const words = text.split(' ');
      let lines = 1;
      let currentLineLength = 0;
      const avgCharWidth = fontSize * 0.55; 
      
      words.forEach(word => {
        const wordWidth = word.length * avgCharWidth;
        if (currentLineLength + wordWidth > width) {
          lines++;
          currentLineLength = wordWidth;
        } else {
          currentLineLength += wordWidth + avgCharWidth; 
        }
      });
      return lines * (fontSize + 2);
    };

    const subTotal = Number(order.sub_total ?? order.subTotal ?? 0);
    const serviceCharge = Number(order.service_charge ?? order.serviceCharge ?? 0);
    const tax = Number(order.tax ?? 0);
    const discount = Number(order.discount ?? order.discount_amount ?? order.discountAmount ?? 0);
    const total = Number(order.total ?? 0);

    const rowHeights = order.items.map((item: any) => {
      const nameHeight = estimateTextHeight(item.name, colWidth.item - 10, 9);
      const rowHeight = Math.max(20, nameHeight + 8);
      totalRowsHeight += rowHeight;
      return rowHeight;
    });

    // Estimate summary table height
    let summaryRowsCount = 2; // Subtotal and Grand Total are always present
    if (discount > 0) summaryRowsCount++;
    if (tax > 0) summaryRowsCount++;
    if (serviceCharge > 0) summaryRowsCount++;
    const summaryHeight = summaryRowsCount * 18;

    // Calculate content height
    const margin = 40;
    const headerHeight = 150;
    const metadataHeight = 51;
    const tableHeaderHeight = 22;
    const spacingHeight = 15;
    const footerHeight = 70;

    // Add a 50px buffer to prevent word wraps or header text extensions from pushing content onto a second page
    const calculatedHeight = margin + headerHeight + metadataHeight + tableHeaderHeight + totalRowsHeight + spacingHeight + summaryHeight + footerHeight + margin + 50;

    // Design invoice receipt PDF (A4 width, content-driven dynamic height)
    const doc = new PDFDocument({ size: [595.28, calculatedHeight], margin });
    const pdfPromise = buildPdfBuffer(doc);

    if (regularFontBuffer && boldFontBuffer) {
      doc.registerFont('Custom-Regular', regularFontBuffer);
      doc.registerFont('Custom-Bold', boldFontBuffer);
    }

    const font = (type: 'regular' | 'bold') => {
      if (type === 'bold') {
        return boldFontBuffer ? 'Custom-Bold' : 'Helvetica-Bold';
      }
      return regularFontBuffer ? 'Custom-Regular' : 'Helvetica';
    };

    // Fetch restaurant logo image as buffer if present
    let logoBuffer: Buffer | null = null;
    if (order.restaurants?.logo) {
      logoBuffer = await fetchImageBuffer(order.restaurants.logo);
    }

    // --- PAGE BORDER ---
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(1).strokeColor('#E5E5E5').stroke();

    // --- 1. RECEIPT TITLE & LOGO ---
    doc.font(font('bold')).fontSize(22).fillColor(primaryColor).text('Restaurant Receipt', { align: 'center' });
    doc.moveDown(0.5);

    const centerX = doc.page.width / 2;
    const logoY = doc.y;
    
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, centerX - 20, logoY, { width: 40, height: 40 });
        doc.moveDown(2.2);
      } catch (e) {
        // Fallback vector chef hat icon if image embedding fails
        doc.fillColor(primaryColor);
        doc.circle(centerX, logoY + 12, 10).fill();
        doc.circle(centerX - 10, logoY + 15, 8).fill();
        doc.circle(centerX + 10, logoY + 15, 8).fill();
        doc.rect(centerX - 12, logoY + 20, 24, 8).fill();
        doc.moveDown(2);
      }
    } else {
      // Fallback vector chef hat icon
      doc.fillColor(primaryColor);
      doc.circle(centerX, logoY + 12, 10).fill();
      doc.circle(centerX - 10, logoY + 15, 8).fill();
      doc.circle(centerX + 10, logoY + 15, 8).fill();
      doc.rect(centerX - 12, logoY + 20, 24, 8).fill();
      doc.moveDown(2);
    }

    // --- 2. RESTAURANT DETAILS ---
    doc.font(font('bold')).fontSize(11).fillColor('#1F2937').text(restName.toUpperCase(), { align: 'center' });
    doc.font(font('regular')).fontSize(8).fillColor('#4B5563');
    doc.text(restAddress, { align: 'center' });
    doc.text(`Phone: ${restPhone}`, { align: 'center' });
    doc.text(`Email: ${restEmail}`, { align: 'center' });
    doc.text(`GSTIN: ${restGST}`, { align: 'center' });
    doc.moveDown(0.8);

    // --- 3. METADATA ROW ---
    const createdAt = order.created_at || order.createdAt || new Date();
    const tableNumber = order.table_number || order.tableNumber || 'N/A';
    const customerName = order.customer_name || order.customerName || 'Guest';

    // --- 3. METADATA BLOCK (Receipt No., Customer, Table, Date, Time) ---
    const metaY = doc.y;
    doc.rect(50, metaY, 495, 36).fill('#FDEFE3');
    
    const dateObj = new Date(createdAt);
    const dateStr = dateObj.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const timeStr = dateObj.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      timeZone: 'Asia/Kolkata' 
    });

    doc.fontSize(8);

    // Row 1: Receipt, Customer, Table
    doc.font(font('bold')).fillColor(primaryColor).text('Receipt No : ', 65, metaY + 7, { continued: true });
    doc.font(font('regular')).fillColor('#1F2937').text(`REC_${order.id.substring(0, 8).toUpperCase()}`);

    doc.font(font('bold')).fillColor(primaryColor).text('Customer   : ', 245, metaY + 7, { continued: true });
    doc.font(font('regular')).fillColor('#1F2937').text(customerName.length > 22 ? customerName.substring(0, 20) + '..' : customerName);

    doc.font(font('bold')).fillColor(primaryColor).text('Table No   : ', 445, metaY + 7, { continued: true });
    doc.font(font('regular')).fillColor('#1F2937').text(tableNumber);

    // Row 2: Date, Time
    doc.font(font('bold')).fillColor(primaryColor).text('Date       : ', 65, metaY + 21, { continued: true });
    doc.font(font('regular')).fillColor('#1F2937').text(dateStr);

    doc.font(font('bold')).fillColor(primaryColor).text('Time       : ', 245, metaY + 21, { continued: true });
    doc.font(font('regular')).fillColor('#1F2937').text(timeStr);

    doc.y = metaY + 48;

    // --- 4. ITEMS TABLE ---
    const tableTop = doc.y;
    const colX = {
      item: 50,
      qty: 280,
      cost: 360,
      amount: 450
    };

    // Header Fill
    doc.rect(50, tableTop, 495, 22).fill(primaryColor);
    
    // Header Text
    doc.font(font('bold')).fontSize(9).fillColor('#FFFFFF');
    doc.text('List of Items', colX.item + 10, tableTop + 6, { width: colWidth.item });
    doc.text('Quantity', colX.qty, tableTop + 6, { width: colWidth.qty, align: 'center' });
    doc.text('Unit Cost', colX.cost, tableTop + 6, { width: colWidth.cost, align: 'right' });
    doc.text('Amount', colX.amount, tableTop + 6, { width: colWidth.amount - 10, align: 'right' });

    doc.y = tableTop + 22;

    // Table Rows with Dynamic Height Calculation
    doc.font(font('regular')).fontSize(9);
    order.items.forEach((item: any, idx: number) => {
      const rowY = doc.y;
      
      // Calculate height of the item name to support clean text wrapping
      const nameHeight = doc.heightOfString(item.name, { width: colWidth.item - 10 });
      const rowHeight = Math.max(20, nameHeight + 8);
      
      const bgFill = idx % 2 === 0 ? '#FFFFFF' : '#FFF7ED'; // Zebra striping
      
      doc.rect(50, rowY, 495, rowHeight).fill(bgFill);
      
      const textPaddingY = (rowHeight - nameHeight) / 2;
      const numberPaddingY = (rowHeight - 9) / 2; // centering single-line values vertically
      
      doc.fillColor('#374151');
      doc.text(item.name, colX.item + 10, rowY + textPaddingY, { width: colWidth.item - 10 });
      doc.text(item.quantity.toString(), colX.qty, rowY + numberPaddingY, { width: colWidth.qty, align: 'center' });
      doc.text(`${currency}${item.price.toFixed(2)}`, colX.cost, rowY + numberPaddingY, { width: colWidth.cost, align: 'right' });
      doc.text(`${currency}${(item.price * item.quantity).toFixed(2)}`, colX.amount, rowY + numberPaddingY, { width: colWidth.amount - 10, align: 'right' });
      
      doc.lineWidth(0.5).strokeColor('#E5E5E5')
         .moveTo(50, rowY + rowHeight).lineTo(545, rowY + rowHeight).stroke();

      doc.y = rowY + rowHeight;
    });

    doc.moveDown(0.8);

    // --- 5. CALCULATIONS SUMMARY BLOCK (Aligned inside the table columns) ---
    let summaryY = doc.y;
    
    const summaryColX = {
      label: 340, // Aligns under the Unit Cost column
      value: 450  // Aligns under the Amount column
    };
    const summaryColWidth = {
      label: 110,
      value: 95
    };

    const drawSummaryRow = (label: string, value: string, isBold: boolean = false) => {
      const rowY = summaryY;
      
      // Draw borders to form cells
      doc.rect(summaryColX.label, rowY, summaryColWidth.label, 18).lineWidth(0.5).strokeColor('#E5E5E5').stroke();
      doc.rect(summaryColX.value, rowY, summaryColWidth.value, 18).lineWidth(0.5).strokeColor('#E5E5E5').stroke();
      
      // Draw shaded background for values cell
      doc.rect(summaryColX.value + 0.25, rowY + 0.25, summaryColWidth.value - 0.5, 17.5).fill('#FDEFE3');

      // Draw text
      doc.font(font(isBold ? 'bold' : 'regular')).fontSize(8.5);
      doc.fillColor(isBold ? primaryColor : '#4B5563');
      doc.text(label, summaryColX.label, rowY + 5, { width: summaryColWidth.label - 10, align: 'right' });
      doc.text(value, summaryColX.value, rowY + 5, { width: summaryColWidth.value - 10, align: 'right' });

      summaryY += 18;
    };

    // Output calculations row by row
    drawSummaryRow('Subtotal:', `${currency}${subTotal.toFixed(2)}`);
    
    if (discount > 0) {
      drawSummaryRow('Discount:', `-${currency}${discount.toFixed(2)}`);
    }
    
    if (tax > 0) {
      drawSummaryRow('GST:', `${currency}${tax.toFixed(2)}`);
    }
    
    if (serviceCharge > 0) {
      drawSummaryRow('Service Charge:', `${currency}${serviceCharge.toFixed(2)}`);
    }

    drawSummaryRow('Grand Total:', `${currency}${total.toFixed(2)}`, true);

    // --- 6. FOOTER SLOGANS (Centered horizontally at the bottom of the page) ---
    doc.y = summaryY + 20;
    doc.font(font('bold')).fontSize(12).fillColor(primaryColor).text('Eat As Much As You Like!', 50, doc.y, { width: 495, align: 'center' });
    doc.moveDown(0.4);
    doc.font(font('bold')).fontSize(14).fillColor(primaryColor).text('Thank You! Please Visit Us Again.', 50, doc.y, { width: 495, align: 'center' });

    doc.end();

    const pdfBuffer = await pdfPromise;
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${orderId.substring(0, 8)}.pdf`
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
  }
}
