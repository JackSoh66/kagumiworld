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

`.github/workflows/daily.yml` 已配置：**每天马来西亚时间 09:17（UTC 01:17）**。GitHub 的排程可能延迟，不保证精确到分钟。它也支持在 Actions 中通过 **Run workflow** 手动触发。

启用前，需要在 [仓库的 Actions secrets 设置](https://github.com/JackSoh66/kagumiworld/settings/secrets/actions) 中添加名为 **`OPENAI_API_KEY`** 的有效 OpenAI API Key。只在 GitHub 的安全输入框中填写值，不要写进代码、issue 或聊天。这个 GitHub Actions secret 与 Codex 云环境的变量是不同的配置。有效 API 额度是运行前提；模型调用会产生 API 费用，ChatGPT 订阅不会自动提供此 Key 或额度。

工作流推送到默认分支后，确认仓库允许 Actions 运行。分支保护若禁止 Actions 直接向 `main` 推送，需要仓库管理员允许相应 bot 或另行采用 PR 流程。只有配置了可用凭证并且首次真实运行成功后，才算每日生成已经启用。GitHub 对长期无活动的公开仓库可能停用定时任务；可在 Actions 页重新启用。

本次首次云端验证（2026-10-21，马来西亚时间）遇到了 GitHub 账号级阻塞：CI 与手动每日任务均在 runner 启动前失败，检查注释为 **“The job was not started because your account is locked due to a billing issue.”** 需仓库所有者先在 [GitHub Billing](https://github.com/settings/billing) 解除账号限制，再在 Actions 中重新运行。此时没有执行模型生成，也未确认 Actions secret 是否可用；本地构建、开发与生产模式的浏览器测试已通过。

每日流程：

1. 按 `Asia/Kuala_Lumpur` 计算日期；已有当天作品就跳过，避免重复和重复 API 消费。
2. 抓取 Awwwards、Codrops、GitHub Trending、Motion；保留可访问状态与实际内容。至少两个来源可读才继续。Codex 可用 web search 进一步研究。
3. 结合最近的作品判断方向，制作一个完整的新网页。不会每天只替换颜色和文案。
4. 增加独立页面、预览、作品索引、中文研究笔记与真实交互测试。
5. 单独检查改动范围、历史保留、构建和桌面/移动版浏览器测试。失败会阻止提交。
6. 单独的发布 job 在确认 `main` 没有发生新提交后，将验证过的变更提交并推送。如果分支发生变化则停止；不会强制推送覆盖他人工作。

生成 job 只有仓库读取权限；提交 job 才获得写入权限。排程并不依赖聊天窗口或这台临时云机器持续运行。单次生成 job 上限 45 分钟；这不是金额上限，建议同时在 OpenAI 项目中设置合适的预算与用量提醒。

## 作品结构

```text
data/experiments.json                  作品索引
public/experiments/YYYY-MM-DD-slug/    独立的 HTML / CSS / JS 作品
public/previews/YYYY-MM-DD-slug.svg    本地预览
research/YYYY-MM-DD.md                 实际来源、选择理由、交互及检查记录
tests/YYYY-MM-DD.spec.js               当天作品的行为测试
.github/prompts/daily.md               每日创作任务
```

日常创作只增加当天的新文件和一条索引。保持旧作品、共享画廊、依赖和工作流不变。作品必须可触控、可键盘操作、适配小屏幕并尊重减少动态效果偏好。禁止空按钮、伪造数据和未经证实的“流行”宣称。灵感来自参考，代码与设计需要原创。

首页使用的本地字体为 DM Sans 和 Manrope；原始 SIL Open Font License 与版权声明保存在 `public/licenses/`，会随构建一起分发。

## 停止或调整

在 Actions 页停用 **Daily creative practice** 可停止每日运行。修改 `daily.yml` 的 cron 可调整时间；修改 `.github/prompts/daily.md` 可调整创作方向。删除模型 secret 会让新日期的任务明确失败，而不会生成假作品。每日笔记与 Actions 的 `daily-evidence` artifact 可用于追踪实际结果。
