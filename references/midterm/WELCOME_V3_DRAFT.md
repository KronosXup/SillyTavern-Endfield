# 欢迎页中期草图 v3（用户已否定，不作为后续母版）

## 状态与边界

- 用户反馈：现有设计丢失，画面过平。停止沿此稿推进；后续必须直接以实际页面为编辑母版。
- 本轮交付是静态视觉草图，不是已经实现或验收通过的主题。
- 使用内置 imagegen 生成；art-direct 用于沿用已确认的官方档案长图方向和整理视觉约束。
- 不修改 `src/`、主题 JSON、宿主/插件源码或部署文件。
- 所有会话内容均为生成用示例，不使用真实聊天正文。
- 图标和小字属于构图占位，不作为最终图标资产或功能实现依据。
- 草图文件：`welcome-v3-concept.png`。

## 本轮需要判断

1. 标题、最近聊天列表和工具是否形成清楚但紧凑的主次。
2. 白色纸面与灰色工作区是否像同一套视觉系统，而非各自套卡片。
3. 纹理是否保持近看才注意到的低对比细节。
4. 在桌面约50%面板宽度下，真实长名称、预览和操作是否仍有空间。

## 已锁定的功能顺序

顶部原生菜单 → 版本栏/最近聊天标题与原生快捷项 → 三条示例最近聊天 →
助手欢迎消息 → API连接/角色管理/扩展程序 → 底部输入栏。

不新增侧栏、仪表盘、搜索框、功能标签页、遥测信息或大图封面。

## 参考图的职责

- `research/reference/official-longform/2025-12-09-dijiang-update-02.png`：已存档官方长图，只参考白灰纸面、黑黄章节层级、字体与分隔方式；不采角色、场景或文章功能布局。
- 用户提供的灰底局部截图：只参考极淡暗色斜十字细网格、断开交点与中心点、局部白色等高线。
- 不以旧中期文档中的“暖白/纤维颗粒”等已被后续反馈修正的描述为本轮依据。

## 第一张草图的偏差

第一张生成图把中央栏画得比50%更宽，灰底斜纹太显眼，
并把底部原生输入条/快捷入口画成了圆角容器。它不作为可直接照做的实现稿。
第二次只作约束校正；最终是否采用仍由用户看图决定。

## 校正稿检查与未解决项

- 中央栏已接近画面一半宽度；底部恢复平直条带，移除了第一张的重斜纹、圆角外框和额外装饰文字。
- 顶部图标、头像与细字仍是生成占位，不是经过核对的原生图标或最终资产。
- 灰底与列表层次被压得偏淡，已确认的细斜网格和局部等高线也表现不足；不能反过来用此图覆盖已确认的材质参数。
- 字体、长文本行高及实际菜单/列表几何尚未进行运行时验证；本图不证明对应 CSS 已实现或全部可行。
- 最终是否采用尚待用户确认；本轮没有修改或部署主题。

## 初始生成提示词

