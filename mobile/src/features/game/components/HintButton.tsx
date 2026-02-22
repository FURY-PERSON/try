import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';

type HintButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  used?: boolean;
};

export const HintButton: FC<HintButtonProps> = ({ onPress, disabled = false, used = false }) => {
  const { colors } = useThemeContext();

  return (
    <Button
      label={used ? '' : ''}
      variant="ghost"
      size="sm"
      fullWidth={false}
      disabled={disabled || used}
      onPress={onPress}
      iconLeft={
        <MaterialCommunityIcons
          name="lightbulb-outline"
          size={20}
          color={disabled || used ? colors.textSecondary : colors.purple}
        />
      }
    />
  );
};
