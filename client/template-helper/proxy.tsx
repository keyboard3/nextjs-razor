import ReactDOMServer from "react-dom/server";

/**
 * @param data
 * @param severModel
 * @returns
 */

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
  console.log("normalValue", data);
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
      //todo 处理成htmlRaw()
      meta.result = `@Html.Raw("${ReactDOMServer.renderToString(value)}")`;
    } else {
      vDOM = new Proxy(vDOM, {
        get(target: any, prop: any, receiver: any): any {
          console.log(`prop:${prop},value:`, value)
          if (prop == "map") {
            return function (itemCall: (item: any, index: number) => any) {

              const itemCallCode = itemCall.toString();
              const itemArray = /\((.+?)\b/.exec(itemCallCode)
              const modelName = itemArray?.[1] || "item";
              const itemModel = modelGroups[modelName];

              const arrayItem = normalValue(itemModel);
              let itemResult = itemCall(arrayItem, 0); //普通js函数调用，可能是 普通js变量,归一化对象，虚拟dom
              itemResult = normalValue(itemResult);
              debugger;
              const renderModel = {
                result: `${meta.instruction}${itemResult.meta.instruction || ""}
                @foreach(var item in ${meta.result}) {
                  ${itemResult.meta.result}
                }`
              }
              return normalValue(renderModel);
            }
          }
          if (value[prop]) {
            return normalValue({
              value: value[prop],
              result: meta?.result + `.${prop}`
            });
          }
          console.log("vDOM." + prop, target[prop])
          return target[prop];
        }
      })
    }
  }
  htmlProperty.__html = `<!--${meta.instruction}\n${meta.result}-->`;
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
