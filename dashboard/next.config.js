/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // API routes will proxy to the main CLI
  async rewrites() {
    return [
      {
        source: '/api/agents/:path*',
        destination: 'http://localhost:3001/api/agents/:path*',
      },
    ];
  },
}