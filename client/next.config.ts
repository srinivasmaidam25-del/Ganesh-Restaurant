import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/invoice': ['./node_modules/pdfkit/js/data/**'],
    '/api/qr': ['./node_modules/pdfkit/js/data/**']
  }
};

export default nextConfig;
