# 技术规范

## 技术栈
- HTML5
- CSS3（变量、动画、渐变、3D变换）
- 原生 JavaScript（ES6+）
- 无框架、无构建工具、无依赖

## 文件结构
```
e:\电子绘本\
├── index.html          # 主页面
├── CLAUDE.md           # AI助手指引
├── css/
│   └── style.css       # 所有样式
├── js/
│   └── notebook.js     # 所有脚本
├── images/             # 图片资源
├── docs/               # 规范文档
└── devlog/             # 开发日志
```

## 编码规范

### HTML
- 语义化标签
- 所有内容在 `#app-frame` 容器内
- 使用 data-* 属性传递数据

### CSS
- 变量统一在 `:root` 定义
- 类名使用 kebab-case
- 动画使用 transition/transform，避免触发 layout
- 桌面端优先，固定 4:3 画幅

### JavaScript
- 使用 ES6+ 语法
- DOM 操作集中管理
- 事件委托优先
- 避免全局变量污染（使用 IIFE 或命名空间）
- 图片上传使用 FileReader API

## 性能要求
- 动画帧率 ≥ 30fps
- 避免频繁 DOM 操作
- 图片预览使用 createObjectURL 而非 base64
