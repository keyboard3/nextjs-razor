const { RawSource } = require("webpack-sources");
const webpack = require("webpack");
const { compileTemplate, compilePrintTemplate } = require("./config");

class ReplaceFunctionPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "ReplaceFunctionPlugin",
      (compilation) => {
        compilation.hooks.processAssets.tap({
          name: "ReplaceFunctionPlugin",
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        }, (assets) => {
          for (const [fileName, asset] of Object.entries(assets)) {
            if (fileName.startsWith("static")) continue;
            if (/\.js$/.test(fileName)) {
              const content = asset.source().toString();
              const replaced = content.replace(
                /Function\((.+?)\)\(\)/g,
                "eval($1)",
              ).replace(/compile\(\(\)=>{/g, compileTemplate)
                .replace(/compilePrint\(\(\)=>{/g, compilePrintTemplate);
              assets[fileName] = new RawSource(replaced);
            }
          }
        });
      },
    );
  }
}
module.exports = ReplaceFunctionPlugin;