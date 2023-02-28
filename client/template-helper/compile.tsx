const compileTemplte = require("./config");

/**
* 目的是让预渲染运行时能够正确将指定的js代码转义成c#代码
* @param func 需要转义js代码
* @returns 
*/
export function compile(func: any) {
  //当dev或者产物在浏览器中跑的时候直接用原始的js代码执行
  if (typeof window !== "undefined" || process.env.NODE_ENV == "development") {
    if (typeof func == "function") {
      return func();
    }
    return func;
  }
  //如果遇到非function的对象不做处理
  if (typeof func != "function") {
    if (typeof func == "object") return func?.meta?.result || func;
    return func;
  }

  //将预处理过的运行时代码转换成普通箭头函数，方便ast分析，核心是分析函数的body代码块
  let code = func.toString();
  code = code.replace(compileTemplte.replace("compile(", ""), "()=>{");
  //因为jsx展开成c#代码时，c#变量是全局作用域，所以这里需要防止变量名生成唯一
  const allNames: any = (global as any).cacheNames || {};
  const resultName = generateUniqueVariableName("result");
  let reusltValueName = "";
  let resultCode = ""

  debugger;
  const { t, babel, traverse } = (global as any).compile;
  const ast = babel.parse(code);
  traverse(ast, {
    exit(path: any) {
      const isRoot = path.node.type === 'Program' && !path.parentPath;
      if (!isRoot) {
        //当退出
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
        const callee = t.memberExpression(t.memberExpression(t.identifier("global"), t.identifier("compile")), t.identifier("normalValue"));
        const callExpr = t.callExpression(callee, args);
        const varName = t.identifier(key);
        const varDecl = t.variableDeclaration("var", [t.variableDeclarator(varName, callExpr)]);
        return varDecl;
      });
      //获取所有生成c#变量的所依赖的c#代码
      const prefixInstructionNode = t.stringLiteral("");
      const prefixInstructionExpr = Object.keys(allNames).reduce((acc: any, key) => {
        const instruction = t.memberExpression(t.memberExpression(t.identifier(key), t.identifier("meta")), t.identifier("instruction"));
        return t.binaryExpression("+", acc, instruction);
      }, prefixInstructionNode);
      //去掉之前c#代码块中的@{}，最外层只需要一个@{}就行了
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
      //因为这个代码最终要交给运行时处理，所以prefixInstructionCode用来捕获运行时变量，最后目的是拿到c#代码字符串
      resultCode = prefixInstructionCode + "\n`@{\n" + `\${prefixInstruction}\n` + `var ${resultName}=\${${reusltValueName}.meta.result};\n` + replacedCode + "}`";
    },
    enter(innerPath: any) {
      const { node: innerNode } = innerPath as any;
      //如果遇到已经处理过的变量名就直接跳过
      if (t.isIdentifier(innerNode) && allNames[innerNode.name]) {
        innerPath.skip();
        return;
      }
      //如果是exit中return替换之后的赋值语句就直接跳过
      if (t.isAssignmentExpression(innerNode) && innerNode.left.name == resultName) {
        innerPath.skip();
        return;
      }
      if (t.isMemberExpression(innerNode)) {
        const varName = generateUniqueVariableName("variable_");
        const newNode = t.identifier(varName);
        allNames[varName] = innerNode;
        innerPath.replaceWith(newNode);
        return;
      }
      if (t.isCallExpression(innerNode)) {
        const varName = generateUniqueVariableName("variable_" + (innerNode.callee.name ?? ""));
        const newNode = t.identifier(varName);
        allNames[varName] = innerNode;
        innerPath.replaceWith(newNode);
        return;
      }
      // 如果当前节点是标识符或字面量，则将其替换为函数调用表达式
      if (t.isIdentifier(innerNode) || t.isLiteral(innerNode)) {
        const varName = generateUniqueVariableName("variable_" + (innerNode.name ?? ""));
        const newNode = t.identifier(varName);
        allNames[varName] = innerNode;
        innerPath.replaceWith(newNode);
      }
    },
  }, undefined, { isRoot: true });
  (global as any).cacheNames = allNames;

  console.log("resultCode", resultCode);
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
