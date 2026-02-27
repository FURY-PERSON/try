import { Share } from 'react-native';

type ShareResultParams = {
  score: number;
  total: number;
  streak: number;
  results: boolean[];
};

export const shareResult = async ({ score, total, streak, results }: ShareResultParams): Promise<void> => {
  const squares = results.map((correct) => (correct ? '🟩' : '🟥')).join('');
  const message = `Фронт фактов ${score}/${total} ${squares}\n🔥 Стрик: ${streak}\nhttps://factfront.app`;

  try {
    await Share.share({ message });
  } catch {
    // User cancelled sharing
  }
};

export const shareFact = async (explanation: string, source: string): Promise<void> => {
  const message = `💡 ${explanation}\n\n📖 ${source}\n\nВ приложении Фронт фактов`;

  try {
    await Share.share({ message });
  } catch {
    // User cancelled sharing
  }
};
