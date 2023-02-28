import ReactDOMServer from "react-dom/server";


export const compileTemplte =
  "compile((code,result)=>{return compileValue(eval(code),result);";
//将compile 回调的结果也转换成归一对象
export function compile(func: any) {
  if (typeof window !== "undefined" || process.env.NODE_ENV == "development") {
    if (typeof func == "function") {
      return func();
    }
    return func;
  }
  if (typeof func != "function") {
    if (typeof func == "object") return func?.meta?.result || func;
    return func;
  }

  let code = func.toString();
  code = code.replace(compileTemplte.replace("compile(", ""), "()=>{");

  const allNames: any = {};
  const resultName = generateUniqueVariableName("result");
  let reusltValueName = "";
  let resultCode = ""

  const { t, babel, traverse } = (global as any).compile;
  debugger;
  const ast = babel.parse(code);
  traverse(ast, {
    exit(path: any) {
      const isRoot = path.node.type === 'Program' && !path.parentPath;
      if (!isRoot) {
        if (t.isReturnStatement(path.node)) {
          reusltValueName = (path.node?.argument as any)?.name;
          const newNode = t.assignmentExpression('=', t.identifier(resultName), t.identifier(reusltValueName));
          path.replaceWith(newNode);
        }
        return;
      }

      //提前捕获到所有声明的变量
      const compiledCode = Object.keys(allNames).map((key) => {
        const value = allNames[key];
        const args = [value];
        const callee = t.identifier("normalValue");
        const callExpr = t.callExpression(callee, args);
        const varName = t.identifier(key);
        const varDecl = t.variableDeclaration("var", [t.variableDeclarator(varName, callExpr)]);
        return varDecl;
      });

      const prefixInstructionNode = t.stringLiteral("");
      const prefixInstructionExpr = Object.keys(allNames).reduce((acc: any, key) => {
        const instruction = t.memberExpression(t.memberExpression(t.identifier(key), t.identifier("meta")), t.identifier("instruction"));
        return t.binaryExpression("+", acc, instruction);
      }, prefixInstructionNode);
      const replaceExpr = t.callExpression(
        babel.types.memberExpression(
          prefixInstructionExpr,
          babel.types.identifier('replace')
        ),
        [
          babel.types.regExpLiteral('@{\\n?(.+?)\\n?}', 'sg'),
          babel.types.stringLiteral('$1')
        ]
      );

      const prefixInstruction = t.variableDeclaration("var", [t.variableDeclarator(t.identifier("prefixInstruction"), replaceExpr)]);
      compiledCode.push(prefixInstruction);

      //获得执行语句的编译代码
      let programBodyCode = getCode((path.node as any).body[0].expression.body.body);
      const replacedCode = programBodyCode.replace(/variable_(\w+)/g, (_: any, name: string) => {
        return `\${variable_${name}.meta.result}`;
      });
      let prefixInstructionCode = getCode(compiledCode);
      resultCode = prefixInstructionCode + "\n`@{\n" + `\${prefixInstruction}\n` + `var ${resultName}=\${${reusltValueName}.meta.result};\n` + replacedCode + "}`";
    },
    IfStatement(path: any) {
      path.traverse({
        enter(innerPath: any) {
          const { node: innerNode } = innerPath as any;
          if (t.isIdentifier(innerNode) && allNames[innerNode.name]) {
            innerPath.skip();
            return;
          }

          if (innerNode.type === "CallExpression") {
            const varName = generateUniqueVariableName("variable_" + (innerNode.callee.name ?? "")); 
            const newNode = t.identifier(varName);
            allNames[varName] = innerNode;

            innerPath.replaceWith(newNode);
            return;
          }
          // 如果当前节点是标识符或字面量，则将其替换为函数调用表达式
          if (t.isIdentifier(innerNode) || t.isLiteral(innerNode)) {
            const varName = generateUniqueVariableName("variable_" + (innerNode.name??""));
            const newNode = t.identifier(varName);
            allNames[varName] = innerNode;

            innerPath.replaceWith(newNode);
          }
        },
      })
    },
  }, undefined, { isRoot: true });
  console.log("----resultCode",resultCode);
  return func(resultCode, `@${resultName}`);
}


function getCode(node: any) {
  const { t, babel } = (global as any).compile;
  const program = t.program(node);
  const outputAst = t.file(program);
  const output: any = babel.transformFromAstSync(outputAst, undefined, {});
  return output.code;
}
export function generateUniqueVariableName(prefix: string) {
  let name = '';
  const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const cacheNames = (global as any).cacheNames || {};
  do {
    // 生成一个由 6 个字符组成的随机字符串
    name = prefix;
    for (let i = 0; i < 6; i++) {
      name += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }
  } while (cacheNames[name] !== undefined);
  cacheNames[name] = true;
  (global as any).cacheNames = cacheNames;
  return name;
}
