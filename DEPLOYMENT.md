# 西安钟楼部署说明

默认构建为纯静态网站，部署前缀固定为 `/xianBellTower/`。服务器只需要 Nginx，无需运行 Node.js。页面复用现有 React / Three.js 查看器，保留模型、视角、构件控制和灯光功能。

## 本地开发

构建电脑需要 Node.js 22.13 或更新版本和 npm。

```bash
npm ci
npm run dev
```

现有开发服务入口为 `http://localhost:3000/xianBellTower`，保留热更新。

## 静态打包

```bash
npm run build
```

该命令使用 `vite.config.ts`，生成 `dist/index.html`，并将 `public/` 中的模型、图片和图标复制到 `dist/`。每次构建会清理旧的 `dist` 产物。

```text
dist/
├── index.html
├── assets/
├── model/
├── images/
└── favicon.svg
```

以前生成的 `dist/client` 和 `dist/server` 属于旧的服务端构建，不能直接上传作为静态站点。请使用当前代码重新运行打包命令。

## 本地检查构建结果

先停止占用 3000 端口的开发服务，然后执行：

```bash
npm start
```

打开 `http://localhost:3000/xianBellTower/`。也可以用 `npm start -- --port 3001` 指定其他端口。

此命令只用于预览 `dist`。正式部署由 Nginx 提供文件；不要双击 `index.html` 通过 `file://` 打开模型页面。

## 上传到服务器

将 **dist 内的全部内容** 上传到 `/home/project/www/xianBellTower/`，使入口文件位于：

```text
/home/project/www/xianBellTower/index.html
```

不要多嵌套一层 `dist`。更新时同时上传 HTML、脚本、样式、模型和图片。

在现有 `server` 块中替换钟楼对应的规则，保留博客和其他项目的规则：

```nginx
location = /xianBellTower {
    return 301 /xianBellTower/$is_args$args;
}

location ^~ /xianBellTower/ {
    root /home/project/www;
    index index.html;
    try_files $uri $uri/ /xianBellTower/index.html;
}
```

Nginx 的 `http` 配置应包含标准 `mime.types`，让 JS 和 CSS 使用正确的 Content-Type。修改配置后执行：

```bash
nginx -t && nginx -s reload
```

正式访问地址：`https://darmk.com.cn/xianBellTower/`。

## 资源路径

- HTML：`/xianBellTower/`
- 脚本和样式：`/xianBellTower/assets/`
- GLB：`/xianBellTower/model/xian-bell-tower.glb`
- 视角缩略图：`/xianBellTower/model/views/`
- 页面图片：`/xianBellTower/images/`

网页源码统一放在 `src/`：`main.tsx` 是入口，`App.tsx` 是界面，`viewer.ts` 负责三维场景，`public-asset.ts` 处理部署前缀。以后修改部署目录，需要修改 `vite.config.ts` 中的 `base` 并重新构建，不能只改服务器文件夹名。

## 验证与排错

发布前运行 `npm run check` 和 `npm run build`，然后通过 `npm start` 检查实际构建产物。

- 404：检查入口是否在目标目录内，是否误传成 `xianBellTower/dist/index.html`。
- 脚本 MIME 错误或模型解析错误：检查资源响应是否实际返回 HTML，确认所有产物已上传且请求带 `/xianBellTower/` 前缀。
- 仍显示旧页面：确认上传的是本次 `dist` 内容，并强制刷新浏览器。
- 无实时 3D：浏览器需要支持 WebGL 2，并启用显卡加速；模型文件约 14 MB，首次加载需要等待。

模型资源在 GLB 中包含几何和贴图，原有城墙、台基、材质与建模范围没有因静态部署改变。建筑模型为研究示意，不能作为施工测绘图。
