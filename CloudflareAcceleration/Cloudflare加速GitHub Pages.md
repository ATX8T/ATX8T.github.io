# 另一个GitHub Pages地址
[https://chuyanzhio.github.io/](https://chuyanzhio.github.io/)

# Cloudflare 加速
- Cloudflare 可以对两个甚至更多个 GitHub Pages 站点进行加速。
- Cloudflare 的 CDN 加速功能无法直接加速GitHub Pages中跨仓库的资源。
- 使用 Cloudflare 加速 GitHub Pages 需要一个自定义域名

# Cloudflare加速GitHub Pages 实验
- 使用账户GitHub
- ChuYanZhi3026@outlook.com
- GitHub挂入--->cloudflare
  
# 不想买域名，有没有“曲线救国”方法？Cloudflare Workers 反向代理 github.io
- 缺点：不稳定，复杂，有缓存问题，SEO差

配置git 推送到指定GitHub 账户
```
git config --global user.name "ChuYanZhi3026"
git config --global user.email "ChuYanZhi3026@outlook.com"
```
配置_config.yml 文件
```
# Deployment
## Docs: https://hexo.io/docs/one-command-deployment
deploy:
  type: ''
````
  如下
  ```
# Deployment
## Docs: https://hexo.io/docs/one-command-deployment
deploy:
  type: git  # 部署类型为git
  repo: https://github.com/ChuYanZhio/ChuYanZhio.github.io.git  # 你的GitHub仓库地址
  branch: main  # 部署到的分支（GitHub Pages通常用main或master，根据你的仓库默认分支调整）
  message: "Site updated: {{ now('YYYY-MM-DD HH:mm:ss') }}"  # 部署时的提交信息，可选
  ```
