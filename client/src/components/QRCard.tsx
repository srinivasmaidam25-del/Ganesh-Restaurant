import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface QRCardProps {
  tableNumber: string;
  url: string;
  logoUrl?: string;
  primaryColor?: string;
  width?: number; // visual width in display
}

export const QRCard: React.FC<QRCardProps> = ({
  tableNumber,
  url,
  logoUrl,
  primaryColor = '#EA580C',
  width = 280
}) => {
  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
      return qr.modules;
    } catch (e) {
      console.error('Error creating QR matrix:', e);
      return null;
    }
  }, [url]);

  const padTableNumber = (numStr: string) => {
    const parsed = parseInt(numStr, 10);
    if (isNaN(parsed)) return numStr;
    return parsed < 10 ? `0${parsed}` : `${parsed}`;
  };

  const tableLabel = `TABLE ${padTableNumber(tableNumber)}`;

  // SVG dimensions
  const cardW = 300;
  const cardH = 400;

  // Render SVG elements dynamically
  const svgContent = useMemo(() => {
    if (!qrData) return null;

    const N = qrData.size;
    const qrSize = 210; // Width of QR area
    const cellWidth = qrSize / N;
    const cx = N / 2;
    const cy = N / 2;
    const logoRadius = Math.ceil(N * 0.16);

    const modulesList: React.ReactNode[] = [];

    const isFinderPattern = (row: number, col: number): boolean => {
      if (row < 7 && col < 7) return true;
      if (row < 7 && col >= N - 7) return true;
      if (row >= N - 7 && col < 7) return true;
      return false;
    };

    const getGradientColor = (row: number, col: number) => {
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
      
      return `rgb(${r}, ${g}, ${b})`;
    };

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const dist = Math.sqrt((r - cx) ** 2 + (c - cy) ** 2);
        if (dist <= logoRadius) continue;

        if (qrData.get(r, c)) {
          const x = c * cellWidth;
          const y = r * cellWidth;

          if (isFinderPattern(r, c)) {
            if (r < 7 && c < 7) {
              const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
              const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
              if (isBorder) {
                modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill="#000000" />);
              } else if (isCore) {
                modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill={primaryColor} />);
              }
            } else if (r < 7 && c >= N - 7) {
              const cc = c - (N - 7);
              const isBorder = r === 0 || r === 6 || cc === 0 || cc === 6;
              const isCore = r >= 2 && r <= 4 && cc >= 2 && cc <= 4;
              if (isBorder) {
                modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill="#000000" />);
              } else if (isCore) {
                modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill={primaryColor} />);
              }
            } else if (r >= N - 7 && c < 7) {
              const rr = r - (N - 7);
              const isBorder = rr === 0 || rr === 6 || c === 0 || c === 6;
              const isCore = rr >= 2 && rr <= 4 && c >= 2 && c <= 4;
              if (isBorder) {
                modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill="#000000" />);
              } else if (isCore) {
                modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill={primaryColor} />);
              }
            }
          } else {
            const color = getGradientColor(r, c);
            modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill={color} />);
          }
        }
      }
    }

    const logoBadgeRadius = (logoRadius + 0.5) * cellWidth;
    const logoCenter = qrSize / 2;

    return {
      modulesList,
      logoBadgeRadius,
      logoCenter
    };
  }, [qrData, primaryColor]);

  if (!qrData || !svgContent) return null;

  return (
    <svg 
      id={`qr-card-svg-${tableNumber}`}
      width={width}
      height={width * (cardH / cardW)}
      viewBox={`0 0 ${cardW} ${cardH}`}
      className="select-none inline-block shadow-md rounded-[28px]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style type="text/css">{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600&display=swap');
          .cursive-text {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-weight: 600;
          }
        `}</style>
      </defs>

      {/* 1. Outer Card Background and Border */}
      <rect 
        x="6" 
        y="6" 
        width={cardW - 12} 
        height={cardH - 12} 
        rx="28" 
        ry="28" 
        fill="#FFFFFF" 
        stroke={primaryColor} 
        strokeWidth="5" 
      />

      {/* 2. Top Banner Pill */}
      <rect 
        x={(cardW - 150) / 2} 
        y="0" 
        width="150" 
        height="32" 
        rx="16" 
        ry="16" 
        fill={primaryColor} 
      />
      <text 
        x={cardW / 2} 
        y="21" 
        fill="#FFFFFF" 
        fontFamily="Helvetica, Arial, sans-serif" 
        fontWeight="900" 
        fontSize="13" 
        textAnchor="middle"
        letterSpacing="1"
      >
        {tableLabel}
      </text>

      {/* 3. QR Code Graphic Group */}
      <g transform={`translate(${(cardW - 210) / 2}, 50)`}>
        {/* QR modules rendering */}
        <g>{svgContent.modulesList}</g>

        {/* Central Logo Circle badge */}
        <circle 
          cx={svgContent.logoCenter} 
          cy={svgContent.logoCenter} 
          r={svgContent.logoBadgeRadius} 
          fill="#FFFFFF" 
          stroke={primaryColor}
          strokeWidth="2"
        />

        {/* Embedded Logo or Vector Cutlery Fallback */}
        {logoUrl ? (
          <image 
            href={logoUrl}
            x={svgContent.logoCenter - svgContent.logoBadgeRadius * 0.72}
            y={svgContent.logoCenter - svgContent.logoBadgeRadius * 0.72}
            width={svgContent.logoBadgeRadius * 1.44}
            height={svgContent.logoBadgeRadius * 1.44}
          />
        ) : (
          <g transform={`translate(${svgContent.logoCenter - 10}, ${svgContent.logoCenter - 10}) scale(${20 / 24})`}>
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill={primaryColor} />
          </g>
        )}
      </g>

      {/* 4. Cursive tagline "Scan to View Menu" */}
      <text 
        x={cardW / 2} 
        y="318" 
        fill={primaryColor} 
        fontSize="21" 
        textAnchor="middle"
        className="cursive-text"
      >
        Scan to View Menu
      </text>

      {/* 5. Bottom Cutlery Graphic Divider */}
      <g transform={`translate(${(cardW - 200) / 2}, 340)`}>
        {/* Left line */}
        <line x1="30" y1="12" x2="88" y2="12" stroke={primaryColor} strokeWidth="1.5" />
        {/* Right line */}
        <line x1="112" y1="12" x2="170" y2="12" stroke={primaryColor} strokeWidth="1.5" />
        
        {/* Fork on the left end */}
        <g transform="translate(10, 4) scale(0.65)" fill={primaryColor}>
          <path d="M12 2v10h1.5v-7h1.5v7H16.5v-7H18v7h1.5V2H18v5h-1.5V2h-1.5v5H13.5V2H12zm1.5 12h3v8h-3v-8z" />
        </g>
        
        {/* Spoon on the right end */}
        <g transform="translate(174, 4) scale(0.65)" fill={primaryColor}>
          <path d="M12 2c-2.76 0-5 2.24-5 5v7h2.5v8h5v-8H17V7c0-2.76-2.24-5-5-5z" />
        </g>
        
        {/* Circle with Smartphone in the center */}
        <circle cx="100" cy="12" r="9" fill="#FFFFFF" stroke={primaryColor} strokeWidth="1.5" />
        <g transform="translate(96.5, 8.5) scale(0.3)" fill={primaryColor}>
          <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
        </g>
      </g>
    </svg>
  );
};
