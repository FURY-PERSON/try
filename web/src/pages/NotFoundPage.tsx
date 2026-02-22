import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-lg text-text-secondary mb-6">Страница не найдена</p>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </div>
    </div>
  );
}
