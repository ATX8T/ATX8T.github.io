GitHub Actions 是 GitHub 内置的 CI/CD 自动化工具，核心是在 `.github/workflows/` 下写 YAML 工作流，由事件触发、在 Runner 上执行 Job/Step，实现构建、测试、部署等自动化。

### 一、核心概念
- **Workflow（工作流）**：一个自动化流程，由一个或多个 Job 组成，定义在 `.github/workflows/` 目录下的 YAML 文件中。
- **Job（作业）**：Workflow 中的独立任务单元，可并行/串行执行，用 `runs-on` 指定运行环境（如 `ubuntu-latest`）。
- **Step（步骤）**：Job 中最小执行单元，可执行 Shell 命令或调用 Action（如 `actions/checkout@v4`）。
- **Action（动作）**：可复用的封装任务，官方/社区提供，也可自定义。
- **Event（事件）**：触发 Workflow 的条件（如 `push`、`pull_request`、定时 `schedule`）。
- **Runner（运行器）**：执行 Workflow 的服务器，GitHub 托管或自托管。

### 二、快速上手（5 步）
#### 1. 创建目录与配置文件
在仓库根目录创建固定目录，所有 Workflow 必须放在这里：
```bash
mkdir -p .github/workflows
# 创建工作流文件，如 hello.yml
touch .github/workflows/hello.yml
```

```
你的仓库名/                  # 仓库根目录
├── .github/                 # GitHub 专属配置目录（隐藏目录）
│   └── workflows/           # GitHub Actions 工作流目录（固定名称）
│       ├── hello.yml        # 自定义的工作流文件1（如 Hello World 示例）
│       ├── ci.yml           # 自定义的工作流文件2（如 构建测试 示例）
│       └── deploy.yml       # 自定义的工作流文件3（如 自动部署 示例）
├── src/                     # 项目源码目录（示例）
├── package.json             # 项目依赖文件（示例，Node.js 项目）
├── README.md                # 仓库说明文档
└── .gitignore               # Git 忽略文件
```

#### 2. 编写最简 Workflow（Hello World）
```yaml
# .github/workflows/hello.yml
name: Hello GitHub Actions  # 工作流名称
on: [push]                  # 触发事件：代码 push 时执行
jobs:
  say-hello:               # 作业名
    runs-on: ubuntu-latest # 运行环境：最新 Ubuntu
    steps:
      - name: Checkout code
        uses: actions/checkout@v4  # 官方 Action：拉取仓库代码
      - name: Print message
        run: echo "Hello from GitHub Actions!"  # 执行 Shell 命令
      - name: Show system info
        run: |
          echo "OS: $(lsb_release -d | cut -f2)"
          echo "Node version: $(node -v)"
```

#### 3. 提交并推送
```bash
git add .github/workflows/hello.yml
git commit -m "Add GitHub Actions hello workflow"
git push origin main
```

#### 4. 查看运行结果
1. 打开 GitHub 仓库 → 点击顶部 **Actions** 标签。
2. 找到刚触发的工作流，点击进入查看日志与执行详情。

#### 5. 常见触发事件示例
```yaml
on:
  push:
    branches: [main, develop]  # 仅推送到 main/develop 时触发
  pull_request:
    branches: [main]           # 对 main 发起 PR 时触发
  schedule:
    - cron: "0 8 * * *"        # 定时：每天 UTC 8 点（北京时间 16 点）执行
  workflow_dispatch:           # 手动触发（在 Actions 页面点击 Run workflow）
```

### 三、实战：Node.js 项目 CI（构建+测试）
```yaml
# .github/workflows/ci.yml
name: Node.js CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]  # 多版本并行测试
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'  # 缓存依赖，加速构建
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
      - name: Run tests
        run: npm test
      - name: Build project
        run: npm run build
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.node-version }}
          path: dist/  # 上传构建产物，可下载
```

### 四、实战：自动部署到服务器（SSH）
#### 1. 准备：在 GitHub 仓库添加密钥
仓库 → Settings → Secrets and variables → Actions → New repository secret：
- 名称：`SSH_PRIVATE_KEY`
- 值：你的服务器私钥（`~/.ssh/id_rsa`）

#### 2. 部署 Workflow
```yaml
# .github/workflows/deploy.yml
name: Auto Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies & build
        run: |
          npm ci
          npm run build
      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/your-project
            git pull origin main
            npm ci --production
            pm2 restart app
```

### 五、常用技巧
- **缓存依赖**：用 `actions/cache` 缓存 `node_modules`、`vendor` 等，大幅提速。
- **环境变量**：在仓库 Secrets 中存储敏感信息，通过 `${{ secrets.NAME }}` 引用。
- **矩阵构建**：`strategy.matrix` 实现多系统、多版本并行测试。
- **Artifacts（产物）**：用 `upload-artifact`/`download-artifact` 传递文件。
- **自托管 Runner**：适合特殊环境/性能需求，在 Settings → Actions → Runners 配置。

### 六、常见问题
- 工作流不触发：检查文件路径是否为 `.github/workflows/*.yml`、分支是否匹配、事件配置是否正确。
- 步骤失败：点击 Actions 日志，查看具体错误信息；优先检查依赖安装、权限、密钥配置。
- 运行超时：默认 6 小时，可在 Job 中用 `timeout-minutes` 调整。

---

需要我给你生成一个**可直接复制的 GitHub Actions 模板**，适配你的项目（Node/Python/Java/静态页）并包含**缓存、测试、部署**完整流程吗？
