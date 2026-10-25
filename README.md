# ailula.top

lula 的个人网站：一棵红杉。设计见 `docs/superpowers/specs/`。

- `pnpm dev`：本地预览（http://localhost:4321）
- `pnpm test`：单元测试
- `pnpm e2e`：端到端测试
- `pnpm build`：构建静态网站到 `dist/`

## Notes

- Package manager: pnpm. The depth-map script (`scripts/depth-maps.mjs`) needs `pnpm approve-builds onnxruntime-node` once before it can run.
