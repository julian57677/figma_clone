/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing image configuration (if any)

  webpack: (config, { isServer }) => {
    // Add the canvas external only on the server-side
    if (isServer) {
      config.externals.push({ canvas: 'commonjs canvas' });
    }

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'liveblocks.io',
        port: '', // Optional, leave empty if no specific port
      },
    ],
  },
};

export default nextConfig;
