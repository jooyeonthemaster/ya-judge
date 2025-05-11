'use client';

import { useState, useEffect } from 'react';
import { PaymentRequest } from '@portone/browser-sdk/v2';
import * as PortOne from '@portone/browser-sdk/v2';

// Define component props
interface PortonePaymentProps {
  onPaymentComplete?: (result: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentCancel?: () => void;
  paymentButtonText?: string;
  disabled?: boolean;
  paymentOptions: Omit<PaymentRequest, 'redirectUrl' | 'storeId' | 'channelKey'>;
}

/**
 * Portone Payment Component
 * 
 * A React component for integrating Portone payments using the v2 SDK
 */
export default function PortonePayment({
  onPaymentComplete,
  onPaymentError,
  onPaymentCancel,
  paymentButtonText = 'Pay Now',
  disabled = false,
  paymentOptions,
}: PortonePaymentProps) {
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Handle payment initiation
  const handlePayment = async () => {
    if (!sdkLoaded) {
      alert('Payment SDK is still loading. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Create full payment options with redirect URL and credentials
      const fullPaymentOptions: PaymentRequest = {
        ...paymentOptions,
        redirectUrl: window.location.origin + '/payment/result',
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '',
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '',
      };

      // Request payment using Portone SDK
      const result = await PortOne.requestPayment(fullPaymentOptions);
      
      if (result && onPaymentComplete) {
        onPaymentComplete(result);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      
      // Check if payment was canceled by user
      if (
        error instanceof Error && 
        error.message.includes('cancel')
      ) {
        if (onPaymentCancel) {
          onPaymentCancel();
        }
      } else if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load Portone SDK
  useEffect(() => {
    const loadPortoneSdk = async () => {
      try {
        setSdkLoaded(true);
      } catch (error) {
        console.error('Failed to load Portone SDK:', error);
        if (onPaymentError) {
          onPaymentError(error);
        }
      }
    };

    if (!sdkLoaded) {
      loadPortoneSdk();
    }
  }, [sdkLoaded, onPaymentError]);

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={disabled || loading || !sdkLoaded}
        className={`px-4 py-2 rounded ${
          disabled || loading || !sdkLoaded
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? '결제 요청중...' : paymentButtonText}
      </button>
      {!sdkLoaded && <p className="text-sm text-gray-500 mt-2">Loading payment system...</p>}
    </div>
  );
} 