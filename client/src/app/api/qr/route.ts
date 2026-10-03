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
    const tableId = searchParams.get('tableId');
    const format = searchParams.get('format') || 'png'; // 'png', 'pdf'

    if (!tableId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing tableId' }), { status: 400 });
    }

    let tableNum = '1';
    let restaurantName = 'La Piazza Pizzeria';
    let restaurantSlug = 'la-piazza';
    let logoUrl: string | null = null;
    let primaryColor = '#EA580C';

    if (isDemoMode) {
      const dbTables = mockDb.getTables();
      const match = dbTables.find(t => t.id === tableId);
      if (!match) {
        return new Response(JSON.stringify({ success: false, message: 'Table not found' }), { status: 404 });
      }
      tableNum = match.number;
      logoUrl = mockDb.restaurant.logo || null;
    } else {
      // In live mode: query Supabase tables with resilient try-catch
      try {
        const { data: tableData, error: tableErr } = await supabase
          .from('tables')
          .select('*')
          .eq('id', tableId)
          .single();
        
        if (tableErr || !tableData) {
          const dbTables = mockDb.getTables();
          const match = dbTables.find(t => t.id === tableId);
          if (match) {
            tableNum = match.number;
            logoUrl = mockDb.restaurant.logo || null;
          } else {
            return new Response(JSON.stringify({ success: false, message: tableErr?.message || 'Table not found in database' }), { status: 404 });
          }
        } else {
          tableNum = tableData.number;

          // Query restaurant details separately to bypass join schema errors
          if (tableData.restaurant_id) {
            try {
              const { data: restData } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', tableData.restaurant_id)
                .single();
              if (restData) {
                restaurantName = restData.name || 'Ganesh Restaurant';
                restaurantSlug = restData.slug || 'la-piazza';
                logoUrl = restData.logo || mockDb.restaurant.logo;
                primaryColor = restData.theme?.primaryColor || '#EA580C';
              } else {
                logoUrl = mockDb.restaurant.logo || null;
              }
            } catch (err) {
              console.error('Error fetching restaurant for QR, falling back to mock logo:', err);
              logoUrl = mockDb.restaurant.logo || null;
            }
          } else {
            logoUrl = mockDb.restaurant.logo || null;
          }
        }
      } catch (err) {
        console.error('Error querying Supabase tables for QR, falling back to mock:', err);
        const dbTables = mockDb.getTables();
        const match = dbTables.find(t => t.id === tableId);
        if (match) {
          tableNum = match.number;
          logoUrl = mockDb.restaurant.logo || null;
        } else {
          return new Response(JSON.stringify({ success: false, message: 'Table not found during query fallback' }), { status: 404 });
        }
      }
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
    
    const targetUrl = `${baseUrl}/r/${restaurantSlug}/table/${tableNum}`;

    if (format === 'pdf') {
      // Create A6-sized print-ready flyer (297.64 x 419.53 points)
      const doc = new PDFDocument({ size: [297.64, 419.53], margin: 0 });
      const pdfPromise = buildPdfBuffer(doc);
      
      const cardW = 297.64;
      const cardH = 419.53;

      // 1. Draw outer orange border
      doc.roundedRect(6, 6, cardW - 12, cardH - 12, 28)
         .lineWidth(5)
         .strokeColor(primaryColor)
         .stroke();

      // Fetch restaurant logo
      let logoBuffer: Buffer | null = null;
      if (logoUrl) {
        logoBuffer = await fetchImageBuffer(logoUrl);
      }

      // 2. Draw Top Pill Header
      const pillW = 150;
      const pillH = 32;
      const pillX = (cardW - pillW) / 2;
      doc.roundedRect(pillX, 0, pillW, pillH, 16)
         .fillColor(primaryColor)
         .fill();

      // Text inside pill
      const padNum = (numStr: string) => {
        const parsed = parseInt(numStr, 10);
        if (isNaN(parsed)) return numStr;
        return parsed < 10 ? `0${parsed}` : `${parsed}`;
      };
      const tableLabel = `TABLE ${padNum(tableNum)}`;
      doc.font('Helvetica-Bold')
         .fontSize(13)
         .fillColor('#FFFFFF')
         .text(tableLabel, pillX, 9, { width: pillW, align: 'center' });

      // 3. Draw Custom QR code in the center
      const qrSize = 210;
      const qrX = (cardW - qrSize) / 2;
      const qrY = 50;

      // Inline QR matrix computation & vector draw
      const qr = QRCode.create(targetUrl, { errorCorrectionLevel: 'H' });
      const N = qr.modules.size;
      const cellWidth = qrSize / N;
      const cx = N / 2;
      const cy = N / 2;
      const logoRadius = Math.ceil(N * 0.16);

      const isFinderPattern = (row: number, col: number): boolean => {
        if (row < 7 && col < 7) return true;
        if (row < 7 && col >= N - 7) return true;
        if (row >= N - 7 && col < 7) return true;
        return false;
      };

      const getGradientColor = (row: number, col: number): string => {
        const t = (row + (N - 1 - col)) / (2 * (N - 1));
        const hex1 = '#000000';
        const hex2 = primaryColor;
        
        const r1 = parseInt(hex1.substring(1, 3), 16);
        const g1 = parseInt(hex1.substring(3, 5), 16);
        const b1 = parseInt(hex1.substring(5, 7), 16);
        
        const r2 = parseInt(hex2.substring(1, 3), 16);
        const g2 = parseInt(hex2.substring(3, 5), 16);
        const b2 = parseInt(hex2.substring(5, 7), 16);
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        const toHex = (val: number) => {
          const hex = val.toString(16);
          return hex.length === 1 ? `0${hex}` : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const dist = Math.sqrt((r - cx) ** 2 + (c - cy) ** 2);
          if (dist <= logoRadius) continue;

          if (qr.modules.get(r, c)) {
            const cellX = qrX + c * cellWidth;
            const cellY = qrY + r * cellWidth;

            if (isFinderPattern(r, c)) {
              if (r < 7 && c < 7) {
                const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
                const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                if (isBorder) {
                  doc.rect(cellX, cellY, cellWidth + 0.15, cellWidth + 0.15).fillColor('#000000').fill();
                } else if (isCore) {
                  doc.rect(cellX, cellY, cellWidth + 0.15, cellWidth + 0.15).fillColor(primaryColor).fill();
                }
              } else if (r < 7 && c >= N - 7) {
                const cc = c - (N - 7);
                const isBorder = r === 0 || r === 6 || cc === 0 || cc === 6;
                const isCore = r >= 2 && r <= 4 && cc >= 2 && cc <= 4;
                if (isBorder) {
                  doc.rect(cellX, cellY, cellWidth + 0.15, cellWidth + 0.15).fillColor('#000000').fill();
                } else if (isCore) {
                  doc.rect(cellX, cellY, cellWidth + 0.15, cellWidth + 0.15).fillColor(primaryColor).fill();
                }
              } else if (r >= N - 7 && c < 7) {
                const rr = r - (N - 7);
                const isBorder = rr === 0 || rr === 6 || c === 0 || c === 6;
                const isCore = rr >= 2 && rr <= 4 && c >= 2 && c <= 4;
                if (isBorder) {
                  doc.rect(cellX, cellY, cellWidth + 0.15, cellWidth + 0.15).fillColor('#000000').fill();
                } else if (isCore) {
                  doc.rect(cellX, cellY, cellWidth + 0.15, cellWidth + 0.15).fillColor(primaryColor).fill();
                }
              }
            } else {
              const rgb = getGradientColor(r, c);
              doc.rect(cellX, cellY, cellWidth + 0.15, cellWidth + 0.15).fillColor(rgb).fill();
            }
          }
        }
      }

      // 4. Central logo badge
      const logoBadgeRadius = (logoRadius + 0.5) * cellWidth;
      const logoCenterX = qrX + qrSize / 2;
      const logoCenterY = qrY + qrSize / 2;

      doc.circle(logoCenterX, logoCenterY, logoBadgeRadius).fillColor('#FFFFFF').fill();
      doc.circle(logoCenterX, logoCenterY, logoBadgeRadius).lineWidth(1.5).strokeColor(primaryColor).stroke();

      if (logoBuffer) {
        try {
          const imgW = logoBadgeRadius * 1.44;
          doc.image(logoBuffer, logoCenterX - imgW / 2, logoCenterY - imgW / 2, { width: imgW, height: imgW });
        } catch (e) {
          console.error('Error rendering logo inside PDF QR:', e);
        }
      } else {
        doc.save();
        doc.translate(logoCenterX - 8, logoCenterY - 8);
        doc.scale(16 / 24);
        doc.path("M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z").fillColor(primaryColor).fill();
        doc.restore();
      }

      // 5. Elegant script tagline "Scan to View Menu"
      let fontLoaded = false;
      try {
        const fontRes = await fetch('https://fonts.gstatic.com/s/playfairdisplay/v37/nuFeD-vYSZ1C_E1X1kx1rALKB89Kkzc.ttf');
        if (fontRes.ok) {
          const fontArrayBuffer = await fontRes.arrayBuffer();
          doc.registerFont('PlayfairDisplay-Italic', Buffer.from(fontArrayBuffer));
          doc.font('PlayfairDisplay-Italic').fontSize(19).fillColor(primaryColor).text('Scan to View Menu', 0, 310, { width: cardW, align: 'center' });
          fontLoaded = true;
        }
      } catch (e) {
        console.error('Error loading Playfair Display Italic font:', e);
      }
      if (!fontLoaded) {
        doc.font('Times-Italic').fontSize(18).fillColor(primaryColor).text('Scan to View Menu', 0, 310, { width: cardW, align: 'center' });
      }

      // 6. Bottom cutlery graphic divider
      const dividerY = 352;
      doc.lineWidth(1.5).strokeColor(primaryColor);
      doc.moveTo(78, dividerY).lineTo(136, dividerY).stroke();
      doc.moveTo(160, dividerY).lineTo(218, dividerY).stroke();

      // Fork Left
      doc.save();
      doc.translate(58, dividerY - 8);
      doc.scale(0.65);
      doc.path("M12 2v10h1.5v-7h1.5v7H16.5v-7H18v7h1.5V2H18v5h-1.5V2h-1.5v5H13.5V2H12zm1.5 12h3v8h-3v-8z").fillColor(primaryColor).fill();
      doc.restore();

      // Spoon Right
      doc.save();
      doc.translate(222, dividerY - 8);
      doc.scale(0.65);
      doc.path("M12 2c-2.76 0-5 2.24-5 5v7h2.5v8h5v-8H17V7c0-2.76-2.24-5-5-5z").fillColor(primaryColor).fill();
      doc.restore();

      // Smartphone circle
      doc.circle(148, dividerY, 9).fillColor('#FFFFFF').fill();
      doc.circle(148, dividerY, 9).lineWidth(1.5).strokeColor(primaryColor).stroke();

      // Smartphone icon
      doc.save();
      doc.translate(144.5, dividerY - 5.5);
      doc.scale(0.3);
      doc.path("M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z").fillColor(primaryColor).fill();
      doc.restore();

      doc.end();

      const pdfBuffer = await pdfPromise;
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=table-${tableNum}-qr-card.pdf`
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
