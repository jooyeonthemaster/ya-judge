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
  roomId: string | null;
  userName: string | null;
  isPaid: boolean;
  setPaymentResult: (result: PaymentResult) => void;
  clearPaymentResult: () => void;
  setRoomId: (roomId: string) => void;
  setUserName: (userName: string) => void;
  setIsPaid: (isPaid: boolean) => void;
  clearPaymentData: () => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  paymentResult: null,
  roomId: null,
  userName: null,
  isPaid: false,
  setPaymentResult: (result) => set({ paymentResult: result }),
  clearPaymentResult: () => set({ paymentResult: null }),
  setRoomId: (roomId) => set({ roomId }),
  setUserName: (userName) => set({ userName }),
  setIsPaid: (isPaid) => set({ isPaid }),
  clearPaymentData: () => set({ 
    roomId: null, 
    userName: null, 
    isPaid: false,
    paymentResult: null 
  }),
})); 