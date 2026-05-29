import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://127.0.0.1:3000/auth/:path*',
      },
      {
        source: '/users/:path*',
        destination: 'http://127.0.0.1:3000/users/:path*',
      },
      {
        source: '/assinaturas/:path*',
        destination: 'http://127.0.0.1:3000/assinaturas/:path*',
      },
      {
        source: '/pagamentos/:path*',
        destination: 'http://127.0.0.1:3000/pagamentos/:path*',
      },
      {
        source: '/historicos/:path*',
        destination: 'http://127.0.0.1:3000/historicos/:path*',
      },
      {
        source: '/planos/:path*',
        destination: 'http://127.0.0.1:3000/planos/:path*',
      },
    ];
  },
};

export default nextConfig;
