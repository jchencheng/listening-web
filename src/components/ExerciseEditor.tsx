import { useState, useEffect, useRef } from 'react';
import type { Exercise } from '../types';
import { Save, ArrowLeft, Mic, Brain } from 'lucide-react';

interface ExerciseEditorProps {
  exercise?: Exercise;
  onSave: (exercise: Exercise) => void;
  onBack: () => void;
}

export const ExerciseEditor: React.FC<ExerciseEditorProps> = ({ exercise, onSave, onBack }) => {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [blankedText, setBlankedText] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isSmartBlanking, setIsSmartBlanking] = useState(false);
  const [error, setError] = useState('');
  
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (exercise) {
      setTitle(exercise.title);
      setVideoUrl(exercise.videoUrl);
      setOriginalText(exercise.originalText);
      setBlankedText(exercise.blankedText);
    }
  }, [exercise]);

  useEffect(() => {
    // 检查浏览器是否支持Web Speech API
    setIsSpeechSupported('speechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  const handleAutoGenerate = () => {
    const words = originalText.split(/\s+/);
    const newBlankedText = words.map((word, index) => {
      if (index % 2 === 1) {
        return '____';
      }
      return word;
    }).join(' ');
    setBlankedText(newBlankedText);
  };

  const handleSmartBlank = async () => {
    if (!originalText) {
      setError('请先输入原文文本');
      return;
    }
    
    setIsSmartBlanking(true);
    setError('');
    
    try {
      console.log('[Frontend] Calling smart blank API...');
      const response = await fetch('/api/smart-blank-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setBlankedText(data.blankedText);
    } catch (err: any) {
      console.error('[Frontend] Error:', err);
      setError(err?.message || '智能挖空失败');
    } finally {
      setIsSmartBlanking(false);
    }
  };

  const extractVideoId = (url: string): string => {
    // 处理YouTube链接
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/);
    if (youtubeMatch && youtubeMatch[1]) {
      return youtubeMatch[1];
    }
    
    // 处理Bilibili链接
    const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/);
    if (bilibiliMatch && bilibiliMatch[1]) {
      return bilibiliMatch[1];
    }
    
    return '';
  };

  const handleAutoTranscribe = async () => {
    if (!videoUrl) {
      alert('请先输入视频链接');
      return;
    }

    if (!isSpeechSupported) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }

    setIsTranscribing(true);
    setTranscription('正在准备...');

    try {
      // 检查是否有权限访问麦克风
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 创建MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 使用Web Speech API进行语音识别
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setTranscription(transcript);
          setOriginalText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('语音识别错误:', event.error);
          setTranscription('语音识别错误: ' + event.error);
          setIsTranscribing(false);
        };

        recognition.onend = () => {
          setIsTranscribing(false);
        };

        // 开始识别
        recognition.start();
      };

      // 开始录制
      mediaRecorder.start();
      setTranscription('正在录制...请播放视频');
      
      // 自动播放视频 - iframe中无法直接控制，用户需要手动播放
      setTranscription('正在录制...请手动播放视频');
      
      // 尝试通过iframe的contentWindow控制视频播放（可能会被浏览器阻止）
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage('playVideo', '*');
        } catch (err) {
          console.error('无法控制视频播放:', err);
        }
      }
      
    } catch (error) {
      console.error('获取麦克风权限失败:', error);
      setTranscription('获取麦克风权限失败');
      setIsTranscribing(false);
    }
  };

  const stopTranscription = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsTranscribing(false);
  };

  const handleSave = () => {
    const now = Date.now();
    const newExercise: Exercise = {
      id: exercise?.id || crypto.randomUUID(),
      title,
      videoUrl,
      originalText,
      blankedText,
      createdAt: exercise?.createdAt || now,
      updatedAt: now
    };
    onSave(newExercise);
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={18} />
          返回
        </button>
        <h2>{exercise ? '编辑练习' : '创建新练习'}</h2>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label>练习标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入练习标题"
          />
        </div>

        <div className="form-group">
          <label>视频链接 (YouTube / Bilibili)</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... 或 https://www.bilibili.com/video/BV..."
          />
          
          {/* 视频播放器 */}
          {videoUrl && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
                {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                  <iframe
                    ref={iframeRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={`https://www.youtube.com/embed/${extractVideoId(videoUrl)}?autoplay=0`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : videoUrl.includes('bilibili.com') ? (
                  <iframe
                    ref={iframeRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={`https://player.bilibili.com/player.html?aid=${extractVideoId(videoUrl)}&page=1`}
                    frameBorder="0"
                    allowFullScreen
                  />
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                    <p style={{ color: '#64748b' }}>不支持的视频链接</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>原文文本</label>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="请输入完整的原文文本..."
            rows={4}
          />
          
          {/* 自动识别文本按钮 */}
          {isSpeechSupported && videoUrl && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={isTranscribing ? stopTranscription : handleAutoTranscribe} 
                className={`btn ${isTranscribing ? 'btn-danger' : 'btn-info'} btn-small`}
              >
                <Mic size={16} />
                {isTranscribing ? '停止识别' : '自动识别文本'}
              </button>
              
              {/* 转录状态 */}
              {isTranscribing && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', flex: 1 }}>
                  {transcription}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>挖空后文本</label>
          <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            使用下划线 ____ 表示挖空，系统会自动清理序号标记如 (1)、（1）等干扰信息
          </div>
          <textarea
            value={blankedText}
            onChange={(e) => setBlankedText(e.target.value)}
            placeholder="例如：NASA's Artemis 2 mission (1)____ off 或 Hello ____! 这是一个 ____..."
            rows={4}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button onClick={handleAutoGenerate} className="btn btn-secondary btn-small">
              自动隔词挖空
            </button>
            <button 
              onClick={handleSmartBlank} 
              className="btn btn-primary btn-small" 
              disabled={isSmartBlanking || !originalText}
            >
              {isSmartBlanking ? (
                <>
                  <span className="spin" style={{ display: 'inline-block', marginRight: '4px' }}>⟳</span>
                  智能挖空中...
                </>
              ) : (
                <>
                  <Brain size={16} />
                  智能挖空
                </>
              )}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--error)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="editor-actions">
          <button onClick={handleSave} className="btn btn-primary" disabled={!title}>
            <Save size={18} />
            保存练习
          </button>
        </div>
      </div>
    </div>
  );
};
