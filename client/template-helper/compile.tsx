const { compileTemplate, compilePrintTemplate } = require("./config");

/**
* 目的是让预渲染运行时能够正确将指定的js代码转义成c#代码
* todo 先声明多个变量去重
* todo 去掉重复引用
* @param func 需要转义js代码
* @returns 
*/
export function compile(func: any, template: any = compileTemplate, templateFun: string = "compile") {
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
  code = code.replace(template.replace(`${templateFun}(`, ""), "()=>{");

  console.log("compile before code", code);
  //因为jsx展开成c#代码时，c#变量是全局作用域，所以这里需要防止变量名生成唯一。这里暂时先不看全局的唯一，只靠随机
  const resultName = generateUniqueVariableName("result_");
  let resultValueName = "";
  let resultCode = ""

  const { prefixInstructionCode, programBodyCode } = transferCompile(code,
    function enter(path: any, t: any) {
      const innerNode = path.node;
      //如果是exit中return替换之后的赋值语句就直接跳过
      if (t.isAssignmentExpression(innerNode) && innerNode.left.name == resultName) {
        path.skip();
        return true;
      }
      return false;
    },
    function exit(path: any, t: any) {
      if (t.isReturnStatement(path.node)) {
        if (t.isIdentifier(path.node.argument)) {
          resultValueName = path.node.argument.name;
        }

        const newNode = t.variableDeclaration("var", [t.variableDeclarator(t.identifier(resultName), path.node.argument)]);
        path.replaceWith(newNode);
      }
      return false;
    });

  resultCode = prefixInstructionCode;
  resultCode += "\n`@{\n" + `\${prefixInstruction}`;
  if (resultValueName) {
    resultCode += `var ${resultName}=\${${resultValueName}.meta.result};`;
  }
  resultCode += "\n" + programBodyCode + "\n}`\n";

  console.log("resultCode", resultCode);
  return func(resultCode, `@${resultName}`);
}

export function compilePrint(func: any, template: any = compilePrintTemplate, templateFun: string = "compilePrint") {
  //当dev或者产物在浏览器中跑的时候直接用原始的js代码执行
  if (typeof window !== "undefined" || process.env.NODE_ENV == "development") {
    if (typeof func == "function") {
      return func();
    }
    return func;
  }

  //将预处理过的运行时代码转换成普通箭头函数，方便ast分析，核心是分析函数的body代码块
  let code = func.toString();
  code = code.replace(template.replace(`${templateFun}(`, ""), "()=>{");

  const { prefixInstructionCode, programBodyCode } = transferCompile(code, undefined,
    function exit(path, t) {
      if (t.isReturnStatement(path.node)) {
        path.replaceWith(path.node.argument);
      }
      return false;
    });

  let resultCode = "";
  resultCode = prefixInstructionCode;
  resultCode += "\n`@{" + `\${prefixInstruction}`;
  resultCode += "\n" + programBodyCode + "\n}\n`";

  console.log("resultCode", resultCode);
  return func(resultCode, "");
}

