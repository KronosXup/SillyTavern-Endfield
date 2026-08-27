# Endfield Protocol

以《明日方舟：终末地》整体视觉语言为目标的 SillyTavern JSON 主题实验。
武陵、四号谷地和通用工业界面都作为证据源，不再把任一地区限定为整套主题的唯一风格。

旧 `alpha.1` 的暗青视觉前提已作废，只保留为工程链路样本。下一版仍只从普通
SillyTavern 的稳定入口开始：

- `#chat`
- `.mes`
- `#send_form`
- `#send_textarea`
- `#send_but`

主题不修改 SillyTavern、Luker 或任何第三方插件源码。所有样式都由 JSON 的
`custom_css` 提供；`src/` 是维护源，`themes/` 是构建产物。

## 构建与校验

```powershell
npm run build
npm run verify
```

构建产物：`themes/Endfield-Wuling.json`

## 研究边界

游戏资源只用于提取形态、配色与动效事实，不直接打包进主题。已确认的静态事实见
`references/UI_FACTS.md`；尚待实机取证的动效问题见 `references/MOTION_FACTS.md`。
