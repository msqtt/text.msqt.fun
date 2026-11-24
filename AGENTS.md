# AGENTS.md

## 项目约定

- 纯前端站，无后端、无框架（原生 TS + Vite），UI 为 neobrutalism 风格（粗黑边框 + 硬阴影 + 高饱和色块）。
- 文字处理逻辑全部放 `src/ops.ts` 纯函数；UI 与 WTOP provider 方法共用同一实现，禁止两处各写一份。
- 新增/修改 WTOP 方法时，`public/.well-known/wtop-manifest.json` 的 input/output JSON Schema 必须与 `ops.ts` 参数同步。
- SDK 依赖走 `vendor/wtop`（`pnpm sync-sdk` 从 `../wtop-sdk` 同步），vendor 的 dist 必须提交（Netlify 全新克隆构建）。`.gitignore` 用 `/dist/` 而非 `dist/`。
- `pnpm-workspace.yaml` 同时保留 `allowBuilds`（pnpm 12 本地）与 `onlyBuiltDependencies`（pnpm 10 Netlify）两种 esbuild 构建许可写法。
- 开发端口 5181（strictPort）；host 编排站本地端口 5173。
- 提交信息用中文；推送 `git -c credential.helper='!gh auth git-credential' push origin main`。
- 验证方式：Chrome（playwright 驱动，`/home/bob/Projects/duckdaw-e2e/node_modules/playwright`）实测 UI 与 host 集成，通过后才推送。

## 部署链路

GitHub public 仓库 → GitHub Actions（push main：pnpm 10 / node 22 构建）→ `scripts/netlify-deploy.mjs` Netlify API 直传发布 → Cloudflare CNAME `text` → `text-msqt-fun.netlify.app`（proxied=false，TLS 由 Netlify 签发）。netlify.toml 随部署上传，redirects/headers 生效。