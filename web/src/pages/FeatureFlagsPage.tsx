import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { api } from '@/services/api';
import type { FeatureFlag, CreateFeatureFlagDto, UpdateFeatureFlagDto } from '@/api-client/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';

// ── Toggle Switch ───────────────────────────────────────────────────────────

type ToggleSwitchProps = {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
};

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ── Flag Form ───────────────────────────────────────────────────────────────

type FlagFormState = {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  payload: string;
};

const EMPTY_FORM: FlagFormState = {
  key: '',
  name: '',
  description: '',
  isEnabled: false,
  payload: '',
};

type FlagFormErrors = Partial<Record<keyof FlagFormState, string>>;

function validateForm(form: FlagFormState, isEdit: boolean): FlagFormErrors {
  const errors: FlagFormErrors = {};
  if (!isEdit && !form.key.trim()) {
    errors.key = 'Ключ обязателен';
  } else if (!isEdit && !/^[a-z][a-z0-9_]*$/.test(form.key.trim())) {
    errors.key = 'Только строчные буквы, цифры и _, начиная с буквы';
  }
  if (!form.name.trim()) {
    errors.name = 'Название обязательно';
  }
  if (form.payload.trim()) {
    try {
      JSON.parse(form.payload.trim());
    } catch {
      errors.payload = 'Невалидный JSON';
    }
  }
  return errors;
}

function formToDto(form: FlagFormState): CreateFeatureFlagDto {
  const dto: CreateFeatureFlagDto = {
    key: form.key.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    isEnabled: form.isEnabled,
  };
  if (form.payload.trim()) {
    dto.payload = JSON.parse(form.payload.trim()) as Record<string, unknown>;
  }
  return dto;
}

// ── Confirm Delete Dialog ───────────────────────────────────────────────────

type ConfirmDeleteDialogProps = {
  flag: FeatureFlag | null;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
};

function ConfirmDeleteDialog({ flag, onConfirm, onClose, loading }: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={flag !== null} onClose={onClose} title="Удалить флаг">
      <div className="flex gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <p className="text-sm text-text-primary">
            Удалить флаг{' '}
            <code className="bg-surface-secondary px-1.5 py-0.5 rounded text-xs font-mono text-text-primary">
              {flag?.key}
            </code>
            ?
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Это действие необратимо. Все части приложения, которые зависят от этого флага,
            будут использовать значение по умолчанию.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Удалить
        </Button>
      </div>
    </Dialog>
  );
}

// ── Flag Form Dialog ────────────────────────────────────────────────────────

type FlagFormDialogProps = {
  open: boolean;
  editingFlag: FeatureFlag | null;
  onClose: () => void;
  onSubmit: (dto: CreateFeatureFlagDto | UpdateFeatureFlagDto, key?: string) => void;
  loading: boolean;
  serverError: string | null;
};

