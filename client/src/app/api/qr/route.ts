import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { isDemoMode, supabase } from '@/utils/supabaseClient';
import { mockDb } from '@/utils/mockDb';
import os from 'os';

// Resolve local network interface IP to generate scannable phone QR codes
function getNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// Helper to convert PDF kit document to a buffer
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
    const tableId = searchParams.get('tableId');
    const format = searchParams.get('format') || 'png'; // 'png', 'pdf'

    if (!tableId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing tableId' }), { status: 400 });
    }

    let tableNum = '1';
    let restaurantName = 'La Piazza Pizzeria';
    let restaurantSlug = 'la-piazza';

    if (isDemoMode) {
      const dbTables = mockDb.getTables();
      const match = dbTables.find(t => t.id === tableId);
      if (!match) {
        return new Response(JSON.stringify({ success: false, message: 'Table not found' }), { status: 404 });
      }
      tableNum = match.number;
    } else {
      // In live mode: query Supabase tables, join restaurants
      const { data: tableData, error: tableErr } = await supabase
        .from('tables')
        .select('*, restaurants(*)')
        .eq('id', tableId)
        .single();
      
      if (tableErr || !tableData) {
        return new Response(JSON.stringify({ success: false, message: tableErr?.message || 'Table not found in database' }), { status: 404 });
      }
      tableNum = tableData.number;
      restaurantName = tableData.restaurants?.name || 'La Piazza Pizzeria';
      restaurantSlug = tableData.restaurants?.slug || 'la-piazza';
    }

    // Dynamic base URL detection prioritizing NEXT_PUBLIC_SITE_URL for Vercel production deployments
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    if (baseUrl) {
      baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    } else {
      let host = req.headers.get('host') || 'localhost:3000';
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        const ip = getNetworkIp();
        host = host.replace(/localhost|127\.0\.0\.1/, ip);
      }
      const protocol = req.url.startsWith('https') ? 'https' : 'http';
      baseUrl = `${protocol}://${host}`;
    }
    
    const targetUrl = `${baseUrl}/table/${tableNum}`;

    if (format === 'pdf') {
      // Generate A4 Flyer
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.rect(20, 20, 555, 800).lineWidth(3).stroke('#EA580C'); // Border
      
      doc.font('Helvetica-Bold').fontSize(28).fillColor('#EA580C').text(restaurantName, { align: 'center' });
      doc.moveDown();
      
      doc.font('Helvetica').fontSize(16).fillColor('#374151').text('Scan to View Menu & Order Directly', { align: 'center' });
      doc.moveDown(2);

      // Generate QR
      const qrDataUrl = await QRCode.toDataURL(targetUrl, { margin: 1, width: 250 });
      const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
      
      doc.image(qrBuffer, doc.page.width / 2 - 125, 200, { width: 250, height: 250 });
      doc.moveDown(13);

      doc.font('Helvetica-Bold').fontSize(36).fillColor('#1F2937').text(`TABLE ${tableNum}`, { align: 'center' });
      doc.moveDown();

      doc.font('Helvetica-Oblique').fontSize(12).fillColor('#6B7280').text('No app download required. Scan with your smartphone camera.', { align: 'center' });
      doc.end();

      const pdfBuffer = await buildPdfBuffer(doc);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=table-${tableNum}-qr.pdf`
        }
      });
    } else {
      // Default to PNG image Buffer stream
      const qrBuffer = await QRCode.toBuffer(targetUrl, { margin: 2, width: 400 });
      return new Response(new Uint8Array(qrBuffer), {
        headers: {
          'Content-Type': 'image/png'
        }
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
  }
}
