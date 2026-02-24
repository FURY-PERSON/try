import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { FactCard } from '@/features/game/components/FactCard';
import { shareFact } from '@/utils/share';
import { analytics } from '@/services/analytics';

export default function FactModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    explanation: string;
    source: string;
    sourceUrl?: string;
    illustrationUrl?: string;
  }>();

  const handleNext = () => {
    router.back();
  };

  const handleShare = async () => {
    await shareFact(params.explanation ?? '', params.source ?? '');
    analytics.logEvent('fact_shared');
  };

  React.useEffect(() => {
    analytics.logEvent('fact_viewed');
  }, []);

  return (
    <Screen style={{ justifyContent: 'center', padding: 16, paddingTop: insets.top }}>
      <AnimatedEntrance delay={0} direction="up">
        <FactCard
          explanation={params.explanation ?? ''}
          source={params.source ?? ''}
          sourceUrl={params.sourceUrl}
          illustrationUrl={params.illustrationUrl}
          onNext={handleNext}
          onShare={handleShare}
        />
      </AnimatedEntrance>
    </Screen>
  );
}
