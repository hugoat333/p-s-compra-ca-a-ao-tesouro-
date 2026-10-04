import type { NextConfig } from "next";

const securityHeaders = [
  // Os links de acesso carregam um token opaco: nunca vazar a URL via Referer.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Os kits ficam FORA de /public (as pistas não podem ser baixadas por URL direta).
  // Garante que os arquivos acompanhem as funções serverless que geram o PDF.
  outputFileTracingIncludes: {
    "/api/personalization": ["./kits/**/*", "./assets/fonts/**/*"],
    "/api/download/[token]": ["./kits/**/*", "./assets/fonts/**/*"],
  },
  serverExternalPackages: ["pg", "nodemailer"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
