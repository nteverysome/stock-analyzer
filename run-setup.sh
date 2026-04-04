#!/bin/bash
cd "C:\Users\Administrator\Desktop\sotke4"
node setup-database.js 2>&1 | tee setup-output.log
echo "=== Setup completed ===" >> setup-output.log
