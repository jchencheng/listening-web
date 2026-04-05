import { useState, useEffect, useCallback } from 'react';
import type { Exercise, TestRecord } from './types';
import { db } from './utils/db';
import { ExerciseList } from './components/ExerciseList';
import { ExerciseEditor } from './components/ExerciseEditor';
import { PracticeView } from './components/PracticeView';
import './index.css';

type ViewMode = 'list' | 'editor' | 'practice';

function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [testRecords, setTestRecords] = useState<Map<string, TestRecord>>(new Map());
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>();
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await db.init();
      setDbInitialized(true);
      loadExercises();
    };
    init();
  }, []);

  const loadExercises = useCallback(async () => {
    const allExercises = await db.getAllExercises();
    setExercises(allExercises);
    
    // 获取所有练习的测试记录
    const recordsMap = new Map<string, TestRecord>();
    for (const exercise of allExercises) {
      const latestRecord = await db.getLatestTestRecord(exercise.id);
      if (latestRecord) {
        recordsMap.set(exercise.id, latestRecord);
      }
    }
    setTestRecords(recordsMap);
  }, []);

  const handleCreateExercise = () => {
    setSelectedExercise(undefined);
    setCurrentView('editor');
  };

  const handleEditExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentView('editor');
  };

  const handleSaveExercise = async (exercise: Exercise) => {
    await db.saveExercise(exercise);
    await loadExercises();
    setCurrentView('list');
  };

  const handleStartExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentView('practice');
  };

  const handleDeleteExercise = async (id: string) => {
    if (window.confirm('确定要删除这个练习吗？')) {
      await db.deleteExercise(id);
      await loadExercises();
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedExercise(undefined);
  };

  const handleSaveTestRecord = async (exerciseId: string, score: number, total: number) => {
    const record: TestRecord = {
      id: crypto.randomUUID(),
      exerciseId,
      score,
      total,
      completedAt: Date.now()
    };
    await db.saveTestRecord(record);
    // 更新测试记录状态
    setTestRecords(prev => new Map(prev.set(exerciseId, record)));
  };

  if (!dbInitialized) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {currentView === 'list' && (
        <ExerciseList
          exercises={exercises}
          testRecords={testRecords}
          onStartExercise={handleStartExercise}
          onEditExercise={handleEditExercise}
          onDeleteExercise={handleDeleteExercise}
          onCreateExercise={handleCreateExercise}
        />
      )}

      {currentView === 'editor' && (
        <ExerciseEditor
          exercise={selectedExercise}
          onSave={handleSaveExercise}
          onBack={handleBackToList}
        />
      )}

      {currentView === 'practice' && selectedExercise && (
        <PracticeView
          exercise={selectedExercise}
          onBack={handleBackToList}
          onEdit={() => handleEditExercise(selectedExercise)}
          onComplete={handleSaveTestRecord}
        />
      )}
    </div>
  );
}

export default App;
