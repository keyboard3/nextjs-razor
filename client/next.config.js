/** @type {import('next').NextConfig} */
const ReplaceFunctionPlugin = require("./template-helper/replace-plugin")
const nextConfig = {
  reactStrictMode: true,
  pageExtensions:["tsx"],
  webpack(config) {
    config.plugins.push(new ReplaceFunctionPlugin());
    return config;
  },
};

module.exports = nextConfig;
