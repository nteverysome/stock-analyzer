#!/usr/bin/env python3
import http.server, socketserver, json, urllib.request, urllib.error, os
from pathlib import Path
import yfinance as yf

PORT = 8080

class Handler(http.server.BaseHTTPRequestHandler):

    # ── OPTIONS（CORS 預檢）
    def do_OPTIONS(self):
        self._cors(200)

    # ── GET（靜態文件）
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self._send_file('public/index.html', 'text/html')
        else:
            # 依序嘗試 public/xxx 和 根目錄/xxx
            for base in ['public', '.']:
                fp = Path(base) / self.path.lstrip('/')
                if fp.exists() and fp.is_file():
                    mime = 'text/html' if fp.suffix == '.html' else \
                           'application/javascript' if fp.suffix == '.js' else \
                           'text/css' if fp.suffix == '.css' else 'text/plain'
                    self._send_file(str(fp), mime)
                    return
            self._send_file('public/index.html', 'text/html')

    # ── POST（Claude API 代理 + Yahoo Finance 代理）
    def do_POST(self):
        print(f'[POST] {self.path}')

        # ── /api/fundamentals：用 yfinance 獲取基本面數據
        if self.path == '/api/fundamentals':
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            try:
                d      = json.loads(body)
                ticker = d.get('ticker', '').upper().strip()
                if not ticker:
                    self._json(400, {'error': 'ticker required'}); return

                print(f'[yfinance] 獲取 {ticker} 基本面數據...')
                t    = yf.Ticker(ticker)
                info = t.info  # 包含 PE、PEG、毛利率、分析師目標等

                if not info or info.get('quoteType') is None:
                    self._json(404, {'error': f'找不到 {ticker} 的數據'}); return

                # 安全取值函數
                def g(key, default=None):
                    v = info.get(key)
                    return v if v not in (None, 'N/A', float('inf'), float('-inf')) else default

                result = {
                    'symbol':          ticker,
                    'trailingPE':      g('trailingPE'),
                    'forwardPE':       g('forwardPE'),
                    'pegRatio':        g('pegRatio') or g('trailingPegRatio'),
                    'grossMargins':    g('grossMargins'),
                    'operatingMargins':g('operatingMargins'),
                    'profitMargins':   g('profitMargins'),
                    'revenueGrowth':   g('revenueGrowth'),
                    'earningsGrowth':  g('earningsGrowth'),
                    'freeCashflow':    g('freeCashflow'),
                    'targetMeanPrice': g('targetMeanPrice'),
                    'targetLowPrice':  g('targetLowPrice'),
                    'targetHighPrice': g('targetHighPrice'),
                    'numberOfAnalystOpinions': g('numberOfAnalystOpinions'),
                    'recommendationKey': g('recommendationKey', 'hold'),
                    'beta':            g('beta'),
                    'marketCap':       g('marketCap'),
                    'dividendYield':   g('dividendYield'),
                    'sector':          g('sector', 'N/A'),
                    'industry':        g('industry', 'N/A'),
                    'earningsTimestamp': g('earningsTimestamp'),
                }
                print(f'[yfinance] ✅ PE={result["trailingPE"]} 毛利率={result["grossMargins"]} 目標=${result["targetMeanPrice"]}')
                self._json(200, result)
            except Exception as e:
                print(f'[yfinance Error] {e}')
                self._json(500, {'error': str(e)})
            return

        # ── /api/proxy：代理 Yahoo Finance GET 請求
        if self.path == '/api/proxy':
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            try:
                d   = json.loads(body)
                url = d.get('url', '')
                allowed = ['query1.finance.yahoo.com','query2.finance.yahoo.com','production.dataviz.cnn.io']
                if not any(h in url for h in allowed):
                    self._json(403, {'error': 'URL not allowed'}); return
                print(f'[YF Proxy] {url[:80]}')
                req = urllib.request.Request(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://finance.yahoo.com/',
                    'Origin': 'https://finance.yahoo.com',
                })
                with urllib.request.urlopen(req, timeout=15) as resp:
                    self._raw(200, resp.read())
            except urllib.error.HTTPError as e:
                self._raw(e.code, e.read())
            except Exception as e:
                self._json(500, {'error': str(e)})
            return

        if self.path != '/api/claude':
            self._json(404, {'error': 'Not found'})
            return

        length = int(self.headers.get('Content-Length', 0))
        body   = self.rfile.read(length)

        try:
            d      = json.loads(body)
            apiKey = d.get('apiKey', '')
            prompt = d.get('prompt', '')
            if not apiKey or not prompt:
                self._json(400, {'error': 'apiKey and prompt required'})
                return

            print(f'[Claude] Calling API...')
            payload = json.dumps({
                'model': 'claude-3-haiku-20240307',
                'max_tokens': 500,
                'messages': [{'role': 'user', 'content': prompt}]
            }).encode()

            req = urllib.request.Request(
                'https://api.anthropic.com/v1/messages',
                data=payload,
                headers={
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    result = resp.read()
                    print('[Claude] ✅ Success')
                    self._raw(200, result)
            except urllib.error.HTTPError as e:
                err = e.read()
                print(f'[Claude] HTTP {e.code}: {err[:120]}')
                self._raw(e.code, err)

        except Exception as e:
            print(f'[Error] {e}')
            self._json(500, {'error': str(e)})

    # ── 工具函數
    def _cors(self, code):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _json(self, code, obj):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(data)

    def _raw(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(data)

    def _send_file(self, path, mime):
        try:
            data = Path(path).read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data)
        except FileNotFoundError:
            self._json(404, {'error': f'{path} not found'})

    def log_message(self, fmt, *args):
        print(f'  {args[0]} {args[1]}')


if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    with socketserver.TCPServer(('', PORT), Handler) as s:
        s.allow_reuse_address = True
        print(f'🚀  http://localhost:{PORT}/stock_analyzer.html')
        print(f'🔑  /api/claude  ← Claude proxy')
        s.serve_forever()

