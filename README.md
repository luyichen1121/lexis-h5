# Lexis H5 — 生词本轻应用

把 Chrome 扩展 **Lexis** 改写成的**移动端 H5 网页版**（纯前端，无后端、无构建步骤）。
一个 HTML + 一个 CSS + 一个 JS + 复用扩展的离线数据 `vocab.js`。

## 运行

因为浏览器不允许 `file://` 页面发起跨域请求，需要用本地服务器打开（不能直接双击 index.html）：

```bash
cd h5-lexis
python3 -m http.server 8848
# 浏览器打开 http://localhost:8848
```

手机访问：让手机和电脑在同一 Wi-Fi，用 `http://<电脑IP>:8848`。
部署：把整个 `h5-lexis/` 目录丢到任意静态托管（GitHub Pages / Vercel / Netlify）即可，无需服务器逻辑。

## 五个页面（底部 Tab）

| Tab | 功能 |
|---|---|
| **查词** | 输入单词/短语 → 音标、发音、中文释义、英文释义、例句、词根拆解、词族、近义词；一键保存到生词本。 |
| **生词本** | 全部 / 待复习 / 最近；点开看详情（与查词界面同结构）。 |
| **复习** | 间隔重复（SRS，算法与扩展一致）：显示词 → 翻面看释义 → 重来/困难/记得/简单。 |
| **发现** | 离线推荐清单：单词（按词频）/ 短语搭配 / 习语，每项带使用场景标签，可「学习」（加入生词本）或「已掌握」（计入评估）。 |
| **我的** | 概览、词汇量估算、快速评估、设置、数据导入/导出、清空。 |

## 与扩展版的差异（诚实说明）

- **没有网页划词悬浮 chip / 右键查词 / 快捷键** —— 这些依赖扩展的 content script，网页版做不到，改为**搜索框查词**。
- **存储**：`chrome.storage.local` → 浏览器 `localStorage`（仅存本机，换设备用「我的 → 导出/导入 JSON」迁移）。
- **网络**：扩展的 background 服务worker 统一请求 → 改为**页面端直接 `fetch`**，只用 **CORS 友好**的源：
  - 释义/音标/发音/例句：`dictionaryapi.dev`
  - 中文释义：`api.mymemory.translated.net`（免费，尽力而为）
  - 近义词/词族/拼写建议：`api.datamuse.com`
  - 词根拆解 / 词频池 / 短语·习语种子：复用 `vocab.js`（完全离线）
  - 未接入需要密钥或无 CORS 的源（Youdao、Merriam-Webster、AI 富集、Discover 文章抓取等）。
- **发现**只做离线学习清单，不做文章阅读器（扩展里的文章抓取本就不稳定，见原 BUG-1）。

## 文件

```
index.html   页面骨架 + 底部 Tab
app.css      暖纸色系样式（#fbfaf7 / clay #c0603e / sage #6f9c6b，衬线标题）
app.js       全部逻辑：存储层、查词 fetch、卡片渲染、SRS、发现、评估、设置
vocab.js     从扩展 data/vocab.js 复制的离线数据 + 词根引擎（未改动）
icons/       图标
```

## 语法检查（本机无 Node）

```bash
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
"$JSC" -e 'try{new Function(readFile("app.js"));print("OK")}catch(e){print(e)}'
```
