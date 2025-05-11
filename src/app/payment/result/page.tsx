'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { recordPayment } from '@/lib/portone';

// 에러 정보를 구조화된 형태로 관리하기 위한 인터페이스
interface PaymentError {
  code?: string;
  message: string;
  details?: string;
  technicalInfo?: string;
}

function PaymentResult() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<PaymentError | null>(null);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);

  // URL에서 에러 관련 정보 추출
  const extractErrorFromParams = (params: URLSearchParams): PaymentError | null => {
    // 결제 실패 시 에러 정보가 있는지 확인
    const errorCode = params.get('error_code') || params.get('code') || '';
    const errorMsg = params.get('error_msg') || params.get('message') || params.get('fail_reason') || '';
    
    if (errorCode || errorMsg) {
      return {
        code: errorCode,
        message: errorMsg || '결제 과정에서 오류가 발생했습니다.',
        details: params.get('fail_reason') || undefined,
      };
    }
    
    return null;
  };

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        // URL 파라미터에서 에러 정보 먼저 확인
        const urlError = extractErrorFromParams(searchParams);
        if (urlError) {
          console.error('결제 실패 (URL 파라미터):', urlError);
          setPaymentStatus('failed');
          setError(urlError);
          return;
        }

        // Extract payment result from URL parameters
        const paymentId = searchParams.get('paymentId');
        const status = searchParams.get('status');
        
        if (!paymentId) {
          throw new Error('Payment ID not found in URL parameters');
        }

        // 추가 에러 파라미터 확인
        if (status === 'failed') {
          const failReason = searchParams.get('fail_reason') || '알 수 없는 오류';
          setPaymentStatus('failed');
          setError({
            code: searchParams.get('error_code') || 'PAYMENT_FAILED',
            message: '결제가 실패했습니다.',
            details: failReason
          });
          return;
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
            const responseText = await recordResponse.text();
            console.error('서버 기록 실패:', responseText);
            
            throw new Error(`결제 기록에 실패했습니다. (${recordResponse.status}: ${responseText})`);
          }
        } catch (recordError) {
          console.error('Error recording payment:', recordError);
          
          // 결제 기록 실패 시에도 상태는 유지하면서 에러 기록
          if (recordError instanceof Error) {
            setError({
              code: 'RECORD_FAILED',
              message: '결제는 완료되었으나 결제 정보 기록에 실패했습니다.',
              technicalInfo: recordError.message
            });
          }
          
          // 결제 자체는 성공했을 수 있으므로 status를 그대로 사용
        }

        // Set payment status based on the result
        setPaymentStatus(status === 'success' ? 'success' : 'failed');
        setPaymentDetails(paymentResult);

      } catch (error) {
        console.error('Error processing payment result:', error);
        setPaymentStatus('failed');
        
        // 에러 객체에서 정보 추출
        let errorMessage = '알 수 없는 결제 오류가 발생했습니다.';
        let technicalInfo = '';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          technicalInfo = error.stack || '';
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError({
          code: 'PROCESSING_ERROR',
          message: errorMessage,
          technicalInfo: technicalInfo
        });
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
          
          {/* 결제는 성공했지만 기록 중 에러가 있었다면 경고 표시 */}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-yellow-700">{error.message}</p>
              {error.technicalInfo && (
                <details className="mt-2">
                  <summary className="text-sm text-yellow-600 cursor-pointer">기술적 상세 정보</summary>
                  <p className="mt-1 text-xs text-yellow-600 whitespace-pre-wrap">{error.technicalInfo}</p>
                </details>
              )}
            </div>
          )}
          
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
        
        <div className="mb-6">
          {error ? (
            <div className="space-y-2">
              <p className="text-red-700 font-medium">
                {error.message}
              </p>
              
              {error.code && (
                <p className="text-sm text-red-600">
                  에러 코드: {error.code}
                </p>
              )}
              
              {error.details && (
                <p className="text-sm text-red-600">
                  상세 정보: {error.details}
                </p>
              )}
              
              {error.technicalInfo && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
                    className="text-xs text-red-600 underline"
                  >
                    {showTechnicalInfo ? '기술적 정보 숨기기' : '기술적 정보 보기'}
                  </button>
                  
                  {showTechnicalInfo && (
                    <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 overflow-x-auto">
                      {error.technicalInfo}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-700">
              Your payment could not be processed. Please try again.
            </p>
          )}
        </div>
        
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