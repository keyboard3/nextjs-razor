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
  const { data } = proxyModel(Model, modelGroups);

  const type = compile(() => {
    if (data.basic.age > 30) return 1;
    else return 2;
  });
  return (
    <div>
      <h1>{data.basic.name}</h1>
      {compile(() => {
        switch (type) {
          case 1: return <h1>中老年 当前年龄:{data.basic.age}</h1>;
          default: return <h1>青年 当前年龄:{data.basic.age}</h1>;
        }
      })}
    </div>
  );
}
```
razor View
```c#
<div id="__next">
    <div>
      <h1>@Model.data.basic.name</h1>@{
        var result_ukn3wm = 2;
        if (@Model.data.basic.age > 30) result_ukn3wm = 1; else result_ukn3wm = 2;

        var result_83e2c0 = @Html.Raw(@"<h1>青年 当前年龄:@Model.data.basic.age</h1>");
        switch (@result_ukn3wm)
        {
          case 1:
            result_83e2c0 = @Html.Raw(@"<h1>中老年 当前年龄:@Model.data.basic.age</h1>");
            break;
          default:
            result_83e2c0 = @Html.Raw(@"<h1>青年 当前年龄:@Model.data.basic.age</h1>");
            break;
        }
      }@result_83e2c0
    </div>
  </div>
```