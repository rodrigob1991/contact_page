/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
  experimental: {
    appDir: true,
  },
  transpilePackages: ["utils", "chat-common"],
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig
