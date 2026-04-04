#!/usr/bin/env node

/**
 * 執行數據填充並保存日誌
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'populate-log.txt');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

console.log('開始執行數據填充...\n');
logStream.write('=== 數據填充日誌 ===\n');
logStream.write(`開始時間: ${new Date().toISOString()}\n\n`);

const child = spawn('node', ['populate-data.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  logStream.write(output);
});

child.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output);
  logStream.write(output);
});

child.on('close', (code) => {
  logStream.write(`\n結束時間: ${new Date().toISOString()}\n`);
  logStream.write(`退出碼: ${code}\n`);
  logStream.end();
  
  console.log(`\n日誌已保存到: ${logFile}`);
  process.exit(code);
});
