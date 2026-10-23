// 只发布站点需要的文件，测试、源码仓库元数据和本地文件不进入发布包。
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'css', 'js', 'CNAME']) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
// 内容改变时资源地址也改变，避免新版 HTML 搭配浏览器缓存的旧 CSS/JS。
let html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
const assets = ['css/style.css', ...fs.readdirSync(path.join(output, 'js')).filter(name => name.endsWith('.js')).map(name => `js/${name}`)];
for (const asset of assets) {
  const source = path.join(output, asset);
  const hash = createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0, 12);
  const versioned = asset.replace(/(\.[^.]+)$/, `.${hash}$1`);
  fs.renameSync(source, path.join(output, versioned));
  html = html.replaceAll(`"${asset}"`, `"${versioned}"`);
}
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('静态站点已构建到 dist/');
