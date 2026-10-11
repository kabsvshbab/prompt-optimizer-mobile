# 提示词优化器 · 手机版（Prompt Optimizer Mobile）

一个纯前端、移动端优先的 AI 提示词优化工具，灵感来自开源项目
[linshenkx/prompt-optimizer](https://github.com/linshenkx/prompt-optimizer)。

- 一键智能优化提示词，支持多轮迭代优化
- 用户提示词 / 系统提示词双模式
- 原始 vs 优化后提示词「对比测试」，左右同屏多轮对话
- 多模型集成：OpenAI、Gemini、DeepSeek、智谱 AI、硅基流动、自定义 OpenAI 兼容接口
- 提示词收藏、优化历史、内置模板库
- **纯客户端架构**：API Key 与所有数据仅保存在浏览器 localStorage，请求由浏览器直连 AI 服务商，不经过任何中间服务器

## 技术栈

React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Radix UI + React Router（HashRouter）。

## 本地开发

```bash
npm install
npm run dev      # 启动开发服务器（端口 8001）
npm run build    # 构建生产产物到 dist/
npm run preview  # 本地预览构建产物
```

## 配置 API Key

打开应用 → 底部「设置」→ 选择服务商 → 填入 API Key → 保存（可先点「测试连接」）。

> 说明：API Key 只存在你自己的浏览器里。部分服务商（如 OpenAI 官方）对浏览器直连有
> CORS 限制，若连接失败可改用 DeepSeek、硅基流动等支持跨域调用的服务，或自建代理。

## 使用 GitHub Actions 构建 / 部署

仓库已内置工作流 `.github/workflows/deploy.yml`：

1. 推送到 `main`（或 `master`）分支，或在 Actions 页面手动点 **Run workflow**，即自动执行
   `npm install` → `vite build`。
2. 构建产物 `dist/` 会作为 Artifact 保留，可在对应 Actions 运行记录页下载。
3. 若要一键发布为在线网页（GitHub Pages）：
   - 进入仓库 **Settings → Pages**；
   - **Build and deployment → Source** 选择 **GitHub Actions**；
   - 工作流运行成功后，即可在 Pages 提供的 `https://<用户名>.github.io/<仓库名>/` 访问。

项目使用相对路径（`base: './'`）与 HashRouter，因此部署到任意子路径或静态托管目录都能直接运行。

## 目录结构

```
src/
  components/      # 布局与 shadcn/ui 组件
  pages/           # 优化 / 对比测试 / 提示词库 / 设置 四个页面
  lib/             # AI 调用、本地存储、工具函数
  data/types.ts    # 类型、服务商配置、内置模板
```

## License

MIT
