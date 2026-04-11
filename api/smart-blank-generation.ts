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

  const { originalText } = req.body;

  if (!originalText) {
    return res.status(400).json({ error: 'Original text is required' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[API] API Key configured:', !!apiKey);
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const prompt = `请对以下文本进行智能挖空处理，生成适合雅思备考的听力练习挖空文本：

原文：${originalText}

请按照以下要求处理：
1. 分析文本内容，识别重要的学术词汇、核心动词、形容词和关键短语
2. 优先挖空雅思考试常见的高频词汇和短语
3. 挖空的比例应该适中，大约每句话4个空，确保练习难度符合雅思考试要求
4. 保持文本的完整性和可读性，确保挖空后的文本仍然能够理解整体意思
5. 使用下划线 ____ 标记挖空的位置，下划线长度保持一致
6. 确保挖空的词汇难度适中，既要有挑战性又不至于过于困难
7. 优先挖空名词、动词、形容词等内容词，避免挖空冠词、介词等功能词
8. 只返回挖空后的文本，不要添加任何其他说明`;

    console.log('[API] Initializing GoogleGenAI...');
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    console.log('[API] Creating model instance (gemini-3.1-flash-lite-preview)...');
    
    const config = {
      thinkingConfig: {
        thinkingLevel: 'MINIMAL' as const,
      },
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    };

    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    console.log('[API] Generating content...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      config,
      contents,
    });

    console.log('[API] Content generated successfully');
    const blankedText = response.text ?? '';
    console.log('[API] Blanked text length:', blankedText.length);

    if (!blankedText) {
      throw new Error('Gemini returned empty response');
    }

    res.status(200).json({
      blankedText: blankedText
    });
  } catch (error: any) {
    console.error('[API] Error:', error?.message || error);
    console.error('[API] Error type:', error?.constructor?.name);
    
    let errorMessage = 'Failed to generate blanked text';
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
      details: msg,
      type: error?.constructor?.name
    });
  }
}