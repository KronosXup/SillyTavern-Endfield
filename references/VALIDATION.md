# 验证记录

## alpha.1 — 2026-08-21

构建产物：`themes/Endfield-Wuling.json`

### 离线闸门

- `npm run check`：通过。
- 构建：5 个 CSS 分片成功注入 `custom_css`。
- JSON：可解析，6,679 字节。
- CSS：5 个目标入口齐全，花括号配平，包含 Reduced Motion 降级。
- 依赖：`custom_css` 不含远程 URL，也不引用 `research/raw`。

### 普通 SillyTavern 1.18.0

- 部署路径：`<SillyTavern 数据目录>/default-user/themes/Endfield-Wuling.json`。
- 源／部署文件 SHA-256：
  `EBEE5D01B6418A75E112D669BD43A5BE09EAB3A2899CB822E2AC47E083E9F7DF`。
- 主题列表识别：通过。
- 切换后计算样式命中：`#chat`、可见 `.mes`、`#send_form`、
  `#send_textarea`、`#send_but` 均通过。
- 输入框聚焦：焦点保持在 `#send_textarea`，输入内容未被改动，输入容器边线反馈命中。
- 重载持久化：通过；重载后仍为 `Endfield · Wuling Protocol α1`，`custom_css` 仍命中。
- 控制台错误：0。

### 响应式探针

- 视口：390 × 844。
- `#chat`、`#send_form` 和两条可见 `.mes` 均为
  `scrollWidth == clientWidth`。
- 输入区和发送按钮均在 390px 视口内。
- 宿主隐藏抽屉使文档根节点报告更宽的 `scrollWidth`，但 `body` 的
  `overflow-x` 为 `hidden`；核心主题元素未产生横向溢出。

### 尚未声称通过

- 用户在自己的日常浏览器中的目视确认。
- 真机触控。
- modern-ui。
- Luker。
- 顶栏、抽屉、弹窗、设置与低频表单。
- 来自游戏录屏的准确动效时序复刻。

## β0.3 — 2026-08-24

构建产物：`themes/Endfield-Wuling.json`（文件名仍留旧后缀，内容为档案长图方向）

### 离线闸门

- `npm run check`：通过。
- JSON：可解析，62,336 字节；`custom_css` 58,554 字符。
- 源／部署文件 SHA-256：
  `EE226CCA60E4313C925CE17F8613A364DF17981CBC26DE8E09A7A66BA7A8B41D`。

### 活动样式一致性

先切走主题再切回，`#custom-style` 文本长度 58,554，与构建输出字符数一致。
未做这步时运行时读到的是 58,604 的旧副本 —— 拷贝 JSON 不等于生效。

### 本轮四项改动的计算样式命中

| 目标 | 探针结果 |
| --- | --- |
| 发送键去圆角 | `#send_but` → `border-radius: 0px`，46 × 35，底色 `rgb(236,242,0)` |
| logo 单色化 | `.welcomeHeaderLogo` → `filter: grayscale(1) contrast(1.2) brightness(...)` |
| 黄色横条分节 | `.recentChatsTitle` 命中，方角 |
| 图钉激活态收黄 | `.pinChat.active` → 底 `rgba(236,242,0,0.22)`，内阴影顶线 3px 实黄 |

桌面 1280 × 800 截图目视：四项均按预期呈现，见
`research/runtime/beta03-cleanup-desktop.png`、`beta03-cleanup-header.png`。

### 响应式探针

- 视口：390px。
- `#chat`、`#send_form`、`#sheld` 均为 `scrollWidth == clientWidth`。
- `#send_but` 位于 x=342、宽 46，落在 390px 视口内；方角保持。
- `.recentChatsTitle` 位于 x=16、宽 167，未溢出。

### 控制台

无可归因于主题的报错。预览窗格观察到 403 Forbidden 与
`ERR_CONNECTION_CLOSED` 两条，属宿主 CSRF 与网络层，与 CSS 无关。

### 本版尚未声称通过

- 用户目视验收（本轮由我截图判断，未经用户确认）。
- 真机触控、modern-ui、Luker。
- 顶栏、抽屉、弹窗、设置与低频表单。
- 动效时序仍按 `MOTION_FACTS.md` 闸门冻结，本版未新增动效。

## β0.4 排版层级对齐 — 2026-08-24

依据 `references/UI_FACTS.md`「官号长图实测」把设计从目测改为按实测比例对齐。

