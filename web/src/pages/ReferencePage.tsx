import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { EmojiPickerInput } from '@/components/ui/EmojiPickerInput';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type {
  NicknameAdjective,
  NicknameAnimal,
  AvatarEmojiItem,
} from '@/api-client/types';

// ── Schemas ──

const adjectiveSchema = z.object({
  textRu: z.string().min(1, 'Введите прилагательное (RU)'),
  textEn: z.string().min(1, 'Введите прилагательное (EN)'),
});

const animalSchema = z.object({
  textRu: z.string().min(1, 'Введите название (RU)'),
  textEn: z.string().min(1, 'Введите название (EN)'),
  emoji: z.string().min(1, 'Введите эмоджи'),
});

const emojiSchema = z.object({
  emoji: z.string().min(1, 'Введите эмоджи'),
  category: z.string().min(1, 'Введите категорию'),
});

type AdjectiveForm = z.infer<typeof adjectiveSchema>;
type AnimalForm = z.infer<typeof animalSchema>;
type EmojiForm = z.infer<typeof emojiSchema>;

type Tab = 'adjectives' | 'animals' | 'emojis';

const TABS: { key: Tab; label: string }[] = [
  { key: 'adjectives', label: 'Прилагательные' },
  { key: 'animals', label: 'Животные' },
  { key: 'emojis', label: 'Эмоджи' },
];

// ── Adjectives Tab ──

function AdjectivesTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NicknameAdjective | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'adjectives'],
    queryFn: () => api.admin.adjectives.list(),
  });

  const items = data?.data.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdjectiveForm>({
    resolver: zodResolver(adjectiveSchema),
  });

  const createMut = useMutation({
    mutationFn: (d: AdjectiveForm) => api.admin.adjectives.create(d),
    onSuccess: () => {
      toast.success('Прилагательное создано');
      queryClient.invalidateQueries({ queryKey: ['admin', 'adjectives'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка создания'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: AdjectiveForm }) =>
      api.admin.adjectives.update(id, d),
    onSuccess: () => {
      toast.success('Прилагательное обновлено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'adjectives'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.admin.adjectives.delete(id),
    onSuccess: () => {
      toast.success('Удалено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'adjectives'] });
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.admin.adjectives.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'adjectives'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ textRu: '', textEn: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: NicknameAdjective) => {
    setEditing(item);
    reset({ textRu: item.textRu, textEn: item.textEn });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    reset();
  };

  const onSubmit = (d: AdjectiveForm) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, d });
    } else {
      createMut.mutate(d);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-text-secondary">Всего: {items.length}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Добавить
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Нет прилагательных"
            description="Добавьте прилагательные для генерации никнеймов"
            action={<Button size="sm" onClick={openCreate}>Добавить</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Русский</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.textRu}</TableCell>
                  <TableCell className="text-text-secondary">{item.textEn}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleMut.mutate({ id: item.id, isActive: !item.isActive })}>
                      <Badge variant={item.isActive ? 'success' : 'default'}>
                        {item.isActive ? 'Активно' : 'Неактивно'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-blue hover:bg-blue/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить?')) deleteMut.mutate(item.id);
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

      <Dialog open={dialogOpen} onClose={closeDialog} title={editing ? 'Редактировать' : 'Новое прилагательное'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input id="textRu" label="Русский" placeholder="Быстрый" error={errors.textRu?.message} {...register('textRu')} />
          <Input id="textEn" label="English" placeholder="Swift" error={errors.textEn?.message} {...register('textEn')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>Отмена</Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

// ── Animals Tab ──

function AnimalsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NicknameAnimal | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'animals'],
    queryFn: () => api.admin.animals.list(),
  });

  const items = data?.data.data ?? [];

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AnimalForm>({
    resolver: zodResolver(animalSchema),
  });

  const emojiValue = watch('emoji');

  const createMut = useMutation({
    mutationFn: (d: AnimalForm) => api.admin.animals.create(d),
    onSuccess: () => {
      toast.success('Животное создано');
      queryClient.invalidateQueries({ queryKey: ['admin', 'animals'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка создания'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: AnimalForm }) =>
      api.admin.animals.update(id, d),
    onSuccess: () => {
      toast.success('Животное обновлено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'animals'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.admin.animals.delete(id),
    onSuccess: () => {
      toast.success('Удалено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'animals'] });
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.admin.animals.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'animals'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ textRu: '', textEn: '', emoji: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: NicknameAnimal) => {
    setEditing(item);
    reset({ textRu: item.textRu, textEn: item.textEn, emoji: item.emoji });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    reset();
  };

  const onSubmit = (d: AnimalForm) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, d });
    } else {
      createMut.mutate(d);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-text-secondary">Всего: {items.length}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Добавить
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Нет животных"
            description="Добавьте животных для генерации никнеймов"
            action={<Button size="sm" onClick={openCreate}>Добавить</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Эмоджи</TableHead>
                <TableHead>Русский</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-2xl">{item.emoji}</TableCell>
                  <TableCell className="font-medium">{item.textRu}</TableCell>
                  <TableCell className="text-text-secondary">{item.textEn}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleMut.mutate({ id: item.id, isActive: !item.isActive })}>
                      <Badge variant={item.isActive ? 'success' : 'default'}>
                        {item.isActive ? 'Активно' : 'Неактивно'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-blue hover:bg-blue/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить?')) deleteMut.mutate(item.id);
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

      <Dialog open={dialogOpen} onClose={closeDialog} title={editing ? 'Редактировать' : 'Новое животное'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input id="textRu" label="Русский" placeholder="Лис" error={errors.textRu?.message} {...register('textRu')} />
          <Input id="textEn" label="English" placeholder="Fox" error={errors.textEn?.message} {...register('textEn')} />
          <EmojiPickerInput
            value={emojiValue ?? ''}
            onChange={(emoji) => setValue('emoji', emoji, { shouldValidate: true })}
            label="Эмоджи"
            error={errors.emoji?.message}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>Отмена</Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

// ── Emojis Tab ──

function EmojisTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AvatarEmojiItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'emojis'],
    queryFn: () => api.admin.emojis.list(),
  });

  const items = data?.data.data ?? [];

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EmojiForm>({
    resolver: zodResolver(emojiSchema),
  });

  const emojiTabValue = watch('emoji');

  const createMut = useMutation({
    mutationFn: (d: EmojiForm) => api.admin.emojis.create(d),
    onSuccess: () => {
      toast.success('Эмоджи создан');
      queryClient.invalidateQueries({ queryKey: ['admin', 'emojis'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка создания'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: EmojiForm }) =>
      api.admin.emojis.update(id, d),
    onSuccess: () => {
      toast.success('Эмоджи обновлён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'emojis'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.admin.emojis.delete(id),
    onSuccess: () => {
      toast.success('Удалено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'emojis'] });
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.admin.emojis.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emojis'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ emoji: '', category: 'default' });
    setDialogOpen(true);
  };

  const openEdit = (item: AvatarEmojiItem) => {
    setEditing(item);
    reset({ emoji: item.emoji, category: item.category });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    reset();
  };

  const onSubmit = (d: EmojiForm) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, d });
    } else {
      createMut.mutate(d);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-text-secondary">Всего: {items.length}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Добавить
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Нет эмоджи"
            description="Добавьте эмоджи для аватаров пользователей"
            action={<Button size="sm" onClick={openCreate}>Добавить</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Эмоджи</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-2xl">{item.emoji}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-surface-secondary px-2 py-1 rounded">
                      {item.category}
                    </code>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleMut.mutate({ id: item.id, isActive: !item.isActive })}>
                      <Badge variant={item.isActive ? 'success' : 'default'}>
                        {item.isActive ? 'Активно' : 'Неактивно'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-blue hover:bg-blue/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить?')) deleteMut.mutate(item.id);
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

      <Dialog open={dialogOpen} onClose={closeDialog} title={editing ? 'Редактировать' : 'Новый эмоджи'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <EmojiPickerInput
            value={emojiTabValue ?? ''}
            onChange={(emoji) => setValue('emoji', emoji, { shouldValidate: true })}
            label="Эмоджи"
            error={errors.emoji?.message}
          />
          <Input id="category" label="Категория" placeholder="animals" error={errors.category?.message} {...register('category')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>Отмена</Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

// ── Main Page ──

export function ReferencePage() {
  const [activeTab, setActiveTab] = useState<Tab>('adjectives');

  return (
    <div>
      <PageHeader title="Никнеймы и аватары" description="Прилагательные, животные и эмоджи для персонализации" />

      <div className="flex gap-1 mb-6 bg-surface-secondary p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'adjectives' && <AdjectivesTab />}
      {activeTab === 'animals' && <AnimalsTab />}
      {activeTab === 'emojis' && <EmojisTab />}
    </div>
  );
}
