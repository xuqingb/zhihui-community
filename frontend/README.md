# 知汇 Web

Vue 3 + Vite 社区前端。项目亮点、架构、配置和后端启动见 [项目 README](../README.md)。

## 启动

需要 Node.js ≥ 22.12.0，在本目录执行：

```powershell
npm.cmd ci --cache ..\.npm-cache
npm.cmd run dev
```

Windows 也可双击 `启动前端.cmd`。访问 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)，在终端按 `Ctrl+C` 停止。

## 功能与模式

- 首页、专题、文章、收藏、关注、个人主页与 Markdown 写作，支持手机布局。
- 24 篇完整示例与本地头像，首页每批 12 篇，通过“加载更多”分页。
- 首次进入可选游客或手动启用演示账号；互动和个人页面要求登录。
- 演示记录保存在当前浏览器；摘要是本地提取，AI 问答是已标注的预设示例。
- “连接设置”可切换真实后端，服务失败时显示错误，不用示例替代真实结果。

## 接口配置

复制 `.env.example` 为 `.env.local`，修改后重启 Vite：

```dotenv
API_PROXY_TARGET=http://127.0.0.1:8080
```

开发代理将 `/api/v1` 转发至后端。生产构建需自行配置反向代理。真实模式需要后端认证、OSS 和模型服务；OSS 跨域须暴露 `ETag`。

真实账号令牌保存在当前标签页的 `sessionStorage`。收藏清单包含设备本地记录；后端尚未提供全部收藏、专用关注 Feed 和草稿列表接口。

## 检查与构建

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

构建产物位于 `dist/`。核心文件：`App.vue`（界面）、`useCommunity.js`（交互）、`useCommunityAuth.js`（身份）、`api.js`（接口）、`community.css`（主题）。
