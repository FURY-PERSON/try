import { create } from 'zustand';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
  show: (message: string, variant?: ToastVariant) => void;
  dismiss: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  variant: 'info',
  show: (message, variant = 'error') =>
    set({ visible: true, message, variant }),
  dismiss: () => set({ visible: false }),
}));

/** Fire-and-forget helper — call from anywhere (no hooks needed). */
export const showToast = useToastStore.getState().show;
