import React from 'react';
import type { Exercise } from '../types';
import { Play, Edit2, Trash2, Plus } from 'lucide-react';

interface ExerciseListProps {
  exercises: Exercise[];
  onStartExercise: (exercise: Exercise) => void;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
  onCreateExercise: () => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  onStartExercise,
  onEditExercise,
  onDeleteExercise,
  onCreateExercise
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

  return (
    <div className="exercise-list-container">
      <div className="list-header">
        <h1>我的练习</h1>
        <button onClick={onCreateExercise} className="btn btn-primary">
          <Plus size={18} />
          创建新练习
        </button>
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
                <h3>{exercise.title}</h3>
                <span className="card-date">{formatDate(exercise.updatedAt)}</span>
              </div>
              <div className="card-preview">
                <p>{exercise.originalText.slice(0, 100)}{exercise.originalText.length > 100 ? '...' : ''}</p>
              </div>
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
    </div>
  );
};
