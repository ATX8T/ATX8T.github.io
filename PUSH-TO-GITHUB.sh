#!/usr/bin/env bash
# R2ImageBed v3.0 - 一键 push 到 GitHub 脚本
# 用法：在解压后的目录中执行 ./PUSH-TO-GITHUB.sh
#
# 前提：
#   1. 本机能访问 github.com
#   2. 已安装 git
#   3. 已配置 GitHub 凭证（推荐用 personal access token / SSH key / GitHub Desktop）

set -euo pipefail

REPO_R2="R2ImageBed"
REPO_HOMEPAGE="ATX8T.github.io"
GITHUB_USER="ATX8T"

cd "$(dirname "$0")"

echo "=========================================="
echo "  R2ImageBed v3.0 - GitHub 推送脚本"
echo "=========================================="
echo
echo "本脚本将："
echo "  1) 推送 ./$REPO_R2/   → github.com/$GITHUB_USER/$REPO_R2"
echo "  2) 推送 ./$REPO_HOMEPAGE/ → github.com/$GITHUB_USER/$REPO_HOMEPAGE"
echo
read -p "继续? (y/N) " ans
[ "$ans" = "y" ] || [ "$ans" = "Y" ] || exit 0

push_one() {
  local dir="$1"
  echo
  echo "==> 推送 $dir"
  cd "$dir"
  echo "    [git log]"
  git log -3 --oneline | sed 's/^/    /'
  echo "    [推送中...]"
  git push origin HEAD
  echo "    [✓ 完成]"
  cd ..
}

push_one "$REPO_R2"
push_one "$REPO_HOMEPAGE"

echo
echo "✓ 全部推送完成"
echo
echo "下一步："
echo "  1) 到 GitHub → R2ImageBed → Settings → Pages → Source 选 GitHub Actions"
echo "  2) 到 GitHub → R2ImageBed → Settings → Secrets and variables → Actions → 添加:"
echo "       CLOUDFLARE_API_TOKEN  (必填)"
echo "       CLOUDFLARE_ACCOUNT_ID (必填)"
echo "       ACCESS_TOKEN          (强烈建议，自己生成 32+ 位随机串)"
echo "  3) Actions 会自动部署 Worker + Pages"
echo "  4) 部署成功后访问：https://atx8t.github.io/R2ImageBed/"
echo
