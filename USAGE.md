# 推送到 GitHub - 简明指南

## 包内文件

```
R2ImageBed/                      ← 完整源码，直接 push 到 R2ImageBed 仓库
ATX8T-homepage-index.html       ← 替换 ATX8T.github.io/index.html
README-DEPLOYMENT.md             ← 部署完整指南（含 Secrets 配置）
```

## 第 1 步：推送 R2ImageBed 仓库

```bash
# Clone 你的 R2ImageBed 仓库
git clone https://github.com/ATX8T/R2ImageBed.git
cd R2ImageBed

# 把本包里 R2ImageBed/ 的全部内容覆盖进去（除了 .git）
cp -r /path/to/bundle/R2ImageBed/* .
cp -r /path/to/bundle/R2ImageBed/.github .
cp /path/to/bundle/R2ImageBed/.gitignore .

git add -A
git commit -m "feat: v3.0 GitHub Pages + Cloudflare Worker 架构"
git push origin main
```

## 第 2 步：替换主页

```bash
git clone https://github.com/ATX8T/ATX8T.github.io.git
cd ATX8T.github.io

cp /path/to/bundle/ATX8T-homepage-index.html index.html

git add index.html
git commit -m "feat: 在主页添加 R2 图床 Pro 入口卡片（v3.0）"
git push origin main
```

## 第 3 步：在 GitHub 配置 Secrets

到 `R2ImageBed → Settings → Secrets and variables → Actions → New repository secret`：

| Secret 名 | 值 | 必需 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | https://dash.cloudflare.com/profile/api-tokens → 模板「Edit Cloudflare Workers」 | ✅ |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 首页右下角「Account ID」（如 `4457c2d5e4481d0a12e417ebdc44023f`） | ✅ |
| `ACCESS_TOKEN` | 自己生成 32 位以上随机串（用于前端访问 Worker 鉴权） | 强烈建议 |

## 第 4 步：启用 GitHub Pages

`R2ImageBed → Settings → Pages → Source: GitHub Actions`

## 第 5 步：触发部署

Push 之后 Actions 会自动跑。也可手动：
`R2ImageBed → Actions → Deploy Worker & Pages → Run workflow`

## 第 6 步：访问

- 主页：https://atx8t.github.io/
- 新版图床：https://atx8t.github.io/R2ImageBed/

打开新版图床 → 右上角 ⚙ 设置 → 填入 Worker URL 与 Access Token → 完成
