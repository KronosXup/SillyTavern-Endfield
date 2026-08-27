# 中期视觉方向 v2：校准留白

## 诊断

- 当前运行时的主要问题不是装饰不足，而是中央正文、消息分节和外侧工作区落在接近同一档白色，材料层级坍缩。
- 旧概念稿通过假侧栏、遥测和卡片制造层次，脱离 SillyTavern 固定布局，也削弱了官号档案长图的连续阅读感。
- 新方向只允许改变表面材料、灰阶、边界和密度，不改变现有功能区几何。

## 锁定方向

- 情绪：安静、精确、克制。
- 能量：低速但有明确节拍。
- 主材料：暖白连续纸面、冷灰工作纸、炭黑既有顶栏。
- 信号色：黄色只保留在左侧状态轨、发送按钮和最多一条短激活线。
- 层次来源：纸面色差、细线、留白和消息间距；不用阴影、悬浮卡片或玻璃效果。
- 纹理：正文为极淡小网格与稀疏定位十字；外侧灰区为低对比纤维／印刷颗粒；斜纹不做全铺。

## 禁止项

- 新侧栏、假遥测、虚构英文微文案。
- 圆角消息卡、投影、辉光、渐变和浮层。
- 满屏点阵、满屏斜纹或高对比网格。
- 新增标题、图标、Logo 或装饰性信息块。

## 生图输入

1. 编辑目标：`research/runtime/beta05-final.png`。
2. 风格参考：`research/reference/official-longform/2025-12-09-dijiang-update-01.png`。
3. 风格参考：`research/reference/official-longform/2025-12-09-dijiang-update-02.png`。

## 最终精修提示词

```text
Use case: precise-object-edit
Asset type: refined midterm UI visual-direction mockup.

Image 1 is the edit target. Preserve it exactly except for one material-hierarchy adjustment. Images 2 and 3 are style references only for restrained pale-gray archival sectioning and printed material contrast.

Increase the material distinction by one restrained tonal step: make the two outer gutters slightly cooler and approximately 4% darker than the central page with subtle fibrous printed-paper grain; give the middle message section a barely perceptible cool-gray paper tone approximately 2% darker than the other message sections; retain the existing hairline separators but make them crisp, neutral gray, and very thin.

Keep every pixel of geometry, all existing Chinese text, top navigation, icons, left yellow rail, input field, scrollbar, send button, padding, positions, and content order unchanged. Keep the central reading field overwhelmingly calm and white. Preserve the sparse micro-grid and registration crosses at extremely low contrast.

Do not add or remove anything. No new text, no new yellow bars, no sidebars, no cards, no shadow, no gradient, no rounded message containers, no telemetry, no decorative hatch, no dot wallpaper, no logo, no watermark.
```

## 落地边界

这张图只验证材料层级与阅读节奏。用户确认后，再把灰阶、边界和纹理逐项搬入 CSS 分片；不从概念图反推新 DOM，也不把生成图直接作为主题背景。
