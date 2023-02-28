import { Html, Head, Main, NextScript } from 'next/document'
const babel = require("@babel/core");
const t = require('@babel/types');
import traverse from "@babel/traverse";
import { compileValue, normalValue } from '@/template-helper/proxy';

const compile: any = {};
(global as any).compile = compile;
compile.babel = babel;
compile.t = t;
compile.traverse = traverse;
compile.compileValue = compileValue;
compile.normalValue = normalValue;

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
