/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    // Polyfill browser-only modules that Node.js doesn't provide.
    // Required by @react-pdf/renderer on the server build.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:       false,
        path:     false,
        encoding: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
