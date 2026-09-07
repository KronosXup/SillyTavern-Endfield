# 公告阅读面素材

- `contours-top-right.svg`、`contours-bottom-left.svg`：本项目独立生成的等高线路径，来自已确认的 `research/concepts/paper-dots-contours-v1/` 定稿。保留 0.9 / 1.75 线宽、3.4% / 6% 强度及向内淡出的遮罩；只增加对应角落的 `preserveAspectRatio` 对齐。
- `points-bg.png`：官方公告点阵原图的本地副本，24×24 像素。来源：`https://web.hycdn.cn/endfield/official-v4/_next/static/media/points-bg.f3b559e8.png`。

`18-reading-paper.css` 使用 `asset:reading/...` 引用这些维护素材。构建时转为内嵌 data URL，因此导出的主题不需要额外文件或联网取纹理。

纸面覆盖正文至尾部操作行。两个角各占不超过阅读面的一半高度，短消息等比收小；点阵保持 12px 平铺，只在末端最多 220px 区域内由透明渐显至 6%。字体大小继续遵循酒馆当前设置。

短纸面另用一层高度遮罩：顶部 120px 保留三分之一强度，120–300px 逐渐恢复完整强度。与原有尾部渐显相交后，短回复底部约为 2% 不透明度，仍可看到极淡点阵。纸面高于约 410px 时，保留原来的整段尾部渐显效果。判定依据是实际阅读面高度，不是段落数量。
