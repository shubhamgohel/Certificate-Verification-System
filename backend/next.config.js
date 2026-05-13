/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Pin the turbopack root to the backend folder so it always finds node_modules here
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin',      value: '*'    },
          { key: 'Access-Control-Allow-Methods',     value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers',     value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
