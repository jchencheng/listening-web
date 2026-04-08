export interface Exercise {
  id: string;
  title: string;
  videoUrl: string;
  originalText: string;
  blankedText: string;
  translation?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Blank {
  id: string;
  answer: string;
  userAnswer: string;
  status: 'idle' | 'correct' | 'wrong';
}

export interface TestRecord {
  id: string;
  exerciseId: string;
  score: number;
  total: number;
  completedAt: number;
}
