# 电子绘本 — AI 助手项目指引

## 项目简介
手风琴经折页手账本交互组件。纯前端HTML/CSS/JS，手绘温暖清新风格。书本可点击展开、鼠标左右移动控制翻页、支持图片上传替换。

## 核心原则
- 纯前端，无框架，双击 index.html 即可运行
- 分7个阶段推进，每阶段完成后等待用户确认再继续
- 每次改动后更新 devlog/ 下当日日志
- 用户是不懂代码的小白，所有交互必须直观友好

## 规范文档路径

| 文档 | 路径 | 说明 |
|------|------|------|
| 项目需求 | [docs/requirements.md](docs/requirements.md) | 完整需求描述 |
| 技术规范 | [docs/tech-spec.md](docs/tech-spec.md) | 技术栈与编码规范 |
| 设计规范 | [docs/design-spec.md](docs/design-spec.md) | 颜色/字体/风格 |
| 开发步骤 | [docs/dev-steps.md](docs/dev-steps.md) | 7阶段执行步骤 |
| 开发日志 | [devlog/](devlog/) | 每日完成事项与待办 |

## 工作流程
1. 每次开始工作前，阅读 devlog/ 中最新日志了解当前进度
2. 严格按 docs/dev-steps.md 的阶段顺序推进
3. 每个阶段完成后更新当日 devlog
4. 图片资源统一放在 images/
5. 设计规范参考 docs/design-spec.md

## 关键约定
- 样式写在 css/style.css，脚本写在 js/notebook.js
- 页面容器为 #app-frame，4:3 固定比例
- 后续整合到 E:\星星网页 时，文件可平滑迁移
- 每阶段只做该阶段的事，不提前写后续阶段的代码
