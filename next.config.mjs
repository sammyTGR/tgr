/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';

dotenv.config();

const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'utfs.io',
            pathname: '/f/**',
            port: '',
          },
        ],
    },
    env: {
      API_KEY: process.env.API_KEY,
      USERNAME: process.env.USERNAME,
      PASSWORD: process.env.PASSWORD,
      APP_ID: process.env.APP_ID,
    },
    // eslint: {
    //   // Warning: This allows production builds to successfully complete even if
    //   // your project has ESLint errors.
    //   ignoreDuringBuilds: true,
    // },
    // typescript: {
    //   // This will also ignore TypeScript errors during build
    //   ignoreBuildErrors: true,
    // },

    // async headers() {
    //   return [
    //     {
    //       source: "/api/:path*",
    //       headers: [
    //         { key: "Access-Control-Allow-Credentials", value: "true" },
    //         { key: "Access-Control-Allow-Origin", value: "*" },
    //         { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
    //         { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, ApiKey, AppId" },
    //       ]
    //     }
    //   ]
    // },
    // webpack: (config, { isServer }) => {
    //   if (!isServer) {
    //     config.resolve.fallback = {
    //       ...config.resolve.fallback,
    //       https: false,
    //     };
    //   }
    //   return config;
    // }
  
};

export default nextConfig;
