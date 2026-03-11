import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type FormState = { email: string; description: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.email.trim()) {
    errors.email = 'Email обязателен';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Введите корректный email';
  }
  if (!form.description.trim()) {
    errors.description = 'Опишите проблему';
  } else if (form.description.trim().length < 10) {
    errors.description = 'Описание должно быть не менее 10 символов';
  }
  return errors;
}

const baseUrl = import.meta.env.VITE_API_URL || '';

async function submitTicket(dto: FormState) {
  const res = await axios.post(`${baseUrl}/api/v1/support`, dto);
  return res.data;
}

export function SupportPage() {
  const [form, setForm] = useState<FormState>({ email: '', description: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: submitTicket,
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        toast.error(Array.isArray(msg) ? msg.join(', ') : (msg as string) ?? 'Ошибка сервера');
      } else {
        toast.error('Неизвестная ошибка');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    mutation.mutate({ email: form.email.trim(), description: form.description.trim() });
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Поддержка</h1>
          <p className="text-sm text-text-secondary mt-1 text-center">
            Опишите проблему и мы свяжемся с вами
          </p>
        </div>

        <Card className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
              <p className="text-sm font-medium text-text-primary">Заявка отправлена!</p>
              <p className="text-xs text-text-secondary mt-1">
                Мы ответим на указанный email в ближайшее время.
              </p>
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => {
                  setForm({ email: '', description: '' });
                  setSubmitted(false);
                }}
              >
                Отправить ещё
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email для обратной связи"
                type="email"
                placeholder="example@mail.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                error={errors.email}
              />
              <Textarea
                label="Описание проблемы"
                placeholder="Опишите проблему подробно..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={5}
                error={errors.description}
              />
              <Button type="submit" loading={mutation.isPending} className="w-full">
                Отправить
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
