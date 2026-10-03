import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface StyledQRCodeProps {
  url: string;
  logoUrl?: string;
  size?: number;
  primaryColor?: string;
}

export const StyledQRCode: React.FC<StyledQRCodeProps> = ({
  url,
  logoUrl,
  size = 250,
  primaryColor = '#EA580C'
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

  if (!qrData) return null;

  const N = qrData.size;
  const cellWidth = size / N;
  const cx = N / 2;
  const cy = N / 2;
  // Clear a circular region in the center of the QR matrix (about 18% radius)
  const logoRadius = Math.ceil(N * 0.16); 

  const modulesList: React.ReactNode[] = [];

  // Identify position detection (finder) pattern cells
  const isFinderPattern = (row: number, col: number): boolean => {
    if (row < 7 && col < 7) return true;
    if (row < 7 && col >= N - 7) return true;
    if (row >= N - 7 && col < 7) return true;
    return false;
  };

  // Determine diagonal gradient color for data modules (from black bottom-left to orange top-right)
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
      // Clear central logo area
      const dist = Math.sqrt((r - cx) ** 2 + (c - cy) ** 2);
      if (dist <= logoRadius) {
        continue;
      }

      if (qrData.get(r, c)) {
        const x = c * cellWidth;
        const y = r * cellWidth;

        if (isFinderPattern(r, c)) {
          // Custom finder pattern squares: outer 7x7 black border, inner 3x3 orange square
          if (r < 7 && c < 7) {
            // Top-Left Finder
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            if (isBorder) {
              modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill="#000000" />);
            } else if (isCore) {
              modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill={primaryColor} />);
            }
          } else if (r < 7 && c >= N - 7) {
            // Top-Right Finder
            const cc = c - (N - 7);
            const isBorder = r === 0 || r === 6 || cc === 0 || cc === 6;
            const isCore = r >= 2 && r <= 4 && cc >= 2 && cc <= 4;
            if (isBorder) {
              modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill="#000000" />);
            } else if (isCore) {
              modulesList.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellWidth + 0.25} height={cellWidth + 0.25} fill={primaryColor} />);
            }
          } else if (r >= N - 7 && c < 7) {
            // Bottom-Left Finder
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
          // Regular data modules: diagonal black-to-orange gradient
          const color = getGradientColor(r, c);
          modulesList.push(
            <rect 
              key={`${r}-${c}`} 
              x={x} 
              y={y} 
              width={cellWidth + 0.25} 
              height={cellWidth + 0.25} 
              fill={color} 
            />
          );
        }
      }
    }
  }

  const logoBadgeRadius = (logoRadius + 0.5) * cellWidth;
  const logoCenter = size / 2;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      className="select-none inline-block"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Quiet Zone white background */}
      <rect width={size} height={size} fill="#FFFFFF" />

      {/* QR Code Modules */}
      <g>{modulesList}</g>

      {/* Central circular logo badge container */}
      <circle 
        cx={logoCenter} 
        cy={logoCenter} 
        r={logoBadgeRadius} 
        fill="#FFFFFF" 
        stroke={primaryColor}
        strokeWidth={1.5}
      />

      {/* Embedded restaurant logo image or vector cutlery fallback */}
      {logoUrl ? (
        <image 
          href={logoUrl}
          x={logoCenter - logoBadgeRadius * 0.75}
          y={logoCenter - logoBadgeRadius * 0.75}
          width={logoBadgeRadius * 1.5}
          height={logoBadgeRadius * 1.5}
        />
      ) : (
        <g transform={`translate(${logoCenter - 10}, ${logoCenter - 10}) scale(${20 / 24})`}>
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill={primaryColor} />
        </g>
      )}
    </svg>
  );
};
