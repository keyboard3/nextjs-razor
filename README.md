# nextjs-razor
将 nextjs 的服务端渲染过程转译成 .net 的 razor 视图引擎的视图

## clinet
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
          return compilePrint(() => {
            const type = personModel.age > 6 ? 1 : 2;;
            const typeStr = type == 1 ? "幼儿园" : "没上学";;
            const attachInfo = index < 1 ? "这个孩子失踪了" : "";
            return <h2 className={styles.title} key={personModel.name}>{personModel.name} {typeStr} {attachInfo}</h2>;
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