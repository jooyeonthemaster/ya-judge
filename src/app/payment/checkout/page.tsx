"use client"

import { useState, FormEvent, useEffect } from "react";
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

// 에러 정보 저장을 위한 인터페이스
interface PaymentError {
  code: string;
  message: string;
  details?: string;
  timestamp: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    orderName: "Test Order",
    totalAmount: 1000,
    payMethod: "CARD",
  });

  // 커스텀 에러 처리 함수
  const handlePaymentError = (code: string, message: string, details?: string) => {
    console.error(`결제 오류 [${code}]:`, message, details ? `(${details})` : '');
    
    // 에러 정보를 로컬 스토리지에 저장
    const errorInfo: PaymentError = {
      code,
      message,
      details,
      timestamp: Date.now()
    };
    
    localStorage.setItem('payment_error', JSON.stringify(errorInfo));
    
    // UI에 에러 메시지 표시
    setErrorMessage(message);
    
    // 기본 alert도 시도해보기
    try {
      window.alert(message);
    } catch (e) {
      console.error("Native alert failed:", e);
    }
    
    // 에러가 발생했기 때문에 로딩 상태 해제
    setIsLoading(false);
  };
  
  // 에러 모달 닫기
  const closeErrorModal = () => {
    setErrorMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalAmount" ? Number(value) : value,
    }));
  };

  // 초기화 시 로컬 스토리지의 에러 정보 확인
  useEffect(() => {
    // 테스트 alert - 브라우저에서 alert 기능이 작동하는지 확인
    try {
      console.log("Alert 테스트");
      // alert 호출은 주석 처리하여 사용자 경험에 방해되지 않게 함
      // window.alert("Alert 테스트");
    } catch (e) {
      console.error("Alert 테스트 실패:", e);
    }
    
    // 이전에 저장된 에러 정보가 있으면 표시
    const storedError = localStorage.getItem('payment_error');
    if (storedError) {
      try {
        const errorData = JSON.parse(storedError) as PaymentError;
        // 10분(600000ms) 이내의 에러만 표시
        if (Date.now() - errorData.timestamp < 600000) {
          setErrorMessage(errorData.message);
        }
      } catch (e) {
        console.error("저장된 에러 정보 파싱 실패:", e);
      }
      // 표시 후 삭제
      localStorage.removeItem('payment_error');
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null); // 기존 에러 메시지 초기화

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

      // PortOne 결제 요청 전에 에러를 localStorage에 기록하는 함수 등록
      window.addEventListener('beforeunload', function() {
        if (isLoading) {
          localStorage.setItem('payment_error', JSON.stringify({
            code: 'PAYMENT_INTERRUPTED',
            message: '결제 처리 중 페이지를 떠났습니다. 결제 상태를 확인해주세요.',
            timestamp: Date.now()
          }));
        }
      });

      // Request payment with Portone
      let response;
      try {
        response = await PortOne.requestPayment(paymentRequest);
        
        if (response?.code != null) {
          // PortOne에서 에러 발생
          const errorMessage = `Payment failed: ${response.message || 'Unknown error from payment provider'}`;
          handlePaymentError('PORTONE_ERROR', errorMessage, response.code);
          return; // 추가 프로세스 중단
        }
      } catch (paymentError) {
        // PortOne 결제 요청 자체가 실패
        const errorMessage = `Payment processing failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown payment error'}`;
        handlePaymentError('PAYMENT_PROCESS_ERROR', errorMessage);
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
          
          handlePaymentError('VERIFICATION_ERROR', errorMessage, `Status: ${verifyResponse.status}`);
          return; // 추가 프로세스 중단
        }

        try {
          verificationResult = await verifyResponse.json();
        } catch (jsonError) {
          const errorMessage = `Failed to parse verification result: ${jsonError instanceof Error ? jsonError.message : 'Invalid response format'}`;
          handlePaymentError('PARSE_ERROR', errorMessage);
          return; // 추가 프로세스 중단
        }
      } catch (verifyError) {
        // 서버 통신 자체가 실패한 경우
        const errorMessage = `Payment verification error: ${verifyError instanceof Error ? verifyError.message : 'Failed to communicate with server'}`;
        handlePaymentError('SERVER_COMMUNICATION_ERROR', errorMessage);
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
            // 성공 메시지
            try {
              window.alert('Payment successful!');
            } catch (e) {
              console.error("Success alert failed:", e);
            }
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
            
            handlePaymentError('EXTERNAL_API_ERROR', errorMessage, `Status: ${externalResponse.status}`);
          }
        } catch (error) {
          const errorMessage = `Error recording payment to external API: ${error instanceof Error ? error.message : 'Unknown error'}`;
          handlePaymentError('EXTERNAL_API_COMMUNICATION_ERROR', errorMessage);
        }
      } else {
        // 결제 검증 실패
        const errorMessage = `Payment failed: ${verificationResult.message || 'Verification failed'}`;
        handlePaymentError('VERIFICATION_FAILED', errorMessage);
      }
    } catch (error) {
      // 모든 처리되지 않은 에러 캐치
      const errorMessage = `Payment process error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
      handlePaymentError('UNKNOWN_ERROR', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      {/* 에러 모달 */}
      {errorMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md border-2 border-red-500">
            <h3 className="text-xl font-bold text-red-700 mb-4">결제 오류</h3>
            <p className="text-gray-800 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={closeErrorModal}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                확인
              </button>
            </div>
          </div>
          <div className="fixed inset-0 bg-black opacity-50 -z-10"></div>
        </div>
      )}
      
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
  