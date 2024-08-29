/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://active-ewebservice.biz/aeServices30/:path*',
            },
        ]
    },
    env: {
        SERVICESTACK_API_KEY: process.env.SERVICESTACK_API_KEY,
        API_USERNAME: process.env.API_USERNAME,
        API_PASSWORD: process.env.API_PASSWORD,
        APP_ID: process.env.APP_ID,
      },
      serverRuntimeConfig: {
        SERVICESTACK_API_KEY: process.env.SERVICESTACK_API_KEY,
      },
      publicRuntimeConfig: {
        // Add any public env variables here if needed
      },
};

export default nextConfig;
