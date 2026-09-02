# Endfield Protocol

以《明日方舟：终末地》官方档案长图的视觉语言为参考的 SillyTavern JSON 主题实验。
当前版本从普通 SillyTavern 的稳定入口开始：

- `#chat`
- `.mes`
- `#send_form`
- `#send_textarea`
- `#send_but`

主题样式由 JSON 的 `custom_css` 提供；`src/` 是维护源，`themes/` 是构建产物。

## 构建与校验

```powershell
npm run build
npm run verify
```

构建产物：`themes/Endfield.json`

## 参考记录

视觉事实与动效记录分别见 `references/UI_FACTS.md` 和 `references/MOTION_FACTS.md`。
