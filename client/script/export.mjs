import fse from "fs-extra"
import fs from "fs"
import path from "path"

await fse.removeSync("../../server/wwwroot/");
await fse.removeSync("../../server/Views/");

await fse.copySync("../out", "../../server/wwwroot/", {
    filter: (src, dest) => {
        if (src == "../out") return true;
        return src.indexOf("_next") >= 0 || /.svg|.ico/.test(src) >= 0;
    }
})

await fse.copySync("../out", "../../server/Views/", {
    filter: (src, dest) => {
        if (src == "../out") return true;
        return !(src.indexOf("_next") >= 0 || /.svg|.ico/.test(src));
    }
})

async function changeNameAllFiles(dirPath) {
    console.log("dirPath", dirPath)
    const files = fs.readdirSync(dirPath);

    for (let file of files) {
        const filename = path.join(dirPath, "/", file);
        if (fs.statSync(filename).isDirectory()) {
            changeNameAllFiles(filename);
        } else {
            const oldFile = filename;
            const newFile = oldFile.replace(".html", ".cshtml");
            console.log("newFile", newFile, oldFile)
            if (oldFile == newFile) return;
            await fse.moveSync(oldFile, newFile, { overwrite: true })
            let content = fs.readFileSync(newFile).toString()
            content = content.replace(/<!-- -->/g,"");
            content = content.replace(/<div><!--/g, "").replace(/--><\/div>/g, "");
            content = content.replace(/<!--/g, "").replace(/-->/g, "");
            content = content.replace(/\/\*#__PURE__\*\//g, "");
            content = content.replace(/undefined/g, "");
            content = content.replace(/>;/g,">");
            content = handleSameVar(content);
            content = content.replace(/@media/g, `@("@")media`);
            content = content.replace(`"pageProps":{"Model":{}}`, `"pageProps":{"Model":@Html.Raw(Json.Serialize(@Model))}`);
            content = content.replace(/\n\n/g, "\n");
            if (content.indexOf(`"pageProps":{}`) < 0)
                content = content.replace(/"query":.+,"buildId"/, `"query":@Html.Raw(Json.Serialize(@Model.context.query)),"buildId"`)
            fs.writeFileSync(newFile, `@model dynamic
@{
    int index=0;
}            
${content}
            `);
        }
    }
}

await changeNameAllFiles('../../server/Views/');

function handleSameVar(str) {
    const regex = /(var\s+)(\w+)(\s*=)/g;
    const variables = {};
    const handledStr = str.replace(regex, (match, p1, p2, p3, offset) => {
        if (variables[p2] !== undefined) {
            return `${p2}${p3}`;
        }
        variables[p2] = offset;
        return match;
    });
    return handledStr;
}
