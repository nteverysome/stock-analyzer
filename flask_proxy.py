#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_from_directory
import requests
from pathlib import Path

app = Flask(__name__, static_folder='public', static_url_path='')

@app.route('/api/claude', methods=['POST', 'OPTIONS'])
def claude_proxy():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        api_key = data.get('apiKey')
        prompt = data.get('prompt')
        
        if not api_key or not prompt:
            return jsonify({'error': 'apiKey and prompt required'}), 400
        
        print('[Claude Proxy] 调用 Claude API...')
        
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01'
            },
            json={
                'model': 'claude-3-5-sonnet-20241022',
                'max_tokens': 500,
                'messages': [{'role': 'user', 'content': prompt}]
            },
            timeout=30
        )
        
        if response.status_code != 200:
            error_data = response.json()
            print(f'[Claude Proxy] API Error {response.status_code}')
            return jsonify(error_data), response.status_code
        
        data = response.json()
        print('[Claude Proxy] Success')
        return jsonify(data), 200
        
    except Exception as e:
        print(f'[Claude Proxy Error] {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    public_path = Path('public') / path
    if public_path.exists() and public_path.is_file():
        return send_from_directory('public', path)
    
    root_path = Path(path)
    if root_path.exists() and root_path.is_file():
        return send_from_directory('.', path)
    
    return send_from_directory('public', 'index.html')

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

if __name__ == '__main__':
    print('🚀 Flask proxy running at http://localhost:8080')
    print('📍 API endpoint: /api/claude')
    app.run(host='localhost', port=8080, debug=False)

