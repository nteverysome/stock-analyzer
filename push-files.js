#!/usr/bin/env node

/**
 * 推送文件到 GitHub
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 读取 tw.html 文件
const htmlPath = path.join(__dirname, 'public/tw.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const htmlBase64 = Buffer.from(htmlContent).toString('base64');

console.log('✅ 文件已读取');
console.log(`📝 文件大小: ${htmlContent.length} 字符`);
console.log(`🔐 Base64 大小: ${htmlBase64.length} 字符`);
console.log('');
console.log('现在推送到 GitHub...');
console.log('');

// GitHub 信息
const owner = 'nteverysome';
const repo = 'stock-analyzer';
const filePath = 'public/tw.html';
const message = 'feat: Add Taiwan stocks analyzer app at /public/tw.html';

// 构建 API 请求
const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

console.log(`📤 API 端点: ${apiUrl}`);
console.log('');

// 获取 GitHub Token（从环境变量）
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('❌ 缺少 GITHUB_TOKEN 环境变量');
  console.error('请设置: set GITHUB_TOKEN=your_token');
  process.exit(1);
}

// 准备请求数据
const data = {
  message,
  content: htmlBase64,
  branch: 'main',
};

console.log('📋 请求数据:');
console.log(JSON.stringify(data, null, 2));
console.log('');

// 发送请求
const options = {
  method: 'PUT',
  headers: {
    'Authorization': `token ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Node.js Git Pusher',
  },
};

console.log('🚀 发送请求到 GitHub API...');

fetch(apiUrl, {
  ...options,
  body: JSON.stringify(data),
})
  .then(res => res.json())
  .then(body => {
    if (body.commit) {
      console.log('✅ 推送成功！');
      console.log(`📝 提交: ${body.commit.sha.substring(0, 7)}`);
      console.log(`💬 消息: ${body.commit.message}`);
      console.log('');
      console.log('🌐 GitHub 链接:');
      console.log(`   ${body.html_url}`);
      console.log('');
      console.log('📱 Vercel 应用:');
      console.log('   https://stock-analyzer.vercel.app/tw.html');
      console.log('');
      console.log('⏳ Vercel 将在 2-3 分钟内自动部署...');
    } else {
      console.error('❌ 推送失败：');
      console.error(JSON.stringify(body, null, 2));
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ 请求失败：');
    console.error(err.message);
    process.exit(1);
  });
