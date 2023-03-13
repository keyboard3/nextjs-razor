import { Html, Head, Main, NextScript } from 'next/document'
const babel = require("@babel/core");
const t = require('@babel/types');
import traverse from "@babel/traverse";

import { compilePrintValue, compileValue, normalValue, normalValuePrint } from '@/template-helper/proxy';
import { compilePrint, compile } from '@/template-helper/compile';

const option: CompileOption = {
  babel,
  t,
  traverse,
  compilePrintValue,
  compileValue,
  normalValuePrint,
  normalValue,
  whiteListNames: {
    "index": true, //这给是c# foreach 中使用 index 索引用的变量，不能被替换
    "props": true,//给react组件传递的props
  },
  cacheNames:{}
}
global.compile = Object.assign(compile, option);
global.compilePrint = compilePrint;

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
