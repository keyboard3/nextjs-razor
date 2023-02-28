/** @type {import('next').NextConfig} */
const ReplaceFunctionPlugin = require("./template-helper/replace-plugin")
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.plugins.push(new ReplaceFunctionPlugin());
    return config;
  },
};

module.exports = nextConfig;
