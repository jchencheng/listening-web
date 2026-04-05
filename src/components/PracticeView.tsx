import React from 'react';
import type { Exercise } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { FillBlanks } from './FillBlanks';
import { ArrowLeft, Edit2 } from 'lucide-react';

interface PracticeViewProps {
  exercise: Exercise;
  onBack: () => void;
  onEdit: () => void;
  onComplete?: (exerciseId: string, score: number, total: number) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({ exercise, onBack, onEdit, onComplete }) => {
  return (
    <div className="practice-view">
      <div className="practice-header">
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={18} />
          返回
        </button>
        <h2>{exercise.title}</h2>
        <button onClick={onEdit} className="btn btn-secondary">
          <Edit2 size={18} />
          编辑
        </button>
      </div>

      <div className="practice-content">
        <div className="video-section">
          <VideoPlayer videoUrl={exercise.videoUrl} />
        </div>
        <div className="exercise-section">
          <FillBlanks
            originalText={exercise.originalText}
            blankedText={exercise.blankedText}
            onComplete={(score, total) => onComplete && onComplete(exercise.id, score, total)}
          />
        </div>
      </div>
    </div>
  );
};
