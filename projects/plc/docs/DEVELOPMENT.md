# PLC 工具集 — 开发规范

## 目录结构

```
projects/plc/
├── index.html                     # 项目入口 / 工具导航页
├── docs/
│   ├── README.md                  # 项目说明
│   └── DEVELOPMENT.md             # 开发规范（本文件）
├── tools/
│   ├── siemens/                   # 西门子 PLC 工具
│   │   ├── s7-200-smart/
│   │   │   ├── addressing.html            # 寻址工具
│   │   │   ├── modbus-address-calc.html    # Modbus RTU 地址 快捷工具
│   │   │   └── poll-slave-table.html       # Poll 主站 / Slave 工具
│   │   └── ...                            # 其他西门子系列
│   └── ...                        # 其他品牌（三菱、欧姆龙等）
└── .gitignore
```

### 层级规则

| 层级 | 目录 | 说明 |
|------|------|------|
| 1 | `tools/` | 所有工具根目录 |
| 2 | `tools/<品牌>/` | 品牌名，全小写英文 |
| 3 | `tools/<品牌>/<系列>/` | PLC 系列型号 |
| 4 | `tools/<品牌>/<系列>/<工具>.html` | 独立工具文件 |

示例：
```
tools/siemens/s7-200-smart/addressing.html     ✅ 正确
tools/Siemens/S7-200/addr.html                  ❌ 大小写不规范
tools/siemens_s7-200.html                       ❌ 层级缺失
```

---

## 文件规范

### 工具文件
- **格式**：单文件 HTML（CSS / JS 内联），零外部依赖
- **命名**：全小写英文 + 连字符分隔，如 `addressing.html`、`cross-ref.html`
- **<title>**：须包含品牌 + 系列 + 工具名，格式 `品牌 系列 — 工具名`

### 文档文件
- **格式**：Markdown（`.md`）
- **命名**：全大写英文 + 下划线，如 `DEVELOPMENT.md`、`README.md`

### 图像 / 资源（如需添加）
- 放置在对应工具同级目录的 `assets/` 下
- 示例：`tools/siemens/s7-200-smart/assets/icon.png`

---

## 代码规范

### HTML 结构
- 使用 HTML5 `<!DOCTYPE html>`
- `<meta charset="UTF-8">` 放在 head 最前
- `<style>` 放在 `<head>` 中，`<script>` 放在 `</body>` 前
- 中文字体栈：`'Segoe UI', 'Microsoft YaHei', sans-serif`
- 等宽字体栈：`'Consolas', monospace`

### CSS 规范
- 使用 `* { margin:0; padding:0; box-sizing:border-box; }` 统一重置
- 颜色体系：
  - 主色：`#4a90d9`（蓝）
  - 背景：`#f2f4f7`（浅灰）
  - 卡片背景：`#fff`
  - 卡片边框：`#e4e7ed`
  - 成功/ON：`#d4edda` / `#0d6b2e`（绿）
  - 错误/OFF：`#e6423a`（红）
  - 高亮选中：`#ffd6e7` / `#f08cb4`（粉）
- 避免内联样式，除非仅用于极少量的一次性调整
- 表单元素禁用态统一使用 `cursor:not-allowed; opacity:.5;`

### JavaScript 规范
- ES5 语法（兼容老旧工控机浏览器）
- 变量声明使用 `var`
- 函数命名：`camelCase`，动词开头（`parseAddr`、`renderCards`）
- 常量命名：`UPPER_SNAKE_CASE`
- 全局状态集中定义在文件顶部，加注释说明

### 命名速查

| 类型 | 规范 | 示例 |
|------|------|------|
| 目录 | `kebab-case` | `s7-200-smart` |
| 文件 | `kebab-case` + `.html` | `addressing.html` |
| CSS class | `kebab-case` | `.val-row`、`.card-head` |
| CSS id | `camelCase` | `#btnSet`、`#vHex` |
| JS 变量 | `camelCase` | `currentParsed` |
| JS 常量 | `UPPER_SNAKE` | `ADDR_RANGE` |
| JS 函数 | `camelCase` + 动词 | `parseAddr()`、`setAssignEnabled()` |

---

## 添加新工具流程

1. 在 `tools/<品牌>/<系列>/` 下创建单文件 HTML
2. 在 `index.html` 对应品牌区域添加工具卡片：
   ```html
   <a class="card" href="tools/<品牌>/<系列>/<工具>.html">
     <h3><span class="dot"></span>工具名</h3>
     <p>简要描述...</p>
     <span class="tag">系列标签</span>
   </a>
   ```
3. 如为新品牌，在 `index.html` 和 `docs/README.md` 中新增品牌区块
4. 更新 `docs/README.md` 工具清单表格

---

## 兼容性目标

| 环境 | 最低版本 |
|------|----------|
| Chrome | 49+ |
| Edge | 14+ |
| Firefox | 52+ |
| IE | 无需支持 |
