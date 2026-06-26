# SSH 密钥自动配置工具

一键在 Linux 服务器上生成 SSH 密钥对并完成安全配置。脚本自动检测发行版、安装 OpenSSH、生成密钥、配置 sshd_config。

## 支持的发行版

| 发行版 | 包管理器 |
|--------|----------|
| Debian / Ubuntu | `apt` |
| CentOS / RHEL | `yum` |
| Alpine | `apk` |
| Arch | `pacman` |

## 支持的密钥算法

| 算法 | 特性 |
|------|------|
| RSA 4096 | 经典算法，兼容性最佳 |
| RSA 8192 | RSA 增强版，更高安全 |
| Ed25519 | 现代椭圆曲线，快速安全 |

## 一键执行

```bash
bash <(curl -s https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh)
```

### 国内加速 (Gitee)

```bash
bash <(curl -s https://gitee.com/kaiyuankaifa/OpenSSHorSSL/raw/main/ssh_admin_toolkit.sh)
```

### 下载到本地执行

```bash
wget https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh
chmod +x ssh_admin_toolkit.sh
./ssh_admin_toolkit.sh
```

## ⚠️ 重要安全警告

1. **需要 root 权限执行** — 脚本需要修改 `/etc/ssh/sshd_config` 和 `/root/.ssh/`
2. **开启 Root 远程登录有风险** — 建议配合防火墙（如 `ufw` / `firewalld`）限制来源 IP
3. **在服务器生成私钥**不如「本地生成公钥上传」安全 — 私钥曾存在于服务器，传输过程可能泄露
4. **执行后删除服务器私钥** — 复制到本地后立即删除服务器上的私钥文件
5. **执行前确认服务器能连接 GitHub** — 脚本需要从 GitHub 下载

### 网络连通性测试

```bash
ping -c 3 raw.githubusercontent.com
nc -zv raw.githubusercontent.com 443
```

## 执行流程

1. 检测 Linux 发行版 → 自动安装 `openssh-client` / `openssh-server`
2. 交互选择密钥算法（RSA 4096 / RSA 8192 / Ed25519）
3. 生成密钥对 → 配置 `/etc/ssh/sshd_config`（备份在 `/etc/ssh/backup/`）
4. 可选显示私钥内容，复制到本地即可 SSH 登录

## 自动配置项

```
PubkeyAuthentication yes
PasswordAuthentication no
PermitRootLogin yes
AuthorizedKeysFile .ssh/authorized_keys
X11Forwarding no
IgnoreRhosts yes
```

## 密钥文件说明

| 文件 | 作用 | 处理方式 |
|------|------|----------|
| `id_rsa` | 私钥（保密核心） | 复制到本地 Windows，妥善保管 |
| `id_rsa.pub` | 公钥（公开） | 存在服务器 `authorized_keys` 中，无需下载 |

在 Windows 上用私钥连接服务器：

```bash
ssh -i "C:\Users\你的用户名\.ssh\id_rsa" root@服务器IP
```

## v3.0 安全特性

| 特性 | 说明 |
|------|------|
| `set -euo pipefail` | 严格 Shell 选项 |
| `trap` 异常捕获 | ERR / EXIT / INT / TERM |
| 输入验证 | 所有用户输入正则校验 |
| 权限检查 | 自动检查文件/目录权限 |
| 配置验证 | 修改前后验证 SSH 配置 |
| 原子操作 | 临时文件 + `mv` |
| 备份管理 | `/etc/ssh/backup/` 目录 |
| 临时文件清理 | trap 退出时自动清理 |

## 相关概念

- **SSH**：网络安全协议，定义加密远程登录规范
- **OpenSSH**：SSH 协议的开源实现（Linux 自带 ssh/sshd）
- **OpenSSL**：加密算法库 + 工具集，是 OpenSSH 的底层依赖

## 链接

| 地址 | 说明 |
|------|------|
| `ssh_admin_toolkit.sh` | 主脚本 (v3.0) |

> **总结**：服务器生成需下载私钥；本地生成需上传公钥到 `authorized_keys`。
