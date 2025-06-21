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
    orderName: "재심 참가비",
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

  // Clear ispaying status when user leaves payment page without completing
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (roomId) {
        try {
          // Get room ID and clear ispaying status
          const { database } = await import('@/lib/firebase');
          const { ref, remove, set } = await import('firebase/database');
          
          if (database) {
            const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
            await remove(isPayingRef);
            //console.log('Cleared ispaying status due to page unload');
            
            // Signal all users to clear their session storage
            const clearSessionSignalRef = ref(database, `rooms/${roomId}/clearPaymentSession`);
            await set(clearSessionSignalRef, {
              timestamp: new Date().toISOString(),
              reason: 'newpayment_page_left',
              clearedBy: userName || 'unknown'
            });
            //console.log('Session storage clear signal sent to all users for newpayment page exit');
            
            // Remove the signal after a short delay to clean up
            setTimeout(() => {
              remove(clearSessionSignalRef).catch(error => {
                console.error('Failed to remove session clear signal:', error);
              });
            }, 2000);
          }
        } catch (error) {
          console.error('Failed to clear ispaying status or send clear signal on page unload:', error);
        }
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Clean up event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also clear on component unmount
      handleBeforeUnload();
    };
  }, [roomId]);

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
        payMethod: formData.payMethod,
        // Always use DIGITAL for mobile payments, undefined for others
        productType: formData.payMethod === 'MOBILE' ? 'DIGITAL' : undefined,
        // Don't specify carrier - let users choose in payment modal
        carrier: undefined
      };

      // //console.log('=== STARTING CLEAN PAYMENT PROCESS ===');
      // //console.log('Customer:', customer);
      // //console.log('Payment:', payment);
      // //console.log('Is Mobile:', isMobile);
      // //console.log('=======================================');

      // Request payment using the new clean function
      const { paymentId } = await requestPayment(customer, payment);

      if (isMobile) {
        // On mobile, we'll be redirected, so we store the necessary info in sessionStorage
        sessionStorage.setItem('newPaymentId', paymentId);
        sessionStorage.setItem('newOrderData', JSON.stringify(formData));
        sessionStorage.setItem('newRoomId', roomId || '');
        //console.log('Mobile payment initiated, awaiting redirect...');
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

      // //console.log('=== PAYMENT VERIFICATION RESULT ===');
      // //console.log('Status:', verificationResult.status);
      // //console.log('Message:', verificationResult.message);
      // //console.log('================================');

      if (verificationResult.status === 'success') {
        // Create payment result
        const paymentResult = createPaymentResult(paymentId, customer, payment, 'SUCCESS');

        // Detect if this user is the host by checking Firebase
        let isHost = false;
        if (roomId && userName) {
          try {
            const { database } = await import('@/lib/firebase');
            const { ref, get } = await import('firebase/database');
            
            if (database) {
              const hostRef = ref(database, `rooms/${roomId}/host`);
              const hostSnapshot = await get(hostRef);
              
              if (hostSnapshot.exists()) {
                const hostUserId = hostSnapshot.val();
                
                // Check if current user is the host
                const roomUsersRef = ref(database, `rooms/${roomId}/users`);
                const usersSnapshot = await get(roomUsersRef);
                
                if (usersSnapshot.exists()) {
                  const users = usersSnapshot.val();
                  const currentUserEntry = Object.entries(users).find(([userId, user]: [string, any]) => 
                    (user.username || user) === userName
                  );
                  
                  if (currentUserEntry && currentUserEntry[0] === hostUserId) {
                    isHost = true;
                  }
                }
              }
            }
          } catch (error) {
            console.warn('Could not determine host status:', error);
          }
        }

        // Save completion to Firebase instead of external API call with room context
        await logPaymentCompletion(paymentResult, roomId || undefined, userName || undefined, isHost);
        
        // Clear Firebase ispaying status but preserve session storage for user return
        if (roomId) {
          try {
            const { database } = await import('@/lib/firebase');
            const { ref, remove } = await import('firebase/database');
            
            if (database) {
              // Clear Firebase ispaying status
              const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
              await remove(isPayingRef);
              // //console.log('Cleared Firebase ispaying status after newpayment completion');
              // //console.log('Session storage preserved - paying user can return to room');
            }
          } catch (error) {
            console.error('Failed to clear ispaying status after newpayment completion:', error);
          }
        }
        
        // Update store with successful payment
        setPaymentResult(paymentResult);
        setPaymentCompleted(true);
        
        // //console.log('=== PAYMENT COMPLETED SUCCESSFULLY ===');
        // //console.log('Payment ID:', paymentId);
        // //console.log('Amount:', formData.totalAmount);
        // //console.log('Order Name:', formData.orderName);
        // //console.log('===================================');
        
        // Redirect to result page with room ID as backup parameter
        const redirectUrl = roomId ? `/newpayment/result?roomId=${roomId}` : '/newpayment/result';
        router.push(redirectUrl);
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
          재심 참가비 - 결제 페이지
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
                  주문명
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                  {formData.orderName}
                </div>
              </div>

              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-black mb-1">
                  결제금액 (KRW)
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium">
                  {formData.totalAmount.toLocaleString()}원
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-black">결제수단</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                  <option value="MOBILE">휴대폰결제</option>
                  <option value="TRANSFER">계좌이체</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Info Display */}
          {/* <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-sm font-medium text-purple-800 mb-2">결제 정보</h3>
            <div className="text-sm text-purple-600">
              <p>• 기기: {isMobile ? '모바일' : '데스크톱'}</p>
              <p>• 결제 시스템: New Payment System (Clean)</p>
              <p>• 로깅: Firebase 기반 로깅</p>
              {roomId && <p>• 룸 ID: {roomId}</p>}
              {formData.payMethod === 'MOBILE' && (
                <p>• 상품 유형: 디지털 콘텐츠</p>
              )}
            </div>
          </div> */}

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