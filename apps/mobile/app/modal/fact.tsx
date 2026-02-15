import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { FactCard } from '@/features/game/components/FactCard';
import { shareFact } from '@/utils/share';
import { analytics } from '@/services/analytics';

export default function FactModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fact: string;
    factSource: string;
    factSourceUrl?: string;
    illustrationUrl?: string;
  }>();

  const handleNext = () => {
    router.back();
  };

  const handleShare = async () => {
    await shareFact(params.fact ?? '', params.factSource ?? '');
    analytics.logEvent('fact_shared');
  };

  React.useEffect(() => {
    analytics.logEvent('fact_viewed');
  }, []);

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ justifyContent: 'center', padding: 16 }}>
      <FactCard
        fact={params.fact ?? ''}
        factSource={params.factSource ?? ''}
        factSourceUrl={params.factSourceUrl}
        illustrationUrl={params.illustrationUrl}
        onNext={handleNext}
        onShare={handleShare}
      />
    </Screen>
  );
}
