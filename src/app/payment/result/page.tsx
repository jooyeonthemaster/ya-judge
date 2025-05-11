'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { recordPayment } from '@/lib/portone';

function PaymentResult() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        // Extract payment result from URL parameters
        const paymentId = searchParams.get('paymentId');
        const status = searchParams.get('status');
        
        if (!paymentId) {
          throw new Error('Payment ID not found in URL parameters');
        }

        // Create payment result object
        const paymentResult = {
          payment_id: paymentId,
          status: status,
          merchant_uid: searchParams.get('merchantUid') || paymentId,
          amount: searchParams.get('amount') ? parseInt(searchParams.get('amount')!) : 0,
          method: searchParams.get('method') || 'unknown',
          paid_at: Math.floor(Date.now() / 1000),
          receipt_url: searchParams.get('receiptUrl') || undefined,
        };

        // Record payment to backend
        try {
          const recordResponse = await recordPayment(paymentResult);
          
          if (!recordResponse.ok) {
            console.warn('Failed to record payment to backend:', await recordResponse.text());
          }
        } catch (recordError) {
          console.error('Error recording payment:', recordError);
        }

        // Set payment status based on the result
        setPaymentStatus(status === 'success' ? 'success' : 'failed');
        setPaymentDetails(paymentResult);

      } catch (error) {
        console.error('Error processing payment result:', error);
        setPaymentStatus('failed');
        setError(error instanceof Error ? error.message : 'Unknown payment error');
      }
    };

    // Process payment result when component mounts
    processPaymentResult();
  }, [searchParams]);

  // Render loading state
  if (paymentStatus === 'loading') {
    return (
      <div className="container mx-auto p-8 max-w-xl text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Payment</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="mt-4 text-gray-600">Please wait while we process your payment...</p>
      </div>
    );
  }

  // Render success state
  if (paymentStatus === 'success') {
    return (
      <div className="container mx-auto p-8 max-w-xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-full p-2 mr-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-800">Payment Successful</h1>
          </div>
          
          <p className="text-green-700 mb-6">Your payment has been processed successfully.</p>
          
          {paymentDetails && (
            <div className="bg-white rounded-md p-4 border border-gray-200">
              <h2 className="font-semibold text-gray-800 mb-3">Payment Details</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Payment ID:</div>
                <div>{paymentDetails.payment_id}</div>
                
                <div className="text-gray-600">Amount:</div>
                <div>{paymentDetails.amount.toLocaleString()} KRW</div>
                
                <div className="text-gray-600">Method:</div>
                <div className="capitalize">{paymentDetails.method}</div>
                
                <div className="text-gray-600">Date:</div>
                <div>{new Date(paymentDetails.paid_at * 1000).toLocaleString()}</div>
                
                {paymentDetails.receipt_url && (
                  <>
                    <div className="text-gray-600">Receipt:</div>
                    <div>
                      <a 
                        href={paymentDetails.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        View Receipt
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <a 
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render failed state
  return (
    <div className="container mx-auto p-8 max-w-xl">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="bg-red-100 rounded-full p-2 mr-3">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-800">Payment Failed</h1>
        </div>
        
        <p className="text-red-700 mb-6">
          {error || 'Your payment could not be processed. Please try again.'}
        </p>
        
        <div className="mt-6">
          <a 
            href="/payment/checkout"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 mr-3"
          >
            Try Again
          </a>
          <a 
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}

// 로딩 상태를 표시하는 컴포넌트
function PaymentResultFallback() {
  return (
    <div className="container mx-auto p-8 max-w-xl text-center">
      <h1 className="text-2xl font-bold mb-4">결제 정보 로딩 중</h1>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      <p className="mt-4 text-gray-600">잠시만 기다려주세요...</p>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultFallback />}>
      <PaymentResult />
    </Suspense>
  );
} 