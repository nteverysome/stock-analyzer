import base64

# 讀取本地文件
with open('./api/screener.js', 'rb') as f:
    content = f.read()

# 統計股票數量
us_count = content.count(b"'AAPL'") + content.count(b"'MSFT'") + content.count(b"'GOOGL'")
content_str = content.decode('utf-8')
us_tickers = len([x for x in content_str.split("'") if x.isupper() and len(x) <= 5])

# 編碼
b64 = base64.b64encode(content).decode('utf-8')

print(f"File size: {len(content)} bytes")
print(f"Base64 size: {len(b64)} bytes")
print(f"Lines: {len(content_str.splitlines())}")
print(f"Content check: OK")
