"use client"

import { useState, FormEvent } from "react";
import PortOne, { PaymentRequest } from "@portone/browser-sdk/v2";
import { useRouter } from "next/navigation";

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
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    orderName: "Test Order",
    totalAmount: 1000,
    payMethod: "CARD",
  });

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
      // Generate payment ID using timestamp and random string (max 40 chars)
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timestamp = Date.now().toString().slice(-10);
      const paymentId = `ord_${timestamp}_${randomPart}`;
      
      // Create payment request directly
      const paymentRequest: PaymentRequest = {
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "",
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "",
        paymentId: paymentId,
        orderName: formData.orderName,
        totalAmount: formData.totalAmount,
        currency: "CURRENCY_KRW",
        payMethod: formData.payMethod as PaymentRequest["payMethod"],
        customer: {
          fullName: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
        },
        redirectUrl: window.location.origin + '/payment/result',
      };

      // Request payment with Portone
      let response;
      try {
        response = await PortOne.requestPayment(paymentRequest);
        
        if (response?.code != null) {
          // PortOne에서 에러 발생
          const errorMessage = `Payment failed: ${response.message || 'Unknown error from payment provider'}`;
          console.error(errorMessage);
          alert(errorMessage);
          return; // 추가 프로세스 중단
        }
      } catch (paymentError) {
        // PortOne 결제 요청 자체가 실패
        const errorMessage = `Payment processing failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown payment error'}`;
        console.error('PortOne payment error:', paymentError);
        alert(errorMessage);
        return; // 추가 프로세스 중단
      }

      // 결제 성공, 서버에 결제 완료 통지
      let verificationResult;
      try {
        const verifyResponse = await fetch('/api/payment/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: paymentId,
            orderData: {
              ...formData,
              totalAmount: formData.totalAmount
            }
          }),
        });

        if (!verifyResponse.ok) {
          // 서버에서 에러 응답 반환
          const errorText = await verifyResponse.text();
          let errorMessage = `Payment verification failed with status: ${verifyResponse.status}`;
          
          try {
            // JSON 형식인지 확인
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage += ` - ${errorJson.message}`;
            } else if (errorJson.error) {
              errorMessage += ` - ${errorJson.error}`;
            }
          } catch (jsonError) {
            // JSON이 아닌 경우 텍스트 그대로 표시
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          }
          
          console.error(errorMessage);
          alert(errorMessage);
          return; // 추가 프로세스 중단
        }

        try {
          verificationResult = await verifyResponse.json();
        } catch (jsonError) {
          const errorMessage = `Failed to parse verification result: ${jsonError instanceof Error ? jsonError.message : 'Invalid response format'}`;
          console.error(errorMessage);
          alert(errorMessage);
          return; // 추가 프로세스 중단
        }
      } catch (verifyError) {
        // 서버 통신 자체가 실패한 경우
        const errorMessage = `Payment verification error: ${verifyError instanceof Error ? verifyError.message : 'Failed to communicate with server'}`;
        console.error('Verification error:', verifyError);
        alert(errorMessage);
        return; // 추가 프로세스 중단
      }

      if (verificationResult.status === 'success') {
        // 결제 검증 성공, 외부 API에 결제 기록 전송
        try {
          const externalResponse = await fetch('https://perfume-maker.pixent.co.kr/api/v3/payment/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: paymentId,
              amount: formData.totalAmount,
              orderName: formData.orderName,
              customerName: formData.name,
              customerEmail: formData.email,
              customerPhone: formData.phone,
              paymentStatus: 'SUCCESS',
              paymentMethod: formData.payMethod,
              timestamp: new Date().toISOString()
            }),
          });
          
          if (externalResponse.ok) {
            console.log('Payment successful and recorded to external API!', {
              paymentId,
              amount: formData.totalAmount,
              orderName: formData.orderName
            });
            alert('Payment successful!');
          } else {
            // 응답 본문을 확인하여 에러 메시지 추출
            const errorText = await externalResponse.text();
            let errorMessage = 'Failed to record payment to external API';
            
            try {
              // JSON 형식인지 확인
              const errorJson = JSON.parse(errorText);
              if (errorJson.message) {
                errorMessage += `: ${errorJson.message}`;
              } else if (errorJson.error) {
                errorMessage += `: ${errorJson.error}`;
              } else {
                errorMessage += ` (Status: ${externalResponse.status})`;
              }
            } catch (e) {
              // JSON이 아닌 경우 상태 코드와 함께 텍스트 표시
              if (errorText) {
                errorMessage += `: ${errorText}`;
              } else {
                errorMessage += ` (Status: ${externalResponse.status})`;
              }
            }
            
            console.error(errorMessage);
            alert(errorMessage);
          }
        } catch (error) {
          console.error('Error recording payment to external API:', error);
          alert(`Error recording payment to external API: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // 결제 검증 실패
        const errorMessage = `Payment failed: ${verificationResult.message || 'Verification failed'}`;
        console.error('Payment verification failed:', verificationResult.message);
        alert(errorMessage);
      }
    } catch (error) {
      // 모든 처리되지 않은 에러 캐치
      console.error('Checkout error:', error);
      alert(`Payment process error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
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
        
        <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="orderName" className="block text-sm font-medium text-gray-700 mb-1">
                Order Name
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
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (KRW)
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
        
        <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div>
            <label htmlFor="payMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="payMethod"
              name="payMethod"
              required
              value={formData.payMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="CARD">Credit Card</option>
              <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
              <option value="PHONE">Mobile Phone</option>
              <option value="TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : 'Complete Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
  