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

export default function PaymentResultPage() {
  const paymentResult = usePaymentStore((state) => state.paymentResult);
  const setPaymentResult = usePaymentStore((state) => state.setPaymentResult);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for redirected mobile payment
  useEffect(() => {
    async function handleMobilePaymentRedirect() {
      try {
        // Check for pending payment data in sessionStorage
        const pendingPaymentId = sessionStorage.getItem('pendingPaymentId');
        const pendingOrderData = sessionStorage.getItem('pendingOrderData');
        
        if (pendingPaymentId && pendingOrderData) {
          console.log('Found pending payment data, completing mobile payment flow', { pendingPaymentId });
          
          // Parse the order data
          const orderData = JSON.parse(pendingOrderData);
          
          // Verify the payment with backend
          const verificationResult = await verifyPayment(pendingPaymentId, orderData);
          
          console.log('Mobile payment verification result:', verificationResult);
          
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
            const externalResponse = await recordPayment(paymentRecord);
            
            if (externalResponse.ok) {
              console.log('Mobile payment completed successfully!');
              
              // Store payment data in Zustand store
              setPaymentResult(paymentRecord);
              
              // Clear the pending payment data
              sessionStorage.removeItem('pendingPaymentId');
              sessionStorage.removeItem('pendingOrderData');
            } else {
              console.error('Failed to record mobile payment');
              setError('Payment was processed but failed to be recorded. Please contact support.');
            }
          } else {
            console.error('Mobile payment verification failed:', verificationResult.message);
            setError(`Payment verification failed: ${verificationResult.message}`);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error processing mobile payment:', err);
        setError('An error occurred while processing your payment. Please contact support.');
        setLoading(false);
      }
    }
    
    // Execute the mobile payment handling
    handleMobilePaymentRedirect();
  }, [setPaymentResult]);

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
          <p className="text-center mb-6">{error}</p>
          <div className="flex justify-center">
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
          <p className="text-center mb-6">결제 정보를 찾을 수 없습니다. 다시 시도해 주세요.</p>
          <div className="flex justify-center">
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