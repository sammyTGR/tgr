/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/f/**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'kxxn9fl00i.ufs.sh',
        pathname: '/f/**',
        port: '',
      },
    ],
  },
};

module.exports = nextConfig;