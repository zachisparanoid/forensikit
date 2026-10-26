/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static, client-side app. No server runtime touches user data — the
  // "server" only ever runs at build time to pre-render the shell.
  output: 'export',
  reactStrictMode: true,
  // next/image optimization requires a server; disable it for static export.
  images: { unoptimized: true },
  // Trailing slashes make the exported static site portable across hosts.
  trailingSlash: true,
  eslint: {
    // We run lint explicitly in CI; never silently ignore during build.
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
