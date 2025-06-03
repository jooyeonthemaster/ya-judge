import { create } from 'zustand';
import { PaymentResult } from '@/lib/newpayment';

interface PaymentState {
  // Payment result data
  paymentResult: PaymentResult | null;
  
  // Session data
  roomId: string | null;
  userName: string | null;
  
  // Payment status flags
  isPaymentInProgress: boolean;
  isPaymentCompleted: boolean;
  
  // Error handling
  paymentError: string | null;
}

interface PaymentActions {
  // Payment result actions
  setPaymentResult: (result: PaymentResult) => void;
  clearPaymentResult: () => void;
  
  // Session actions
  setRoomId: (roomId: string) => void;
  setUserName: (userName: string) => void;
  
  // Payment status actions
  setPaymentInProgress: (inProgress: boolean) => void;
  setPaymentCompleted: (completed: boolean) => void;
  
  // Error handling
  setPaymentError: (error: string | null) => void;
  clearPaymentError: () => void;
  
  // Utility actions
  clearAllPaymentData: () => void;
  initializePaymentSession: (roomId: string, userName: string) => void;
}

type PaymentStore = PaymentState & PaymentActions;

export const useNewPaymentStore = create<PaymentStore>((set, get) => ({
  // Initial state
  paymentResult: null,
  roomId: null,
  userName: null,
  isPaymentInProgress: false,
  isPaymentCompleted: false,
  paymentError: null,

  // Payment result actions
  setPaymentResult: (result) => {
    console.log('=== PAYMENT STORE: Setting Payment Result ===');
    console.log('Payment ID:', result.paymentId);
    console.log('Status:', result.paymentStatus);
    console.log('Amount:', result.amount);
    console.log('==========================================');
    
    set({ 
      paymentResult: result,
      isPaymentCompleted: true,
      isPaymentInProgress: false,
      paymentError: null
    });
  },
  
  clearPaymentResult: () => {
    console.log('=== PAYMENT STORE: Clearing Payment Result ===');
    set({ paymentResult: null });
  },

  // Session actions
  setRoomId: (roomId) => {
    console.log('=== PAYMENT STORE: Setting Room ID ===', roomId);
    set({ roomId });
  },
  
  setUserName: (userName) => {
    console.log('=== PAYMENT STORE: Setting User Name ===', userName);
    set({ userName });
  },

  // Payment status actions
  setPaymentInProgress: (inProgress) => {
    console.log('=== PAYMENT STORE: Payment In Progress ===', inProgress);
    set({ 
      isPaymentInProgress: inProgress,
      paymentError: inProgress ? null : get().paymentError // Clear error when starting new payment
    });
  },
  
  setPaymentCompleted: (completed) => {
    console.log('=== PAYMENT STORE: Payment Completed ===', completed);
    set({ 
      isPaymentCompleted: completed,
      isPaymentInProgress: false
    });
  },

  // Error handling
  setPaymentError: (error) => {
    console.log('=== PAYMENT STORE: Setting Payment Error ===', error);
    set({ 
      paymentError: error,
      isPaymentInProgress: false
    });
  },
  
  clearPaymentError: () => {
    console.log('=== PAYMENT STORE: Clearing Payment Error ===');
    set({ paymentError: null });
  },

  // Utility actions
  clearAllPaymentData: () => {
    console.log('=== PAYMENT STORE: Clearing All Payment Data ===');
    set({
      paymentResult: null,
      roomId: null,
      userName: null,
      isPaymentInProgress: false,
      isPaymentCompleted: false,
      paymentError: null
    });
  },
  
  initializePaymentSession: (roomId, userName) => {
    console.log('=== PAYMENT STORE: Initializing Payment Session ===');
    console.log('Room ID:', roomId);
    console.log('User Name:', userName);
    console.log('================================================');
    
    set({
      roomId,
      userName,
      isPaymentInProgress: false,
      isPaymentCompleted: false,
      paymentError: null,
      paymentResult: null
    });
  }
}));

// Selectors for common use cases
export const usePaymentStatus = () => {
  const store = useNewPaymentStore();
  return {
    isInProgress: store.isPaymentInProgress,
    isCompleted: store.isPaymentCompleted,
    hasError: !!store.paymentError,
    error: store.paymentError
  };
};

export const usePaymentSession = () => {
  const store = useNewPaymentStore();
  return {
    roomId: store.roomId,
    userName: store.userName,
    isSessionReady: !!(store.roomId && store.userName)
  };
};

export const usePaymentResult = () => {
  const store = useNewPaymentStore();
  return {
    result: store.paymentResult,
    hasResult: !!store.paymentResult
  };
}; 