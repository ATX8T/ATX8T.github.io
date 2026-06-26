# GitHub 加速代理 · proxyclass.dpdns.org

基于 Cloudflare Workers Edge Functions 的 GitHub 加速代理。

📖 **完整文档请阅读 [DOCS.md](./DOCS.md)**

## 快速使用

在 GitHub 链接前加上 `https://proxyclass.dpdns.org/`：

```
原始:  https://github.com/user/repo
加速:  https://proxyclass.dpdns.org/https://github.com/user/repo
```

## Windows 示例

```bat
:: git clone
git clone https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL.git

:: ZIP 下载 (PowerShell)
Invoke-WebRequest -Uri "https://proxyclass.dpdns.org/https://github.com/ATX8T/OpenSSHorSSL/archive/refs/heads/main.zip" -OutFile "OpenSSHorSSL.zip"
```

> ⚠️ 若 git clone 提示 `Couldn't connect`，编辑 `C:\Windows\System32\drivers\etc\hosts` 添加 `104.21.28.86 proxyclass.dpdns.org`（详见 [DOCS.md](./DOCS.md#ipv6-连接失败修复)）

## 首页功能

访问 `https://proxyclass.dpdns.org/`：
- 粘贴 GitHub 链接 → 自动生成 Windows PowerShell/CMD 命令
- 每块命令可独立复制
- 支持识别 clone / zip / raw / release 类型

## 部署

```bash
cd github-proxy
npm install
export CLOUDFLARE_API_TOKEN="your_token"
npx wrangler deploy
```

## 项目结构

```
github-proxy/
├── wrangler.toml       # 配置（自定义域名 + Assets）
├── package.json
├── README.md           # 本文件
├── DOCS.md             # 完整项目文档
├── src/worker.js       # 代理核心逻辑
└── public/
    ├── index.html      # 首页（命令自动生成）
    └── _headers        # 防缓存配置
```