构建产物：11 个分片，65,646 字节，`custom_css` 60,816 字符。
SHA-256：`F777BBCD809E97D660A7349FF7CDDE12942ED661009E22C0F7583F9C72703B74`。
活动样式长度 60,816，与构建一致。

### 改动与命中

| 改动 | 探针结果 |
| --- | --- |
| 标题／正文字号比 | 26px ／ 15px = **1.73×**（官方 1.77×） |
| 正文行距 | 1.6（官方实测 42/26 ≈ 1.6），原为 1.75 |
| 角色名 | 16.8px，由 `0.94em` 提到 `1.12em`，现已大于正文 |
| 章节头两行结构 | `display: grid`，列 `131.3px 575.8px`；上层条炭灰→灰双色渐变底 |
| 页眉套准色条 | `.welcomePanel::before` 高 5px，三段渐变按 6.1%/18.7%/29.3%/60.5% 分段 |
| 令牌换代 | 黄 `#ecf200`→`#ffff0f`，纸面 `#f1f3f0`→`#fdfdfd`，墨 `#171a1a`→`#061112` |

新增分片：`10-section-band.css` 重写为两行结构，`11-archive-marks.css` 承载套准色条与 `//` 前缀。

### 几何检查

- 桌面 1280 × 800：面板顶 y=35 正好接顶栏底 y=35，套准色条无被遮挡。
- 390px：`#chat`、`#send_form`、`#sheld` 均 `scrollWidth == clientWidth`；
  标题降至 21px，黄条内极小灰字按预期隐藏。

### 已知简化

章节头上层条在官方是「炭灰块 + 灰条」两段两色、编号为黄字。两个伪元素凑不出三个盒子，
现用双色线性渐变还原分段、文字统一取纸白。若后续要求编号字为黄，需引入第三个挂载点。

### 本版尚未声称通过

- 用户目视验收。
- `//` 前缀目前只挂在推理块头部，官方图注那种「黄竖条 + // + 标签」的完整形态未做。
- `「」` 角括号规则未落地。
- 真机触控、modern-ui、Luker、顶栏容器、抽屉、弹窗。

## 首页分节收束带 — 2026-08-27

本轮没有改主题名或发版号；只补齐首页真实分区的视觉收尾，并完成普通 ST 运行时验收。

### 构建、部署与活动样式

- `npm run check`：通过；12 个 CSS 分片，JSON 68,168 字节，`custom_css` 62,562 字符。
- 工作区产物与部署文件 SHA-256 均为
  `28F5D716555F8AD9A3B449F35FFF5BBDDF844F81502E4F913480F8C9390E7556`。
- 部署路径：`<SillyTavern 数据目录>/default-user/themes/Endfield-Wuling.json`。
- 重启已核对的普通 ST 服务后，活动 `#custom-style` 与构建产物的 `custom_css` 逐字符相等；
  活动 CSS SHA-256 为 `18CED248A0701C54B29E8DB52E02A8CE2206E9F46A73CB04AD7A9423A2098351`。
- 页面控制台错误：0。

### 视觉与语义

- `10-section-band.css` 移除了无官方依据的 `ENDFIELD ARCHIVE / SECTION` 微缩英文；
  黄条保留为空白结构色块。
- 新增 `12-section-closure.css`：只挂 `#chat > .welcomePanel::after`，不把普通消息轮次
  伪造成章节。桌面高 84px，窄屏高 48px；底色 `#e5e5e5`，160px 结构网格贯穿，
  深色细斜纹只覆盖局部。
- 最近聊天折叠时，welcomePanel 高 441.27px；展开后为 1592.20px。两种状态下
  `welcomePanel.bottom == 第一条消息.top`，收束带始终参与正常文档流，没有覆盖正文。

### 响应式探针

| 视口 | 收束带 | 核心横向溢出 | 发送键 |
| --- | --- | --- | --- |
| 1280 × 800 | 84px | chat 1067/1067；sheld 1080/1080；send 1069/1069 | 在视口内 |
| 390 × 844 | 48px | chat 390/390；sheld 390/390；send 384/384 | x=342–388，宽 46px |

截图：`research/runtime/section-closure-1280x800.png`、
`research/runtime/section-closure-390x844.png`。

### 回退与未覆盖范围

- 部署前副本：`research/runtime/Endfield-Wuling.pre-section-closure.json`。
- 仍未声称通过：用户最终目视、真机触控、modern-ui、Luker、顶栏抽屉、弹窗与
  有官方时序证据的过渡动画。
