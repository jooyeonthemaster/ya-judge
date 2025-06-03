"use client"

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNewPaymentStore, usePaymentStatus, usePaymentSession } from "@/app/store/newPaymentStore";
import { requestPayment, verifyPayment, logPaymentCompletion, isMobileBrowser, createPaymentResult } from "@/lib/newpayment";
import type { CustomerInfo, PaymentDetails } from "@/lib/newpayment";

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  orderName: string;
  totalAmount: number;
  payMethod: string;
}

export default function NewCheckoutPage() {
  const router = useRouter();
  const { 
    setPaymentResult, 
    setPaymentInProgress, 
    setPaymentCompleted,
    setPaymentError,
    clearPaymentError
  } = useNewPaymentStore();
  
  const { isInProgress, hasError, error } = usePaymentStatus();
  const { roomId, userName } = usePaymentSession();
  
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    orderName: "재판 참가비",
    totalAmount: 1000,
    payMethod: "CARD",
  });

  useEffect(() => {
    // Check if mobile browser on client side
    setIsMobile(isMobileBrowser());
    
    // Prepopulate form with user data from payment store
    if (userName) {
      setFormData(prev => ({
        ...prev,
        name: userName
      }));
    }
  }, [userName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalAmount" ? Number(value) : value,
    }));
    
    // Clear any existing errors when user starts typing
    if (hasError) {
      clearPaymentError();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPaymentInProgress(true);
    clearPaymentError();

    try {
      // Extract customer and payment information from form data
      const customer: CustomerInfo = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };
      
      const payment: PaymentDetails = {
        orderName: formData.orderName,
        totalAmount: formData.totalAmount,
        payMethod: formData.payMethod
      };

      console.log('=== STARTING CLEAN PAYMENT PROCESS ===');
      console.log('Customer:', customer);
      console.log('Payment:', payment);
      console.log('Is Mobile:', isMobile);
      console.log('=======================================');

      // Request payment using the new clean function
      const { paymentId } = await requestPayment(customer, payment);

      if (isMobile) {
        // On mobile, we'll be redirected, so we store the necessary info in sessionStorage
        sessionStorage.setItem('newPaymentId', paymentId);
        sessionStorage.setItem('newOrderData', JSON.stringify(formData));
        sessionStorage.setItem('newRoomId', roomId || '');
        console.log('Mobile payment initiated, awaiting redirect...');
        // The rest of the flow will continue after redirect
        return;
      }

      // For desktop flow, continue with verification
      const verificationResult = await verifyPayment(paymentId, {
        totalAmount: formData.totalAmount,
        orderName: formData.orderName,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        payMethod: formData.payMethod
      });

      console.log('=== PAYMENT VERIFICATION RESULT ===');
      console.log('Status:', verificationResult.status);
      console.log('Message:', verificationResult.message);
      console.log('================================');

      if (verificationResult.status === 'success') {
        // Create payment result
        const paymentResult = createPaymentResult(paymentId, customer, payment, 'SUCCESS');

        // Log completion instead of external API call
        logPaymentCompletion(paymentResult);
        
        // Update store with successful payment
        setPaymentResult(paymentResult);
        setPaymentCompleted(true);
        
        console.log('=== PAYMENT COMPLETED SUCCESSFULLY ===');
        console.log('Payment ID:', paymentId);
        console.log('Amount:', formData.totalAmount);
        console.log('Order Name:', formData.orderName);
        console.log('===================================');
        
        alert('결제가 완료되었습니다! 채팅방으로 돌아갑니다.');
        
        // Redirect back to chat room or result page
        if (roomId) {
          router.push(`/room/${roomId}`);
        } else {
          router.push('/newpayment/result');
        }
      } else {
        // Payment verification failed
        const errorMessage = verificationResult.message || 'Payment verification failed';
        console.error('Payment verification failed:', errorMessage);
        setPaymentError(errorMessage);
        alert(`Payment failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setPaymentError(errorMessage);
      alert(errorMessage);
    } finally {
      setPaymentInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-black">
          New Payment System - 결제 페이지
        </h1>

        {hasError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-black">고객 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                  고객명 *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                  이메일 *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-black mb-1">
                  전화번호 *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-black mb-1">
                  주소
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-black">주문 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="orderName" className="block text-sm font-medium text-black mb-1">
                  주문명 *
                </label>
                <input
                  id="orderName"
                  name="orderName"
                  type="text"
                  required
                  value={formData.orderName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-black mb-1">
                  결제금액 (KRW) *
                </label>
                <input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  min="1000"
                  required
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-black">결제수단</h2>
            <div>
              <label htmlFor="payMethod" className="block text-sm font-medium text-black mb-1">
                결제수단 *
              </label>
              <select
                id="payMethod"
                name="payMethod"
                required
                value={formData.payMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="CARD">신용카드</option>
                <option value="VIRTUAL_ACCOUNT">가상계좌</option>
                <option value="PHONE">휴대폰결제</option>
                <option value="TRANSFER">계좌이체</option>
              </select>
            </div>
          </div>

          {/* Payment Info Display */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-sm font-medium text-purple-800 mb-2">결제 정보</h3>
            <div className="text-sm text-purple-600">
              <p>• 기기: {isMobile ? '모바일' : '데스크톱'}</p>
              <p>• 결제 시스템: New Payment System (Clean)</p>
              <p>• 로깅: 콘솔 로그 방식</p>
              {roomId && <p>• 룸 ID: {roomId}</p>}
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <button
              type="submit"
              disabled={isInProgress}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                isInProgress ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
              } transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
            >
              {isInProgress ? '결제 처리 중...' : `${formData.totalAmount.toLocaleString()}원 결제하기`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 