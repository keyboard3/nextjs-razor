export function cleanCode(content) {
    content = content.replace(/<!-- -->/g, "");
    content = content.replace(/<div><!--/g, "").replace(/--><\/div>/g, "");
    content = content.replace(/<!--/g, "").replace(/-->/g, "");
    content = content.replace(/\/\*#__PURE__\*\//g, "");
    content = content.replace(/undefined/g, "");
    content = content.replace(/>;/g, ">");
    return content;
}