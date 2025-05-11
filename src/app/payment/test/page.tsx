'use client';

import { useState } from 'react';
import { useEffect } from 'react';

// Using the type approach instead of direct import
// to avoid conflicts in server components
type PortOneSDK = {
  requestPayment: (options: any) => Promise<any>;
};

export default function PaymentTestPage() {
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handlePaymentTest = async () => {
    setLoading(true);
    try {
      // Create merchant UID
      const merchantUid = `mid_${Date.now()}`;
      
      try {
        // In a real implementation, you would:
        // 1. First install the SDK: npm install @portone/browser-sdk
        // 2. Then in your component:
        //    import { loadPortone } from "@portone/browser-sdk/v2";
        //    const portone = await loadPortone({ clientKey: "YOUR_CLIENT_KEY" });
        //    await portone.requestPayment({
        //      storeId: "store-123",
        //      paymentId: merchantUid,
        //      orderName: "Test Payment",
        //      totalAmount: 1000,
        //      currency: "KRW",
        //      channelKey: "channel-key",
        //      payMethod: "CARD",
        //      redirectUrl: window.location.origin + "/payment/result"
        //    });

        // For this test implementation, we'll use our test API route
        const response = await fetch('/api/payment/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merchant_uid: merchantUid,
            amount: 1000,
            method: 'card',
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          setPaymentResult(result.data);
        } else {
          throw new Error(result.message || 'Payment failed');
        }
      } catch (error) {
        console.error('Payment error:', error);
        setPaymentResult({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    } catch (error) {
      console.error('Error in payment process:', error);
      setPaymentResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Portone v2 Payment Test</h1>
      
      <div className="mb-6 p-4 border border-gray-200 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Test Payment</h2>
        <p className="mb-4">Click the button below to simulate a Portone v2 payment.</p>
        
        <button
          onClick={handlePaymentTest}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Processing...' : 'Pay 1,000 KRW'}
        </button>
      </div>
      
      {paymentResult && (
        <div className="p-4 border border-gray-200 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Payment Result</h2>
          
          {paymentResult.error ? (
            <div className="text-red-600">
              <p>Error: {paymentResult.error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p><span className="font-medium">Payment ID:</span> {paymentResult.payment_id}</p>
              <p><span className="font-medium">Merchant UID:</span> {paymentResult.merchant_uid}</p>
              <p><span className="font-medium">Amount:</span> {paymentResult.amount} KRW</p>
              <p><span className="font-medium">Status:</span> {paymentResult.status}</p>
              <p><span className="font-medium">Method:</span> {paymentResult.method}</p>
              <p><span className="font-medium">Paid At:</span> {new Date(paymentResult.paid_at * 1000).toLocaleString()}</p>
              {paymentResult.receipt_url && (
                <p>
                  <span className="font-medium">Receipt:</span>{' '}
                  <a 
                    href={paymentResult.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Receipt
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Add TypeScript declaration for the PortOne global object
declare global {
  interface Window {
    PortOne: any;
  }
} 