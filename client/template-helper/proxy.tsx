import ReactDOMServer from "react-dom/server";
import { TSchema } from '@sinclair/typebox'
import { ReactElement } from "react";
import {cleanCode} from "./helper.mjs";

export function compilePrintValue(instruction: string) {
  return <div dangerouslySetInnerHTML={{ __html: `<!--${instruction}-->` }}></div>;
}
export function compileValue(instruction: string, result: string) {
  return normalValue({
    instruction,
    result
  })
}

export function normalValuePrint(data: any) {
  return normalValue(data, false);
}

type MetaType = { value?: any, result: string, instruction: string, returnInstructionCount?: number }
type NormalReactElement = ReactElement & { meta: MetaType }
type NormalValueFunc = {
  <T>(data: TSchema | NormalReactElement | MetaType, pureHtml?: boolean): T,
  modelGroups?: { [key: string]: TSchema }
}

function isNormalReactElement(data: any): data is NormalReactElement {
  return data.meta && data["$$typeof"];
}
function isReactElement(value: any): value is ReactElement {
  return !!value["$$typeof"];
}
function isProxyTObject(value: any): value is TSchema {
  return !!value.type;
}

//将c#的模板数据对象转换成归一化对象
export const normalValue: NormalValueFunc = (data: TSchema | NormalReactElement | MetaType, pureHtml: boolean = true) => {
  if (typeof window != "undefined" || process.env.NODE_ENV == "development") {
    return data;
  }

  const modelGroups = normalValue.modelGroups;
  const htmlProperty = { __html: "" }
  let vDOM: any = <div dangerouslySetInnerHTML={htmlProperty} />
  let meta: MetaType = { instruction: "", returnInstructionCount: 0, result: "" }

  //console.log("normalValue    data",data);
  if (typeof data == "object") {
    if (isNormalReactElement(data)) return data;
    if (isReactElement(data)) {
      const htmlStr = ReactDOMServer.renderToString(data)
      meta.result = htmlStr;
    } else {
      //代理对象和指令对象
      meta.value = data.value || data;
      meta.instruction = data.instruction || "";
      meta.result = data.result || "";

      const value = meta.value;
      if (!meta.result && isProxyTObject(value)) {
        meta.result = value.properties["result"];
      }
      //console.log("----Proxy meta", meta)
      vDOM = new Proxy(vDOM, {
        get(target: any, prop: any, receiver: any): any {
          //console.log("proxy get",prop,meta,"-----target",target);
          if (prop == "toString") return meta.result;
          if (prop == "valueOf") return () => meta.result;
          if (prop == "map") {
            return function (itemCall: (item: any, index: number) => any) {

              const itemCallCode = itemCall.toString();
              const itemArray = /\((.+?)\b/.exec(itemCallCode)
              const modelName = itemArray?.[1] || "item";
              let itemModel = modelGroups![modelName] as any;

              if (!itemModel && meta.value?.type == "array") itemModel = meta.value.items;
              itemModel.properties = itemModel.properties || {};
              itemModel.properties["result"] = "@item";

              const arrayItem = normalValue(itemModel);
              let itemResult: NormalReactElement = itemCall(arrayItem, 0); //普通js函数调用，可能是 普通js变量,归一化对象，虚拟dom
              const renderModel: MetaType = {
                instruction: "",
                result: `${meta.instruction}
@{ 
  index=0; 
  foreach(var item in ${meta.result}) {
    ${removeCsharpScope(ReactDOMServer.renderToString(itemResult))}
    index++;
  }
}`
              }
              return normalValue(renderModel);
            }
          }
          if (isProxyTObject(value)) {
            if (value.type == "array" && prop == "length") {
              return normalValue({
                instruction: "",
                value: value,
                result: meta.result + `.Count`
              });
            }
            if (value.type == "object" && value.properties[prop]) {
              return normalValue({
                instruction: "",
                value: value.properties[prop],
                result: meta.result + `.${prop}`
              });
            }
            if (!value.properties?.[prop]) return target[prop];
            return target;
          }
          // 从vDom中直接访问instruction属性，根据引用次数，只有第一次返回指令，后面返回空字符串
          if (prop == "instruction") {
            meta.returnInstructionCount = meta.returnInstructionCount || 0 + 1;
            if (meta.returnInstructionCount > 1) {
              return "";
            }
            return meta.instruction;
          }
          return target[prop];
        }
      })

    }
  } else {
    meta.value = data;
    meta.result = data;
  }
  htmlProperty.__html = `<!--${meta.instruction || ""}${meta.result}-->`;
  vDOM.meta = meta;
  return vDOM;
}

export function proxyModel<T>(data: TSchema, modelGroups: { [key: string]: TSchema }): T {
  if (typeof window != "undefined" || process.env.NODE_ENV == "development") {
    return data as T;
  }
  (normalValue as any).modelGroups = modelGroups;
  return normalValue<T>(modelGroups.rootModel);
}


function removeCsharpScope(content: string) {
  content = cleanCode(content);

  const regex = /([\s\S]+?)(<\w+.*?>.*?<\/\w+>)/g;
  content = content.replace(regex, (match, p1, p2) => p1.replace(/@/g, '') + p2);

  return content;
}