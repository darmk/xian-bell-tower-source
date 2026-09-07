# 西安钟楼 · 建筑研究模型

本模型由云端 Three.js 参数化生成，经 glTF-Transform 导出；未使用 Blender。

## 本地启动

在项目目录运行 `npm ci`（首次安装依赖），再运行 `npm run dev`。
浏览器打开 http://localhost:3000/xianBellTower 。Windows PowerShell 和 CMD 均可使用。
运行 `npm run build` 会生成可供 Nginx 托管的 `dist/index.html` 和全部静态资源。将 `dist` 内的内容上传到 `/home/project/www/xianBellTower/`；`npm start` 可在本地预览 `http://localhost:3000/xianBellTower/`。详细说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

发布前运行 `npm run check` 检查 TypeScript，再运行 `npm run build`。

## 项目结构

```text
src/             页面、样式和 Three.js 查看器
public/          GLB、视角图、页面图片和图标
scripts/model/   模型、纹理和视角图生成脚本
dist/            静态构建产物（由 npm run build 生成）
index.html       Vite 页面入口
vite.config.ts   开发、打包及 /xianBellTower/ 部署前缀
```

## 文件与单位

- `xian-bell-tower.glb`：完整建筑、8 套内嵌 PBR 材质、24 张内嵌 PNG 贴图。
- 1 单位 = 1 米；Y 向上，X 向东，-Z 向北；基座地面中心为原点。
- 基座主体 35.5 × 35.5 × 8.6 m，宝顶最高点 Y=36 m。外梯、压顶与栏杆的外伸不计入基座边长。
- 内金柱 4 根、外金柱 12 根、外围主要檐柱 20 根、后补方柱 8 根；上层另有支撑柱。
- 两层楼阁、三重檐，四角攒尖顶；四向券洞形成真实连通的十字通道。

## 材质与兼容性

青砖、石材、朱红木构、深色木材、绿琉璃瓦、贴金、梁枋彩绘、天花彩绘共 8 套材质。
每套均嵌入 BaseColor、Normal 与 ORM（R=AO、G=Roughness、B=Metallic），一般纹理 2048²，彩绘颜色图 4096²。

GLB 使用标准扩展 `EXT_meshopt_compression` 与 `KHR_mesh_quantization`。Three.js 导入时为 GLTFLoader 配置 MeshoptDecoder；网页已内置。模型采用 16 位位置量化，几何量化精度约为毫米级，这不代表历史测绘精度。

## 复原范围

依据此前确认的《西安钟楼_资料考证与完整3D建模方案_V1》制作。整体尺度与主要柱规格依据公开报道和研究资料；柱网由研究图示推导。

下列局部属于推定或简化：外梯及室内转折楼梯的完整详图、后补方柱位置、斗拱的逐项踩数与榫卯、曲面屋顶剖面、脊兽逐处排列、门扇故事浮雕及梁枋彩绘纹样。雕饰为原创概括纹样，没有把缺失故事名称伪写为考证结果。未建隐蔽榫卯或屋面全部传统材料薄层。模型用于建筑展示与研究示意，不应当作修缮施工测绘图。

## 检查与网页

- Khronos glTF Validator：零错误、零警告，详见 validation.json。
- 导出后独立解码检查：有限坐标、非退化三角形、主要尺寸与柱数；模型各部分按组保留。
- 已根据交付 GLB 生成并检查外部、大厅、梁架、楼梯、券洞、斗拱、宝顶等视角。
- 云端 QA 浏览器的 WebGL 被禁用，无法在该浏览器实测实时 3D 光照、拖动和分层；网页已检查相机按钮对应的渲染图切换。
- 支持 WebGL 2 的浏览器加载同一份 GLB，可旋转、缩放、切换相机、隐藏屋顶与门窗、分层展开、显示尺寸和切换夜间灯光。
- 不支持 WebGL 的浏览器自动显示上述模型渲染图，并保留视角切换和 GLB 下载；此模式不伪称实时 3D。

## 主要资料

- [新华网：八百秦川 双楼竞秀](https://www.xinhuanet.com/politics/2017-01/01/c_129428062.htm)
- [新华网：打卡古都西安的文化地标——钟楼](https://www.news.cn/culture/20230509/f0bbc231386e457281c8027fc901a9d2/c.html)
- [华商网采访：钟楼修缮后正式开放](https://news.qq.com/rain/a/20200827A007U900)
- [黄思达、喻梦哲：西安钟楼尺度规律探讨，公开转载](https://www.sohu.com/a/694993454_121124384)
- [CGTN：600-year-old bell tower reopens](https://news.cgtn.com/news/2020-08-28/600-year-old-bell-tower-reopens-in-northwest-China-s-Xi-an--TjHW5TVC1y/index.html)
