import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@wordpulse/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const categorySchema = z.object({
  name: z.string().min(1, 'Введите название'),
  nameEn: z.string().min(1, 'Введите название (EN)'),
  slug: z.string().min(1, 'Введите slug'),
  icon: z.string().min(1, 'Введите иконку'),
  sortOrder: z.coerce.number().min(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
  });

  const categories = data?.data.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => api.admin.categories.create(data),
    onSuccess: () => {
      toast.success('Категория создана');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка создания'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      api.admin.categories.update(id, data),
    onSuccess: () => {
      toast.success('Категория обновлена');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.categories.delete(id),
    onSuccess: () => {
      toast.success('Категория удалена');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: () => toast.error('Категория используется в вопросах и не может быть удалена'),
  });

  const openCreate = () => {
    setEditingCategory(null);
    reset({ name: '', nameEn: '', slug: '', icon: '', sortOrder: 0 });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      nameEn: cat.nameEn,
      slug: cat.slug,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <PageHeader
        title="Категории"
        description={`Всего: ${categories.length}`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Добавить
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="Нет категорий"
            description="Создайте первую категорию для вопросов"
            action={
              <Button size="sm" onClick={openCreate}>
                Добавить категорию
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Иконка</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Название (EN)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Порядок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="text-2xl">{cat.icon}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-text-secondary">{cat.nameEn}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-surface-secondary px-2 py-1 rounded">
                      {cat.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-text-secondary">{cat.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={cat.isActive ? 'success' : 'default'}>
                      {cat.isActive ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-blue hover:bg-blue/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить категорию?')) deleteMutation.mutate(cat.id);
                        }}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-red hover:bg-red/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editingCategory ? 'Редактировать категорию' : 'Новая категория'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="name"
            label="Название (RU)"
            placeholder="Наука"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id="nameEn"
            label="Название (EN)"
            placeholder="Science"
            error={errors.nameEn?.message}
            {...register('nameEn')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="slug"
              label="Slug"
              placeholder="science"
              error={errors.slug?.message}
              {...register('slug')}
            />
            <Input
              id="icon"
              label="Иконка (emoji)"
              placeholder="🔬"
              error={errors.icon?.message}
              {...register('icon')}
            />
          </div>
          <Input
            id="sortOrder"
            label="Порядок сортировки"
            type="number"
            min={0}
            error={errors.sortOrder?.message}
            {...register('sortOrder')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
