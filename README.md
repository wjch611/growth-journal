# 🌟 成长日记 - 个人博客

一个基于 GitHub Pages 的轻量级个人博客，具有动态星空背景、音乐播放器、日记列表与 Markdown 文章加载功能。所有文章以 Markdown 格式存储，通过前端渲染展示，支持搜索、分页、页面滑动与炫酷的磁吸交互。

🔗 **在线地址**：[https://wjch611.github.io/growth-journal](https://wjch611.github.io/growth-journal)

---

## ✨ 功能特点

- 🎨 **动态星空背景** – 可调节速度、方向、漂移与流星密度
- 📖 **日记列表** – 从 `entries/index.json` 读取文章，支持分页与全文搜索
- 📝 **Markdown 渲染** – 使用 `marked` 解析 `.md` 文件，支持上一篇/下一篇导航
- 🎵 **音乐播放器** – 可拖拽的音乐球，点击展开控制面板，支持播放/暂停、切歌、随机/循环模式，播放时小球旋转
- 🧲 **磁吸交互** – 导航球与音乐球靠近时产生光晕连接线，距离越近效果越强，合并时自动播放音乐
- 🎛️ **可拖动按钮** – 左侧导航球、音乐球均支持鼠标/触摸拖动，位置自动吸附边缘并记忆
- 🔍 **搜索框** – 浮动搜索框，实时筛选日记标题、日期和预览内容
- 📱 **响应式设计** – 适配手机与平板

---

## 🛠️ 技术栈

- **前端**：原生 HTML / CSS / JavaScript
- **Markdown 解析**：[marked](https://cdn.jsdelivr.net/npm/marked/marked.min.js)
- **部署**：GitHub Pages
- **存储**：本地文章为 `.md` 文件 + `index.json` 索引

---

## 📁 项目结构

```
growth-journal/
├── index.html               # 主页面
├── about.md                 # 关于页面
├── assets/
│   ├── css/
│   │   └── style.css        # 所有样式
│   └── js/
│       ├── main.js          # 核心逻辑（路径处理、日记列表、加载文章）
│       ├── music.js         # 音乐控件 + 磁吸交互
│       ├── sidebar.js       # 左侧导航球与侧边栏
│       └── starfield.js     # 星空背景动画
├── entries/
│   ├── index.json           # 日记索引（标题、日期、预览、文件名）
│   └── *.md                 # 各篇日记 Markdown 文件
├── assets/music/            # 存放音频文件（如“贝加尔湖畔.mp3”）
└── README.md                # 本文件
```

---

## 🚀 本地运行

1. 克隆本仓库：
   ```bash
   git clone https://github.com/wjch611/growth-journal.git
   cd growth-journal
   ```

2. 使用任何本地服务器（如 Live Server、Python HTTP 服务器）打开 `index.html`：
   ```bash
   # 使用 Python 3
   python -m http.server 8000
   ```
   访问 `http://localhost:8000` 即可预览。

---

## 📝 添加新日记

1. 在 `entries/` 目录下新建一个 Markdown 文件，文件名建议格式：`YYYY-MM-DD.md`。
2. 在 `entries/index.json` 中添加对应条目：
   ```json
   {
     "date": "2025-02-15",
     "title": "我的新日记",
     "preview": "这是第一篇日记的摘要...",
     "filename": "2025-02-15.md"
   }
   ```
3. 如果需要更换音乐，修改 `music.js` 中的 `playlist` 数组，并确保音频文件放在 `assets/music/` 下。

---

## 🌐 部署到 GitHub Pages

本项目已配置为 GitHub Pages 站点，根目录即为 `https://wjch611.github.io/growth-journal/`。

若你想在自己的仓库中使用，只需：

1. 将本项目所有文件推送到你的 GitHub 仓库（例如 `username.github.io` 或 `username.github.io/repo`）。
2. 在仓库设置中启用 GitHub Pages，选择 `main` 分支（或 `gh-pages`）作为源。
3. 等待几分钟，即可通过 `https://username.github.io/repo` 访问。

注意：代码中的 `BASE_PATH` 已自动适配 GitHub Pages 的二级目录（`/growth-journal/`），本地开发时无需修改。

---

## ⚙️ 自定义配置

- **星空参数**：可在页面右上角的“星空调节”面板中实时调整，或修改 `starfield.js` 的默认值。
- **内容透明度**：通过滑块可调节内容背景的透明度，让星空更透。
- **音乐球位置**：拖动后会自动保存位置到 `localStorage`，刷新后保留。

---

## 📄 许可证

MIT License © 2025 wjch611

---

欢迎 star ⭐ 和贡献！如果你有任何问题或建议，请提交 Issue。
