/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@workout/core", "@workout/db"],
};

module.exports = nextConfig;
