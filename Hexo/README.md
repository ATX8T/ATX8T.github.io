# 这是一个hexo笔记文档


# Hexo 使用
```
安装 Hexo
npm install -g hexo-cli


安装 Hexo 完成后，请执行下列命令，Hexo 将会在指定文件夹中新建所需要的文件。
hexo init <folder>
cd <folder>
npm install

hexo init niubi
cd niubi
npm install

_config.yml  网站的 配置 文件。 您可以在此配置大部分的参数。
package.json  应用程序的信息。 EJS, Stylus 和 Markdown 渲染引擎 已默认安装，您可以自由移除。 如果您想，可以稍后卸载它们。


生成静态文件
hexo generate  # 简写：hexo g
# 启动本地服务，默认端口 4000
hexo server  # 简写：hexo s

hexo clean  # 清空 public 目录和缓存


重启服务生效
hexo clean && hexo g && hexo s


部署到服务器 / 平台（可选，比如 GitHub Pages）需要先安装部署插件
npm install hexo-deployer-git --save

执行部署
hexo deploy  # 简写：hexo d
```

# 在 GitHub Pages 上部署 Hexo
- 已有 GitHub 账号
- 本地已安装 Git 并配置好 GitHub 账号（关联用户名和邮箱
```
    # 配置 Git 用户名（替换成你的 GitHub 用户名）
    git config --global user.name "你的GitHub用户名"
    # 配置 Git 邮箱（替换成你的 GitHub 注册邮箱）
    git config --global user.email "你的GitHub邮箱@xxx.com"

git config --global user.name "ATX8T"
git config --global user.email "gyt56863696@193.com"


```



- 进入你的 Hexo 项目根目录（比如 my-hexo-blog），执行命令安装 Git 部署插件：
```
    npm install hexo-deployer-git --save    
```




- 打开项目根目录的 _config.yml 文件 （建议用 VS Code 等编辑器打开），找到末尾的 deploy 配置项，修改为以下内容：
```
# Deployment
## Docs: https://hexo.io/docs/one-command-deployment
deploy:
  type: git
  # 替换成你刚创建的仓库地址（HTTPS 或 SSH 都可以，推荐 SSH）
  # HTTPS 地址示例：https://github.com/你的用户名/你的用户名.github.io.git
  # SSH 地址示例：git@github.com:你的用户名/你的用户名.github.io.git
  repo: https://github.com/你的用户名/你的用户名.github.io.git
  branch: main  # 分支名，GitHub 新版默认是 main，旧版是 master，根据你的仓库分支调整
  message: "Site updated: {{ now('YYYY-MM-DD HH:mm:ss') }}"  # 部署时的提交信息（可选）

  注意：_config.yml 中配置项的冒号 : 后面必须加空格（比如 type: git 而不是 type:git），否则会报错。



# Deployment
## Docs: https://hexo.io/docs/one-command-deployment
deploy:
  type: git
  repo: https://github.com/ATX8T/Hexo.git
  branch: main  # 或 master（根据你的仓库默认分支调整）
  message: "Site updated: {{ now('YYYY-MM-DD HH:mm:ss') }}"  # 可选：部署提交的备注信息


```


- 执行部署命令
```
    # 清理缓存和 public 目录
    hexo clean
    # 生成静态文件
    hexo generate  # 简写：hexo g
    # 部署到 GitHub
    hexo deploy    # 简写：hexo d
    首次部署时，如果用 HTTPS 地址，会弹出 GitHub 账号验证
```

# 跨仓库部署hexo  不然无法显示
- 编辑 Hexo 项目根目录的_config.yml，修改  添加root
```
url: https://atx8t.github.io  # 根域名
root: /Hexo/  # 跨仓库的仓库名，必须以/开头和结尾
```


# 替换主题--- 下载并安装新主题
```
# 进入 Hexo 博客根目录
cd /你的/hexo/项目路径

# 克隆主题到 themes 文件夹（以 next 主题为例）
git clone https://github.com/hexojs/hexo-theme-next.git themes/next

# 如果是其他主题，替换仓库地址即可，比如克隆 butterfly 主题：
# git clone https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly

如果主题没有 git 仓库，可直接下载 zip 包，解压后放到 themes 文件夹下，

配置 Hexo 启用新主题
打开 Hexo 根目录的 _config.yml 文件
# 找到 theme 字段，将默认的 landscape 替换为你刚安装的主题文件夹名
theme: next  # 如果你安装的是 butterfly，就改为 theme: butterfly

```