import { create } from 'zustand';

interface PaymentResult {
  paymentId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentStatus: string;
  paymentMethod: string;
  timestamp: string;
}

interface PaymentStore {
  paymentResult: PaymentResult | null;
  setPaymentResult: (result: PaymentResult) => void;
  clearPaymentResult: () => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  paymentResult: null,
  setPaymentResult: (result) => set({ paymentResult: result }),
  clearPaymentResult: () => set({ paymentResult: null }),
})); 