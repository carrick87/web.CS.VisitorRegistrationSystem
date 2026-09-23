/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

const isPWADisabled = process.env.NODE_ENV === 'development' || process.env.VERCEL === '1'

if (isPWADisabled) {
  module.exports = nextConfig
} else {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: false,
  })
  module.exports = withPWA(nextConfig)
}