```text
Use case: ui-mockup.
Create ONE high-fidelity, flat, front-facing midterm visual mockup for a SillyTavern welcome page themed after Arknights: Endfield's official white/gray archival announcement sheets. This is a visual proposal, not a new application, not a poster and not a pencil wireframe.

REFERENCE ROLES:
Image 1 is the official archival graphic-design reference. Borrow its distinctive Chinese typography, precise black/white/yellow relationships, quiet printed structure, and restrained section-header treatment. Do NOT copy its photographs, game scenes, article content, or tall promotional-page composition.
Image 2 is ONLY the reference for pale-gray material detail: an extremely faint dense DARK-gray diagonal cross-grid; a larger square grid with registration marks whose horizontal, vertical and diagonal arms have equal fine weight, are broken before the center, and leave a tiny isolated center dot. Sparse smooth white contour lines appear only locally. This material is clean and subtle, not scratched, grainy or dirty.

CANVAS AND FIXED APP SKELETON:
Landscape 1536 by 1024 composition, crisp screen-design rendering. The app's single continuous central paper column occupies exactly the middle 50% of the canvas; equal gray gutters on the left and right occupy the remaining quarters. No additional sidebars. A shallow charcoal toolbar with nine small, evenly spaced native-style monochrome functional icons spans only the central column at the top. A fixed white compose bar with a menu icon, text field and small yellow send button spans the same column at the bottom. A very narrow yellow identification rail runs along the left edge of the central sheet. No floating window, drop shadow, device frame or browser chrome.

WELCOME CONTENT, IN THIS ORDER:
1. A restrained single-line masthead reading "SillyTavern 1.18.0" with small existing settings/hide controls at its right.
2. One recent-conversation heading reading "最近的聊天". Retain a compact official-style charcoal micro-label "01  ARKNIGHTS: ENDFIELD" above it and a carefully proportioned yellow continuation to the heading's right, never a giant yellow hero. The existing small Docs/GitHub/Discord link affordances and "临时聊天" control live in this header's tool area, not a new navigation band.
3. Exactly THREE compact continuous conversation rows on one neutral gray field, not three separate boxed cards. Each row has a small subdued placeholder avatar; a strong conversation/character name and quieter chat filename; a short two-line preview; a readable small date and message-count/file-size pair; and the existing pin, rename, delete icon affordances grouped discreetly at the right. Keep a consistent compact information axis: the names and filenames should not spread into many scattered baselines. Use generic demonstration content only. Names "示例会话 A", "示例会话 B", "示例会话 C". Chat names "档案整理", "日常交流", "一段较长的会话名称，用于观察截断效果…". Previews "这里是最近一条消息的预览，保持两行以内。", "文字与操作各有位置，信息仍然完整。", "这是一段示例内容，不包含真实聊天记录。". Dates "08/30", "08/29", "08/28". Small metadata "12条 · 24KB", "8条 · 16KB", "6条 · 12KB". Show the first pin as selected, the other two neutral. Keep a small native downward more-chevron below the rows.
4. A quiet paper welcome-message area BELOW the recent list, with a small assistant avatar and the label "Assistant". Keep it a message, not a hero/banner or character showcase. Text: "如果您已连接到一个 API，试着问我点儿什么吧！" and a short secondary line "您可以在角色设置中选择欢迎页助手。"
5. Below that message, the three existing shortcut controls "API 连接", "角色管理", "扩展程序" share one compact row. Compose-field placeholder: "输入消息…". Do not relocate this shortcut row above the assistant message.

ART DIRECTION:
Make the entire sheet feel composed by one meticulous graphic designer, closer to the attached Endfield archival paper system than a generic admin dashboard. Chinese headings are compact, well-drawn, heavy industrial grotesk in the spirit of the reference, not bubbly, handwritten or artificially spaced. Body type is calm regular sans-serif, smaller metadata is medium gray and clearly readable. Strong contrast belongs to actual content; texture remains a near-subliminal material layer. Neutral white #fdfdfd / #ffffff; workbench gray #e5e5e5; ink #061112 / charcoal #444444; selective signal yellow #ffff0f. Fine paper micro-grid and sparse registration crosses in white areas, darker extremely faint diagonal mesh only in gray areas. No green/teal tint. A short three-color calibration hairline may appear once at the sheet's top edge as in the reference. Keep flat tonal layers, precise alignment, balanced margins, and quiet white space. Preserve useful visual breathing room, but do not insert large empty gray blocks or make list rows tall to manufacture hierarchy.

HARD LIMITS:
One screen, one welcome page, no exploded views, no collage of alternate designs. Do not add new controls, search fields, side panels, telemetry, status cards, dashboards, tabs, oversized branding, giant numerals, character art, scenery, logos from other products, framing borders around every option, shadows, glass, bevels, glowing edges, rough noise, full-strength hatching, decorative English filler or explanatory annotations. Do not sacrifice existing operations to make the design clean. Respect a plausible CSS-only skin for the fixed SillyTavern structure. The proposal must improve overall rhythm and visual finish while remaining recognizably the same compact welcome page.
```

## 校正提示词

```text
Use case: precise-object-edit / ui-mockup.
Image 1 is the edit target, the just-generated SillyTavern welcome-page mockup. Image 2 is a material-detail reference only.
Make ONE fidelity-correction pass on this existing mockup. Keep its overall visual direction, exact section order, all three conversation rows, their content and controls, the Assistant message, shortcut labels, current white/gray/yellow palette and typography character. Do not create a new design.

Correct these concrete deviations:
1. FIX THE APP FRAME. On the same 1536x1024 canvas, the central app must span x=384 through x=1152, exactly 768px or 50% of the canvas. The empty gray side gutters each span exactly 384px or 25%. The current app is too wide. Refit content gracefully within this narrower width: filenames and previews may naturally truncate, but no controls disappear, no new rows/sections are introduced, and the recent list remains compact. The top dark toolbar and bottom compose bar must both be exactly the central column's width, flush with its edges. Keep all nine top icons, do not add icons.
2. FIX FLAT NATIVE FOOTER GEOMETRY. The compose bar is a flat white rectangular strip flush at the bottom of the central app, not an inset rounded input card. The yellow send area is square-cornered. The three shortcut controls remain a single compact row above it, WITHOUT a rounded enclosing container or heavy frame. Their position after the Assistant message is unchanged. Remove the diagonal decorative swatch to the LEFT of the Assistant message; it is an invented element. Leave clean paper there.
3. CALIBRATE GRAY MATERIAL ONLY. The side gutters must be nearly uniform clean neutral #e5e5e5 at normal viewing distance. Dramatically reduce the opacity of the dense diagonal mesh until it is only just discernible, around 2-3% dark ink, NOT bold visible hatching or fiber grain. Retain a few ultra-faint larger square-grid registration marks, with broken arm centers and tiny dots. Use Image 2 only as the subtlety reference; its white contours are a small local accent and must NOT sweep across the entire background. Keep the center's paper micro-grid extremely faint. No shadows, glow, gradients or distressed material.
4. Remove invented fine-print filler from the yellow heading strip. Keep only the actual existing Docs/GitHub/Discord and temporary-chat controls there. In the SillyTavern masthead keep the two small settings/hide icons but remove their added text labels, so there is no false "hide whole welcome page" control.

Preserve the remaining design. Render clean, precise Chinese text. No new cards, sidebars, telemetry, prose, hero art, frames or decorations. Show one full, straight-on screen, not a crop or perspective view. The calm outer half of the canvas and the exact half-width app are essential, not optional.
```
