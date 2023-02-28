module.exports = {
  compileTemplate: "compile((code,result)=>{return global.compile.compileValue(eval(code),result);",
  compilePrintTemplate: "compilePrint((code,result)=>{return global.compile.compilePrintValue(eval(code),result);"
}
