/**
 * 包裝腳本：運行 test-neon.js 並將結果保存到文件
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'test-neon-output.log');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

console.log('🔍 運行 Neon 連接測試...\n');
logStream.write('=== Neon Connection Test Output ===\n\n');

const child = spawn('node', ['test-neon.js'], {
  cwd: __dirname,
  stdio: 'pipe',
  shell: true
});

// 監聽 stdout
child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  logStream.write(output);
});

// 監聽 stderr
child.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output);
  logStream.write(output);
});

// 進程結束
child.on('close', (code) => {
  logStream.write(`\n\n=== Process exited with code ${code} ===\n`);
  logStream.end();
  
  console.log(`\n✅ 測試完成！結果已保存到: ${logFile}`);
  process.exit(code);
});

// 監聽錯誤
child.on('error', (err) => {
  console.error('❌ 執行失敗:', err.message);
  logStream.write(`Error: ${err.message}\n`);
  logStream.end();
  process.exit(1);
});