function FlagFormDialog({ open, editingFlag, onClose, onSubmit, loading, serverError }: FlagFormDialogProps) {
  const isEdit = editingFlag !== null;

  const [form, setForm] = useState<FlagFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FlagFormErrors>({});

  useEffect(() => {
    if (!open) return;
    if (editingFlag) {
      setForm({
        key: editingFlag.key,
        name: editingFlag.name,
        description: editingFlag.description,
        isEnabled: editingFlag.isEnabled,
        payload: editingFlag.payload ? JSON.stringify(editingFlag.payload, null, 2) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [open, editingFlag]);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form, isEdit);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const dto = formToDto(form);
    if (isEdit) {
      const { key: _key, ...updateDto } = dto;
      void _key;
      onSubmit(updateDto, editingFlag!.key);
    } else {
      onSubmit(dto);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Редактировать флаг' : 'Новый флаг'}
      description={isEdit ? `Изменение флага "${editingFlag?.key}"` : 'Создание нового фича-флага'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Ключ (key)"
            placeholder="show_ads"
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            disabled={isEdit}
            error={errors.key}
          />
          {!isEdit && (
            <p className="text-xs text-text-secondary mt-1">
              snake_case: только строчные буквы, цифры и_
            </p>
          )}
        </div>

        <Input
          label="Название"
          placeholder="Показ рекламы"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />

        <Textarea
          label="Описание"
          placeholder="Глобальное управление показом рекламы"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
        />

        <div>
          <Textarea
            label='Payload (JSON, необязательно)'
            placeholder='{ "variant": "v2", "maxPerDay": 5 }'
            value={form.payload}
            onChange={(e) => setForm((f) => ({ ...f, payload: e.target.value }))}
            rows={3}
            error={errors.payload}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <ToggleSwitch
            enabled={form.isEnabled}
            onChange={() => setForm((f) => ({ ...f, isEnabled: !f.isEnabled }))}
          />
          <span className="text-sm text-text-primary">
            {form.isEnabled ? 'Включён' : 'Выключен'}
          </span>
        </div>

        {serverError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red/10 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export function FeatureFlagsPage() {
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [deletingFlag, setDeletingFlag] = useState<FeatureFlag | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: () => api.admin.featureFlags.list(),
  });

  const flags: FeatureFlag[] = Array.isArray(data?.data?.data)
    ? (data.data.data as FeatureFlag[])
    : [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });

  const extractErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
      return error.response?.data?.error ?? 'Ошибка сервера';
    }
    return 'Неизвестная ошибка';
  };

  const createMutation = useMutation({
    mutationFn: (dto: CreateFeatureFlagDto) => api.admin.featureFlags.create(dto),
    onSuccess: () => {
      toast.success('Флаг создан');
      invalidate();
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, dto }: { key: string; dto: UpdateFeatureFlagDto }) =>
      api.admin.featureFlags.update(key, dto),
    onSuccess: () => {
      toast.success('Флаг обновлён');
      invalidate();
      setFormOpen(false);
      setEditingFlag(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (key: string) => api.admin.featureFlags.toggle(key),
    onSuccess: () => {
      invalidate();
      setTogglingKey(null);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
      setTogglingKey(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => api.admin.featureFlags.delete(key),
    onSuccess: () => {
      toast.success('Флаг удалён');
      invalidate();
      setDeletingFlag(null);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
      setDeletingFlag(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingFlag(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormOpen(true);
  };

  const handleFormSubmit = (
    dto: CreateFeatureFlagDto | UpdateFeatureFlagDto,
    key?: string,
  ) => {
    if (key) {
      updateMutation.mutate({ key, dto: dto as UpdateFeatureFlagDto });
    } else {
      createMutation.mutate(dto as CreateFeatureFlagDto);
    }
  };

  const handleToggle = (flag: FeatureFlag) => {
    setTogglingKey(flag.key);
    toggleMutation.mutate(flag.key);
  };

  const handleDeleteConfirm = () => {
    if (deletingFlag) {
      deleteMutation.mutate(deletingFlag.key);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const formServerError = createMutation.error
    ? extractErrorMessage(createMutation.error)
    : updateMutation.error
      ? extractErrorMessage(updateMutation.error)
      : null;

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Управление функциональными флагами для управления поведением приложения"
        actions={
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Новый флаг
          </Button>
        }
      />

      <Card>
        {isLoading && (
          <div className="space-y-3 p-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <AlertTriangle className="w-8 h-8 mb-3 text-red-400" />
            <p className="text-sm">Не удалось загрузить флаги. Попробуйте обновить страницу.</p>
          </div>
        )}

        {!isLoading && !isError && flags.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Flag className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm font-medium">Флагов пока нет</p>
            <p className="text-xs mt-1">Создайте первый флаг, нажав «Новый флаг»</p>
          </div>
        )}

        {!isLoading && !isError && flags.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ключ</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Payload</TableHead>
                <TableHead className="text-center">Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((flag) => (
                <TableRow key={flag.key}>
                  <TableCell>
                    <code className="bg-surface-secondary px-2 py-1 rounded text-xs font-mono text-text-primary">
                      {flag.key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-text-primary">{flag.name}</p>
                    {flag.description && (
                      <p className="text-xs text-text-secondary mt-0.5 truncate max-w-xs">
                        {flag.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {flag.payload ? (
                      <code className="text-xs font-mono text-text-secondary bg-surface-secondary px-1.5 py-0.5 rounded truncate block max-w-[200px]">
                        {JSON.stringify(flag.payload)}
                      </code>
                    ) : (
                      <span className="text-xs text-text-secondary">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ToggleSwitch
                        enabled={flag.isEnabled}
                        onChange={() => handleToggle(flag)}
                        disabled={togglingKey === flag.key}
                      />
                      <Badge variant={flag.isEnabled ? 'success' : 'default'}>
                        {flag.isEnabled ? 'Вкл' : 'Выкл'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(flag)}
                        className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingFlag(flag)}
                        className="p-1.5 rounded-lg text-text-secondary hover:bg-red/10 hover:text-red-500 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <FlagFormDialog
        open={formOpen}
        editingFlag={editingFlag}
        onClose={() => {
          setFormOpen(false);
          setEditingFlag(null);
        }}
        onSubmit={handleFormSubmit}
        loading={isMutating}
        serverError={formServerError}
      />

      <ConfirmDeleteDialog
        flag={deletingFlag}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingFlag(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
