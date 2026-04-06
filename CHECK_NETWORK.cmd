@echo off
REM 自己牽的網路線 — 快速網路診斷

echo.
echo ===== Windows 網路診斷 =====
echo.
echo.
echo 1️⃣ 檢查 DNS 能否解析
echo ──────────────────
nslookup google.com | findstr "Address"
echo.
echo.
echo 2️⃣ 檢查是否有 VPN 連線
echo ──────────────────
rasdial | findstr "Connected\|撥號"
if %errorlevel% neq 0 (
  echo 沒有 VPN 連線（正常）
)
echo.
echo.
echo 3️⃣ 檢查 Windows 防火牆狀態
echo ──────────────────
echo 公用設定:
netsh advfirewall show publicprofile | findstr "State"
echo 私人設定:
netsh advfirewall show privateprofile | findstr "State"
echo.
echo.
echo 4️⃣ 檢查是否有防毒軟體/代理阻擋
echo ──────────────────
tasklist | findstr /i "kaspersky mcafee norton symantec avast avg bitdefender proxy"
if %errorlevel% neq 0 (
  echo 沒有偵測到已知的防毒軟體
) else (
  echo ⚠️ 有防毒軟體在跑，可能阻擋連線
)
echo.
echo.
echo 5️⃣ 檢查網路介面
echo ──────────────────
ipconfig | findstr "Ethernet\|Wi-Fi\|Address"
echo.
echo.
echo ===== 診斷完成 =====
echo.
echo 如果看到 ❌ 就告訴我結果！
pause
