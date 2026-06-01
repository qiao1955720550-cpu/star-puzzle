# 技术规范

## 技术栈
- **前端三件套**：HTML5 + CSS3 + JavaScript (ES6+)
- **无框架**：不依赖 React/Vue/jQuery 等任何第三方库
- **无构建工具**：不需要 npm/node/webpack，直接浏览器运行

## 浏览器兼容
- 目标：Chrome、Edge、Firefox 最新版
- 使用标准 API，不依赖实验性特性

## 编码规范

### HTML
- 语义化标签（header/main/section）
- 所有视图用 div 容器切换显示/隐藏
- 图片使用相对路径

### CSS
- 统一写在 style.css
- 使用 CSS 变量定义颜色/字体
- 动画用 @keyframes，过渡用 transition
- 像素风使用 box-shadow 模拟像素点
- 响应式暂不做，优先桌面端体验

### JavaScript
- 统一写在 game.js
- 使用 ES6+ 语法（const/let、箭头函数、模板字符串）
- 游戏状态集中管理在一个 state 对象中
- 事件监听统一在初始化函数中注册

## 数据存储
- localStorage 存储游戏进度
- 存储结构：
```js
{
  stories: [1, 2, 3],      // 已解锁故事ID
  fragments: [1, 2],       // 已收集碎片ID
  puzzleCompleted: false   // 拼图是否完成
}
```

## 拖拽实现
- 使用 Pointer Events（兼容鼠标和触屏）
- DIY模式：绝对定位 + transform
- 拼图模式：判断拖放位置，自动吸附

## 动画方案
- CSS Animations：星星闪烁、粒子飘浮、按钮交互
- JS 定时器：打字机逐字效果
- requestAnimationFrame：流畅的拖拽体验

## 性能要求
- 所有动画使用 transform/opacity（GPU加速）
- 避免强制同步布局
- 图片资源控制在合理大小
