# 欢迎页中期草图 v4：现有页面局部精修（待用户确认）

## 起点

用户否定 v3：丢失现有设计、画面过平。本轮不修改源样式或部署文件，不以 v3 为母版。
使用内置 imagegen 编辑实时页面截图；art-direct 用于区分现有设计保留项与允许的层次精修。

## 本轮保留项

- 中央50%宽度、原生菜单与底部输入条，保持截图可见范围。
- 炭灰/中灰分段章节标签、黑字标题和黄色续带。
- 顶部不等长三色套准条与左侧黄线。
- 连续灰色列表面及灰色过渡带，不压成近白，不拆成卡片。
- 密淡暗色斜十字网格、大网格、断开准星/中心点、局部白色等高线。
- 助手方头像、短黄线、细分隔及黄色 [Assistant] 名签。

## 只允许调整

白/灰/炭灰面的对比、已有块面的衔接、分区边界与行分隔强弱，以及原位置上的文字主次。
不使用阴影制造层次，不增加功能和装饰文字，不重排原生区块。

## 输入和交付边界

- 实时截图为本地临时母版，仅保存在已忽略的 research/temp；不将真实会话正文作为草图内容。
- 输出会话文字替换为通用示例。官方长图仅指导印刷层次，灰底局部图仅指导纹理。
- 静态图中的图标、文字和几何不构成运行时验收；主题保持回滚后的版本。
- 图像生成结果需检查保留程度后再交付，不能因为生成成功就视作方向通过。

## 校正稿交付检查

- 交付图：welcome-v4-preserved-concept.png。
- 当前两层章节头、三色细条、左黄线、连续灰面、圆形列表头像与原生控件组、助手方头像和黄底名签均保留。
- 灰色过渡带已恢复，外侧大幅白色等高线已去掉。
- 仍是生成草图：过渡带比原页面短，字体/图标不保证逐像素一致，细斜网格在部分区域仍偏淡。不能替代已确认的材质参数，也未得到用户认可。
- 本轮未修改 src/、主题 JSON 或部署内容；源主题与当前部署 SHA256 均为 26B2217208D3F352172C0D86120E3389203DBE36F0DC9C833D29817BF76539C8。

## 首稿校正

首稿保住主要视觉锚点，但吞掉了灰色过渡带，外侧等高线过强，因此仅对这两处做一次校正。

```text
Use case: precise-object-edit.
Image 1 is the edit target: the refined SillyTavern screenshot. Image 2 is the original actual screenshot and is ONLY a guide to the missing gray transition band, original row density and restrained outer-gutter texture.

Repair TWO fidelity errors only. Keep all other design choices from Image 1, including the exact canvas/aspect ratio, 50% central app width, nine toolbar icons, yellow rail, three-color strip, chapter label and heading, yellow ribbon, current three sample rows and avatars, action controls, font styling, Assistant ST square avatar/yellow underline/yellow name label, and bottom composer.

1. Restore the distinct light-gray textured transition band that appears BELOW the recent-list/more-chevron area and ABOVE the white Assistant message in Image 2. In Image 1 it was wrongly erased and replaced with a hairline gap. This is a real full-width interior gray plane, approximately 75–85px tall at Image 1 resolution, separated from the list by a narrow white gutter. It contains the same fine dark diagonal mesh, larger square-grid broken registration marks and a small local cluster of smooth thin white contours as Image 2. It is NOT a shadow, not a white gap, not another row, and contains no new text or controls. Recover the necessary space by modestly tightening the exaggerated row and more-chevron vertical padding back toward Image 2's compact density; keep the text, controls and frame fully visible. Do not lengthen the canvas, hide content or shrink the entire UI.

2. Make the big outer gray gutters calm again. Remove the conspicuous sweeping white contour ribbons across the left gutter of Image 1. Match Image 2's near-uniform clean pale-gray outer field, very subtle dense dark diagonal mesh, and sparse low-contrast large grid/registration marks. Preserve detailed local contours in the restored interior gray transition band instead of decorating the whole outer background.

Everything else unchanged. Maintain the stronger gray-vs-white separation and existing layered graphic identity. No shadows, rounded frames, new features, new decorative words or large additional shapes. Return ONE corrected screenshot only.
```


## 生成提示词（内置 imagegen，图像编辑模式）

