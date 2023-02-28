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