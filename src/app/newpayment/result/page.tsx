"use client";

import { useEffect, useState } from "react";
import { useNewPaymentStore, usePaymentStatus, usePaymentSession, usePaymentResult } from "@/app/store/newPaymentStore";
import { verifyPayment, logPaymentCompletion, createPaymentResult } from "@/lib/newpayment";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export default function NewPaymentResultPage() {
  const { 
    setPaymentResult, 
    setPaymentCompleted, 
    setPaymentError 
  } = useNewPaymentStore();
  
  const { isCompleted, hasError, error } = usePaymentStatus();
  const { roomId } = usePaymentSession();
  const { result: paymentResult, hasResult } = usePaymentResult();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState<ErrorInfo | null>(null);

  // Mobile debugging helper function
  function logMobilePaymentDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[MOBILE-DEBUG ${timestamp}] ${message}`, data);
    
    // Save to localStorage for persistent mobile debugging
    try {
      const logs = JSON.parse(localStorage.getItem('mobilePaymentDebugLogs') || '[]');
      logs.push({ timestamp, message, data });
      localStorage.setItem('mobilePaymentDebugLogs', JSON.stringify(logs.slice(-10))); // Keep last 10 logs
    } catch (e) {
      console.warn('Failed to save debug logs:', e);
    }
  }

  useEffect(() => {
    async function handlePaymentResult() {
      try {
        logMobilePaymentDebug('NEW PAYMENT RESULT PAGE LOADED');

        // Get URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const urlPaymentId = urlParams.get('paymentId');
        const transactionType = urlParams.get('transactionType');
        const txId = urlParams.get('txId');
        
        // Check for pending payment data in sessionStorage (mobile flow)
        const newPaymentId = sessionStorage.getItem('newPaymentId');
        const newOrderData = sessionStorage.getItem('newOrderData');
        const newRoomId = sessionStorage.getItem('newRoomId');
        
        logMobilePaymentDebug('URL Params', { urlPaymentId, transactionType, txId });
        logMobilePaymentDebug('Session Storage', { 
          hasNewPaymentId: !!newPaymentId, 
          hasNewOrderData: !!newOrderData,
          hasNewRoomId: !!newRoomId
        });
        logMobilePaymentDebug('Existing Payment Result', !!paymentResult);
        
        // If we already have a payment result, show it
        if (hasResult && paymentResult) {
          logMobilePaymentDebug('Payment result already exists, displaying...');
          setLoading(false);
          return;
        }

        // Handle URL-based verification (PortOne mobile redirect)
        if (urlPaymentId && transactionType === 'PAYMENT') {
          console.log('=== HANDLING URL-BASED PAYMENT VERIFICATION ===');
          console.log('Payment ID from URL:', urlPaymentId);
          console.log('Transaction ID:', txId || 'N/A');
          
          try {
            // Verify payment using the new verification endpoint
            const verificationResponse = await fetch(`/api/newpayment/verify?paymentId=${urlPaymentId}&txId=${txId || ''}`, {
              method: 'GET',
            });
            
            const verificationResult = await verificationResponse.json();
            
            console.log('URL-based payment verification result:', verificationResult);
            
            if (verificationResult.status === 'success' && verificationResult.payment) {
              const paymentData = verificationResult.payment;
              
              // Save completion to Firebase instead of external API call
              await logPaymentCompletion(paymentData);
              
              // Update store with successful payment
              setPaymentResult(paymentData);
              setPaymentCompleted(true);
              
              console.log('=== URL-BASED PAYMENT COMPLETED ===');
              console.log('Payment ID:', paymentData.paymentId);
              console.log('Amount:', paymentData.amount);
              console.log('Status:', paymentData.paymentStatus);
              console.log('================================');
              
            } else {
              console.error('URL-based payment verification failed:', verificationResult);
              setLocalError({
                code: verificationResult.code || 'VERIFICATION_FAILED',
                message: verificationResult.message || 'Payment verification failed',
                details: verificationResult,
                timestamp: new Date().toISOString()
              });
            }
            
            setLoading(false);
            return;
          } catch (verifyError) {
            console.error('Error verifying URL-based payment:', verifyError);
            // Continue to check sessionStorage as fallback
          }
        }
        
        // Handle sessionStorage-based verification (mobile flow)
        if (newPaymentId && newOrderData) {
          console.log('=== HANDLING SESSION STORAGE PAYMENT VERIFICATION ===');
          console.log('Payment ID from session:', newPaymentId);
          
          try {
            // Parse the order data
            const orderData = JSON.parse(newOrderData);
            console.log('Order data:', orderData);
            
            // Verify the payment with our new backend
            const verificationResult = await verifyPayment(newPaymentId, {
              totalAmount: orderData.totalAmount,
              orderName: orderData.orderName,
              customerName: orderData.name,
              customerEmail: orderData.email,
              customerPhone: orderData.phone,
              payMethod: orderData.payMethod
            });
            
            console.log('Session-based payment verification result:', verificationResult);
            
            if (verificationResult.status === 'success') {
              // Create payment result
              const paymentData = createPaymentResult(
                newPaymentId,
                {
                  name: orderData.name,
                  email: orderData.email,
                  phone: orderData.phone,
                  address: orderData.address
                },
                {
                  orderName: orderData.orderName,
                  totalAmount: orderData.totalAmount,
                  payMethod: orderData.payMethod
                },
                'SUCCESS'
              );
              
              // Save completion to Firebase instead of external API call
              await logPaymentCompletion(paymentData);
              
              // Update store with successful payment
              setPaymentResult(paymentData);
              setPaymentCompleted(true);
              
              console.log('=== SESSION-BASED PAYMENT COMPLETED ===');
              console.log('Payment ID:', paymentData.paymentId);
              console.log('Amount:', paymentData.amount);
              console.log('Status:', paymentData.paymentStatus);
              console.log('====================================');
              
              // Auto-redirect to chat room if we have room ID
              if (newRoomId) {
                setTimeout(() => {
                  router.push(`/room/${newRoomId}`);
                }, 3000); // 3 second delay to show success
              }
              
              // Clear the pending payment data
              sessionStorage.removeItem('newPaymentId');
              sessionStorage.removeItem('newOrderData');
              sessionStorage.removeItem('newRoomId');
              
            } else {
              console.error('Session-based payment verification failed:', verificationResult);
              setLocalError({
                code: 'VERIFICATION_FAILED',
                message: verificationResult.message || 'Payment verification failed',
                details: verificationResult,
                timestamp: new Date().toISOString()
              });
            }
          } catch (parseError) {
            console.error('Error parsing order data:', parseError);
            setLocalError({
              code: 'PARSE_ERROR',
              message: 'Failed to parse payment data',
              details: parseError instanceof Error ? parseError.message : String(parseError),
              timestamp: new Date().toISOString()
            });
          }
        } else if (urlParams.has('payment_status')) {
          // Handle explicit payment status in URL
          const paymentStatus = urlParams.get('payment_status');
          
          if (paymentStatus && paymentStatus !== 'success') {
            console.log('Payment status from URL:', paymentStatus);
            setLocalError({
              code: 'PAYMENT_' + paymentStatus.toUpperCase(),
              message: `Payment ${paymentStatus}. Please try again.`,
              details: { urlParams: Object.fromEntries(urlParams.entries()) },
              timestamp: new Date().toISOString()
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error processing payment result:', errorMessage);
        setLocalError({
          code: 'PROCESSING_ERROR',
          message: 'An error occurred while processing your payment. Please contact support.',
          details: { message: errorMessage },
          timestamp: new Date().toISOString()
        });
        setLoading(false);
      }
    }
    
    handlePaymentResult();
  }, [setPaymentResult, setPaymentCompleted, hasResult, paymentResult]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="max-w-md mx-auto p-6 flex flex-col items-center">
          <Clock className="text-purple-500 w-12 h-12 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-700">결제 결과 확인 중...</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려 주세요.</p>
        </div>
      </div>
    );
  }

  // Error state (local error or store error)
  const displayError = localError || (hasError ? { 
    code: 'STORE_ERROR', 
    message: error || 'Unknown error', 
    timestamp: new Date().toISOString() 
  } : null);

  if (displayError) {
    return (
      <div className="min-h-screen bg-white flex justify-center">
        <div className="max-w-md mx-auto my-20 p-6">
          <div className="flex justify-center mb-4">
            <AlertCircle className="text-red-500 w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-center text-red-600">결제 오류</h1>
          <p className="text-center mb-2 text-gray-700">{displayError.message}</p>
          {displayError.code && (
            <p className="text-center text-sm text-gray-500 mb-6">오류 코드: {displayError.code}</p>
          )}
          
          <div className="flex justify-center space-x-3 mt-6">
            <button 
              onClick={() => router.push('/newpayment/checkout')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              다시 시도
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No payment result state
  if (!hasResult || !paymentResult) {
    return (
      <div className="min-h-screen bg-white flex justify-center">
        <div className="max-w-md mx-auto my-20 p-6">
          <div className="flex justify-center mb-4">
            <AlertCircle className="text-orange-500 w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">결제 정보가 없습니다</h1>
          <p className="text-center mb-4 text-gray-600">결제 정보를 찾을 수 없습니다.</p>
          
          <div className="flex justify-center space-x-3 mt-6">
            <button 
              onClick={() => router.push('/newpayment/checkout')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              결제 페이지로
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show payment result
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
            <CheckCircle className="text-green-500 w-16 h-16" />
          </div>
          
          {/* Payment Title */}
          <h1 className="text-xl font-bold text-center mb-1 text-black">결제 완료</h1>
          <p className="text-center text-sm text-green-600 mb-4">New Payment System</p>
          
          {/* Order Name */}
          <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">
            {paymentResult.orderName}
          </h2>
          
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
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">결제 ID</span>
                <span className="font-medium text-black text-sm">{paymentResult.paymentId}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">결제수단</span>
                <span className="font-medium text-black">{paymentResult.paymentMethod}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">상태</span>
                <span className="font-medium text-green-600">{paymentResult.paymentStatus}</span>
              </div>
            </div>
          </div>
          
          {/* Customer Details */}
          <div className="border-b border-gray-200 py-4 mb-4">
            <h3 className="font-medium mb-2 text-black">고객 정보</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">이름</span>
                <span className="text-black">{paymentResult.customerName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">이메일</span>
                <span className="text-black text-xs">{paymentResult.customerEmail}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">전화번호</span>
                <span className="text-black">{paymentResult.customerPhone}</span>
              </div>
            </div>
          </div>
          
          {/* System Info */}
          <div className="bg-purple-50 p-3 rounded-md mb-4">
            <p className="text-xs text-purple-700 text-center">
              ✨ New Payment System - Clean & Simple
            </p>
            <p className="text-xs text-purple-600 text-center mt-1">
              로깅 기반 결제 완료 처리
            </p>
          </div>
          
          {/* Footer */}
          <div className="text-black text-xs text-center space-y-1">
            <p>결제해 주셔서 감사합니다</p>
            <p>영수증을 보관해 주세요</p>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {/* Back to Chat Room Button */}
            {(roomId || sessionStorage.getItem('newRoomId')) && (
              <button 
                onClick={() => {
                  const targetRoomId = roomId || sessionStorage.getItem('newRoomId');
                  if (targetRoomId) {
                    router.push(`/room/${targetRoomId}`);
                  }
                }}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors"
              >
                채팅방으로 돌아가기
              </button>
            )}
            
            {/* Alternative Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  const targetRoomId = roomId || sessionStorage.getItem('newRoomId');
                  if (targetRoomId) {
                    router.push(`/room/${targetRoomId}`);
                  } else {
                    router.push('/');
                  }
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm transition-colors"
              >
                항소하러가기
              </button>
              <button 
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm transition-colors"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 