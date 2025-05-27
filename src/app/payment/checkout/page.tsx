"use client"

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePaymentStore } from "@/app/store/paymentStore";
import { requestPayment, verifyPayment, recordPayment, isMobileBrowser } from "@/lib/portone";
import type { CustomerInfo, PaymentDetails } from "@/lib/portone";

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  orderName: string;
  totalAmount: number;
  payMethod: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { 
    setPaymentResult, 
    setIsPaid, 
    roomId, 
    userName 
  } = usePaymentStore();
  const [isLoading, setIsLoading] = useState(false);
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
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

      console.log('Starting payment process...', {
        customer,
        payment,
        isMobile
      });

      // Request payment using the extracted function
      const { paymentId } = await requestPayment(customer, payment);

      if (isMobile) {
        // On mobile, we'll be redirected, so we store the necessary info in sessionStorage
        // to be retrieved after redirection
        sessionStorage.setItem('pendingPaymentId', paymentId);
        sessionStorage.setItem('pendingOrderData', JSON.stringify(formData));
        sessionStorage.setItem('pendingRoomId', roomId || '');
        console.log('Mobile payment initiated, awaiting redirect...');
        // The rest of the flow will continue after redirect
        return;
      }

      // For desktop flow, continue with verification
      const verificationResult = await verifyPayment(paymentId, {
        ...formData,
        totalAmount: formData.totalAmount
      });

      console.log('Payment verification response:', verificationResult);

      if (verificationResult.status === 'success') {
        // Prepare payment record data
        const paymentRecord = {
          paymentId: paymentId,
          amount: formData.totalAmount,
          orderName: formData.orderName,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          paymentStatus: 'SUCCESS',
          paymentMethod: formData.payMethod,
          timestamp: new Date().toISOString()
        };

        try {
          // Record the payment to external API
          const externalResponse = await recordPayment(paymentRecord);
          
          if (externalResponse.ok) {
            console.log('Payment successful and recorded to external API!', {
              paymentId,
              amount: formData.totalAmount,
              orderName: formData.orderName
            });
            
            // Mark payment as completed
            setIsPaid(true);
            // Store payment data in Zustand store
            setPaymentResult(paymentRecord);
            
            alert('결제가 완료되었습니다! 채팅방으로 돌아갑니다.');
            
            // Redirect back to chat room
            if (roomId) {
              router.push(`/room/${roomId}`);
            } else {
              // Fallback to result page if no room ID
              router.push('/payment/result');
            }
          } else {
            console.error('Failed to record payment to external API');
          }
        } catch (error) {
          console.error('Error recording payment to external API:', error);
        }
      } else {
        // Payment verification failed
        console.error('Payment verification failed:', verificationResult.message);
        alert(`Payment failed: ${verificationResult.message}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-black">결제 페이지(임시)</h1>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-black">결제 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                  고객명
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-black mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                <input
                  id="orderName"
                  name="orderName"
                  type="text"
                  required
                  value={formData.orderName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-black mb-1">
                  결제금액 (KRW)
                </label>
                <input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  min="1000"
                  required
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-black">결제수단</h2>
            <div>
              <label htmlFor="payMethod" className="block text-sm font-medium text-black mb-1">
                결제수단
              </label>
              <select
                id="payMethod"
                name="payMethod"
                required
                value={formData.payMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="CARD">신용카드</option>
                <option value="VIRTUAL_ACCOUNT">가상계좌</option>
                <option value="PHONE">휴대폰결제</option>
                <option value="TRANSFER">계좌이체</option>
              </select>
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                isLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
              } transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
              style={{
                // Extra tap highlight color enhancement for mobile
                WebkitTapHighlightColor: 'rgba(139, 92, 246, 0.5)'
              }}
            >
              {isLoading ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
  