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
    experimental: {
      dynamicIO: true,
    },
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
