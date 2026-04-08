import React, { useState, useEffect } from 'react';
import type { Exercise, TestRecord } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { FillBlanks } from './FillBlanks';
import { ArrowLeft, Edit2, History } from 'lucide-react';
import { db } from '../utils/db';

interface PracticeViewProps {
  exercise: Exercise;
  onBack: () => void;
  onEdit: () => void;
  onComplete?: (exerciseId: string, score: number, total: number) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({ exercise, onBack, onEdit, onComplete }) => {
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadTestRecords();
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

  return (
    <div className="practice-view">
      <div className="practice-header">
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={18} />
          返回
        </button>
        <h2>{exercise.title}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {testRecords.length > 0 && (
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
          <VideoPlayer videoUrl={exercise.videoUrl} />
        </div>
        <div className="exercise-section">
          <FillBlanks
            originalText={exercise.originalText}
            blankedText={exercise.blankedText}
            onComplete={handleComplete}
          />
          
          {showHistory && testRecords.length > 0 && (
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
