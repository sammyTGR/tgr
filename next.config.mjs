/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';
import { VercelToolbar } from '@vercel/toolbar/next';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

dotenv.config();

const nextConfig = {
    // config options here
};

const withVercelToolbar = require('@vercel/toolbar/plugins/next')();
// Instead of module.exports = nextConfig, do this:
export default withVercelToolbar(nextConfig);

