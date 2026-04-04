import { useState, useEffect, useCallback } from 'react';
import type { Exercise } from './types';
import { db } from './utils/db';
import { ExerciseList } from './components/ExerciseList';
import { ExerciseEditor } from './components/ExerciseEditor';
import { PracticeView } from './components/PracticeView';
import './index.css';

type ViewMode = 'list' | 'editor' | 'practice';

function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
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
        />
      )}
    </div>
  );
}

export default App;
