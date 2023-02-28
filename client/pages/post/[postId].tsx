import React from 'react'
import { compile, compilePrint } from "../../template-helper/compile";
import { proxyModel } from '../../template-helper/proxy';
function Home({ Model }: any) {
  const { data } = proxyModel(Model, modelGroups);

  const age = compile(() => {
    var res = data.basic.age + 1;
    return res;
  });
  return (
    <div>
      <h1>{data.basic.name}</h1>
      {compilePrint(() => {
        switch (1) {
          case 1: return <h1>中老年 当前年龄:{age}</h1>;
          default: return <h1>青年 当前年龄:{age}</h1>;
        }
      })}
    </div>
  );
}
export default Home;


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