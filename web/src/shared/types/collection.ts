export type CollectionType = 'featured' | 'seasonal' | 'thematic';
export type CollectionStatus = 'draft' | 'published';

export type Collection = {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  imageUrl: string | null;
  type: CollectionType;
  status: CollectionStatus;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: { questions: number };
};

export type CollectionWithQuestions = Collection & {
  questions: {
    sortOrder: number;
    question: {
      id: string;
      statement: string;
      difficulty: number;
      category: { name: string };
    };
  }[];
};
