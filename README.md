# ATX8T

开源工具集 · 基于 GitHub Pages 的项目聚合站点。

## 目录结构

```
/
├── index.html              # 首页 (自动聚合所有项目)
├── projects.json           # 项目注册清单
├── projects/               # 所有功能项目
│   ├── converter/          # 链接转换工具
│   │   ├── index.html
│   │   ├── style.css
│   │   └── main.js
├── assets/                 # 共享资源
│   └── bootstrap/
│       ├── css/bootstrap.min.css
│       └── js/bootstrap.bundle.min.js
├── Resource/               # 资源存储 (按类型分类)
│   ├── images/             # 图片 (png/jpg/gif/webp)
│   ├── videos/             # 视频 (mp4/webm/mov)
│   ├── installer/          # 安装包 (exe/apk/msi/dmg)
│   ├── git/                # Git 相关 (bundle/pack)
│   └── other/              # 其他文件
└── README.md               # 本文件
```

## 如何新增项目

**只需 3 步，首页自动生效：**

### 1. 创建项目目录

```
projects/your-project/
├── index.html      # 入口页面
├── style.css       # 项目样式
└── main.js         # 项目逻辑
```

### 2. 注册到 projects.json

在 `projects` 数组中添加：

```json
{
  "id": "your-project",
  "name": "项目名称",
  "icon": "🔧",
  "desc": "项目描述",
  "path": "projects/your-project/",
  "tags": ["标签1", "标签2"]
}
```

### 3. 推送即上线

```bash
git add . && git commit -m "新增项目: your-project" && git push
```

首页会自动显示新项目卡片。

## 项目规范

| 约定 | 说明 |
|------|------|
| 目录名 | 小写英文，用 `-` 分隔，如 `url-converter` |
| 入口文件 | 统一使用 `index.html` |
| 资源引用 | Bootstrap: `../../assets/bootstrap/css/bootstrap.min.css` |
| 返回到首页 | `<a href="/">← 首页</a>` |
| 样式 | 每个项目独立 `style.css`，不修改全局样式 |

## 字段说明 (projects.json)

```jsonc
{
  "site": {                     // 站点全局信息
    "title": "ATX8T",       // 网站标题
    "desc": "开源工具集",        // 首页描述
    "footer": "Powered by ..."  // 页脚文字
  },
  "projects": [                 // 项目列表
    {
      "id": "唯一标识",          // 用于锚点等
      "name": "显示名称",
      "icon": "🔧",             // 单字符 emoji
      "desc": "简短描述 (20字内)",
      "path": "projects/xxx/",  // 相对路径，以 / 结尾
      "tags": ["tag1", "tag2"]  // 标签列表
    }
  ]
}
```
