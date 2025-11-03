/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    remotePatterns: [],
  },
  // Suppress static route warnings
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
