"use client";

import { useEffect, useState } from "react";
import { usePaymentStore } from "@/app/store/paymentStore";
import { verifyPayment, recordPayment } from "@/lib/portone";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";

interface PendingPayment {
  paymentId: string;
  orderData: any;
}

interface ErrorInfo {
  code?: string;
  message: string;
  details?: any;
  timestamp: string;
}

interface DebugInfo {
  lastMessage?: string;
  lastData?: any;
  timestamp?: string;
  logs?: Array<{timestamp: string; message: string; data?: any}>;
}

export default function PaymentResultPage() {
  const paymentResult = usePaymentStore((state) => state.paymentResult);
  const setPaymentResult = usePaymentStore((state) => state.setPaymentResult);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  // Create a debug logger helper
  function logPaymentDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data);
    
    // Save to localStorage for persistent debugging
    const logs = JSON.parse(localStorage.getItem('paymentDebugLogs') || '[]');
    logs.push({ timestamp, message, data });
    localStorage.setItem('paymentDebugLogs', JSON.stringify(logs));
    
    // Update debug state
    setDebugInfo((prev: DebugInfo) => ({
      ...prev,
      lastMessage: message,
      lastData: data,
      timestamp,
      logs: logs.slice(-5) // Keep last 5 logs in state
    }));
  }

  // Check for redirected mobile payment
  useEffect(() => {
    async function handleMobilePaymentRedirect() {
      try {
        // Get URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const urlPaymentId = urlParams.get('paymentId');
        const transactionType = urlParams.get('transactionType');
        const txId = urlParams.get('txId');
        
        // Check for pending payment data in sessionStorage
        const pendingPaymentId = sessionStorage.getItem('pendingPaymentId');
        const pendingOrderData = sessionStorage.getItem('pendingOrderData');
        
        logPaymentDebug('Payment result page loaded', { 
          hasPaymentId: !!pendingPaymentId,
          hasOrderData: !!pendingOrderData,
          existingResult: !!paymentResult,
          urlParams: {
            paymentId: urlPaymentId,
            transactionType,
            txId
          }
        });
        
        // Handle URL-based verification (Portone mobile redirect)
        if (urlPaymentId && transactionType === 'PAYMENT') {
          logPaymentDebug('Found payment ID in URL params, verifying payment', { urlPaymentId, txId });
          
          try {
            // Verify payment using the payment ID from URL
            const verificationResult = await fetch(`/api/payment/paymentverification?paymentId=${urlPaymentId}&txId=${txId || ''}`, {
              method: 'GET',
            }).then(res => res.json());
            
            logPaymentDebug('URL-based payment verification result', verificationResult);
            
            if (verificationResult.status === 'success' && verificationResult.payment) {
              const { payment } = verificationResult;
              
              // Prepare payment record data
              const paymentRecord = {
                paymentId: urlPaymentId,
                amount: payment.amount || 0,
                orderName: payment.orderName || 'Payment',
                customerName: payment.customerName || '',
                customerEmail: payment.customerEmail || '',
                customerPhone: payment.customerPhone || '',
                paymentStatus: 'SUCCESS',
                paymentMethod: typeof payment.method === 'string' ? payment.method : payment.method?.type || 'CARD',
                timestamp: new Date().toISOString()
              };
              
              // Record the payment
              logPaymentDebug('Recording URL-based payment', paymentRecord);
              const externalResponse = await recordPayment(paymentRecord);
              
              if (externalResponse.ok) {
                logPaymentDebug('URL-based payment completed successfully!');
                
                // Store payment data in Zustand store
                setPaymentResult(paymentRecord);
              } else {
                const errorResponse = await externalResponse.text();
                logPaymentDebug('Failed to record URL-based payment', { status: externalResponse.status, response: errorResponse });
                setError({
                  code: `HTTP_${externalResponse.status}`,
                  message: 'Payment was processed but failed to be recorded. Please contact support.',
                  details: { status: externalResponse.status, response: errorResponse },
                  timestamp: new Date().toISOString()
                });
              }
            } else {
              logPaymentDebug('URL-based payment verification failed', verificationResult);
              setError({
                code: verificationResult.code || 'VERIFICATION_FAILED',
                message: verificationResult.message || 'Payment verification failed',
                details: verificationResult,
                timestamp: new Date().toISOString()
              });
            }
            
            setLoading(false);
            return;
          } catch (verifyError) {
            logPaymentDebug('Error verifying URL-based payment', verifyError);
            // Continue to check sessionStorage as fallback
          }
        }
        
        // Handle sessionStorage-based verification (original flow)
        if (pendingPaymentId && pendingOrderData) {
          logPaymentDebug('Found pending payment data, completing mobile payment flow', { pendingPaymentId });
          
          try {
            // Parse the order data
            const orderData = JSON.parse(pendingOrderData);
            
            // Verify the payment with backend
            logPaymentDebug('Verifying payment with backend', { pendingPaymentId, orderData });
            const verificationResult = await verifyPayment(pendingPaymentId, orderData);
            
            logPaymentDebug('Mobile payment verification result', verificationResult);
            
            if (verificationResult.status === 'success') {
              // Prepare payment record data
              const paymentRecord = {
                paymentId: pendingPaymentId,
                amount: orderData.totalAmount,
                orderName: orderData.orderName,
                customerName: orderData.name,
                customerEmail: orderData.email,
                customerPhone: orderData.phone,
                paymentStatus: 'SUCCESS',
                paymentMethod: orderData.payMethod,
                timestamp: new Date().toISOString()
              };
              
              // Record the payment
              logPaymentDebug('Recording payment', paymentRecord);
              const externalResponse = await recordPayment(paymentRecord);
              
              if (externalResponse.ok) {
                logPaymentDebug('Mobile payment completed successfully!');
                
                // Store payment data in Zustand store
                setPaymentResult(paymentRecord);
                
                // Clear the pending payment data
                sessionStorage.removeItem('pendingPaymentId');
                sessionStorage.removeItem('pendingOrderData');
              } else {
                const errorResponse = await externalResponse.text();
                logPaymentDebug('Failed to record mobile payment', { status: externalResponse.status, response: errorResponse });
                setError({
                  code: `HTTP_${externalResponse.status}`,
                  message: 'Payment was processed but failed to be recorded. Please contact support.',
                  details: { status: externalResponse.status, response: errorResponse },
                  timestamp: new Date().toISOString()
                });
              }
            } else {
              logPaymentDebug('Mobile payment verification failed', verificationResult);
              setError({
                code: 'VERIFICATION_FAILED',
                message: verificationResult.message || 'Payment verification failed',
                details: verificationResult,
                timestamp: new Date().toISOString()
              });
            }
          } catch (parseError) {
            logPaymentDebug('Error parsing order data', parseError);
            setError({
              code: 'PARSE_ERROR',
              message: 'Failed to parse payment data',
              details: parseError instanceof Error ? parseError.message : String(parseError),
              timestamp: new Date().toISOString()
            });
          }
        } else if (urlParams.has('payment_status')) {
          // Handle explicit payment status in URL
          const paymentStatus = urlParams.get('payment_status');
          
          if (paymentStatus) {
            logPaymentDebug('Found payment status in URL params', { paymentStatus });
            if (paymentStatus !== 'success') {
              setError({
                code: 'PAYMENT_' + paymentStatus.toUpperCase(),
                message: `Payment ${paymentStatus}. Please try again.`,
                details: { urlParams: Object.fromEntries(urlParams.entries()) },
                timestamp: new Date().toISOString()
              });
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorStack = err instanceof Error ? err.stack : undefined;
        
        logPaymentDebug('Error processing mobile payment', { message: errorMessage, stack: errorStack });
        setError({
          code: 'PROCESSING_ERROR',
          message: 'An error occurred while processing your payment. Please contact support.',
          details: { message: errorMessage, stack: errorStack },
          timestamp: new Date().toISOString()
        });
        setLoading(false);
      }
    }
    
    // Execute the mobile payment handling
    handleMobilePaymentRedirect();
  }, [setPaymentResult, paymentResult]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="max-w-md mx-auto p-6 flex justify-center">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex justify-center">
        <div className="max-w-md mx-auto my-20 p-6">
          <div className="flex justify-center mb-4">
            <AlertCircle className="text-red-500 w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-center text-red-600">결제 오류</h1>
          <p className="text-center mb-2">{error.message}</p>
          {error.code && (
            <p className="text-center text-sm text-gray-500 mb-6">오류 코드: {error.code}</p>
          )}
          
          {/* Debug Information */}
          <div className="mt-6 border border-gray-200 rounded-md p-3 bg-gray-50 text-xs overflow-auto">
            <p className="font-medium mb-1">디버그 정보:</p>
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify({
                error,
                debug: debugInfo
              }, null, 2)}
            </pre>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => router.push('/payment/checkout')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div className="min-h-screen bg-white flex justify-center">
        <div className="max-w-md mx-auto my-20 p-6">
          <div className="flex justify-center mb-4">
            <AlertCircle className="text-orange-500 w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-center">결제 정보가 없습니다</h1>
          <p className="text-center mb-4">결제 정보를 찾을 수 없습니다.</p>
          
          {/* Debug Information */}
          <div className="mt-4 border border-gray-200 rounded-md p-3 bg-gray-50 text-xs overflow-auto">
            <p className="font-medium mb-1">디버그 정보:</p>
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify({
                sessionStorage: {
                  hasPendingPaymentId: !!sessionStorage.getItem('pendingPaymentId'),
                  hasPendingOrderData: !!sessionStorage.getItem('pendingOrderData')
                },
                urlParams: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
                debug: debugInfo
              }, null, 2)}
            </pre>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => router.push('/payment/checkout')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              결제 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(paymentResult.timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-4 bg-white">
        {/* Receipt Container */}
        <div className="border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <CheckCircle className="text-purple-500 w-16 h-16" />
          </div>
          
          {/* Store Name / Payment Title */}
          <h1 className="text-xl font-bold text-center mb-1 text-black">{paymentResult.orderName}</h1>
          
          {/* Total Amount */}
          <div className="text-2xl font-bold text-center text-purple-600 mb-2">
            {paymentResult.amount.toLocaleString()} 원
          </div>
          
          {/* Timestamp */}
          <div className="text-black text-center text-sm mb-6">
            {formattedDate}
          </div>
          
          {/* Payment Details */}
          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-black">결제 ID</div>
              <div className="text-right font-medium text-black">{paymentResult.paymentId}</div>
              
              <div className="text-black">결제수단</div>
              <div className="text-right font-medium text-black">{paymentResult.paymentMethod}</div>
              
              <div className="text-black">상태</div>
              <div className="text-right font-medium text-green-600">{paymentResult.paymentStatus}</div>
            </div>
          </div>
          
          {/* Customer Details */}
          <div className="border-b border-gray-200 py-4 mb-4">
            <h3 className="font-medium mb-2 text-black">고객 정보</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-black">이름</div>
              <div className="text-right text-black">{paymentResult.customerName}</div>
              
              <div className="text-black">이메일</div>
              <div className="text-right text-black">{paymentResult.customerEmail}</div>
              
              <div className="text-black">전화번호</div>
              <div className="text-right text-black">{paymentResult.customerPhone}</div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-black text-xs text-center space-y-1">
            <p>결제해 주셔서 감사합니다</p>
            <p>영수증을 보관해 주세요</p>
          </div>
        </div>
      </div>
    </div>
  );
} 