import React from 'react';
import type { Exercise, TestRecord } from '../types';
import { Play, Edit2, Trash2, Plus, CheckCircle2, Trophy, Calendar, BookOpen, Sun, Moon, Download, Upload } from 'lucide-react';

interface ExerciseListProps {
  exercises: Exercise[];
  testRecords: Map<string, TestRecord>;
  isDarkMode: boolean;
  onStartExercise: (exercise: Exercise) => void;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
  onCreateExercise: () => void;
  onToggleDarkMode: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  testRecords,
  isDarkMode,
  onStartExercise,
  onEditExercise,
  onDeleteExercise,
  onCreateExercise,
  onToggleDarkMode,
  onExport,
  onImport
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 计算成就数据
  const completedExercises = testRecords.size;
  
  // 计算累计练习天数
  const getUniqueDays = () => {
    const days = new Set<string>();
    testRecords.forEach(record => {
      const date = new Date(record.completedAt);
      const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      days.add(dateStr);
    });
    return days.size;
  };
  const practiceDays = getUniqueDays();

  return (
    <div className="exercise-list-container">
      <div className="list-header">
        <h1>我的练习</h1>
        <div className="list-header-actions">
          <button onClick={onToggleDarkMode} className="btn btn-secondary btn-small" title={isDarkMode ? '切换到日间模式' : '切换到夜间模式'}>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onExport} className="btn btn-secondary btn-small" title="导出数据">
            <Download size={16} />
          </button>
          <label className="btn btn-secondary btn-small" title="导入数据" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={onCreateExercise} className="btn btn-primary desktop-only">
            <Plus size={18} />
            创建新练习
          </button>
        </div>
      </div>

      {/* 成就板块 */}
      <div className="achievement-section">
        <div className="achievement-card">
          <div className="achievement-icon achievement-icon-trophy">
            <Trophy size={28} />
          </div>
          <div className="achievement-content">
            <div className="achievement-number">{completedExercises}</div>
            <div className="achievement-label">已完成听力</div>
          </div>
        </div>
        
        <div className="achievement-card">
          <div className="achievement-icon achievement-icon-calendar">
            <Calendar size={28} />
          </div>
          <div className="achievement-content">
            <div className="achievement-number">{practiceDays}</div>
            <div className="achievement-label">累计练习天数</div>
          </div>
        </div>
        
        <div className="achievement-card">
          <div className="achievement-icon achievement-icon-book">
            <BookOpen size={28} />
          </div>
          <div className="achievement-content">
            <div className="achievement-number">{exercises.length}</div>
            <div className="achievement-label">创建练习</div>
          </div>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h2>还没有练习</h2>
          <p>点击上方按钮创建你的第一个视频填空练习吧！</p>
        </div>
      ) : (
        <div className="exercise-cards">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="exercise-card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3>{exercise.title}</h3>
                  {testRecords.has(exercise.id) && (
                    <CheckCircle2 size={16} color="#10b981" aria-label="已完成" />
                  )}
                </div>
                <span className="card-date">{formatDate(exercise.updatedAt)}</span>
              </div>
              {exercise.originalText && (
                <div className="card-preview">
                  <p>{exercise.originalText.slice(0, 100)}{exercise.originalText.length > 100 ? '...' : ''}</p>
                </div>
              )}
              <div className="card-actions">
                <button onClick={() => onStartExercise(exercise)} className="btn btn-primary btn-small">
                  <Play size={16} />
                  开始练习
                </button>
                <button onClick={() => onEditExercise(exercise)} className="btn btn-secondary btn-small">
                  <Edit2 size={16} />
                  编辑
                </button>
                <button onClick={() => onDeleteExercise(exercise.id)} className="btn btn-danger btn-small">
                  <Trash2 size={16} />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 移动端悬浮按钮 */}
      <button onClick={onCreateExercise} className="fab mobile-only">
        <Plus size={24} />
      </button>
    </div>
  );
};
