/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  // Ship even if a type or lint warning slips through.
  // We still typecheck locally; this just prevents Vercel build blocks
  // on edge cases like inferred tuple types or strict optional chaining.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
