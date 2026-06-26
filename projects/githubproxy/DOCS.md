# GitHub 加速代理 · 项目文档

> 基于 Cloudflare Workers Edge Functions 的 GitHub 加速代理
> 域名：`https://proxyclass.dpdns.org/`

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [Windows 使用指南](#windows-使用指南)
- [路径写法](#路径写法)
- [架构设计](#架构设计)
- [项目结构](#项目结构)
- [部署方法](#部署方法)
- [配置说明](#配置说明)
- [缓存与版本管理](#缓存与版本管理)
- [常见问题](#常见问题)
- [踩坑记录](#踩坑记录)

---

## 功能特性

| 特性 | 说明 |
|---|---|
| git clone 加速 | 支持 `git clone` / `git pull` / `git fetch` / `git push`（smart HTTP） |
| Release 下载加速 | 自动跟随 302 重定向到 `objects.githubusercontent.com` |
| Raw 文件加速 | `raw.githubusercontent.com` 直链代理 |
| 仓库 ZIP 下载 | `archive/refs/heads/*.zip` 和 `codeload.github.com` |
| 流式响应 | 不缓冲到内存，支持 GB 级大文件 |
| Range 断点续传 | 透传 Range 头，支持断点续传 |
| 全 HTTP 方法 | GET / POST / PUT / DELETE / HEAD |
| 域名白名单 | 仅代理 GitHub 官方域名，安全可靠 |
| 自动生成命令 | 首页粘贴链接后自动生成 Windows PowerShell/CMD 命令 |

---

## 快速开始

### 最简单的用法

在 GitHub 链接前面加上 `https://proxyclass.dpdns.org/` 即可：

```
原始:  https://github.com/user/repo
加速:  https://proxyclass.dpdns.org/https://github.com/user/repo
```

### Windows 上快速测试

打开 PowerShell：

```powershell
# 下载一个仓库 ZIP
Invoke-WebRequest -Uri "https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL/archive/refs/heads/main.zip" -OutFile "OpenSSHorSSL.zip"
```

---

## Windows 使用指南

### 1. git clone 加速

打开 **PowerShell**、**CMD** 或 **Git Bash**：

```bat
:: 完整克隆
git clone https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL.git

:: 浅克隆（推荐，只取最新提交，下载量小）
git clone --depth 1 https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL.git

:: 拉取子模块
git clone --recurse-submodules https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL.git
```

已有仓库改用加速地址：

```bat
cd OpenSSHorSSL
git remote set-url origin https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL.git
git remote -v
```

### 2. ZIP 下载

**PowerShell**（下载 + 解压）：

```powershell
$url = "https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL/archive/refs/heads/main.zip"
Invoke-WebRequest -Uri $url -OutFile "OpenSSHorSSL.zip"
Expand-Archive -Path "OpenSSHorSSL.zip" -DestinationPath "."
```

**CMD (curl)**：

```bat
curl -L -o OpenSSHorSSL.zip "https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL/archive/refs/heads/main.zip"
```

### 3. Release 下载

```powershell
Invoke-WebRequest -Uri "https://proxyclass.dpdns.org/https://github.com/user/repo/releases/download/v1.0/app.zip" -OutFile "app.zip"
```

### 4. Raw 文件下载

```powershell
Invoke-WebRequest -Uri "https://proxyclass.dpdns.org/https://raw.githubusercontent.com/ATX8T/OpenSSHorSSL/main/README.md" -OutFile "README.md"
```

### 5. ⚠️ IPv6 连接失败修复

**现象**：`git clone` 提示 `Couldn't connect to server after 184ms`

**原因**：Cloudflare custom_domain 自动创建 `AAAA proxyclass.dpdns.org -> 100::`（IPv6 黑洞占位地址），git 优先走 IPv6 导致瞬间失败。

**解决**：用**管理员身份**编辑 `C:\Windows\System32\drivers\etc\hosts`，添加：

```
104.21.28.86  proxyclass.dpdns.org
```

保存后重新执行命令即可。验证：`ping proxyclass.dpdns.org` 应返回该 IPv4 地址。

### 6. 使用首页自动生成

打开 `https://proxyclass.dpdns.org/`：

1. 在输入框粘贴任意 GitHub 链接
2. 点击「生成加速命令」
3. 页面自动识别链接类型（clone / zip / raw / release）
4. 生成对应的 Windows PowerShell / CMD / Git Bash 命令
5. 每块命令右侧有「复制」按钮，一键复制

---

## 路径写法

| 写法 | 等价于 |
|---|---|
| `/https://github.com/user/repo` | 完整 URL 透传 |
| `/gh/user/repo` | `https://github.com/user/repo` |
| `/raw/user/repo/main/file` | `https://raw.githubusercontent.com/user/repo/main/file` |
| `/api/...` | `https://api.github.com/...` |
| `/user/repo` | 默认补全到 `https://github.com/user/repo` |

### 支持的 GitHub 域名（白名单）

- `github.com`
- `raw.githubusercontent.com`
- `objects.githubusercontent.com`
- `codeload.github.com`
- `api.github.com`
- `github.githubassets.com`
- `cloud.githubusercontent.com`
- `user-images.githubusercontent.com`
- `avatars.githubusercontent.com`（及 `avatars0-3`）
- `camo.githubusercontent.com`
- `release-assets.githubusercontent.com`
- `media.githubusercontent.com`
- 所有 `*.githubusercontent.com`

---

## 架构设计

```
┌─────────────┐     HTTPS      ┌──────────────────────────┐     HTTPS      ┌──────────────┐
│  Windows    │ ──────────────►│  Cloudflare Edge (Worker) │ ──────────────►│   GitHub     │
│  客户端     │ ◄──────────────│  proxyclass.dpdns.org     │ ◄──────────────│   服务器     │
│ (git/curl)  │   流式响应      │  - 路径解析               │   原始响应      │              │
└─────────────┘                │  - 域名白名单校验          │                └──────────────┘
                               │  - 请求头清理              │
                               │  - 重定向 Location 改写    │
                               │  - 静态资源 (Assets)       │
                               └──────────────────────────┘
```

### 请求处理流程

```
1. 客户端请求 → Cloudflare Edge 接收
2. Worker 判断路径是否为代理路径
   ├─ 否 → Workers Assets 返回静态 HTML（首页）
   └─ 是 → 进入代理逻辑
3. 解析目标 URL（支持完整 URL / gh / raw / api 简写）
4. 域名白名单校验（仅 GitHub 域名）
5. 清理请求头（移除 CF 内部头，设置 User-Agent）
6. fetch 目标 URL（redirect: manual 手动处理重定向）
7. 如为 3xx：
   └─ 改写 Location 头，把 GitHub 域名替换为代理域名
8. 复制响应头，移除安全限制头
9. 流式返回响应体（upstream.body 直传，不缓冲）
```

### 关键设计决策

| 决策 | 原因 |
|---|---|
| 静态 HTML 独立部署（Workers Assets） | 避免在 Worker 中内联 HTML 模板字符串导致语法冲突（坑 #4） |
| 自定义域名而非 workers.dev | workers.dev 在部分网络不可达（坑 #1） |
| 手动处理重定向（redirect: manual） | GitHub release 会 302 到 objects.githubusercontent.com，需改写 Location 让客户端继续走代理 |
| 流式响应（upstream.body） | 不缓冲到内存，支持 GB 级仓库 clone |
| 域名白名单 | 安全限制，防止被滥用为开放代理 |
| `_headers` 设 no-store | 防止浏览器顽固缓存 HTML（坑 #11） |
| 部署时间戳响应头 | 用户可确认 CDN 是否已刷新（坑 #7） |

---

## 项目结构

```
github-proxy/
├── wrangler.toml          # Cloudflare Workers 配置
├── package.json           # 依赖管理
├── README.md              # 快速说明
├── DOCS.md                # 本文档（完整项目文档）
├── src/
│   └── worker.js          # Worker 核心逻辑（代理 + 静态资源路由）
└── public/                # 静态资源目录（Workers Assets）
    ├── index.html         # 首页（URL 转换 + Windows 命令自动生成）
    └── _headers           # HTTP 响应头配置（防缓存）
```

---

## 部署方法

### 前置条件

- Cloudflare 账户
- API Token（需 Workers 编辑权限）
- 域名已添加到 Cloudflare（zone 状态为 active）

### 步骤

```bash
# 1. 进入项目目录
cd github-proxy

# 2. 安装依赖
npm install

# 3. 设置 API Token
export CLOUDFLARE_API_TOKEN="your_token_here"

# 4. 部署
npx wrangler deploy
```

部署成功输出：

```
✨ Success! Uploaded 1 file
Uploaded github-proxy
Deployed github-proxy triggers
  proxyclass.dpdns.org (custom domain)
Current Version ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 本地开发

```bash
npx wrangler dev
```

访问 `http://localhost:8787`，可通过 `http://localhost:8787/https://github.com/...` 本地测试。

---

## 配置说明

### wrangler.toml

```toml
name = "github-proxy"
main = "src/worker.js"
compatibility_date = "2024-09-23"
account_id = "<你的账户ID>"

# 自定义域名（必须在 [assets] 之前，否则被 TOML 解析为 assets.routes）
routes = [
  { pattern = "proxyclass.dpdns.org", custom_domain = true }
]

# 静态资源
[assets]
directory = "./public"
binding = "ASSETS"

[observability]
enabled = true
```

### 域名绑定备选方案

若 `custom_domain = true` 部署失败（DNS 记录冲突），改为 Route 模式：

```toml
routes = [
  { pattern = "proxyclass.dpdns.org/*", zone_name = "dpdns.org" }
]
```

并确保 `proxyclass` 子域 DNS 记录已开启橙色云朵（proxied）。

### worker.js 可配置项

| 常量 | 说明 | 位置 |
|---|---|---|
| `GITHUB_DOMAINS` | 允许代理的域名白名单 | worker.js 顶部 |
| `FORWARDED_HEADERS` | 需移除的转发头 | worker.js 顶部 |
| `DEPLOY_TS` | 部署时间戳（每次部署更新） | worker.js 顶部 |

---

## 缓存与版本管理

### 版本确认方法

1. **响应头**：`curl -I https://proxyclass.dpdns.org/` 查看 `X-Proxy-Deploy` 头
2. **页面底部**：首页底部显示部署时间戳
3. **版本 ID**：`wrangler deploy` 输出的 `Current Version ID`

### 清除 CDN 缓存

部署后若页面未更新，清除 Cloudflare CDN 缓存：

```bash
# 获取 Zone ID
ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=proxyclass.dpdns.org" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['result'][0]['id'])")

# 清除全部缓存
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### 防浏览器缓存

`public/_headers` 已配置：

```
/*.html
  Cache-Control: no-cache, no-store, must-revalidate
```

---

## 常见问题

### Q: git clone 提示 "Couldn't connect to server after 184ms"

A: IPv6 黑洞问题。编辑 `C:\Windows\System32\drivers\etc\hosts` 添加 `104.21.28.86 proxyclass.dpdns.org`。详见 [IPv6 修复](#5--ipv6-连接失败修复)。

### Q: 部署后页面没更新

A: CDN 缓存延迟。按 [清除 CDN 缓存](#清除-cdn-缓存) 操作，或 Ctrl+Shift+R 强制刷新。确认页面底部时间戳是否为最新。

### Q: 能代理非 GitHub 域名吗

A: 不能。出于安全考虑，仅代理 GitHub 官方域名白名单。如需添加，修改 `worker.js` 中的 `GITHUB_DOMAINS`。

### Q: 支持私有仓库吗

A: 支持。在 URL 中或请求头中携带 GitHub Token 即可，代理会透传 `Authorization` 头。

### Q: 下载速度是多少

A: 取决于 Cloudflare 边缘节点到你 Windows 的网络。实测 78MB ZIP 下载约 1.5-7 MB/s。

### Q: 有文件大小限制吗

A: Cloudflare Workers 免费版无明确限制（流式响应不缓冲到内存）。实测 158MB 仓库 clone 正常。

---

## 踩坑记录

项目开发过程中踩过的坑记录在 `../坑.md` 中，与本项目相关的：

| 编号 | 问题 | 解决方案 |
|---|---|---|
| #1 | workers.dev 域名不可达 | 使用自定义域名 `proxyclass.dpdns.org` |
| #4 | Worker 内联 HTML 模板字符串冲突 | HTML 独立部署到 `public/`（Workers Assets） |
| #7 | Cloudflare CDN 缓存延迟 | 响应头加部署时间戳 + 清缓存 API |
| #11 | 浏览器顽固缓存 | `_headers` 设 `Cache-Control: no-store` |
| #12 | AAAA `100::` IPv6 黑洞 | `/etc/hosts` 或 Windows hosts 固定 IPv4 |
| #13 | TOML `routes` 写在 `[assets]` 后被吞 | `routes` 必须放在所有 `[table]` 之前 |
