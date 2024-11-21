/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';

dotenv.config();

const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'utfs.io',
          },
        ],
    },
};

export default nextConfig;
