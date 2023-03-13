import React from 'react'
import { compile, compilePrint } from "../../template-helper/compile";
import { proxyModel } from '../../template-helper/proxy';
import { Static, Type } from '@sinclair/typebox'
import styles from "./styles.module.css";

function Home({ Model }: any) {
  const { data } = proxyModel<RootModel>(Model, modelGroups);
  const type = compile(() => {
    return data.basic.age > 35 ? 1 : 2;
  });
  const typeStr = compile(() => {
    return type == 1 ? "中老年" : "青年";
  })
  return (
    <div >
      <h1>{data.basic.name}</h1>
      {compilePrint(() => {
        switch (type) {
          case 1: return <h1>{typeStr} 当前年龄:{data.basic.age}</h1>;
          default: return <h1>{typeStr} 当前年龄:{data.basic.age}</h1>;
        }
      })}
      {
        data.children.map((personModel: PersonModel, index: number) => {
          const type = compile(() => {
            return personModel.age > 6 ? 1 : 2;
          });
          const typeStr = compile(() => {
            return type == 1 ? "幼儿园" : "没上学";
          })
          const attachInfo = compile(() => {
            return index < 1 ? "这个孩子失踪了" : ""
          })
          return compilePrint(() => {
            return <h2 className={styles.title} key={personModel.name}>{personModel.name} {typeStr} {attachInfo}</h2>;
          })
        })
      }

    </div>
  );
}
export default Home;


const personModel = Type.Object({
  result: "@item" as any,
  name: Type.String(),
  age: Type.Number()
});
type PersonModel = Static<typeof personModel>;

const rootModel = Type.Object({
  result: "@Model" as any,
  data: Type.Object({
    basic: { ...personModel },
    children: Type.Array({ ...personModel })
  }),
  context: Type.Object({
    query: Type.Object({
      postId: Type.Number()
    })
  })
});
type RootModel = Static<typeof rootModel>;
const modelGroups = { personModel, rootModel };
export async function getStaticProps(context: any) {
  if (process.env.NODE_ENV == "development") {
    let data = null;
    try {
      const res = await fetch(`http://localhost:5002/api/post/${context.params.postId}`)
      data = await res.json();
    } catch (e) {
      data = {
        context: {
          query: context.params
        },
        data: {
          basic: {
            name: "张三",
            age: 48
          },
          children: [
            {
              name: "女儿1",
              age: 7,
            },
            {
              name: "女儿2",
              age: 4,
            }
          ]
        }
      }
    }
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