# SSH 密钥自动配置工具

一键在 Linux 服务器上生成 SSH 密钥对并完成安全配置。

## 📥 下载

| 方式 | 链接 | 说明 |
|------|------|------|
| 🌐 **浏览器直接下载** | [ssh_admin_toolkit.sh](https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh) | 右键「另存为」保存到本地 |
| 💻 **命令行执行** | `bash <(curl -s https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh)` | 在 Linux 服务器终端粘贴执行 |
| 📋 **命令行下载** | `wget https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh` | 下载到服务器后 `chmod +x` 执行 |

> 💡 **浏览器下载**：Windows 用户点击上方链接即可下载 `.sh` 文件，然后通过 SFTP 上传到服务器。

## 🚀 命令行一键执行

```bash
bash <(curl -s https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh)
```

### 国内加速

### 📖 在线脚本链接组合方法

在浏览器中打开脚本文件时，地址栏显示的是 **页面链接**（带 GitHub 网页外壳），不能直接用于 `curl`。需要将其转换为 **原始文件直链**。

**GitHub 转换规则**：

```
页面链接（浏览器中的地址）:
https://github.com/ATX8T/ATX8T.github.io/blob/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh
───────────────  ─────  ────
     ①             ②      ③

转换为原始直链:
① 把 github.com → raw.githubusercontent.com
② 删除 /blob
③ 后面的路径保持不变
```

**手动组合步骤**：

1. 在 GitHub 上打开脚本文件，复制浏览器地址栏的完整 URL
   ```
   https://github.com/ATX8T/ATX8T.github.io/blob/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh
   ```
2. 把 `github.com` 替换为 `raw.githubusercontent.com`
3. 把 `/blob` 删除（注意前后各有一个 `/`，删除后只剩一个 `/`）
4. 得到直链：
   ```
   https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh
   ```
5. 把直链放入 `bash <(curl -s ...)` 中即可执行

**Gitee 转换规则**（国内更快）：

```
页面链接:
https://gitee.com/kaiyuankaifa/OpenSSHorSSL/blob/main/ssh_admin_toolkit.sh

转换: gitee.com 保持不变，把 /blob 替换为 /raw
直链:
https://gitee.com/kaiyuankaifa/OpenSSHorSSL/raw/main/ssh_admin_toolkit.sh
```

**为什么需要这样转换？**

| 链接类型 | 返回内容 | 能否 curl |
|----------|----------|-----------|
| `github.com/.../blob/...` | HTML 网页（GitHub 界面） | ❌ 不能 |
| `raw.githubusercontent.com/...` | 文件的纯文本内容 | ✅ 可以 |
| `gitee.com/.../blob/...` | HTML 网页（Gitee 界面） | ❌ 不能 |
| `gitee.com/.../raw/...` | 文件的纯文本内容 | ✅ 可以 |

**快捷记忆**：

```
GitHub:  github.com → raw.githubusercontent.com  +  删/blob
Gitee:   /blob → /raw
```

### 国内加速

```bash
bash <(curl -s https://gitee.com/kaiyuankaifa/OpenSSHorSSL/raw/main/ssh_admin_toolkit.sh)
```

## 功能

| 项目 | 说明 |
|------|------|
| 发行版 | Debian/Ubuntu · CentOS/RHEL · Alpine · Arch |
| 算法 | RSA 4096 · RSA 8192 · Ed25519 |
| 配置 | `PubkeyAuthentication yes` · `PasswordAuthentication no` · 含备份 |

## 执行流程

1. 检测发行版 → 安装 OpenSSH
2. 选择密钥算法
3. 生成密钥 → 配置 sshd_config（备份至 `/etc/ssh/backup/`）
4. 可选显示私钥内容，复制到本地

## ⚠️ 安全警告

- 需要 **root 权限**
- 执行后请**删除服务器私钥**
- 建议配合防火墙限制来源 IP
- 执行前确认服务器能连接 GitHub：`ping raw.githubusercontent.com`

## 连接服务器

生成后将私钥复制到本地 Windows，然后：

```bash
ssh -i "C:\Users\用户名\.ssh\id_rsa" root@服务器IP
```

| 文件 | 作用 | 处理 |
|------|------|------|
| `id_rsa` | 私钥 | 下载到本地，妥善保管 |
| `id_rsa.pub` | 公钥 | 留在服务器，无需下载 |