function transferCompile(code: string, enterCallback?: (path: any, t: any) => boolean, exitCallback?: (path: any, t: any) => boolean) {
  const { t, babel, traverse } = global.compile;
  const ast = babel.parse(code);
  const newNamesNodeMap: any = {};
  const namesMap: any = {};
  const whiteListNames = { ...global.compile.whiteListNames };
  let programBodyCode = "", prefixInstructionCode = "";
  traverse(ast, {
    exit(path: any) {
      const isRoot = path.node.type === 'Program' && !path.parentPath;
      // console.log("exit path.node.type", path.node.type, path.node.name)
      if (!isRoot) {
        //当退出
        if (exitCallback?.(path, t)) return;
        //c#中每个switch case 一定要有break语句
        if (t.isSwitchCase(path.parent) && !t.isBreakStatement(path.parent.consequent[path.parent.consequent.length - 1])) {
          path.parent.consequent.push(t.breakStatement());
        }
        if (t.isCallExpression(path.node)) {
          replaceIdentifierNode(path, path.node.callee.name, true);
          return;
        }
        return;
      }
      //提前捕获到所有声明的变量
      const compiledCode = Object.keys(newNamesNodeMap).map((key) => {
        const value = newNamesNodeMap[key];
        const args = [value];
        const callee = t.memberExpression(t.memberExpression(t.identifier("global"), t.identifier("compile")), t.identifier("normalValue"));
        const callExpr = t.callExpression(callee, args);
        const varName = t.identifier(key);
        const varDecl = t.variableDeclaration("var", [t.variableDeclarator(varName, callExpr)]);
        return varDecl;
      });
      //获取所有生成c#变量的所依赖的c#代码
      const prefixInstructionNode = t.stringLiteral("");
      const prefixInstructionExpr = Object.keys(newNamesNodeMap).reduce((acc: any, key) => {
        let instruction: any = t.memberExpression(t.identifier(key), t.identifier("instruction"));
        return t.binaryExpression("+", acc, instruction);
      }, prefixInstructionNode);

      //去掉之前c#代码块中的@{}，最外层只需要一个@{}就行了
      let replaceExpr = t.callExpression(
        babel.types.memberExpression(
          prefixInstructionExpr,
          babel.types.identifier('replace')
        ),
        [
          babel.types.regExpLiteral('@{\\n?(.+?)\\n?}', 'sg'),
          babel.types.stringLiteral('$1')
        ]
      );
      //去掉变量字符串中@
      replaceExpr = t.callExpression(
        babel.types.memberExpression(
          replaceExpr,
          babel.types.identifier('replace')
        ),
        [
          babel.types.regExpLiteral('@', 'sg'),
          babel.types.stringLiteral('')
        ]
      )
      const prefixInstruction = t.variableDeclaration("var", [t.variableDeclarator(t.identifier("prefixInstruction"), replaceExpr)]);
      compiledCode.push(prefixInstruction);

      //获得执行语句的编译代码
      programBodyCode = getCode((path.node as any).body[0].expression.body.body);
      programBodyCode = programBodyCode.replace(/(?<!var\W+)variable_([\w.]+)/g, (_: any, name: string) => {
        if (name.includes(".")) return _;
        return `\${${_}.meta.result}`;
      });
      prefixInstructionCode = getCode(compiledCode);
      //获取原始对象
      prefixInstructionCode = prefixInstructionCode.replace(/(?<!var\W+)variable_([\w.]+)/g, (_: any, name: string) => {
        if (name.includes(".")) return _;
        return `${_}.meta.result`;
      });
      //当被用作vdom children是用归一化对象
      prefixInstructionCode = prefixInstructionCode.replace(/\/\*#__PURE__\*\/variable_([\w.]+)/g, (_: any, name: string) => {
        return _.replace(".meta.result", "");
      })
    },
    enter(innerPath: any) {
      // console.log("enter node.path.type", innerPath.node.type, "innerPath.key", innerPath.key)
      const { node: innerNode } = innerPath as any;
      if (enterCallback?.(innerPath, t)) return;
      //只处理调用表达式的参数部分，调用对象部分不管
      if (innerPath.key == "callee") {
        innerPath.skip();
        return;
      }
      if (t.isMemberExpression(innerNode)) {
        const memberFirstName = t.isIdentifier(innerNode.object) && innerNode.object.name || "";
        if (memberFirstName.startsWith("jsx_runtime")) {
          innerPath.skip();
          return;
        }
        replaceIdentifierNode(innerPath, generateUniqueVariableName(memberFirstName + "_"))
        return;
      }
      if (t.isCallExpression(innerPath.parent)
        && (
          innerPath.parent.callee.object?.name?.startsWith("jsx_runtime")
          || innerPath.parent.callee.expressions?.[1]?.object?.name?.startsWith("jsx_runtime")
        )
      ) {
        //判断是<div key的表达式就跳过>
        if (innerPath.key == 2) {
          innerPath.replaceWith(t.stringLiteral("key-value"));
        }
        if ([0, 2].includes(innerPath.key)) {
          innerPath.skip();
        }
        return;
      };
      // 如果当前节点是标识符或字面量，则将其替换为函数调用表达式
      if (t.isIdentifier(innerNode)) {
        //对象属性或者赋值语句的左值
        if (innerPath.key == "key") return;
        if (innerPath.key == "id") {
          whiteListNames[innerNode.name] = true;
          return;
        }
        replaceIdentifierNode(innerPath, innerNode.name);
      }
    },
  }, undefined, { isRoot: true });
  console.log("transferCompile", prefixInstructionCode, programBodyCode)
  return { programBodyCode, prefixInstructionCode }
  function replaceIdentifierNode(innerPath: any, oldName: string, force: boolean = false) {
    const { node: innerNode } = innerPath as any;
    if (newNamesNodeMap[innerNode.name] || whiteListNames[innerNode.name])
      return;

    let newName = ""
    if (!force && namesMap[oldName]) newName = namesMap[oldName];
    else {
      newName = generateUniqueVariableName("variable_" + (oldName ?? ""));
      namesMap[oldName] = newName;
    }
    const newNode = t.identifier(newName);
    newNamesNodeMap[newName] = innerNode;
    innerPath.replaceWith(newNode);
  }
}

function getCode(node: any) {
  const { t, babel } = global.compile;
  const program = t.program(node);
  const outputAst = t.file(program);
  const output: any = babel.transformFromAstSync(outputAst, undefined, {});
  return output.code;
}
export function generateUniqueVariableName(prefix: string) {
  let name = '';
  const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const cacheNames = global.compile.cacheNames || {};
  do {
    // 生成一个由 6 个字符组成的随机字符串
    name = prefix;
    for (let i = 0; i < 6; i++) {
      name += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }
  } while (cacheNames[name] !== undefined);
  cacheNames[name] = true;
  global.compile.cacheNames = cacheNames;
  return name;
}