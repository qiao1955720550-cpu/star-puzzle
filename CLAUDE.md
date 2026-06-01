# 星星网页 — AI 助手项目指引

## 项目简介
交互式网页寻宝游戏。像素风小女孩房间中探索物品、触发7段祖孙回忆故事、收集6块拼图碎片，拼出合照。另有DIY模式自由拖拽家具。

## 核心原则
- 用户是不懂代码的小白，所有交互必须直观友好
- 纯前端，无框架，双击 index.html 即可运行
- 分7个阶段推进，每阶段完成后等待用户确认再继续
- 每次改动后更新 devlog/ 下当日日志

## 规范文档路径

| 文档 | 路径 | 说明 |
|------|------|------|
| 项目需求 | [docs/requirements.md](docs/requirements.md) | 完整需求描述 |
| 技术规范 | [docs/tech-spec.md](docs/tech-spec.md) | 技术栈与编码规范 |
| 设计规范 | [docs/design-spec.md](docs/design-spec.md) | 颜色/字体/三种美术风格 |
| 资源清单 | [docs/assets-spec.md](docs/assets-spec.md) | 图片/音频规格与命名 |
| 开发步骤 | [docs/dev-steps.md](docs/dev-steps.md) | 7阶段执行步骤 |
| 开发日志 | [devlog/](devlog/) | 每日完成事项与待办 |

## 工作流程
1. 每次开始工作前，阅读 [devlog/](devlog/) 中最新日志了解当前进度
2. 严格按 [docs/dev-steps.md](docs/dev-steps.md) 的阶段顺序推进
3. 每个阶段完成后更新当日 devlog
4. 图片资源统一放在 [images/](images/) 对应子文件夹
5. 设计规范参考 [docs/design-spec.md](docs/design-spec.md)

## 关键约定
- 所有样式集中写在 [css/style.css](css/style.css)
- 所有脚本集中写在 [js/game.js](js/game.js)
- 房间物品图片可被用户替换，文件名固定不可改
- 背景音乐由用户提供，路径 [audio/bgm.mp3](audio/bgm.mp3)
- 开场动画由用户提供
