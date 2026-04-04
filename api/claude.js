// Vercel Serverless Function - Claude API Proxy
// 在後端調用 Claude API，解決瀏覽器 CORS 限制
// 支持：前端傳入 apiKey（本地），或使用環境變數 ANTHROPIC_API_KEY（Vercel）

export default async function handler(req, res) {
  // 啟用 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 處理 OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET /api/check-key：檢查環境變數是否設定（用於調試）
  if (req.method === 'GET') {
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    const keyLength = process.env.ANTHROPIC_API_KEY?.length || 0;
    const keyPreview = process.env.ANTHROPIC_API_KEY
      ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...'
      : 'NOT SET';

    console.log('[check-key] ANTHROPIC_API_KEY status:', {
      hasKey,
      keyLength,
      keyPreview,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')),
    });

    return res.status(200).json({
      hasKey,
      keyLength,
      keyPreview,
      message: hasKey ? 'API Key found!' : 'API Key NOT found in environment variables'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, prompt } = req.body;

  // 優先使用環境變數（Vercel），否則使用前端傳入的 Key（本地）
  const envApiKey = process.env.ANTHROPIC_API_KEY;
  const finalApiKey = envApiKey || apiKey;

  console.log('[Claude Proxy] Request info:', {
    hasEnvKey: !!envApiKey,
    envKeyLength: envApiKey?.length || 0,
    hasFrontendKey: !!apiKey,
    frontendKeyLength: apiKey?.length || 0,
    willUseEnv: !!envApiKey,
    finalKeyLength: finalApiKey?.length || 0,
  });

  if (!finalApiKey || !prompt) {
    console.error('[Claude Proxy] Missing required fields:', { hasApiKey: !!finalApiKey, hasPrompt: !!prompt });
    return res.status(400).json({ error: 'apiKey and prompt are required' });
  }

  try {
    console.log('[Claude Proxy] 調用 Claude API');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': finalApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('[Claude Proxy] API 錯誤:', errData);
      return res.status(response.status).json({ 
        error: errData.error?.message || `API ${response.status}`
      });
    }

    const data = await response.json();
    console.log('[Claude Proxy] ✅ 成功');
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('[Claude Proxy Error]', error.message);
    res.status(500).json({ error: error.message });
  }
}

