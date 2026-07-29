# PLC 工具集

面向工业自动化工程师的 PLC 调试与开发辅助工具集合，全部为单文件 HTML，浏览器打开即用，无需安装。

## 工具清单

| 工具 | 品牌 | 系列 | 说明 |
|------|------|------|------|
| [寻址工具](../tools/siemens/s7-200-smart/addressing.html) | Siemens | S7-200 SMART | 地址空间拆解演示，输入任意地址自动展开 DWORD/WORD/BYTE/BIT |
| [Modbus RTU 参考表](../tools/siemens/s7-200-smart/modbus-rtu.html) | Siemens | S7-200 SMART | Modbus 地址映射对照表、功能码与寄存器类型速查 |
| [Modbus 地址计算器](../tools/siemens/s7-200-smart/modbus-address-calc.html) | Siemens | S7-200 SMART | Modbus Addr 双向换算、MBUS_MSG 指令参数模拟 |
| [Poll 主站 / Slave 工具](../tools/siemens/s7-200-smart/poll-slave-table.html) | Siemens | S7-200 SMART | 自动生成 Mbslave 寄存器表，支持导出 |

## 使用方式

1. 浏览器打开 `index.html` 入口页，点击工具卡片
2. 或直接打开 `tools/` 下对应的 `.html` 文件

## 目录说明

```
projects/plc/
├── index.html                     # 入口导航页
├── docs/                          # 文档
│   ├── README.md                  # 项目说明（本文件）
│   └── DEVELOPMENT.md             # 开发规范
└── tools/                         # 工具目录
    └── <品牌>/
        └── <系列>/
            └── <工具>.html
```

## 技术栈

- 纯静态 HTML5 单文件（CSS / JS 内联）
- 零外部依赖，无构建步骤
- ES5 语法，兼容工控机老旧浏览器
