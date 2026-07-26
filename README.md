# 黑土寻味·产销闭环

面向黑土地绿色食品产业的产销协同大屏，以供给能力、订单趋势、冷链履约、运输告警和经营结果为核心，提供 1920 × 1080 的静态可视化展示。

## 在线预览

- GitHub Pages：<https://flexibility607.github.io/black-soil-flavor-dashboard/>
- Sites 部署：<https://black-soil-flavor-loop.deep-hill-3942.chatgpt.site>

## 页面特点

- 深色科技农业视觉体系，使用荧光绿、琥珀金和冰蓝建立信息层级
- 关键经营指标、产销闭环流程、企业产能、订单趋势和运输状态集中展示
- 适配 1920 × 1080 大屏，并可根据浏览器窗口等比缩放
- 当前为纯静态演示数据，无需后端服务

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

构建并检查 Sites/Vinext 版本：

```bash
npm run build
```

构建 GitHub Pages 静态版本：

```bash
# macOS / Linux
GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/black-soil-flavor-dashboard npm run build:pages

# Windows PowerShell
$env:GITHUB_PAGES="true"
$env:NEXT_PUBLIC_BASE_PATH="/black-soil-flavor-dashboard"
npm run build:pages
```

静态文件会输出到 `out/`。

## GitHub Pages 自动部署

仓库使用 `.github/workflows/deploy-pages.yml` 自动发布：

1. 向 `main` 分支推送代码。
2. GitHub Actions 安装依赖并生成静态站点。
3. 构建成功后自动部署到 GitHub Pages。

可在仓库的 **Actions** 页面查看构建过程，在 **Settings → Pages** 查看最终地址。首次启用时，Pages 的构建来源应选择 **GitHub Actions**。

## 主要命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发环境 |
| `npm run build` | 构建 Sites/Vinext 版本 |
| `npm run build:pages` | 导出 GitHub Pages 静态版本 |
| `npm test` | 构建并运行页面检查 |
| `npm run lint` | 运行代码规范检查 |

## 项目结构

```text
app/                    页面与样式
public/                 静态资源
.github/workflows/      GitHub Pages 自动部署
tests/                  渲染结果检查
.openai/hosting.json    Sites 部署配置
```

## 数据说明

页面中的企业、订单、销售额、运输任务及政策信息均为静态演示数据，仅用于界面展示，不代表真实业务数据。
