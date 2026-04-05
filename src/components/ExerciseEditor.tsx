import { useState, useEffect } from 'react';
import type { Exercise } from '../types';
import { Save, ArrowLeft } from 'lucide-react';

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

  useEffect(() => {
    if (exercise) {
      setTitle(exercise.title);
      setVideoUrl(exercise.videoUrl);
      setOriginalText(exercise.originalText);
      setBlankedText(exercise.blankedText);
    }
  }, [exercise]);

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
        </div>

        <div className="form-group">
          <label>原文文本</label>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="请输入完整的原文文本..."
            rows={4}
          />
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
          <button onClick={handleAutoGenerate} className="btn btn-secondary btn-small" style={{ marginTop: '8px' }}>
            自动隔词挖空
          </button>
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
