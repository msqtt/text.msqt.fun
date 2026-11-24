# 文字工坊 · text.msqt.fun

纯前端文字处理工具站：查找、替换、文本生成、文本裁剪、大小写转换、行处理。所有处理均在浏览器本地完成，文本不出浏览器。

同时是一个 WTOP 工具节点（`text-tool`），可被 [可回收编排站](https://recycle.msqt.fun) 注册并在流程中调用，6 个方法全部为 headless / stateless。

## 开发

```bash
pnpm sync-sdk   # 从 ../wtop-sdk 同步 SDK 构建产物到 vendor/wtop
pnpm install
pnpm dev        # http://localhost:5181
pnpm build      # tsc 类型检查 + vite 构建
```

## 结构

- `src/ops.ts` — 纯函数文字处理算子（UI 与 WTOP 方法共用）
- `src/main.ts` — UI 交互 + WTOP provider 注册
- `public/.well-known/wtop-manifest.json` — WTOP 工具清单
- `vendor/wtop/` — 自包含的 SDK 构建产物（提交进仓库，Netlify 全新克隆可直接构建）
- `netlify.toml` — Netlify 构建与响应头（含 frame-ancestors 允许编排站嵌入）

## 部署

GitHub `msqtt/text.msqt.fun`（public）→ Netlify 自动构建 → CNAME `text.msqt.fun`。

## WTOP 方法

| 方法 | 说明 | 关键参数 |
| --- | --- | --- |
| find | 查找 | text, query, regex?, ignoreCase? |
| replace | 替换 | text, query, replacement, regex?, ignoreCase?, all? |
| generate | 文本生成 | mode: repeat/lorem/lines/uuid, count?, text? |
| trim | 文本裁剪 | text, mode: ends/lines/collapse/blank/spaces |
| case | 大小写转换 | text, mode: upper/lower/title/camel/snake/reverse |
| lines | 行处理 | text, op: dedupe/sort/reverse/number |