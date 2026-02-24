export type CollectionSummary = {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  imageUrl: string | null;
  type: 'featured' | 'seasonal' | 'thematic';
  _count: { questions: number };
};

export type CollectionSessionQuestion = {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
  sourceUrl: string | null;
  language: string;
  categoryId: string;
  difficulty: number;
  illustrationUrl: string | null;
};

export type CollectionSession = {
  sessionId: string;
  questions: CollectionSessionQuestion[];
};

export type CollectionSubmitResult = {
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSeconds: number;
  score: number;
};
