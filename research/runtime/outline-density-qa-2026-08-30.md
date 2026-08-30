# 菜单减轮廓回归记录

日期：2026-08-30。宿主：普通 SillyTavern 1.18.0，`http://127.0.0.1:8000/`。
起点：`0fe4164`。范围：`07-user-settings.css`、`14-menu-system.css` 及构建主题。

## 改动与证据

- 菜单普通字段标签为 13.5px/650；用户设置分区为 700 字重，背景无渐变、左边框 0，伪元素标记 2×14px。
- 普通文本字段实测四边宽度为 `[0, 0, 0.8, 0]px`（当前渲染比例下的 1 CSS px 底线）。
- API 顶栏六枚工具按钮默认透明背景、透明边框、白色字形；配置选择框单独保留浅色填充，避免深底黑字。
- 用户设置折叠内容边框为 0；主题颜色展开前后 x=14.8px、padding-left=8px、预留左边=2px，未出现文字跳位。
- Persona 顶栏只覆盖实际标题行；外层背景透明、正文按钮为墨色字+浅填充。
- 格式化菜单原本已启用的开关在真实鼠标悬停下保持 `rgb(37,41,42)` 底、`rgb(255,255,15)` 字，未切换用户开关值。
- 文本字段真实焦点命中 `:focus-visible`：深灰 0.8px 轮廓与 2px 黄内侧标记；失焦静止态不常驻完整边框。

## 边界检查

九个入口：AI 响应、API 连接、格式化、世界书、用户设置、背景、扩展、用户形象、角色管理。

| 视口 | 中央菜单宽度 | 左右侧菜单宽度 | 结果 |
| --- | --- | --- | --- |
| 390×844 | 390px | 390px | 九个入口均无抽屉横溢、无标题/字段/按钮越界 |
| 614×695 | 614px | 614px | 九个入口均无抽屉横溢、无标题/字段/按钮越界 |
| 1184×800 | 592px（页面宽度50） | 295px | 九个入口均无抽屉横溢、无标题/字段/按钮越界 |

共 27 次检查；`scrollWidth - clientWidth` 均为 0。

## 截图

- `outline-density-api-before-614.png` / `outline-density-api-after-614.png`
- `outline-density-settings-before-614.png` / `outline-density-settings-after-614.png`
- `outline-density-settings-after-390.png`
- `outline-density-settings-expanded-390.png`
- `outline-density-persona-after-1184.png`
- `outline-density-formatting-state-614.png`

## 验证边界

- 已通过 `npm run check` 与 `git diff --check`，构建主题部署到普通酒馆。
- 这是浏览器视口测试，不等同于手机真机验收；未声明 modern-ui 或 Luker 已通过。
- 未测试发起模型请求、导入/删除数据等有副作用操作。
- 未改欢迎页、正文、背景纹理、头像形状、图标路径或宿主源码。
- 自绘图标撤除为下一独立改动，不混入本轮视觉比较。
