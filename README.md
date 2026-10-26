# ailula.top

lula 的个人网站：一座低多边形的小山谷，中间是一棵巨杉。设计见 `docs/superpowers/specs/`。

- `pnpm dev`：本地预览（http://localhost:4321）
- `pnpm test`：单元测试
- `pnpm e2e`：端到端测试
- `pnpm build`：构建静态网站到 `dist/`

## Notes

- Package manager: pnpm.
- 缺的内容：`pnpm build && node scripts/content-todo.mjs` 生成 `CONTENT-TODO.md`。缺的地方只在 `pnpm dev` 里显示「待补充」，正式网站上自动隐藏。
- 新照片：见 `ASSETS.md`。
