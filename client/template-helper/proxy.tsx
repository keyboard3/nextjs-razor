import ReactDOMServer from "react-dom/server";


export function compilePrintValue(instruction: string, result: string) {
  const value = normalValue({
    instruction,
    result
  })
  value.props.dangerouslySetInnerHTML.__html = `<!--${value.meta.instruction}${value.meta.result}-->`;
  return value;
}
export function compileValue(instruction: string, result: string) {
  return normalValue({
    instruction,
    result
  })
}

//将c#的模板数据对象转换成归一化对象
export function normalValue(data: any): any {
  if (typeof window != "undefined" || process.env.NODE_ENV == "development") {
    return data;
  }
  // console.log("normalValue", data);
  const modelGroups: any = (normalValue as any).modelGroups;
  const htmlProperty = { __html: "" }
  let vDOM: any = <div dangerouslySetInnerHTML={htmlProperty} />
  let meta: any = {
    value: data,
    instruction: "",
    result: data
  }

  if (typeof data == "object") {
    if (data.meta && data["$$typeof"]) return data;

    meta = {
      value: data.value || data,
      instruction: data.instruction || "",
      result: data.result || data,
    }
    const value = meta.value;
    if (value["$$typeof"]) {
      //找到所有变量，然后读取他们的指令
      meta.result = `@Html.Raw($@"${ReactDOMServer.renderToString(value).replace(/@([\w.]+)/g, "{$1}")}")`;
    } else {
      vDOM = new Proxy(vDOM, {
        get(target: any, prop: any, receiver: any): any {
          // console.log(`prop:${prop},value:`, value)
          if (prop == "map") {
            return function (itemCall: (item: any, index: number) => any) {

              const itemCallCode = itemCall.toString();
              const itemArray = /\((.+?)\b/.exec(itemCallCode)
              const modelName = itemArray?.[1] || "item";
              const itemModel = modelGroups[modelName];

              const arrayItem = normalValue(itemModel);
              let itemResult = itemCall(arrayItem, 0); //普通js函数调用，可能是 普通js变量,归一化对象，虚拟dom
              itemResult = normalValue(itemResult);
              const renderModel = {
                result: `${meta.instruction}${itemResult.meta.instruction || ""}
                @foreach(var item in ${meta.result}) {
                  ${itemResult.meta.result}
                }`
              }
              return normalValue(renderModel);
            }
          }
          // 从vDom中直接访问instruction属性，根据引用次数，只有第一次返回指令，后面返回空字符串
          if (prop == "instruction") {
            meta.returnInstructionCount = meta.returnInstructionCount || 0 + 1;
            if (meta.returnInstructionCount > 1) {
              return "";
            }
            return meta.instruction;
          }
          if (value[prop]) {
            return normalValue({
              value: value[prop],
              result: meta?.result + `.${prop}`
            });
          }
          // console.log("vDOM." + prop, target[prop])
          return target[prop];
        }
      })
    }
  } else if (typeof meta.result == "string") {
    meta.result = `"${meta.result}"`;
  }
  htmlProperty.__html = `<!--${meta.result}-->`;
  vDOM.meta = meta;
  return vDOM;
}

export function proxyModel(data: any, modelGroups: any): any {
  if (typeof window != "undefined" || process.env.NODE_ENV == "development") {
    return data;
  }
  (normalValue as any).modelGroups = modelGroups;
  return normalValue(modelGroups.rootModel);
}
