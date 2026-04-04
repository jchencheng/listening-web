export interface Exercise {
  id: string;
  title: string;
  videoUrl: string;
  originalText: string;
  blankedText: string;
  createdAt: number;
  updatedAt: number;
}

export interface Blank {
  id: string;
  answer: string;
  userAnswer: string;
  status: 'idle' | 'correct' | 'wrong';
}
