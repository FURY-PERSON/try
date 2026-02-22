import { Share } from 'react-native';

type ShareResultParams = {
  score: number;
  total: number;
  streak: number;
  results: boolean[];
};

export const shareResult = async ({ score, total, streak, results }: ShareResultParams): Promise<void> => {
  const squares = results.map((correct) => (correct ? '🟩' : '🟥')).join('');
  const message = `WordPulse ${score}/${total} ${squares}\n🔥 Стрик: ${streak}\nhttps://wordpulse.app`;

  try {
    await Share.share({ message });
  } catch {
    // User cancelled sharing
  }
};

export const shareFact = async (factText: string, source: string): Promise<void> => {
  const message = `💡 ${factText}\n\n📖 ${source}\n\nВ приложении WordPulse`;

  try {
    await Share.share({ message });
  } catch {
    // User cancelled sharing
  }
};
