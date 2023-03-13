import { proxyModel } from '../../template-helper/proxy';
import * as Types from "../types";
import { RootModel, PersonModel } from '../types';
import styles from "./styles.module.css";
import { TSchema } from '@sinclair/typebox';

function Home({ Model }: { Model: TSchema }) {
  const { data } = proxyModel<RootModel>(Model, Types);
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
        data.children.map((item: PersonModel, index: number) => {
          return compilePrint(() => {
            const type = item.age > 6 ? 1 : 2;;
            const typeStr = type == 1 ? "幼儿园" : "没上学";;
            const attachInfo = index < 1 ? "这个孩子失踪了" : "";
            return <h2 className={styles.title} key={item.name}>{item.name} {typeStr} {attachInfo}</h2>;
          })
        })
      }

    </div>
  );
}
export default Home;

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