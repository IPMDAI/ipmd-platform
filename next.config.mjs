/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Permet l'upload de fichiers (PDF / PowerPoint) via Server Actions.
    serverActions: { bodySizeLimit: "15mb" },
  },
  images: {
    // Domaines autorisés pour les images distantes (Supabase Storage, etc.).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
