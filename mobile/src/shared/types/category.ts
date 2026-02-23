export type Category = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  descriptionEn: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

export type CategoryWithCount = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  descriptionEn: string;
  imageUrl: string | null;
  availableCount: number;
};
