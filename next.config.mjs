/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';

dotenv.config();

const nextConfig = {
    // async rewrites() {
    //     return [
    //         {
    //             source: '/api/:path*',
    //             destination: 'https://10846.active-e.net:7890/:path*',
    //         },
    //     ]
    // },
    // env: {
    //     API_KEY: process.env.ApiKey,
    //     API_USERNAME: process.env.Username,
    //     API_PASSWORD: process.env.Password,
    //     APP_ID: process.env.AppId,
    //   },
    //   serverRuntimeConfig: {
    //     API_KEY: process.env.ApiKey,
    //   },
    //   publicRuntimeConfig: {
    //     // Add any public env variables here if needed
    //   },
};

export default nextConfig;
