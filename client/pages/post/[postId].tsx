import React from 'react'
import { compile as compileFun, compileTemplte } from "../../template-helper/compile";
import { compileValue as compileValueFun, normalValue as normalValueFun, proxyModel } from '../../template-helper/proxy';
const compile = compileFun;
const compileValue = compileValueFun;
const normalValue = normalValueFun;
function Home({ Model }: any) {
  const { data } = proxyModel(Model, modelGroups);
  console.log(compileValue);
  console.log(normalValue)
  return (
    <div>
      {compile(() => {
        if (data.basic.age > 30) return 5;
        return 2;
      })}
    </div>
  );
}
export default rootCompile(Home);

export function rootCompile(func: any) {
  if (typeof window !== "undefined" || process.env.NODE_ENV == "development") {
    return func;
  }
  let code = func.toString();

  code = code.replace(/compile\(\(\)=>{/g, compileTemplte);
  code += `${func.name}`;
  console.log(code);
  return (...params: any) => {
    const funcRes = eval(code);
    return funcRes(...params);
  };
}


const personModel = {
  result: "@item",
  name: 'string',
  age: 1
}
const rootModel = {
  result: "@Model",
  data: {
    basic: { ...personModel },
    children: []
  },
  context: {
    query: {
      postId: 1
    }
  }
}
const modelGroups = { personModel, rootModel };
/* unused harmony export myUnusedFunction */
export async function getStaticProps(context: any) {
  if (process.env.NODE_ENV == "development") {
    const res = await fetch(`http://localhost:5002/api/post/${context.params.postId}`)
    const data = await res.json();
    return {
      props: {
        Model: data
      }
    }
  }
  return {
    props: {
      Model: {}
    }, // will be passed to the page component as props
  }
}

export async function getStaticPaths() {
  if (process.env.NODE_ENV == "development")
    return {
      paths: [], //indicates that no page needs be created at build time
      fallback: "blocking" //indicates the type of fallback
    }

  return {
    paths: [{ params: { postId: '{postId}' } }],
    fallback: false
  }
}