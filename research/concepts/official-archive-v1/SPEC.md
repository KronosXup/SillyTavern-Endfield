# 官号档案长图概念 v1

## 单一任务

把官号白底档案长图的视觉语法映射为 SillyTavern 活跃聊天界面，同时保留消息阅读、输入与发送的原有功能边界。

## 视觉基线

- `research/reference/official-longform/2025-01-18-valley4-region.jpg`
- `research/reference/official-longform/2025-01-22-dijiang-base.png`
- `research/reference/official-longform/2025-01-26-jinlong-region.png`
- `research/reference/official-longform/2025-12-09-dijiang-update-01.png` 至 `04.png`

## 设计系统

- 纸面：`#F1F3F0`，高光纸面：`#FAFBF8`。
- 墨色：`#171A1A`，局部深灰：`#242829`。
- 主信号黄：`#ECF200`；仅用于左侧状态轨、章节扫条、聚焦线和发送按钮。
- 校准色：青 `#4FD9CA`、品红 `#F03B8D`，仅用于页首／页脚微型标记。
- 标题：HarmonyOS Sans SC Black；正文：Noto Sans SC；窄数字：Haettenschweiler；极少量英文铭牌：Franklin Gothic Condensed。

## 印刷纹理

- 白纸以约 `10px` 周期的极淡小网格和约 `160px` 周期的交点定位十字为底；不要把压缩或印刷细纹画成独立圆点阵。
- 章节右侧只局部出现斜线网版，避免整页铺成普通科技壁纸。
- 黄色章节条叠加低对比等高线；深灰用户消息叠加 `45deg` 微型排线。
- 页首允许一处残缺的大型档案水印；纹理透明度保持在正文之下，不参与信息层级。

## 映射关系

| 官号长图 | SillyTavern |
| --- | --- |
| 连续白灰档案纸 | `#chat` 连续阅读面 |
| 两位数编号章节 | 消息顺序与会话阶段 |
| 左侧黄色识别条 | 活跃聊天与阅读进度轨 |
| 深灰截图／说明块 | 用户消息、媒体与系统状态 |
| 白底正文段落 | 助手消息正文 |
| 黄条与图标提示 | 聚焦态、发送与当前选项 |

## 动效序列

1. 进入界面：黄色状态轨由上至下生长，`440ms`。
2. 章节出现：黄色章节条从左向右扫入，`260ms`。
3. 消息出现：正文下移 `10px → 0` 并淡入，`290ms`。
4. 输入聚焦：输入区短黄线扩展为横向引导线，`180ms`。
5. `prefers-reduced-motion: reduce` 时全部变为即时状态。

## 可实现性边界

核心画面建立在普通 SillyTavern 的 `#chat`、`.mes`、`#send_form`、`#send_textarea`、`#send_but` 上；姓名、时间、正文和头像栏仍需按实际运行时 DOM 的子节点逐项映射。画面两侧的信息读数属于概念层，JSON 主题落地时降级为现有顶栏与抽屉的样式，不伪造动态 Telemetry，也不要求插件注入新 DOM。

纯 CSS 可以稳定实现纸面、消息明暗关系、黄色状态轨、输入聚焦与发送反馈。

**修正（2026-08-24）**：本文原先写「章节语义和真实阅读进度需要插件才可动态生成」，
这一判断被证伪。SillyTavern 原生就在 `.mes` 上给出 `mesid` 属性（0 起递增），
纯 CSS 用 `content: attr(mesid)` 即可取到楼层号，个位补零只需一条
`:is([mesid="0"], … [mesid="9"])` 穷举；分节标题的编号则用 CSS counter
自动排。两者都不需要插件，已分别落地为 `09-floor-index.css` 与
`10-section-band.css`。仍然需要插件的只有「真实阅读进度」这类要计算比例的读数。

消息入场动画在主题切换或 DOM 重绘时可能整批重播，因此落地阶段应先做真实
SillyTavern 验证，再决定是否保留。
