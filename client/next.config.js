/** @type {import('next').NextConfig} */
const webpack = require("webpack");
const { RawSource } = require("webpack-sources");

class ReplaceFunctionPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('ReplaceFunctionPlugin', (compilation) => {
      compilation.hooks.processAssets.tap({
        name: 'ReplaceFunctionPlugin',
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, (assets) => {
        for (const [fileName, asset] of Object.entries(assets)) {
          if (/\.js$/.test(fileName)) {
            const content = asset.source().toString();
            const replaced = content.replace(/Function\((.+?)\)\(\)/g, 'eval($1)');
            assets[fileName] = new RawSource(replaced);
          }
        }
      });
    });
  }
}
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.plugins.push(new ReplaceFunctionPlugin());
    return config;
  }
}

module.exports = nextConfig
