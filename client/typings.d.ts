type Babel = typeof import('@babel/core');
type Types = typeof import('@babel/types');
type Traverse = typeof import('@babel/traverse');

declare module globalThis {
  export function compilePrint(render: () => ReactElement): ReactElement;
  export interface CompileOption {
    babel: Babel;
    t: Types;
    traverse: Traverse.default;
    compilePrintValue: Function;
    compileValue: Function;
    normalValuePrint: Function;
    normalValue: Function;
    whiteListNames: {[key: string]: boolean};
    cacheNames: {[key: string]: boolean};
  }
  export interface compileFunction extends CompileOption {
    (render: () => ReactElement): ReactElement;
  }
  export var compile: compileFunction;
}
