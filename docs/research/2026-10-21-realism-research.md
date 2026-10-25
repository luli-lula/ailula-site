# 真实感调研结论（2026-10-21）

## 一句话结论

**在浏览器里实时渲染出一棵"照片级真实、能从树根一路爬到树冠"的巨杉，以现有素材和合理成本做不到。** 这不是调参数能解决的，而是素材问题：网上找不到一棵完整巨杉的可商用照片级 3D 数据。

所以建议换方向：**用你自己在 Mariposa Grove 拍的真实照片做"摄影编辑风"的网站**，今天的试验已经证明这条路好看。"往上爬"如果还想要，可以作为一段真实视频的点睛时刻，不再用 3D 去硬做。

## 四条路的调研结果

| 路线 | 能不能做到真实 | 成本和工作量 | 结论 |
|---|---|---|---|
| 程序化 3D（我们试过的两版） | 不能。树形、树冠都假，越往上越假 | 已投入很多，继续调收益很低 | 放弃 |
| 3D 扫描模型（Sketchfab、Fab、SpeedTree） | 只有**树干底部**有免费的照片级扫描（CC-BY 署名许可），整棵树没有。整树模型都是付费的"建模"树，不是扫描。另外，网页上的模型文件别人可以下载走，很多付费许可不允许这样用 | 高：需要拼接底部扫描、程序化上半段和雾 | 只能做到"底部真实"，不值得 |
| 高斯泼溅（Gaussian Splatting，用照片重建的 3D） | 网上**没有任何**公开的红杉或巨杉泼溅数据。用 iPhone 自己拍，只能拍好底部 5–10 米，再往上会糊成一片。拍整棵树需要无人机，而美国国家公园禁止飞无人机 | 很高，而且风险大 | 不可行 |
| 真实视频（滚动控制播放进度，苹果官网常用的做法） | **唯一能做到"真的在爬树"的方法**：用一段真实的无人机沿树干上升的镜头，拆成图片序列，滚动时逐帧播放 | 免费素材里没有真正的"沿树干上升"镜头。付费：Storyblocks 订阅一个月约 $21–30，或 Getty 单条约 $500–650。AI 生成（Veo、Kling）每段约 $10–40，但树皮会"游动"，树冠会糊 | 可以作为一段点睛镜头，需要你决定是否花钱 |

## 今天的验证：用你自己的照片

`/lab/editorial/`（截图在 `docs/progress/editorial-*.png`）：
- 首屏：Grizzly Giant 大图，叠了一层轻微的深度视差（鼠标移动或滚动时，近处和远处的东西错开）
- 大号宋体标题「耐心地，长成一棵大树。」
- 胶片颗粒、统一的暖色调
- 往下滚时，章节照片用遮罩慢慢展开

手机竖屏的效果尤其好。这是到目前为止**唯一一个看起来不廉价、也不假的版本**，因为照片是真的，而且是你亲自去过、亲手拍的。这一点本身就在讲你的故事。

## 推荐方向

**主线：摄影编辑风 + 年轮作为贯穿全站的视觉元素**
- 每个章节一张你拍的大图，统一调色，加胶片颗粒，滚动时慢慢放大或展开
- 小号等宽字体写成"野外笔记"式的图注，比如树种、林区、日期
- 首屏照片加深度视差，让它"活"一点，但不再追求 3D
- 年轮继续做时间线导航（之前已经做好了）
- 原来设计里的林下花园（写作页）和树洞（电影页），改用你拍的植物照片和插画元素来实现，不再用程序化渲染

**可选的点睛：一段真实的"往上爬"**
- 首屏滚动时，播放一段真实的沿树干上升镜头（大约 6–8 秒，做成图片序列，手机上也流畅）
- 需要你决定：花大约 $25 订一个月 Storyblocks 来挑素材，或者先不加

## 需要你提供或决定的

1. **原图**：聊天里收到的照片只有 768×1024，桌面大屏上会糊。请把原始照片（iPhone 原图）放到 `assets-src/photos/lula/`。Mariposa 和你平时种植物的照片越多越好。
2. **是否付费买一段爬树视频**（见上）。
3. **一个植物学上的小细节**：你拍的是**巨杉**（giant sequoia，*Sequoiadendron giganteum*），不是海岸红杉（coast redwood）。两者都可以叫 redwood，slogan 不用改。但原设计里林下的剑蕨和红杉酢浆草，属于海岸红杉林。如果主视觉换成 Mariposa 的巨杉，林下植物也要换成对应的物种，图注里也要写对。作为 Master Gardener，这种细节值得做对。

## 参考来源

- 扫描模型：Sketchfab「Giant Sequoia Tree Trunk」（DeepSeaBEE，CC-BY，仅树干底部）https://sketchfab.com/3d-models/307f04bb7f124ab7b07e1611db4554fc ；LiDAR 整树点云（kungphil，CC-BY，无贴图）https://sketchfab.com/3d-models/5c249b3973734f21a0a3e0bab97c182c
- 泼溅渲染器：Spark（World Labs）https://github.com/sparkjsdev/spark ；无人机覆盖不足时泼溅质量下降 https://arxiv.org/pdf/2601.12823
- 视频：Getty「Rise up tree, Redwood Forest」https://www.gettyimages.ae/detail/video/652643726 ；Pexels 免费的仰拍镜头 https://www.pexels.com/video/stunning-upward-view-of-tall-redwood-trees-35818789/
- 风格参考：
  - Lusion「Of the Oak」https://oftheoak.co.uk
  - Codrops 假 3D 图片效果 https://tympanus.net/codrops/2019/02/20/how-to-create-a-fake-3d-image-effect-with-webgl/
  - NYT「Snow Fall」https://www.nytimes.com/projects/2012/snow-fall
