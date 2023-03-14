# NextJs-Razor
将 NextJs 的服务端渲染过程转译成 .Net 的 Razor 视图引擎的视图

---
将传统服务端渲染过程拆成2部分，静态部分交给 Next.js 这种前端工程化开发方案，服务端数据影响的动态部分交给 Razor 视图渲染引擎

实现一套转译工具将 Next.js 页面预渲染成 Razor 的视图，同时后端做接口分离。做到了开发时前后端分离，部署时前后端合并。

## 优势
- Razor 视图提前编译成二进制之后的渲染速度，要远快于 Node.js上 从头渲染页面的速度。所以这套方案可能是同步渲染的 SSR 框架中 FCP 最快之一
- 最大程度的提高了开发效率，同时也兼顾了现有的开发运维基础设施，未来即使部署分离，业务代码层几乎不需要改动。
## 劣势
- 部署不分离导致写法上还是要按照一定的前后端约定来写，没有纯前后端分离来的爽
- 水合失败，因为服务端不是 Next.js 渲染的。水合失败会导致客户端会 TTI 会比水合成功的情况下要慢

## client
- dev 开发

    需要 .net 项目提供聚合 api 服务，所以需要 server 项目启动起来

    ```npm run dev```

- 生成产物交给 .net server 项目

    ```npm run build-export```

## server
- debug项目

    cd server 然后用 vscode 打开，利用 vscode 的调试程序来 debug

- 构建并运行dotnet项目
    ```
    dotnet build
    dotnet run
    ```

## 转译示例
Next.js 页面
```jsx
function Home({ Model }: { Model: TSchema }) {
  const { data } = proxyModel<RootModel>(Model, Types);
  const type = compile(() => {
    return data.basic.age > 35 ? 1 : 2;
  });
  const typeStr = compile(() => {
    return type == 1 ? "中老年" : "青年";
  })
  return (
    <div>
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
```
razor View
```c#
<div id="__next">
    <div>
      <h1>@Model.data.basic.name</h1>@{
        var result_r5ykhn = Model.data.basic.age > 35 ? 1 : 2;
        result_r5ykhn = Model.data.basic.age > 35 ? 1 : 2;
        var result_fyxjlw = result_r5ykhn == 1 ? "中老年" : "青年";
        switch (@result_r5ykhn)
        {
          case 1:
            <h1>@result_fyxjlw 当前年龄: @Model.data.basic.age</h1>
            break;
          default:
            <h1>@result_fyxjlw 当前年龄: @Model.data.basic.age</h1>
            break;
        }
      }
      @{
        index = 0;
        foreach (var item in @Model.data.children)
        {
          {
            var type = item.age > 6 ? 1 : 2;
            var typeStr = type == 1 ? "幼儿园" : "没上学";
            var attachInfo = index < 1 ? "这个孩子失踪了" : "";
            <h2 class="styles_title__nx61M">@item.name @typeStr @attachInfo</h2>
          }
          index++;
        }
      }
    </div>
  </div>
```

## 未来畅想
- 可以支持多种转义目标 ejs，jsp...