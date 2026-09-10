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

## 版本维护

- 在 `src/parts/` 修改样式，在 `src/assets/` 维护素材；构建会将素材内嵌到主题 JSON。
- 每次围绕一个界面或问题提交，将对应源文件、素材和更新后的 `themes/Endfield.json` 一起记录。
- 提交前运行 `npm run check` 和 `git diff --check`，按明确文件路径暂存，并检查暂存差异。
- 界面改动还需在实际 SillyTavern 中核对；构建通过与浏览器验收分别记录在 `references/VALIDATION.md`。
- 研究截图、临时预览及本地草稿按 `.gitignore` 保留在本机；仓库中已有的参考记录继续跟踪。

## 参考记录

视觉事实与动效记录分别见 `references/UI_FACTS.md` 和 `references/MOTION_FACTS.md`。
