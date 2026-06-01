# 设计规范

## 整体基调
手绘温暖清新感。像一本真正的手工经折页手账本，有纸张质感、手写痕迹的感觉。

## 配色方案

```css
:root {
  --bg-cream: #FBF7F0;        /* 浅米色背景 */
  --grid-brown: #E0D5C5;      /* 浅棕色网格线 */
  --paper: #FFFDF7;           /* 纸张白 */
  --paper-shadow: #E8DDD0;    /* 纸张阴影 */
  --cover-warm: #F5E6D3;      /* 封面暖米色 */
  --cover-accent: #D4A574;    /* 封面装饰色 */
  --text: #5D4E3F;            /* 文字暖棕 */
  --text-light: #9B8E7E;      /* 浅文字 */
  --hint: #C4A882;            /* 提示文字/装饰 */
  --shadow: rgba(180, 160, 140, 0.2); /* 柔阴影 */
}
```

## 背景纹理

### 网格纹（默认）
用 CSS repeating-linear-gradient 实现：
- 线色：--grid-brown
- 网格大小：24px × 24px
- 线条粗细：1px

### 波点纹（备选）
用 CSS radial-gradient 实现：
- 点色：--grid-brown
- 点间距：20px
- 点大小：2px

## 书本尺寸
- 封面（闭合时）：约 60px × 180px（视觉厚度）
- 对开页（展开后每格）：约 160px × 200px
- 经折页总展开宽度：约 1280px（8格 × 160px）

## 字体
- 标题/正文：系统默认中文字体
- 提示文字："KaiTi", "STKaiti", serif
- 字号：正文14-16px，提示12px

## 动效规范
- 封面展开：0.8s ease-out
- 翻页过渡：0.3s ease
- 按钮 hover：轻微放大(1.05x)
- 提示文字：淡入淡出

## 纸张效果
- 对开页面板有轻微阴影（box-shadow）
- 面板边缘有细微圆角（2-4px）
- 折叠处有一条细线模拟折痕
