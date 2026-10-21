# Kagumi World ✳

一个不断生长的网页交互作品集。每天研究真实的参考资料，自主决定做什么，再完成一个能使用的新作品。可以是 landing page、小系统、创意工具，或者突发奇想。旧作品一直保留。

第一个作品是 **Afterlight**：一个可调整色彩、运动与细节的生成式光场，可以暂停、重混、响应指针并导出 PNG。首页提供分类、搜索和独立作品入口。

## 开发

需要 Node.js 24（最低 24.5，研究脚本使用 Node 提供的环境代理支持）。

```bash
npm ci
npm run dev
```

生产构建及实际浏览器检查：

```bash
npm run build
npm run test:automation
# 若机器没有 /usr/bin/chromium，首次运行前安装浏览器：
npx playwright install --with-deps chromium
npm test
```

测试会启动生产预览服务，覆盖桌面、移动版、过滤搜索、作品入口和具体交互。截图、失败追踪和 HTML 报告保存在忽略的 `test-results/` 与 `playwright-report/`。云环境默认 npm 缓存不可写时，使用 `npm_config_cache=/workspace/.cache/npm npm ci`。

作品可作为 `dist/` 下的纯静态网站部署。构建采用相对路径，支持 `/kagumiworld/` 这类子目录。当前仓库流程负责制作、验证和推送代码；公开站点托管需另行连接静态托管服务。

## 每天自主创作

每日创作使用 **Codex 自己的 Automations**。建议时间为每天马来西亚时间 **09:17（UTC 01:17）**。GitHub Actions 的每日生成和 CI 工作流已移除；GitHub 仅作为仓库与推送目的地，不需要为此配置 Actions 的模型 API Key 或启动 GitHub runner。

请按 [Codex 自动化设置](automation/README.md) 在 Codex 中选择本项目、设置时间，并粘贴其中提供的任务指令。详细执行规范在 [每日创作任务](automation/daily.md)，包括自主选题、验证与直接提交推送的授权。

**状态：仓库已经准备好，Codex 定时任务尚未登记。** 当前会话的工具与 Codex CLI 没有提供创建 Automation 的入口；保存指令和推送代码不会自动建立排程。实际登记后，需要在 Codex 界面确认启用状态与下次运行时间。执行使用所选 Codex 账户的额度和项目环境，仍需要正常的网络、文件写入与 Git 推送权限。

每日流程：

1. 在 Codex 任务中运行 `npm run daily:prepare`，按 `Asia/Kuala_Lumpur` 计算并固定日期；已有当天作品就跳过。
2. 抓取 Awwwards、Codrops、GitHub Trending、Motion；保留可访问状态与实际内容。至少两个来源可读才继续。Codex 可用 web search 进一步研究。
3. 结合最近的作品判断方向，制作一个完整的新网页。不会每天只替换颜色和文案。
4. 增加独立页面、预览、作品索引、中文研究笔记与真实交互测试。
5. 在 Codex 任务环境运行改动范围校验、历史保留检查、构建、自动化测试和桌面/移动版浏览器测试。失败会阻止提交。
6. Codex 在确认 `main` 没有发生新提交后，将通过验证的文件 commit 并 push，再核对远端 SHA。如果分支发生变化则停止；不会强制推送覆盖他人工作。

无需每天再次确认选题或提交。Codex 自己的自动化调度负责后续触发；不要依赖此聊天进程、临时云机器或仓库中的配置文件持续运行。

## 作品结构

```text
data/experiments.json                  作品索引
public/experiments/YYYY-MM-DD-slug/    独立的 HTML / CSS / JS 作品
public/previews/YYYY-MM-DD-slug.svg    本地预览
research/YYYY-MM-DD.md                 实际来源、选择理由、交互及检查记录
tests/YYYY-MM-DD.spec.js               当天作品的行为测试
automation/daily.md                    Codex 每日创作任务
automation/README.md                   Codex 自动化登记说明和可粘贴指令
```

日常创作只增加当天的新文件和一条索引。保持旧作品、共享画廊、依赖和工作流不变。作品必须可触控、可键盘操作、适配小屏幕并尊重减少动态效果偏好。禁止空按钮、伪造数据和未经证实的“流行”宣称。灵感来自参考，代码与设计需要原创。

首页使用的本地字体为 DM Sans 和 Manrope；原始 SIL Open Font License 与版权声明保存在 `public/licenses/`，会随构建一起分发。

## 停止或调整

在 Codex 的 Automations 界面暂停或编辑任务，可以停止运行或调整时间。修改 `automation/daily.md` 可以调整创作方向，不能代替在 Codex 中修改调度。通过每日研究笔记、Codex 任务的检查结果和 Git 提交追踪真实交付。
