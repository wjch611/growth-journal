const fs = require('fs');
const path = require('path');

const entriesDir = path.join(__dirname, 'entries');
const outputFile = path.join(__dirname, 'entries/index.json');

const files = fs.readdirSync(entriesDir)
  .filter(file => file.endsWith('.md'))
  .sort((a, b) => b.localeCompare(a)); // 倒序（最新在前）

const entries = files.map(file => {
  const content = fs.readFileSync(path.join(entriesDir, file), 'utf-8');
  const lines = content.split('\n');
  
  // 简单提取标题（第一行 # 开头的）
  let title = '未命名日记';
  if (lines[0].startsWith('#')) {
    title = lines[0].replace(/^#+\s*/, '').trim();
  }

  // 提取预览（前 100 字左右）
  let preview = lines.slice(1).join(' ').trim().slice(0, 150) + '...';

  return {
    filename: file,                // ← 关键：这里输出文件名
    date: file.replace(/\.md$/, ''), // 或从文件名解析日期
    title,
    preview
  };
});

fs.writeFileSync(outputFile, JSON.stringify(entries, null, 2), 'utf-8');
console.log(`Generated ${entries.length} entries`);
