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
        data.children.map((personModel: any) => {
          const type = compile(() => {
            return personModel.age > 10 ? 1 : 2;
          });
          const typeStr = compile(() => {
            return type == 1 ? "幼儿园" : "没上学";
          })
          return compile(() => {
            return <h2>{personModel.name} {typeStr}</h2>;
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
<div><h1>@Model.data.basic.name</h1>
@{
var result_i3wm3t = @Model.data.basic.age > 35 ? 1 : 2;
result_i3wm3t = @Model.data.basic.age > 35 ? 1 : 2;
var result_212s0h = @result_i3wm3t == 1 ? "中老年" : "青年";
switch (@result_j0778w) {
  case 1:
    <h1>@result_o6mf7p 当前年龄:@Model.data.basic.age</h1>;
    break;
  default:
    <h1>@result_o6mf7p 当前年龄:@Model.data.basic.age</h1>;
    break;
}}

@{ var result_k3qurn = @Html.Raw(""); }
@foreach(var item in @Model.data.children) {
  {
  var result_m4ca3k = @item.age > 10 ? 1 : 2;
  var result_c4ufiw = @result_m4ca3k == 1 ? "幼儿园" : "没上学";

  result_k3qurn=@Html.Raw($@"<h2>{item.name} {result_c4ufiw}</h2>");
  result_k3qurn = @Html.Raw($@"<h2>{item.name} {result_c4ufiw}</h2>");
  }
  @Html.Raw($@"{result_k3qurn}");
}
</div></div>
```