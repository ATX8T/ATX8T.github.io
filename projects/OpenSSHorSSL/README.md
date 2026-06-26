# SSH 密钥自动配置工具

一键在 Linux 服务器上生成 SSH 密钥对并完成安全配置。

## 一键执行

```bash
bash <(curl -s https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh)
```

### 国内加速

```bash
bash <(curl -s https://gitee.com/kaiyuankaifa/OpenSSHorSSL/raw/main/ssh_admin_toolkit.sh)
```

### 下载执行

```bash
wget https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/projects/OpenSSHorSSL/ssh_admin_toolkit.sh
chmod +x ssh_admin_toolkit.sh
./ssh_admin_toolkit.sh
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
