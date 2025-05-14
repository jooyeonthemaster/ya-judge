"use client";

import { useEffect, useState } from "react";
import { usePaymentStore } from "@/app/store/paymentStore";
import { CheckCircle } from "lucide-react";

export default function PaymentResultPage() {
  const paymentResult = usePaymentStore((state) => state.paymentResult);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just a short delay to simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="max-w-md mx-auto p-6 flex justify-center">로딩 중...</div>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div className="min-h-screen bg-white flex justify-center">
        <div className="max-w-md mx-auto my-40 p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">와우 결제에 오류가 발생하셨나요?</h1>
          <p className="text-center">갓댐~</p>
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