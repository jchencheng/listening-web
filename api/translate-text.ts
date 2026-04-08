import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const apiKey = process.env['GEMINI_API_KEY'];
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `请将以下英文文本翻译成中文，保持原文的语气和风格：

原文：
${text}

要求：
1. 翻译要准确、流畅、自然
2. 保持原文的段落结构
3. 专业术语要翻译准确
4. 只返回翻译后的中文文本，不要添加任何其他说明`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      config: {
        thinkingConfig: {
          thinkingLevel: 'MINIMAL',
        },
        maxOutputTokens: 2048,
        temperature: 0.3,
      },
    });

    const translation = response.text ?? '';

    res.status(200).json({ translation });
  } catch (error: any) {
    console.error('[API] Error:', error?.message || error);
    
    let errorMessage = '翻译失败';
    const msg = error?.message || '';
    
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      errorMessage = '网络错误：无法连接到 Gemini API';
    } else if (msg.includes('API_KEY') || msg.includes('api key')) {
      errorMessage = 'API 密钥无效';
    } else if (msg.includes('quota') || msg.includes('429')) {
      errorMessage = 'API 配额已用尽';
    } else if (msg) {
      errorMessage = msg;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: msg
    });
  }
}
