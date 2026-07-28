import { NextRequest } from 'next/server';
import PDFDocument from 'pdfkit';
import { isDemoMode, supabase } from '@/utils/supabaseClient';
import { mockDb } from '@/utils/mockDb';

const buildPdfBuffer = (doc: PDFKit.PDFDocument): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));
  });
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
      // In live mode: query Supabase orders database, joining restaurant details
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*, restaurants(*)')
        .eq('id', orderId)
        .single();
      
      if (orderErr || !orderData) {
        return new Response(JSON.stringify({ success: false, message: orderErr?.message || 'Order not found' }), { status: 404 });
      }
      order = orderData;
    }

    if (!order) {
      return new Response(JSON.stringify({ success: false, message: 'Order not found' }), { status: 404 });
    }

    // Resolve restaurant details
    const restName = order.restaurants?.name || 'La Piazza Pizzeria';
    const restAddress = order.restaurants?.address || '123 Tuscan Way, Little Italy, NY 10013';
    const restGST = order.restaurants?.gst_number || '27AAAAA1111A1Z1';
    const currency = order.restaurants?.currency || '$';

    // Design invoice receipt PDF (A6 receipt size)
    const doc = new PDFDocument({ size: 'A6', margin: 20 });
    const primaryColor = '#EA580C';

    // 1. Restaurant Header
    doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor).text(restName, { align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#4B5563').text(restAddress, { align: 'center' });
    if (restGST) doc.text(`GST: ${restGST}`, { align: 'center' });
    doc.moveDown();

    doc.lineWidth(1).strokeColor('#E5E7EB').moveTo(15, doc.y).lineTo(doc.page.width - 15, doc.y).stroke();
    doc.moveDown(0.5);

    // 2. Receipt Details
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1F2937');
    doc.text(`Invoice No: INV-${order.id.substring(0, 8).toUpperCase()}`);
    doc.font('Helvetica').fontSize(8);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Table No: ${order.tableNumber}`);
    doc.text(`Customer: ${order.customerName}`);
    doc.moveDown(0.5);

    doc.lineWidth(1).strokeColor('#E5E7EB').moveTo(15, doc.y).lineTo(doc.page.width - 15, doc.y).stroke();
    doc.moveDown(0.5);

    // 3. Items Headers
    const itemColX = 20;
    const qtyColX = 160;
    const priceColX = 200;
    const totalColX = 250;

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151');
    doc.text('Item', itemColX, doc.y, { continued: true });
    doc.text('Qty', qtyColX - itemColX, doc.y, { continued: true });
    doc.text('Price', priceColX - qtyColX, doc.y, { continued: true });
    doc.text('Total', totalColX - priceColX, doc.y);
    doc.moveDown(0.3);

    // 4. Items list
    doc.font('Helvetica').fontSize(8).fillColor('#4B5563');
    order.items.forEach((item: any) => {
      const startY = doc.y;
      doc.text(item.name, itemColX, startY, { width: 135 });
      const endY = doc.y;
      
      doc.text(item.quantity.toString(), qtyColX, startY);
      doc.text(`${currency}${item.price.toFixed(2)}`, priceColX, startY);
      doc.text(`${currency}${(item.price * item.quantity).toFixed(2)}`, totalColX, startY);
      
      doc.y = Math.max(endY, startY + 10);
      doc.moveDown(0.2);
    });

    doc.moveDown(0.5);
    doc.lineWidth(0.5).strokeColor('#F3F4F6').moveTo(15, doc.y).lineTo(doc.page.width - 15, doc.y).stroke();
    doc.moveDown(0.5);

    // 5. Calculations Summary
    const labelX = 140;
    const valueX = 240;

    doc.font('Helvetica').fontSize(8).fillColor('#4B5563');
    doc.text('Subtotal:', labelX, doc.y, { continued: true });
    doc.text(`${currency}${order.subTotal.toFixed(2)}`, valueX - labelX, doc.y);
    doc.moveDown(0.2);

    if (order.discount > 0) {
      doc.text('Discount:', labelX, doc.y, { continued: true });
      doc.text(`-${currency}${order.discount.toFixed(2)}`, valueX - labelX, doc.y);
      doc.moveDown(0.2);
    }

    if (order.tax > 0) {
      doc.text('CGST/SGST (5%):', labelX, doc.y, { continued: true });
      doc.text(`${currency}${order.tax.toFixed(2)}`, valueX - labelX, doc.y);
      doc.moveDown(0.2);
    }

    if (order.serviceCharge > 0) {
      doc.text('Service Charge (2%):', labelX, doc.y, { continued: true });
      doc.text(`${currency}${order.serviceCharge.toFixed(2)}`, valueX - labelX, doc.y);
      doc.moveDown(0.2);
    }

    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937');
    doc.text('Grand Total:', labelX, doc.y, { continued: true });
    doc.text(`${currency}${order.total.toFixed(2)}`, valueX - labelX, doc.y);
    doc.moveDown(2.5);

    // 6. Footer
    doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('Thank You!', { align: 'center' });
    doc.font('Helvetica').fontSize(7).fillColor('#9CA3AF').text('Please Visit Us Again', { align: 'center' });

    doc.end();

    const pdfBuffer = await buildPdfBuffer(doc);
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
