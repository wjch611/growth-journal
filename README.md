# 🌌 Growth Journal - 个人成长日记博客

一个基于 **GitHub Pages** 的轻量级个人博客系统。  
博客以 **Markdown 文件作为内容源**，通过前端 JavaScript 动态加载并渲染文章，同时提供动态星空背景、音乐播放器、磁吸交互、搜索与分页等功能。

🔗 在线地址  
https://wjch611.github.io/growth-journal

---

# ✨ 功能特点

### 🌌 动态星空背景

- Canvas 实现的星空动画

- 支持调节：
  
  - 星星密度
  
  - 星空旋转
  
  - 水平/垂直漂移
  
  - 流星出现频率

- 星空参数可以通过页面控制面板实时调整

---

### 📝 Markdown 日记系统

所有文章以 **Markdown 文件**存储：

- 自动加载 `entries/index.json`

- 点击列表即可阅读

- 支持上一篇 / 下一篇导航

- 支持代码块高亮与 Markdown 语法

---

### 🔍 日记搜索

浮动搜索框支持：

- 按标题搜索

- 按日期搜索

- 按摘要搜索

输入后会 **实时过滤文章列表**。

---

### 🎵 音乐播放器

页面右侧有一个 **可拖拽的音乐球**：

功能包括：

- 播放 / 暂停

- 上一首 / 下一首

- 随机播放

- 单曲循环

- 自动旋转动画（播放时）

音乐球拖动后会：

- 自动吸附到屏幕边缘

- 位置保存到 `localStorage`

- 刷新页面仍保持原位置

---

### 🧲 磁吸交互

导航球与音乐球靠近时：

- 会出现 **发光连接线**

- 距离越近光效越强

- 重合时自动播放音乐

这是一个纯前端实现的 **交互视觉效果**。

---

### 📱 响应式设计

博客适配：

- PC

- 平板

- 手机

在小屏幕设备上布局会自动调整。

---

# 🧰 技术栈

| 技术              | 用途          |
| --------------- | ----------- |
| HTML / CSS / JS | 页面结构与交互     |
| Canvas          | 星空动画        |
| marked.js       | Markdown 渲染 |
| GitHub Pages    | 网站托管        |
| localStorage    | 保存用户设置      |

Markdown 解析使用 CDN：

```
https://cdn.jsdelivr.net/npm/marked/marked.min.js
```

---

# 📁 项目结构

```
growth-journal
│
├── index.html                # 博客主页面
├── about.md                  # 关于页面
├── README.md                 # 项目说明
├── generate-index.js         # 自动生成文章索引
│
├── assets
│   │
│   ├── css
│   │   ├── style.css         # 所有页面样式
│   │   └── head.jpg          # 音乐球头像图片
│   │
│   ├── img
│   │   └── 1.jpg             # 站点图片资源
│   │
│   ├── js
│   │   ├── main.js           # 核心逻辑（加载文章 / 搜索 / 渲染）
│   │   ├── music.js          # 音乐播放器与磁吸效果
│   │   ├── sidebar.js        # 左侧导航球逻辑
│   │   └── starfield.js      # 星空背景动画
│   │
│   └── music
│       └── 贝加尔湖畔.mp3     # 音乐文件
│
└── entries
    │
    ├── index.json            # 文章索引（自动生成）
    ├── about.md
    │
    ├── 2026-03-03.md
    ├── 2026-03-04.md
    ├── 2026-03-05.md
    ├── 2026-03-06.md
    ├── 2026-03-07.md
    ├── 2026-03-08.md
    ├── 2026-03-09.md
    └── 2026-03-10.md
```

---

# 🚀 本地运行

克隆仓库：

```
git clone https://github.com/wjch611/growth-journal.git
cd growth-journal
```

启动本地服务器：

```
python -m http.server 8000
```

浏览器访问：

```
http://localhost:8000
```

---

# ✍️ 写新日记

### 1 创建 Markdown 文件

在 `entries/` 目录创建新文章：

```
YYYY-MM-DD.md
```

例如：

```
2026-03-11.md
```

---

### 2 编写 Markdown 内容

示例：

```
# 今天的学习记录

今天学习了：

- Linux
- Nginx
- Git

## 收获

感觉进步了一点。
```

---

### 3 更新文章索引

写完文章后 **必须执行**：

```
node generate-index.js
```

这个脚本会：

- 扫描 `entries/` 文件夹

- 自动更新 `entries/index.json`

- 生成文章列表索引

否则新文章 **不会出现在博客列表中**。

---

# 🎵 添加音乐

步骤：

### 1 放入音乐文件

将音乐文件放入：

```
assets/music/
```

例如：

```
assets/music/song.mp3
```

---

### 2 修改 `music.js`

在 `playlist` 中添加音乐：

```javascript
const playlist = [
  "assets/music/贝加尔湖畔.mp3",
  "assets/music/song.mp3"
];
```

刷新页面即可。

---

# 🖼 修改音乐头像

音乐球头像图片位于：

```
assets/css/head.jpg
```

替换该文件即可更换头像。

---

# ✏️ 修改首页格言

首页的格言 **需要手动修改**：

文件：

```
assets/js/main.js
```

在代码中找到类似：

```
const quotes = [
  "格言1",
  "格言2"
];
```

手动添加即可。

---

# ⚙️ 自定义配置

### 星空默认参数

文件：

```
assets/js/starfield.js
```

可以修改：

- 星星数量

- 漂移速度

- 流星概率

---

### 页面样式

文件：

```
assets/css/style.css
```

可调整：

- 背景透明度

- 面板样式

- 动画效果

---

# 🌍 部署到 GitHub Pages

1 推送代码到 GitHub

```
git add .
git commit -m "update"
git push
```

2 打开仓库 **Settings**

3 找到 **Pages**

4 选择：

```
Branch: main
Folder: /root
```

等待几分钟即可访问：

```
https://username.github.io/repo
```

---

# 📜 License

MIT License

---

# ⭐ 结语

这是一个 **极简但高度可定制的个人博客系统**：

特点：

- 无后端

- Markdown 写作

- Git 管理内容

- GitHub Pages 免费托管

适合：

- 写成长日记

- 技术笔记

- 个人记录

如果你觉得这个项目有帮助，欢迎点个 ⭐。
