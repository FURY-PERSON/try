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

export type CollectionItem = {
  id: string;
  collectionId: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
  sourceUrl: string | null;
  difficulty: number;
  sortOrder: number;
  language: string;
};

export type CollectionWithItems = Collection & {
  questions: CollectionItem[];
};

/** @deprecated use CollectionWithItems */
export type CollectionWithQuestions = CollectionWithItems;

export type CreateCollectionItemDto = {
  statement: string;
  isTrue: boolean;
  explanation: string;
  source?: string;
  sourceUrl?: string;
  difficulty?: number;
  language?: string;
  sortOrder?: number;
};

export type CreateCollectionDto = {
  title: string;
  titleEn: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  imageUrl?: string;
  type?: CollectionType;
  items: CreateCollectionItemDto[];
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
};

export type UpdateCollectionDto = Partial<Omit<CreateCollectionDto, 'items'>> & {
  items?: CreateCollectionItemDto[];
  status?: CollectionStatus;
};

export type CollectionQueryDto = {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
};
