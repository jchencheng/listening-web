import React, { useState, useEffect } from 'react';
import type { Exercise, TestRecord } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { FillBlanks } from './FillBlanks';
import { ArrowLeft, Edit2, History, Languages, RefreshCw } from 'lucide-react';
import { db } from '../utils/db';

interface PracticeViewProps {
  exercise: Exercise;
  onBack: () => void;
  onEdit: () => void;
  onComplete?: (exerciseId: string, score: number, total: number) => void;
  onUpdateExercise?: (exercise: Exercise) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({ 
  exercise, 
  onBack, 
  onEdit, 
  onComplete,
  onUpdateExercise 
}) => {
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const [currentExercise, setCurrentExercise] = useState<Exercise>(exercise);

  useEffect(() => {
    loadTestRecords();
    setCurrentExercise(exercise);
  }, [exercise.id]);

  const loadTestRecords = async () => {
    const records = await db.getTestRecordsByExerciseId(exercise.id);
    setTestRecords(records);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'var(--success-color)';
    if (percentage >= 60) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  const handleComplete = async (score: number, total: number) => {
    if (onComplete) {
      onComplete(exercise.id, score, total);
      setTimeout(() => {
        loadTestRecords();
      }, 100);
    }
  };

  const handleTranslate = async (forceRefresh = false) => {
    if (currentExercise.translation && !forceRefresh) {
      setShowTranslation(!showTranslation);
      return;
    }

    if (!currentExercise.originalText) {
      setTranslationError('没有原文可供翻译');
      return;
    }

    setIsTranslating(true);
    setTranslationError('');

    try {
      const response = await fetch('/api/translate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentExercise.originalText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const updatedExercise: Exercise = {
        ...currentExercise,
        translation: data.translation,
        updatedAt: Date.now()
      };

      await db.saveExercise(updatedExercise);
      setCurrentExercise(updatedExercise);
      
      if (onUpdateExercise) {
        onUpdateExercise(updatedExercise);
      }

      setShowTranslation(true);
    } catch (err: any) {
      console.error('[Frontend] Translation error:', err);
      setTranslationError(err?.message || '翻译失败');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRefreshTranslation = () => {
    if (window.confirm('确定要重新生成翻译吗？这将覆盖现有的翻译内容。')) {
      handleTranslate(true);
    }
  };

  const hasTestRecords = testRecords.length > 0;
  const canShowTranslation = hasTestRecords || currentExercise.translation;

  return (
    <div className="practice-view">
      <div className="practice-header">
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={18} />
          返回
        </button>
        <h2>{currentExercise.title}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canShowTranslation && (
            <button 
              onClick={() => handleTranslate(false)} 
              className="btn btn-secondary"
              disabled={isTranslating}
            >
              {isTranslating ? (
                <>
                  <span className="spin" style={{ display: 'inline-block', marginRight: '4px' }}>⟳</span>
                  翻译中...
                </>
              ) : (
                <>
                  <Languages size={18} />
                  {currentExercise.translation ? (showTranslation ? '隐藏翻译' : '显示翻译') : '生成翻译'}
                </>
              )}
            </button>
          )}
          {hasTestRecords && (
            <button onClick={() => setShowHistory(!showHistory)} className="btn btn-secondary">
              <History size={18} />
              历史记录
            </button>
          )}
          <button onClick={onEdit} className="btn btn-secondary">
            <Edit2 size={18} />
            编辑
          </button>
        </div>
      </div>

      <div className="practice-content">
        <div className="video-section">
          <VideoPlayer videoUrl={currentExercise.videoUrl} />
        </div>
        <div className="exercise-section">
          <FillBlanks
            originalText={currentExercise.originalText}
            blankedText={currentExercise.blankedText}
            onComplete={handleComplete}
          />
          
          {showTranslation && currentExercise.translation && (
            <div className="translation-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>中文翻译</h3>
                <button 
                  onClick={handleRefreshTranslation}
                  className="btn btn-secondary btn-small"
                  disabled={isTranslating}
                  title="重新生成翻译"
                >
                  <RefreshCw size={14} />
                  重新翻译
                </button>
              </div>
              <div className="translation-content">
                {currentExercise.translation}
              </div>
            </div>
          )}
          
          {translationError && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', borderRadius: 'var(--radius-md)' }}>
              {translationError}
            </div>
          )}
          
          {showHistory && hasTestRecords && (
            <div className="history-section">
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>历史提交记录</h3>
              <div className="history-list">
                {testRecords.map((record) => (
                  <div key={record.id} className="history-item">
                    <div className="history-item-header">
                      <span className="history-date">{formatDate(record.completedAt)}</span>
                      <span 
                        className="history-score"
                        style={{ color: getScoreColor(record.score, record.total) }}
                      >
                        {record.score}/{record.total}
                      </span>
                    </div>
                    <div className="history-progress">
                      <div 
                        className="history-progress-bar"
                        style={{ 
                          width: `${(record.score / record.total) * 100}%`,
                          backgroundColor: getScoreColor(record.score, record.total)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
