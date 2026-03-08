import React from 'react';
import { useToastStore } from '@/stores/useToastStore';
import { Toast } from './Toast';

export const GlobalToast = () => {
  const { visible, message, variant, dismiss } = useToastStore();

  if (!visible && !message) return null;

  return (
    <Toast
      visible={visible}
      message={message}
      variant={variant}
      onDismiss={dismiss}
    />
  );
};
