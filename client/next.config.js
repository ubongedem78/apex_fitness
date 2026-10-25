

const extraHosts = (process.env.NEXT_PUBLIC_IMAGE_HOST || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)
  .map((hostname) => ({ protocol: 'https', hostname }));

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      ...extraHosts,
    ],
  },
};
module.exports = nextConfig;