```text
Use case: precise-object-edit.
Asset type: screenshot-based visual refinement proposal, NOT a replacement app design.

INPUT ROLES
Image 1 is the actual current SillyTavern Endfield theme, and is the mandatory EDIT TARGET. Its structure, proportions and existing visual identity must remain recognizably intact.
Image 2 is the official Endfield announcement reference. Borrow ONLY its printed layering: white title slips against yellow bands, dark/gray segmented chapter labels, gray structural fields behind white information paper. Do not copy its game photographs, article text, huge chapter numbers or page layout.
Image 3 is the material close-up reference ONLY: fine low-contrast dark diagonal cross-grid, larger square grid, broken registration arms with an isolated center dot and equal stroke widths, smooth local white contours.

PRIMARY REQUEST
Refine Image 1 in place to give its EXISTING design more coherent visual layering. The previous proposal was rejected because it erased the current identity and turned everything into a flat near-white table. Do not repeat that. This should look like the same screen, carefully art-directed one step further.

LOCKED COMPOSITION
Keep the same 1280x720 straight-on screenshot framing and same visible crop. The central app remains the middle 50% width, with equal gray gutters. Preserve the nine existing native-style toolbar symbols, their order and dark toolbar; the left yellow rail; native bottom compose strip and yellow send control. Keep the current masthead position, title and toolbar area, three recent-chat rows, more-chevron, gray transition band, and Assistant message in exactly that order, at nearly the same locations and heights. Do not move content into another panel. Do not bring offscreen shortcuts into this crop. No new controls. No sidebars, cards or new navigation.

MUST KEEP — these existing visible details are NOT optional:
1. The small segmented charcoal/gray chapter tag "01 ARKNIGHTS: ENDFIELD", above the strong black "最近的聊天" heading and yellow continuation band.
2. The top magenta/yellow/cyan calibration strip, with unequal segment lengths as in Image 1.
3. One continuous genuinely light-GRAY recent-list plane, separate in tone from the white paper around it. Three rows separated by quiet hairlines, NOT individual framed cards.
4. The gray material's fine diagonal mesh, large grid, broken cross/dot registration marks, and local smooth white contours; subtle but present, not erased into white.
5. The textured gray transition band below the list, at its existing approximate height. It is a deliberate layer, not a spacer to delete.
6. The Assistant message's square dark ST avatar, tiny yellow underline, left-side fine division, yellow rectangular "[Assistant]" name label and white micro-grid paper. Do NOT replace these with an unadorned round robot icon.
7. Current avatar shapes and their sizes/positions in recent rows, the pin/edit/delete controls, yellow selected-pin state, and existing small statistics area.

CHANGE ONLY THE VISUAL FINISH
Give the page depth through graphic occlusion and tonal planes, NOT shadows or 3D effects. Clarify the meeting of the white heading slip, yellow ribbon and small charcoal label so the existing layered title reads as intentional interlocking print pieces, without enlarging it or relocating the controls. Keep the main gray field around #e5e5e5 and white paper around #fdfdfd. Let the section edge read a little stronger than row rules, with the background mesh fainter than both. Improve the current text hierarchy in place: names remain strong black, filenames/date recede to readable gray, previews remain ordinary black text. Do not shrink all text or inflate whitespace. Contours are smooth thin continuous pale lines, not scribbles. The solid yellow rail, title ribbon and Assistant label remain the same active accents.

CONTENT PRIVACY
For the three recent-chat rows only, replace names/filenames/previews with generic sample content while preserving the current line lengths/density and positions: "示例会话 A", "示例会话 B", "示例会话 C"; "档案整理", "日常交流", "一段较长的会话名称…"; preview "这里是最近一条消息的示例预览，保留现有信息密度。". Do not reproduce the source screenshot's chat prose. Keep the existing standard SillyTavern/Assistant welcome copy and functional labels.

AVOID
Do not simplify the current design into a generic clean dashboard. No all-white list. No new English filler. No new symbols or handmade icon language. No rounded outer containers, drop shadows, glows, beveled edges, glass, dark-theme conversion, noisy grain, strong hatch, exaggerated contours or extra decorative objects. Do not add a border to every item. Do not change the screenshot aspect ratio or produce a presentation board. Return ONE refined screenshot, faithful to the current product design.
```
