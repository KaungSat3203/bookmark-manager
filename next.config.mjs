/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/stock',

  experimental: {
    instrumentationHook: true, // optional
  },
};

export default nextConfig;
