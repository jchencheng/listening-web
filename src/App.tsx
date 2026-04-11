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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const init = async () => {
      await db.init();
      setDbInitialized(true);
      loadExercises();
      
      // 从本地存储加载夜间模式设置
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode === 'true') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark-mode');
      }
    };
    init();
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  const handleExport = async () => {
    try {
      const allExercises = await db.getAllExercises();
      
      // 获取所有测试记录
      const allTestRecords: TestRecord[] = [];
      for (const exercise of allExercises) {
        const records = await db.getTestRecordsByExerciseId(exercise.id);
        allTestRecords.push(...records);
      }
      
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exercises: allExercises,
        testRecords: allTestRecords
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `listening-web-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('数据导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      alert('数据导出失败，请查看控制台了解详情。');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.exercises || !Array.isArray(importData.exercises)) {
        throw new Error('无效的导入文件格式');
      }
      
      if (window.confirm(`确定要导入 ${importData.exercises.length} 个练习吗？这将覆盖现有的同名练习。`)) {
        // 导入练习
        for (const exercise of importData.exercises) {
          await db.saveExercise(exercise);
        }
        
        // 导入测试记录
        if (importData.testRecords && Array.isArray(importData.testRecords)) {
          for (const record of importData.testRecords) {
            await db.saveTestRecord(record);
          }
        }
        
        await loadExercises();
        alert('数据导入成功！');
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('数据导入失败，请确保文件格式正确。');
    }
    
    // 重置文件输入
    event.target.value = '';
  };

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
      <div className="loading-container">
        <div className="loading-spinner" />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>加载中...</span>
      </div>
    );
  }

  return (
    <div className="app-container">
      {currentView === 'list' && (
        <ExerciseList
          exercises={exercises}
          testRecords={testRecords}
          isDarkMode={isDarkMode}
          onStartExercise={handleStartExercise}
          onEditExercise={handleEditExercise}
          onDeleteExercise={handleDeleteExercise}
          onCreateExercise={handleCreateExercise}
          onToggleDarkMode={toggleDarkMode}
          onExport={handleExport}
          onImport={handleImport}
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
          onUpdateExercise={(updatedExercise) => {
            setSelectedExercise(updatedExercise);
            loadExercises();
          }}
        />
      )}
    </div>
  );
}

export default App;
