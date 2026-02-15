/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Proxy API calls to the NestJS backend – avoids CORS entirely in development
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3200";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
}

export default nextConfig
