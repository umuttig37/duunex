import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // Add this line
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'aecepwfvdmiibuigggod.supabase.co',
        port: '',
        pathname: '/**', // Add this pattern for Supabase storage
      },
    ],
  },
};

export default nextConfig;
