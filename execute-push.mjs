#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🚀 开始推送到 GitHub...\n');

try {
  // 进入项目目录
  const cwd = __dirname;
  console.log(`📁 项目目录: ${cwd}\n`);

  // 检查 git 状态
  console.log('📝 检查 git 状态...');
  const status = execSync('git status', { cwd, encoding: 'utf8' });
  console.log(status.split('\n').slice(0, 10).join('\n'));
  console.log('...\n');

  // 添加文件
  console.log('📤 添加文件...');
  execSync('git add .', { cwd, stdio: 'inherit' });
  console.log('✅ 文件已添加\n');

  // 提交
  console.log('✍️  提交代码...');
  const commitMsg = 'feat: Add Taiwan stocks analyzer app with API endpoints';
  execSync(`git commit -m "${commitMsg}"`, { cwd, stdio: 'inherit' });
  console.log('✅ 代码已提交\n');

  // 推送
  console.log('🚀 推送到 GitHub...');
  execSync('git push origin main', { cwd, stdio: 'inherit' });
  console.log('✅ 推送成功！\n');

  console.log('========================================');
  console.log('✨ 完成！');
  console.log('========================================\n');
  console.log('📱 应用地址:');
  console.log('   https://stock-analyzer.vercel.app/tw.html\n');
  console.log('⏳ Vercel 将在 2-3 分钟内自动部署\n');

} catch (error) {
  console.error('\n❌ 错误:\n');
  console.error(error.message);
  console.error('\n请在 VS Code 终端中手动执行:');
  console.error('  cd C:\\Users\\Administrator\\Desktop\\sotke4');
  console.error('  git add .');
  console.error('  git commit -m "feat: Add Taiwan stocks app"');
  console.error('  git push origin main\n');
  process.exit(1);
}
