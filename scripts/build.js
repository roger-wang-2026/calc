// 只发布站点需要的文件，测试、源码仓库元数据和本地文件不进入发布包。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'css', 'js', 'CNAME']) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('静态站点已构建到 dist/');
